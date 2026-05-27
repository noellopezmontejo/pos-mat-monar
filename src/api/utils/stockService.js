const { prisma } = require('../db')

/**
 * Actualiza el stock de un producto y registra el movimiento en Kardex.
 * Después de cada salida, verifica si el producto alcanzó su stock mínimo
 * y genera una sugerencia de compra automática si es necesario.
 */
const updateStock = async ({ productId, branchId, quantity, type, reason, reference, userId, tx }) => {
  const performUpdate = async (db) => {
    // 1. Update or create stock record using the composite unique key
    const stock = await db.stock.upsert({
      where: { 
        product_id_branch_id: { product_id: productId, branch_id: branchId }
      },
      update: {
        quantity: { increment: quantity }
      },
      create: {
        product_id: productId,
        branch_id: branchId,
        quantity: quantity,
        committed: 0
      }
    })

    // 2. Record movement in Kardex
    await db.kardex.create({
      data: {
        product_id: productId,
        branch_id: branchId,
        type,
        reason,
        quantity,
        balance: stock.quantity,
        reference: String(reference),
        user_id: userId
      }
    })

    // 3. REGLA DE NEGOCIO: Verificar stock mínimo en salidas de venta
    if (type === 'OUT' && reason === 'SALE') {
      await checkMinStockAndSuggest(db, productId, branchId, stock.quantity, reference)
    }

    return stock
  }

  // Use the provided transaction 'tx' or start a new one
  if (tx) {
    return await performUpdate(tx)
  } else {
    return await prisma.$transaction(async (newTx) => {
      return await performUpdate(newTx)
    })
  }
}

/**
 * Verifica si el stock actual está por debajo o igual al mínimo configurado.
 * Si es así, crea una PurchaseSuggestion que aparecerá en el módulo de Compras.
 * 
 * Regla: Solo crea UNA sugerencia activa por producto/sucursal a la vez.
 * Si ya existe una en estado PENDIENTE, no duplica.
 */
async function checkMinStockAndSuggest(db, productId, branchId, currentStock, triggeredBy) {
  try {
    // Obtener configuración del producto
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { 
        id: true, name: true, min_stock: true, max_stock: true,
        supplier_id: true, last_cost: true, is_service: true
      }
    })

    // No aplicar a servicios, productos sin mínimo configurado, o stock aún por encima del mínimo
    if (!product || product.is_service) return
    if (product.min_stock <= 0) return
    if (currentStock > product.min_stock) return

    // Verificar si ya existe una sugerencia PENDIENTE para este producto en esta sucursal
    const existing = await db.purchaseSuggestion.findFirst({
      where: {
        product_id: productId,
        branch_id: branchId,
        status: 'PENDIENTE'
      }
    })

    if (existing) {
      // Actualizar el stock actual en la sugerencia existente (puede haber bajado más)
      await db.purchaseSuggestion.update({
        where: { id: existing.id },
        data: { 
          current_stock: currentStock,
          suggested_qty: Math.max(0, (product.max_stock || product.min_stock * 2) - currentStock)
        }
      })
      console.log(`[StockAlert] Sugerencia de compra actualizada para "${product.name}" (stock: ${currentStock}/${product.min_stock})`)
      return
    }

    // Calcular cantidad sugerida: llenar hasta el máximo, o al menos 2x el mínimo
    const targetStock = product.max_stock > 0 ? product.max_stock : product.min_stock * 2
    const suggestedQty = Math.max(1, targetStock - currentStock)

    // Crear nueva sugerencia de compra
    await db.purchaseSuggestion.create({
      data: {
        product_id: productId,
        supplier_id: product.supplier_id || null,
        branch_id: branchId,
        current_stock: currentStock,
        min_stock: product.min_stock,
        max_stock: product.max_stock || 0,
        suggested_qty: suggestedQty,
        last_cost: product.last_cost || 0,
        status: 'PENDIENTE',
        triggered_by: triggeredBy || null
      }
    })

    console.log(`[StockAlert] ⚠ ALERTA DE STOCK BAJO: "${product.name}" tiene ${currentStock} unidades (mín: ${product.min_stock}). Sugerencia de compra creada: ${suggestedQty} unidades.`)

  } catch (error) {
    // No bloquear la venta si falla la sugerencia
    console.error('[StockAlert] Error al verificar stock mínimo:', error.message)
  }
}

module.exports = { updateStock }
