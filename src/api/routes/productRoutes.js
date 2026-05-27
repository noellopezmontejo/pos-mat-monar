const express = require('express')
const router = express.Router()
const { getProducts, createProduct, searchProducts, getProductKardex, updateProduct, getProductById } = require('../controllers/productController')

router.get('/', getProducts)
router.get('/search', searchProducts)
router.get('/:id', getProductById)
router.get('/:id/kardex', getProductKardex)
router.post('/', createProduct)
router.put('/:id', updateProduct)

module.exports = router
