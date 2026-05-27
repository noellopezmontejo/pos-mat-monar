const { prisma } = require('../db')

/**
 * Realiza un ajuste de stock manual.
 * Se usa para mermas, daños, o correcciones de inventario.
 */
const adjustStock = async (req, res) => {
  const { product_id, branch_id, quantity, reason, type } = req.body
  const user_id = req.user.id

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Obtener o crear el registro de stock para esa sucursal
      const currentStock = await tx.stock.upsert({
        where: {
          product_id_branch_id: { product_id, branch_id }
        },
        update: {
          quantity: { increment: quantity }
        },
        create: {
          product_id,
          branch_id,
          quantity
        }
      })

      // 2. Registrar en Kardex
      await tx.kardex.create({
        data: {
          product_id,
          branch_id,
          type: type || (quantity >= 0 ? 'IN' : 'OUT'),
          reason: reason || 'Ajuste Manual',
          quantity: Math.abs(quantity),
          balance: currentStock.quantity,
          user_id,
          reference: 'AJUSTE_PWA'
        }
      })

      return currentStock
    })

    res.json(result)
  } catch (error) {
    console.error('Error adjustStock:', error)
    res.status(500).json({ error: 'Error al procesar el ajuste de inventario' })
  }
}

/**
 * Realiza una transferencia de stock entre sucursales.
 */
const transferStock = async (req, res) => {
  const { product_id, from_branch_id, to_branch_id, quantity, observations } = req.body
  const user_id = req.user.id

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Validar stock origen
      const sourceStock = await tx.stock.findUnique({
        where: { product_id_branch_id: { product_id, branch_id: from_branch_id } }
      })

      if (!sourceStock || sourceStock.quantity < quantity) {
        throw new Error('Stock insuficiente en sucursal de origen')
      }

      // 2. Restar de origen
      const updatedSource = await tx.stock.update({
        where: { product_id_branch_id: { product_id, branch_id: from_branch_id } },
        data: { quantity: { decrement: quantity } }
      })

      // 3. Sumar a destino
      const updatedDest = await tx.stock.upsert({
        where: { product_id_branch_id: { product_id, branch_id: to_branch_id } },
        update: { quantity: { increment: quantity } },
        create: { product_id, branch_id: to_branch_id, quantity }
      })

      // 4. Registrar Kardex - SALIDA
      await tx.kardex.create({
        data: {
          product_id,
          branch_id: from_branch_id,
          type: 'OUT',
          reason: `Transferencia a ${to_branch_id}`,
          quantity,
          balance: updatedSource.quantity,
          user_id,
          reference: observations || 'TRANSFER_PWA'
        }
      })

      // 5. Registrar Kardex - ENTRADA
      await tx.kardex.create({
        data: {
          product_id,
          branch_id: to_branch_id,
          type: 'IN',
          reason: `Transferencia desde ${from_branch_id}`,
          quantity,
          balance: updatedDest.quantity,
          user_id,
          reference: observations || 'TRANSFER_PWA'
        }
      })

      return { source: updatedSource, destination: updatedDest }
    })

    res.json(result)
  } catch (error) {
    console.error('Error transferStock:', error)
    res.status(400).json({ error: error.message || 'Error en la transferencia' })
  }
}

const getInventorySearch = async (req, res) => {
  const { query } = req.query
  try {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { barcode: { contains: query, mode: 'insensitive' } },
          { legacy_code: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        stock: {
          include: { branch: true }
        }
      },
      take: 20
    })
    res.json(products)
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar inventario' })
  }
}

module.exports = { adjustStock, transferStock, getInventorySearch }
