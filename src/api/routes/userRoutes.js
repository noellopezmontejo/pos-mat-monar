const express = require('express')
const router = express.Router()
const { getUsers, createUser, updateUser, deleteUser, getAlmacenistas, getChoferes } = require('../controllers/userController')

router.get('/', getUsers)
router.post('/', createUser)
router.put('/:id', updateUser)
router.delete('/:id', deleteUser)
router.get('/almacenistas', getAlmacenistas)
router.get('/choferes', getChoferes)

module.exports = router
