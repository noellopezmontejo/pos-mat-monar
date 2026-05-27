const { prisma } = require('../db')

const recordMovement = async ({ productId, type, reason, quantity, balance, reference, userId }) => {
  return await prisma.kardex.create({
    data: {
      product_id: productId,
      type,
      reason,
      quantity,
      balance,
      reference,
      user_id: userId
    }
  })
}

module.exports = { recordMovement }
