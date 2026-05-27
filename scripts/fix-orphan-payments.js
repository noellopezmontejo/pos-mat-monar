const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('--- Iniciando Reparación de Cuentas por Pagar ---')

  // 1. Encontrar recepciones sin pagos asociados
  const receptions = await prisma.reception.findMany({
    include: {
      purchase_order: { include: { supplier: true } },
      items: true
    }
  })

  // Obtener IDs de recepciones que ya tienen pago
  const existingPayments = await prisma.supplierPayment.findMany({
    select: { reception_id: true }
  })
  const paymentReceptionIds = new Set(existingPayments.map(p => p.reception_id).filter(id => id))

  const orphans = receptions.filter(r => !paymentReceptionIds.has(r.id))
  console.log(`Se encontraron ${orphans.length} recepciones huérfanas.`)

  for (const reception of orphans) {
    const physicalValue = reception.items.reduce((acc, item) => acc + (item.quantity * item.cost), 0)
    const po = reception.purchase_order
    
    const creditDays = po.supplier?.credit_days || 0
    const dueDate = new Date(reception.created_at)
    dueDate.setDate(dueDate.getDate() + creditDays)

    await prisma.supplierPayment.create({
      data: {
        supplier_id: po.supplier_id,
        reception_id: reception.id,
        purchase_order_id: po.id,
        reception_value: physicalValue,
        po_total_value: po.total_amount,
        amount: physicalValue,
        balance: physicalValue,
        due_date: dueDate,
        status: 'Por Validar'
      }
    })
    console.log(`[CREADO] Pago para OC ${po.folio} (Recepción ${reception.id.slice(0,8)})`)
  }

  // 2. Corregir registros con monto 0 y estatus Pendiente (posible bug previo)
  const buggyPayments = await prisma.supplierPayment.findMany({
    where: {
      status: 'Pendiente',
      amount: 0,
      balance: 0
    }
  })

  console.log(`Se encontraron ${buggyPayments.length} pagos con monto 0 en estado Pendiente.`)
  for (const pay of buggyPayments) {
    await prisma.supplierPayment.update({
      where: { id: pay.id },
      data: {
        status: 'Por Validar',
        amount: pay.reception_value,
        balance: pay.reception_value
      }
    })
    console.log(`[CORREGIDO] Pago ID ${pay.id.slice(0,8)} movido a Por Validar con monto ${pay.reception_value}`)
  }

  console.log('--- Reparación Finalizada ---')
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
