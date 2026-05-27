const { prisma } = require('../db')

// ─── VEHICLES ───────────────────────────────────────────────────────────────

const getVehicles = async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: { drivers: true, routes: { where: { status: 'En Ruta' } } },
      orderBy: { name: 'asc' }
    })
    res.json(vehicles)
  } catch (e) { res.status(500).json({ error: 'Error al obtener vehículos', detail: e.message }) }
}

const createVehicle = async (req, res) => {
  const { name, plate, type, brand, model, year, capacity_weight, capacity_volume, notes } = req.body
  if (!name || !plate || !type) return res.status(400).json({ error: 'Campos requeridos: name, plate, type' })
  try {
    const v = await prisma.vehicle.create({
      data: { name, plate, type, brand, model, year: year ? parseInt(year) : null, capacity_weight: parseFloat(capacity_weight) || 0, capacity_volume: parseFloat(capacity_volume) || 0, notes }
    })
    res.json(v)
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'Ya existe un vehículo con esas placas' })
    res.status(500).json({ error: 'Error al crear vehículo', detail: e.message })
  }
}

const updateVehicle = async (req, res) => {
  const { id } = req.params
  const data = req.body
  if (data.year) data.year = parseInt(data.year)
  if (data.capacity_weight) data.capacity_weight = parseFloat(data.capacity_weight)
  if (data.capacity_volume) data.capacity_volume = parseFloat(data.capacity_volume)
  try {
    const v = await prisma.vehicle.update({ where: { id }, data })
    res.json(v)
  } catch (e) { res.status(500).json({ error: 'Error al actualizar vehículo', detail: e.message }) }
}

const deleteVehicle = async (req, res) => {
  const { id } = req.params
  try {
    await prisma.vehicle.update({ where: { id }, data: { status: 'Inactivo' } })
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: 'Error al eliminar vehículo', detail: e.message }) }
}

// ─── DRIVERS ────────────────────────────────────────────────────────────────

const getDrivers = async (req, res) => {
  try {
    const drivers = await prisma.driver.findMany({
      include: { vehicle: true },
      orderBy: { name: 'asc' }
    })
    res.json(drivers)
  } catch (e) { res.status(500).json({ error: 'Error al obtener choferes', detail: e.message }) }
}

const createDriver = async (req, res) => {
  const { name, phone, license, license_type, vehicle_id, notes } = req.body
  if (!name) return res.status(400).json({ error: 'El nombre del chofer es requerido' })
  try {
    const d = await prisma.driver.create({
      data: { name, phone, license, license_type, vehicle_id: vehicle_id || null, notes },
      include: { vehicle: true }
    })
    res.json(d)
  } catch (e) { res.status(500).json({ error: 'Error al crear chofer', detail: e.message }) }
}

const updateDriver = async (req, res) => {
  const { id } = req.params
  const data = { ...req.body }
  if (data.vehicle_id === '') data.vehicle_id = null
  try {
    const d = await prisma.driver.update({ where: { id }, data, include: { vehicle: true } })
    res.json(d)
  } catch (e) { res.status(500).json({ error: 'Error al actualizar chofer', detail: e.message }) }
}

const deleteDriver = async (req, res) => {
  const { id } = req.params
  try {
    await prisma.driver.update({ where: { id }, data: { status: 'Inactivo' } })
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: 'Error al eliminar chofer', detail: e.message }) }
}

module.exports = { getVehicles, createVehicle, updateVehicle, deleteVehicle, getDrivers, createDriver, updateDriver, deleteDriver }
