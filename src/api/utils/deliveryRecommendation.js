/**
 * Smart Delivery Recommendation Engine
 * 
 * Analyzes delivery items (weight, volume) and scores available vehicles
 * to recommend the most efficient assignment — smallest vehicle that can
 * carry the load without wasting capacity.
 */

// Vehicle type order from smallest to largest
const VEHICLE_ORDER = ['MOTOCICLETA', 'CAMIONETA', 'CAMION_3T', 'CAMION_8T', 'TRAILER']

const VEHICLE_LABELS = {
  MOTOCICLETA: { label: 'Motocicleta', icon: '🏍️', max_kg: 30    },
  CAMIONETA:   { label: 'Camioneta',   icon: '🚐', max_kg: 1500  },
  CAMION_3T:   { label: 'Camión 3.5T',icon: '🚛', max_kg: 3500  },
  CAMION_8T:   { label: 'Camión 8T',  icon: '🚚', max_kg: 8000  },
  TRAILER:     { label: 'Tráiler',     icon: '🚜', max_kg: 25000 },
}

/**
 * Calculates the total weight (KG) and volume (M³) of a list of deliveries.
 * Uses product.weight and product.volume fields.
 * Falls back to 0 if data is missing.
 */
function calcDeliveryLoad(deliveries) {
  let totalKg  = 0
  let totalM3  = 0
  let hasData  = false

  for (const d of deliveries) {
    const items = d.sale?.items || []
    for (const item of items) {
      const w = parseFloat(item.product?.weight) || 0
      const v = parseFloat(item.product?.volume) || 0
      totalKg += w * item.quantity
      totalM3 += v * item.quantity
      if (w > 0 || v > 0) hasData = true
    }
  }

  return { totalKg, totalM3, hasData }
}

/**
 * Recommends the optimal vehicle TYPE based on load.
 * Uses a safety factor of 85% capacity to avoid overloading.
 * Returns the smallest type that can handle the load.
 */
function recommendVehicleType(totalKg, totalM3) {
  const SAFETY = 0.85
  const thresholds = [
    { type: 'MOTOCICLETA', maxKg: 30,    maxM3: 0.2  },
    { type: 'CAMIONETA',   maxKg: 1500,  maxM3: 4    },
    { type: 'CAMION_3T',   maxKg: 3500,  maxM3: 10   },
    { type: 'CAMION_8T',   maxKg: 8000,  maxM3: 45   },
    { type: 'TRAILER',     maxKg: 25000, maxM3: 90   },
  ]

  for (const t of thresholds) {
    const kgOk = totalKg <= (t.maxKg * SAFETY)
    const m3Ok = totalM3 <= (t.maxM3 * SAFETY) || totalM3 === 0
    if (kgOk && m3Ok) return t.type
  }

  return 'TRAILER' // Heaviest available
}

/**
 * Scores and ranks available vehicles for a given load.
 * Returns vehicles sorted from best to worst fit.
 * 
 * Scoring logic:
 *  - CANT_USE    → vehicle capacity < required (too small)
 *  - OPTIMAL     → vehicle capacity covers load with 10–60% headroom
 *  - OVERSIZED   → vehicle is massively larger than needed (wasteful)
 *  - Score: lower remaining capacity after load = better fit
 */
function rankVehicles(vehicles, totalKg, totalM3) {
  return vehicles
    .filter(v => v.status !== 'Inactivo')
    .map(v => {
      const capKg = v.capacity_weight || 0
      const capM3 = v.capacity_volume || 0

      const canCarryWeight = capKg === 0 || capKg >= totalKg
      const canCarryVolume = capM3 === 0 || totalM3 === 0 || capM3 >= totalM3

      if (!canCarryWeight || !canCarryVolume) {
        return { ...v, _score: Infinity, _status: 'CANT_USE', _reason: `Capacidad insuficiente (${capKg}KG disponible, ${totalKg.toFixed(1)}KG requerido)` }
      }

      const remainKg = capKg - totalKg
      const usageRatio = capKg > 0 ? totalKg / capKg : 0

      let _status, _reason
      if (usageRatio >= 0.5) {
        _status = 'OPTIMAL'
        _reason = `Uso óptimo: ${Math.round(usageRatio * 100)}% de capacidad`
      } else if (usageRatio >= 0.2) {
        _status = 'ACCEPTABLE'
        _reason = `Uso aceptable: ${Math.round(usageRatio * 100)}% de capacidad`
      } else {
        _status = 'OVERSIZED'
        _reason = `Sobredimensionado: solo ${Math.round(usageRatio * 100)}% de uso`
      }

      // Sort priority: Available vehicles first, then by best fit (lowest remaining capacity)
      const availabilityBonus = v.status === 'Disponible' ? 0 : 100000
      return { ...v, _score: remainKg + availabilityBonus, _status, _reason, _usageRatio: usageRatio }
    })
    .sort((a, b) => a._score - b._score)
}

/**
 * Builds a human-readable recommendation summary.
 */
function buildRecommendationSummary(totalKg, totalM3, recommendedType, hasData) {
  if (!hasData) {
    return {
      level: 'WARNING',
      message: 'Los productos de esta entrega no tienen datos de peso/volumen registrados. Se recomienda verificar manualmente.',
      icon: '⚠️'
    }
  }

  const typeCfg = VEHICLE_LABELS[recommendedType]
  return {
    level: 'INFO',
    message: `Carga estimada: ${totalKg.toFixed(1)} KG${totalM3 > 0 ? ` / ${totalM3.toFixed(2)} M³` : ''}. Tipo recomendado: ${typeCfg?.icon} ${typeCfg?.label}.`,
    icon: '🎯',
    recommendedType,
    totalKg,
    totalM3
  }
}

module.exports = { calcDeliveryLoad, recommendVehicleType, rankVehicles, buildRecommendationSummary, VEHICLE_LABELS, VEHICLE_ORDER }
