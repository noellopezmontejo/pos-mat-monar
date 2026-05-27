const { prisma } = require('../db')

const logAudit = async (tableName, action, userId, oldData = null, newData = null) => {
  try {
    await prisma.auditLog.create({
      data: {
        table_name: tableName,
        action,
        user_id: userId,
        old_data: oldData,
        new_data: newData
      }
    })
  } catch (error) {
    console.error('Failed to log audit:', error)
  }
}

module.exports = { logAudit }
