const { prisma } = require('../db')

const getCustomers = async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      include: { fiscal_client: true },
      orderBy: { created_at: 'desc' },
      take: 10
    })
    console.log(`[API] getCustomers found: ${customers.length}`)
    res.json(customers)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener clientes' })
  }
}

const searchCustomers = async (req, res) => {
  const { query } = req.query
  if (!query) return res.json([])

  try {
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          { legacy_code: { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: { fiscal_client: true },
      take: 20
    })
    console.log(`[API] searchCustomers find: ${customers.length} for query: ${query}`)
    res.json(customers)
  } catch (error) {
    res.status(500).json({ error: 'Error en la búsqueda de clientes' })
  }
}

const createCustomer = async (req, res) => {
  const { name, phone, address, delivery_zone, customer_type, credit_limit, credit_days, seller_id, legacy_code, fiscal_data } = req.body
  try {
    const data = {
        name, phone, address, delivery_zone, customer_type,
        credit_limit: parseInt(credit_limit) || 0,
        credit_days: parseInt(credit_days) || 0,
        seller_id: seller_id || null, 
        legacy_code: legacy_code || null
    }
    await prisma.$transaction(async (tx) => {
      let fiscal_id = null
      if (fiscal_data && fiscal_data.rfc) {
         let fc = await tx.fiscalClient.findUnique({ where: { rfc: fiscal_data.rfc } })
         if (!fc) {
             fc = await tx.fiscalClient.create({
                 data: {
                     rfc: fiscal_data.rfc,
                     business_name: fiscal_data.business_name || name,
                     regime: fiscal_data.regime || '',
                     cfdi_use: fiscal_data.cfdi_use || '',
                     email: fiscal_data.email || '',
                     address: fiscal_data.address || address || '',
                     zip_code: fiscal_data.zip_code || '',
                     street: fiscal_data.street || '',
                     exterior: fiscal_data.exterior || '',
                     interior: fiscal_data.interior || '',
                     colony: fiscal_data.colony || '',
                     municipality: fiscal_data.municipality || '',
                     state: fiscal_data.state || ''
                 }
             })
         }
         fiscal_id = fc.id
      }
      if (fiscal_id) data.fiscal_id = fiscal_id

      const customer = await tx.customer.create({ data })
      res.json(customer)
    })
  } catch (error) {
    res.status(500).json({ error: 'Error al crear cliente' })
  }
}

const updateCustomer = async (req, res) => {
  const { id } = req.params
  const { name, phone, address, delivery_zone, customer_type, credit_limit, credit_days, seller_id, legacy_code, fiscal_data } = req.body
  try {
    const data = {
        name, phone, address, delivery_zone, customer_type,
        credit_limit: parseInt(credit_limit) || 0,
        credit_days: parseInt(credit_days) || 0,
        seller_id: seller_id || null, 
        legacy_code: legacy_code || null
    }

    await prisma.$transaction(async (tx) => {
      let fiscal_id = null
      if (fiscal_data && fiscal_data.rfc) {
         let fc = await tx.fiscalClient.findUnique({ where: { rfc: fiscal_data.rfc } })
         if (fc) {
             fc = await tx.fiscalClient.update({
                 where: { id: fc.id },
                 data: {
                     business_name: fiscal_data.business_name || name,
                     regime: fiscal_data.regime || '',
                     cfdi_use: fiscal_data.cfdi_use || '',
                     email: fiscal_data.email || '',
                     address: fiscal_data.address || address || '',
                     zip_code: fiscal_data.zip_code || '',
                     street: fiscal_data.street || '',
                     exterior: fiscal_data.exterior || '',
                     interior: fiscal_data.interior || '',
                     colony: fiscal_data.colony || '',
                     municipality: fiscal_data.municipality || '',
                     state: fiscal_data.state || ''
                 }
             })
         } else {
             fc = await tx.fiscalClient.create({
                 data: {
                     rfc: fiscal_data.rfc,
                     business_name: fiscal_data.business_name || name,
                     regime: fiscal_data.regime || '',
                     cfdi_use: fiscal_data.cfdi_use || '',
                     email: fiscal_data.email || '',
                     address: fiscal_data.address || address || '',
                     zip_code: fiscal_data.zip_code || '',
                     street: fiscal_data.street || '',
                     exterior: fiscal_data.exterior || '',
                     interior: fiscal_data.interior || '',
                     colony: fiscal_data.colony || '',
                     municipality: fiscal_data.municipality || '',
                     state: fiscal_data.state || ''
                 }
             })
         }
         fiscal_id = fc.id
      }
      if (fiscal_id) data.fiscal_id = fiscal_id

      const customer = await tx.customer.update({ where: { id }, data, include: { fiscal_client: true } })
      res.json(customer)
    })
  } catch (error) {
    console.error('[API] Error updating customer:', error)
    res.status(500).json({ error: 'Error al actualizar cliente' })
  }
}

module.exports = { getCustomers, createCustomer, updateCustomer, searchCustomers }
