/**
 * Route Optimization Engine
 * 
 * Uses Nominatim (OpenStreetMap) for geocoding and Nearest Neighbor
 * algorithm to optimize delivery order — minimizing travel distance.
 */

const https = require('https')
const http = require('http')

// ─── Geocoding via Nominatim (free, no API key) ──────────────────

function geocodeAddress(address) {
  return new Promise((resolve) => {
    const query = encodeURIComponent(address + ', Chihuahua, Mexico')
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`

    https.get(url, { headers: { 'User-Agent': 'PosMatMonar/1.0' } }, (res) => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => {
        try {
          const results = JSON.parse(data)
          if (results.length > 0) {
            resolve({ lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon), ok: true })
          } else {
            resolve({ lat: 0, lng: 0, ok: false })
          }
        } catch {
          resolve({ lat: 0, lng: 0, ok: false })
        }
      })
    }).on('error', () => resolve({ lat: 0, lng: 0, ok: false }))
  })
}

// Rate-limited geocoding (Nominatim requires 1 req/sec)
async function geocodeAll(addresses) {
  const results = []
  for (const addr of addresses) {
    const result = await geocodeAddress(addr)
    results.push(result)
    // Wait 1.1s between requests to respect Nominatim rate limit
    if (addresses.indexOf(addr) < addresses.length - 1) {
      await new Promise(r => setTimeout(r, 1100))
    }
  }
  return results
}

// ─── Haversine distance (km) ──────────────────────────────────

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371 // km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

// ─── Nearest Neighbor Algorithm ──────────────────────────────

function nearestNeighborOrder(origin, points) {
  const n = points.length
  const visited = new Array(n).fill(false)
  const order = []
  let current = origin
  let totalDistance = 0

  for (let step = 0; step < n; step++) {
    let bestIdx = -1
    let bestDist = Infinity

    for (let i = 0; i < n; i++) {
      if (visited[i] || !points[i].ok) continue
      const d = haversine(current.lat, current.lng, points[i].lat, points[i].lng)
      if (d < bestDist) {
        bestDist = d
        bestIdx = i
      }
    }

    if (bestIdx === -1) {
      // Add remaining un-geocoded points at the end
      for (let i = 0; i < n; i++) {
        if (!visited[i]) { order.push(i); visited[i] = true }
      }
      break
    }

    visited[bestIdx] = true
    order.push(bestIdx)
    totalDistance += bestDist
    current = points[bestIdx]
  }

  return { order, totalDistance }
}

// ─── Build Google Maps URL with optimized waypoints ──────────

function buildMapsUrl(originAddr, addresses) {
  if (addresses.length === 0) return null
  if (addresses.length === 1) {
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originAddr)}&destination=${encodeURIComponent(addresses[0])}&travelmode=driving`
  }

  const destination = addresses[addresses.length - 1]
  const waypoints = addresses.slice(0, -1).map(a => encodeURIComponent(a)).join('|')
  
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(originAddr)}&destination=${encodeURIComponent(destination)}&waypoints=${waypoints}&travelmode=driving`
}

/**
 * Main optimization function:
 * 1. Geocodes all delivery addresses
 * 2. Runs nearest-neighbor from origin
 * 3. Returns optimized order + Google Maps URL
 */
async function optimizeRoute(originAddress, deliveries) {
  const addresses = deliveries.map(d => d.address || '')
  const validAddresses = addresses.filter(a => a.trim().length > 3)

  if (validAddresses.length === 0) {
    return {
      success: false,
      error: 'No hay direcciones válidas para optimizar',
      mapsUrl: null,
      order: deliveries.map((_, i) => i),
      totalDistanceKm: 0
    }
  }

  // Geocode origin + all addresses
  console.log(`[RouteOptimizer] Geocoding ${validAddresses.length + 1} addresses...`)
  const allAddresses = [originAddress, ...addresses]
  const coords = await geocodeAll(allAddresses)
  
  const originCoord = coords[0]
  const deliveryCoords = coords.slice(1)

  const geocodedCount = deliveryCoords.filter(c => c.ok).length
  console.log(`[RouteOptimizer] Geocoded ${geocodedCount}/${addresses.length} addresses successfully`)

  if (geocodedCount === 0) {
    // Can't optimize, just return original order with maps URL
    const mapsUrl = buildMapsUrl(originAddress, addresses)
    return {
      success: false,
      error: 'No se pudieron geocodificar las direcciones. Se abrirá la ruta sin optimizar.',
      mapsUrl,
      order: deliveries.map((_, i) => i),
      totalDistanceKm: 0,
      geocodedCount: 0
    }
  }

  // Run nearest neighbor
  const { order, totalDistance } = nearestNeighborOrder(
    originCoord.ok ? originCoord : { lat: 28.6353, lng: -106.0889 }, // Fallback: Chihuahua center
    deliveryCoords
  )

  // Build optimized addresses array for Google Maps
  const optimizedAddresses = order.map(i => addresses[i])
  const mapsUrl = buildMapsUrl(originAddress, optimizedAddresses)

  return {
    success: true,
    order,
    mapsUrl,
    totalDistanceKm: Math.round(totalDistance * 10) / 10,
    geocodedCount,
    totalDeliveries: deliveries.length,
    coordinates: order.map(i => ({
      deliveryId: deliveries[i]?.id,
      address: addresses[i],
      lat: deliveryCoords[i]?.lat,
      lng: deliveryCoords[i]?.lng,
      geocoded: deliveryCoords[i]?.ok
    }))
  }
}

module.exports = { optimizeRoute, geocodeAddress, haversine, buildMapsUrl }
