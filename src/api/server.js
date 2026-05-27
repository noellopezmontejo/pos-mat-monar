require('dotenv').config()
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const { prisma } = require('./db')

const app = express()
module.exports = { app }

const { setupPrismaMiddlewares } = require('./middleware/prismaAudit')
// setupPrismaMiddlewares(prisma)

const PORT = 4002
console.log(`[Diagnostic] Iniciando servidor en puerto ${PORT}...`);

app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

// Routes
const authRoutes = require('./routes/authRoutes')
const customerRoutes = require('./routes/customerRoutes')
const productRoutes = require('./routes/productRoutes')
const salesRoutes = require('./routes/salesRoutes')
const cashRoutes = require('./routes/cashRoutes')
const logisticsRoutes = require('./routes/logisticsRoutes')
const migrationRoutes = require('./routes/migrationRoutes')
const billingRoutes = require('./routes/billingRoutes')
const supplierRoutes = require('./routes/supplierRoutes')
const purchaseRoutes = require('./routes/purchaseRoutes')
const lineRoutes = require('./routes/lineRoutes')
const taxSchemeRoutes = require('./routes/taxSchemeRoutes')
const categoryRoutes = require('./routes/categoryRoutes')
const branchRoutes = require('./routes/branchRoutes')
const userRoutes = require('./routes/userRoutes')
const cpRoutes = require('./routes/cpRoutes')
const inventoryRoutes = require('./routes/inventoryRoutes')
const syncRoutes = require('./routes/syncRoutes')
const receivablesRoutes = require('./routes/receivablesRoutes')
const fleetRoutes = require('./routes/fleetRoutes')
const catalogRoutes = require('./routes/catalogRoutes')
const cashRegisterRoutes = require('./routes/cashRegisterRoutes')
const collectionsRoutes = require('./routes/collectionsRoutes')
const configRoutes = require('./routes/configRoutes')
const reportsRoutes = require('./routes/reportsRoutes')
const inventoryAdditionsRoutes = require('./routes/inventoryAdditionsRoutes')

// Serve static uploads
const path = require('path')
app.use('/uploads', express.static(path.join(__dirname, '../../public/uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/products', productRoutes)
app.use('/api/sales', salesRoutes)
app.use('/api/cash', cashRoutes)
app.use('/api/logistics', logisticsRoutes)
app.use('/api/migration', migrationRoutes)
app.use('/api/billing', billingRoutes)
app.use('/api/suppliers', supplierRoutes)
app.use('/api/purchases', purchaseRoutes)
app.use('/api/lines', lineRoutes)
app.use('/api/tax-schemes', taxSchemeRoutes)
console.log('[Diagnostic] Registrando ruta /api/categories')
app.use('/api/categories', categoryRoutes)
app.use('/api/branches', branchRoutes)
app.use('/api/users', userRoutes)
app.use('/api/cp', cpRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/inventory-additions', inventoryAdditionsRoutes)
app.use('/api/sync', syncRoutes)
app.use('/api/receivables', receivablesRoutes)
app.use('/api/fleet', fleetRoutes)
app.use('/api/catalogs', catalogRoutes)
app.use('/api/cash-register', cashRegisterRoutes)
app.use('/api/collections', collectionsRoutes)
app.use('/api/config', configRoutes)
app.use('/api/reports', reportsRoutes)

// Placeholder for other routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() })
})

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal Server Error' })
})

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running and accepting external connections: http://0.0.0.0:${PORT}`)
})
console.log(`[Lifecycle] Servidor iniciado y escuchando activamente.`);

// Deshabilitar timeout completamente para migraciones masivas infinitas
server.timeout = 0;
server.keepAliveTimeout = 0;
