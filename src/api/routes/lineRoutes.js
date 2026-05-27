const express = require('express')
const router = express.Router()
const { getLines } = require('../controllers/lineController')

router.get('/', getLines)

module.exports = router
