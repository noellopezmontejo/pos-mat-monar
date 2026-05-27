const { prisma } = require('../db')
const { calcDeliveryLoad, recommendVehicleType, rankVehicles, buildRecommendationSummary } = require('../utils/deliveryRecommendation')
const { optimizeRoute } = require('../utils/routeOptimizer')

const getRoutes = async (req, res) => {
  try {
    const routes = await prisma.route.findMany({
      include: { 
        vehicle: true,
        driver: true,
        deliveries: { 
          include: { 
            sale: { include: { customer: true, items: { include: { product: true } } } } 
          } 
        } 
      },
      orderBy: { created_at: 'desc' }
    })
    res.json(routes)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener rutas' })
  }
}

const getPendingDeliveries = async (req, res) => {
  try {
    const deliveries = await prisma.delivery.findMany({
      where: { route_id: null, status: { in: ['PENDING', 'NO_ENTREGADO'] } },
      include: {
        sale: { include: { customer: true, items: { include: { product: true } } } }
      }
    })
    res.json(deliveries)
  } catch(e) {
    res.status(500).json({ error: 'Error al obtener entregas' })
  }
}

const createRoute = async (req, res) => {
  const { name, delivery_ids, vehicle_id, driver_id } = req.body
  try {
    const route = await prisma.route.create({
      data: { 
        name,
        vehicle_id: vehicle_id || null,
        driver_id: driver_id || null,
        status: vehicle_id ? 'En Ruta' : 'Pendiente'
      }
    })
    if (delivery_ids && delivery_ids.length > 0) {
      await prisma.delivery.updateMany({
        where: { id: { in: delivery_ids } },
        data: { route_id: route.id, status: 'EN_RUTA' }
      })
    }
    // If vehicle assigned, mark it En Ruta
    if (vehicle_id) {
      await prisma.vehicle.update({ where: { id: vehicle_id }, data: { status: 'En Ruta' } }).catch(() => {})
    }
    const full = await prisma.route.findUnique({
      where: { id: route.id },
      include: { vehicle: true, driver: true, deliveries: { include: { sale: { include: { customer: true } } } } }
    })
    res.json(full)
  } catch(e) {
    res.status(500).json({ error: 'Error al crear ruta', detail: e.message })
  }
}

const updateDeliveryStatus = async (req, res) => {
  const { id } = req.params
  const { status, lat, lng, fail_reason, fail_notes, extra_charges, extra_charges_note, proof_notes } = req.body
  try {
    const updateData = { status }
    if (lat) updateData.lat = parseFloat(lat)
    if (lng) updateData.lng = parseFloat(lng)

    // Handle ENTREGADO
    if (status === 'ENTREGADO') {
      updateData.delivered_at = new Date()
      if (proof_notes) updateData.proof_notes = proof_notes
      if (extra_charges) updateData.extra_charges = parseFloat(extra_charges)
      if (extra_charges_note) updateData.extra_charges_note = extra_charges_note

      // If sale is CONTRA_ENTREGA / PAGO_EN_CAJA, mark as COBRADO_CHOFER (pending office liquidation)
      const delivery = await prisma.delivery.findUnique({
        where: { id },
        include: { sale: true, route: { select: { driver_id: true } } }
      })
      if (delivery?.sale?.status === 'PENDIENTE_COBRO') {
        const finalMethod = req.body.payment_method ? req.body.payment_method.toUpperCase() : 'CONTRA_ENTREGA'
        await prisma.sale.update({
          where: { id: delivery.sale_id },
          data: {
            status: 'COBRADO_CHOFER',
            payment_method: finalMethod,
            collected_by: delivery.route?.driver_id || null,
            collected_at: new Date(),
            collected_method: finalMethod
          }
        })
      }

      // Add extra charges to sale total if any
      if (extra_charges && parseFloat(extra_charges) > 0 && delivery) {
        await prisma.sale.update({
          where: { id: delivery.sale_id },
          data: { total_amount: { increment: parseFloat(extra_charges) } }
        })
      }
    }

    // Handle NO_ENTREGADO
    if (status === 'NO_ENTREGADO') {
      if (fail_reason) updateData.fail_reason = fail_reason
      if (fail_notes) updateData.fail_notes = fail_notes
      // Remove from route so it goes back to pending pool
      updateData.route_id = null
    }

    const updated = await prisma.delivery.update({
      where: { id },
      data: updateData,
      include: { sale: { include: { customer: true } } }
    })
    res.json(updated)
  } catch (error) {
    console.error('[Delivery] Error updating status:', error)
    res.status(500).json({ error: 'Error al actualizar entrega', detail: error.message })
  }
}


/**
 * Smart analysis: given a list of delivery IDs,
 * calculates total load and ranks available vehicles.
 */
const analyzeDeliveries = async (req, res) => {
  const { delivery_ids } = req.body
  if (!delivery_ids || delivery_ids.length === 0) {
    return res.status(400).json({ error: 'Debes seleccionar al menos una entrega' })
  }
  try {
    // Fetch selected deliveries with products
    const deliveries = await prisma.delivery.findMany({
      where: { id: { in: delivery_ids } },
      include: {
        sale: { include: { items: { include: { product: true } } } }
      }
    })

    // Fetch all available vehicles
    const vehicles = await prisma.vehicle.findMany({
      where: { status: { not: 'Inactivo' } }
    })

    const { totalKg, totalM3, hasData } = calcDeliveryLoad(deliveries)
    const recommendedType = recommendVehicleType(totalKg, totalM3)
    const rankedVehicles  = rankVehicles(vehicles, totalKg, totalM3)
    const summary         = buildRecommendationSummary(totalKg, totalM3, recommendedType, hasData)

    res.json({
      totalKg,
      totalM3,
      hasData,
      recommendedType,
      summary,
      rankedVehicles
    })
  } catch(e) {
    console.error(e)
    res.status(500).json({ error: 'Error al analizar entregas', detail: e.message })
  }
}

/**
 * Assign additional deliveries to an existing route.
 */
const assignToRoute = async (req, res) => {
  const { id } = req.params          // route id
  const { delivery_ids } = req.body   // array of delivery IDs to add
  if (!delivery_ids || delivery_ids.length === 0) {
    return res.status(400).json({ error: 'Selecciona al menos una entrega' })
  }
  try {
    // Verify route exists
    const route = await prisma.route.findUnique({ where: { id } })
    if (!route) return res.status(404).json({ error: 'Ruta no encontrada' })

    // Assign deliveries to this route
    await prisma.delivery.updateMany({
      where: { id: { in: delivery_ids } },
      data: { route_id: id, status: 'EN_RUTA' }
    })

    // Return updated route with all data
    const updated = await prisma.route.findUnique({
      where: { id },
      include: {
        vehicle: true,
        driver: true,
        deliveries: {
          include: { sale: { include: { customer: true, items: { include: { product: true } } } } }
        }
      }
    })
    res.json(updated)
  } catch (e) {
    res.status(500).json({ error: 'Error al asignar entregas', detail: e.message })
  }
}

/**
 * Get routes assigned to a specific driver (for PWA).
 * GET /api/logistics/driver/:driverId/routes
 */
const getDriverRoutes = async (req, res) => {
  const { driverId } = req.params
  try {
    const routes = await prisma.route.findMany({
      where: { driver_id: driverId },
      include: {
        vehicle: true,
        driver: true,
        deliveries: {
          include: {
            sale: {
              include: {
                customer: true,
                items: { include: { product: true } }
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    })
    res.json(routes)
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener rutas del chofer', detail: e.message })
  }
}

/**
 * Get all active drivers (for PWA login selection).
 * GET /api/logistics/drivers/active
 */
const getActiveDrivers = async (req, res) => {
  try {
    const drivers = await prisma.driver.findMany({
      where: { status: 'Activo' },
      include: { vehicle: true },
      orderBy: { name: 'asc' }
    })
    res.json(drivers)
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener choferes', detail: e.message })
  }
}

/**
 * Optimize route order using Nearest Neighbor algorithm.
 * POST /api/logistics/routes/:id/optimize
 * Body: { originAddress: "Sucursal Materiales Monar, Chihuahua" }
 */
const optimizeRouteOrder = async (req, res) => {
  const { id } = req.params
  const { originAddress } = req.body
  const origin = originAddress || 'Materiales Monar, Chihuahua, Mexico'

  try {
    // Get route with deliveries
    const route = await prisma.route.findUnique({
      where: { id },
      include: {
        deliveries: {
          where: { status: { not: 'ENTREGADO' } },
          include: { sale: { include: { customer: true } } }
        }
      }
    })
    if (!route) return res.status(404).json({ error: 'Ruta no encontrada' })

    const pendingDeliveries = route.deliveries.filter(d => d.status !== 'ENTREGADO')
    if (pendingDeliveries.length === 0) {
      return res.json({ success: true, message: 'No hay entregas pendientes', mapsUrl: null, order: [] })
    }

    // Run optimization
    const result = await optimizeRoute(origin, pendingDeliveries)
    
    res.json(result)
  } catch (e) {
    console.error('[RouteOptimizer] Error:', e)
    res.status(500).json({ error: 'Error al optimizar ruta', detail: e.message })
  }
}

/**
 * Quick: generate Google Maps URL for a route (no geocoding, uses optimize:true).
 * GET /api/logistics/routes/:id/maps-url
 */
const getMapsUrl = async (req, res) => {
  const { id } = req.params
  const origin = req.query.origin || 'Materiales Monar, Chihuahua, Mexico'

  try {
    const route = await prisma.route.findUnique({
      where: { id },
      include: { deliveries: { include: { sale: { include: { customer: true } } } } }
    })
    if (!route) return res.status(404).json({ error: 'Ruta no encontrada' })

    const pending = route.deliveries.filter(d => d.status !== 'ENTREGADO')
    if (pending.length === 0) return res.json({ mapsUrl: null, message: 'Todas entregadas' })

    const addresses = pending.map(d => d.address).filter(a => a && a.trim().length > 3)
    if (addresses.length === 0) return res.json({ mapsUrl: null, message: 'Sin direcciones válidas' })

    // Build Google Maps URL with optimize:true for waypoints
    const originEnc = encodeURIComponent(origin)
    const destEnc = encodeURIComponent(addresses[addresses.length - 1])
    
    let url
    if (addresses.length === 1) {
      url = `https://www.google.com/maps/dir/?api=1&origin=${originEnc}&destination=${destEnc}&travelmode=driving`
    } else {
      const waypointsEnc = addresses.slice(0, -1).map(a => encodeURIComponent(a)).join('%7C')
      url = `https://www.google.com/maps/dir/?api=1&origin=${originEnc}&destination=${destEnc}&waypoints=optimize%3Atrue%7C${waypointsEnc}&travelmode=driving`
    }

    res.json({
      mapsUrl: url,
      totalStops: addresses.length,
      addresses
    })
  } catch (e) {
    res.status(500).json({ error: 'Error al generar URL', detail: e.message })
  }
}

/**
 * Update driver's live GPS position on a route.
 * PATCH /api/logistics/routes/:id/location
 * Body: { lat, lng }
 */
const updateRouteLocation = async (req, res) => {
  const { id } = req.params
  const { lat, lng } = req.body
  try {
    const route = await prisma.route.update({
      where: { id },
      data: {
        current_lat: parseFloat(lat),
        current_lng: parseFloat(lng),
        tracking_active: true,
        last_location_at: new Date()
      }
    })
    res.json({ ok: true, lat: route.current_lat, lng: route.current_lng })
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar ubicación', detail: e.message })
  }
}

/**
 * Get live tracking data for a route.
 * GET /api/logistics/routes/:id/tracking
 */
const getRouteTracking = async (req, res) => {
  const { id } = req.params
  try {
    const route = await prisma.route.findUnique({
      where: { id },
      select: {
        id: true, name: true,
        current_lat: true, current_lng: true,
        tracking_active: true, last_location_at: true,
        driver: { select: { name: true } },
        vehicle: { select: { name: true, type: true, plate: true } },
        deliveries: {
          select: {
            id: true, address: true, status: true, lat: true, lng: true,
            sale: { select: { customer: { select: { name: true } } } }
          }
        }
      }
    })
    if (!route) return res.status(404).json({ error: 'Ruta no encontrada' })

    // Check if tracking is stale (>2 min without update)
    if (route.tracking_active && route.last_location_at) {
      const diff = Date.now() - new Date(route.last_location_at).getTime()
      if (diff > 120000) { // 2 minutes
        route.tracking_active = false
      }
    }

    res.json(route)
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener tracking', detail: e.message })
  }
}

/**
 * Toggle tracking on/off for a route.
 * PATCH /api/logistics/routes/:id/tracking-toggle
 * Body: { active: true/false }
 */
const toggleTracking = async (req, res) => {
  const { id } = req.params
  const { active } = req.body
  try {
    const route = await prisma.route.update({
      where: { id },
      data: { tracking_active: !!active }
    })
    res.json({ ok: true, tracking_active: route.tracking_active })
  } catch (e) {
    res.status(500).json({ error: 'Error al cambiar tracking', detail: e.message })
  }
}

/**
 * Retry a failed delivery — reset for re-scheduling.
 * PATCH /api/logistics/delivery/:id/retry
 * Body: { address?: "new address", notes?: "..." }
 */
const retryDelivery = async (req, res) => {
  const { id } = req.params
  const { address, notes } = req.body
  try {
    const delivery = await prisma.delivery.findUnique({ where: { id } })
    if (!delivery) return res.status(404).json({ error: 'Entrega no encontrada' })
    if (delivery.status !== 'NO_ENTREGADO') {
      return res.status(400).json({ error: 'Solo se pueden reagendar entregas fallidas' })
    }

    // Build history log preserving previous attempt info
    const REASON_LABELS = {
      NO_ENCONTRADO: 'Cliente no encontrado',
      DIRECCION_INCORRECTA: 'Dirección incorrecta',
      RECHAZADO: 'Cliente rechazó entrega',
      CERRADO: 'Negocio/domicilio cerrado',
      OTRO: 'Otro motivo'
    }
    const prevHistory = delivery.proof_notes || ''
    const failLabel = REASON_LABELS[delivery.fail_reason] || delivery.fail_reason || 'Sin razón'
    const failDetail = delivery.fail_notes ? ` — ${delivery.fail_notes}` : ''
    const timestamp = new Date().toLocaleString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    const historyEntry = `[Intento #${delivery.attempt_count} falló ${timestamp}] ${failLabel}${failDetail}`
    const retryNote = notes ? `\n[Nota de reagendado] ${notes}` : ''
    const newProofNotes = prevHistory
      ? `${prevHistory}\n${historyEntry}${retryNote}`
      : `${historyEntry}${retryNote}`

    const updated = await prisma.delivery.update({
      where: { id },
      data: {
        status: 'PENDING',
        route_id: null,
        fail_reason: null,
        fail_notes: null,
        attempt_count: { increment: 1 },
        address: address || delivery.address,
        proof_notes: newProofNotes
      },
      include: { sale: { include: { customer: true } } }
    })
    res.json(updated)
  } catch (e) {
    res.status(500).json({ error: 'Error al reagendar entrega', detail: e.message })
  }
}

/**
 * Get sales pending liquidation (driver collected but office hasn't verified).
 * GET /api/logistics/pending-liquidation
 */
const getPendingLiquidation = async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      where: { status: 'COBRADO_CHOFER' },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
      orderBy: { collected_at: 'asc' }
    })

    // Enrich with driver name and delivery info
    const enriched = await Promise.all(sales.map(async (sale) => {
      const delivery = await prisma.delivery.findUnique({
        where: { sale_id: sale.id },
        include: { route: { include: { driver: true } } }
      })
      return {
        ...sale,
        delivery,
        driver_name: delivery?.route?.driver?.name || 'Sin chofer',
        driver_id: delivery?.route?.driver_id || sale.collected_by
      }
    }))

    res.json(enriched)
  } catch (e) {
    console.error('[Liquidation] Error:', e)
    res.status(500).json({ error: 'Error al obtener ventas pendientes de liquidación', detail: e.message })
  }
}

/**
 * Liquidate a sale — office confirms receipt of cash/voucher from driver.
 * POST /api/logistics/liquidate/:saleId
 * Body: { notes?: string }
 */
const liquidateSale = async (req, res) => {
  const { saleId } = req.params
  const { notes } = req.body
  const userId = req.user?.id || 'system'

  try {
    const sale = await prisma.sale.findUnique({ where: { id: saleId } })
    if (!sale) return res.status(404).json({ error: 'Venta no encontrada' })
    if (sale.status !== 'COBRADO_CHOFER') {
      return res.status(400).json({ error: `Solo se pueden liquidar ventas con estatus COBRADO_CHOFER. Estatus actual: ${sale.status}` })
    }

    const updated = await prisma.sale.update({
      where: { id: saleId },
      data: {
        status: 'LIQUIDADO',
        liquidated_by: userId,
        liquidated_at: new Date(),
        liquidation_notes: notes || null
      }
    })

    res.json(updated)
  } catch (e) {
    console.error('[Liquidation] Error:', e)
    res.status(500).json({ error: 'Error al liquidar la venta', detail: e.message })
  }
}

module.exports = { getRoutes, getPendingDeliveries, createRoute, updateDeliveryStatus, analyzeDeliveries, assignToRoute, getDriverRoutes, getActiveDrivers, optimizeRouteOrder, getMapsUrl, updateRouteLocation, getRouteTracking, toggleTracking, retryDelivery, getPendingLiquidation, liquidateSale }
