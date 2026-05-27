const { prisma } = require('../db')

const getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { 
        category: true, 
        supplier: true,
        line: true,
        tax_scheme: true,
        stock: { include: { branch: true } }
      },
      orderBy: { created_at: 'desc' },
      take: 10
    })
    res.json(products)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' })
  }
}

const createProduct = async (req, res) => {
  const { 
    name, description, barcode, legacy_code, category_id, supplier_id, 
    model, base_unit, purchase_unit, sale_unit, unit_factor,
    weight, volume, tax_scheme_id, status,
    cost, last_cost, avg_cost, 
    price_1, price_2, price_3, price_4, price_5, price_6, 
    min_stock, max_stock,
    has_lots, has_series, is_service,
    line_id
  } = req.body

  try {
    const product = await prisma.product.create({
      data: {
        name,
        description,
        barcode: barcode && barcode !== "" ? barcode : null,
        legacy_code: legacy_code && legacy_code !== "" ? legacy_code : null,
        category_id: category_id && category_id !== "" ? category_id : undefined,
        supplier_id: supplier_id && supplier_id !== "" ? supplier_id : null,
        line_id: line_id && line_id !== "" ? line_id : null,
        tax_scheme_id: tax_scheme_id && tax_scheme_id !== "" ? tax_scheme_id : null,
        model,
        base_unit,
        purchase_unit,
        sale_unit,
        unit_factor: parseFloat(unit_factor) || 1,
        weight: parseFloat(weight) || 0,
        volume: parseFloat(volume) || 0,
        status: status || 'Activo',
        cost: parseInt(cost) || 0,
        last_cost: parseInt(last_cost) || 0,
        avg_cost: parseInt(avg_cost) || 0,
        price_1: parseInt(price_1) || 0,
        price_2: parseInt(price_2) || 0,
        price_3: parseInt(price_3) || 0,
        price_4: parseInt(price_4) || 0,
        price_5: parseInt(price_5) || 0,
        price_6: parseInt(price_6) || 0,
        min_stock: parseInt(min_stock) || 0,
        max_stock: parseInt(max_stock) || 0,
        has_lots: !!has_lots,
        has_series: !!has_series,
        is_service: !!is_service
      }
    })
    res.json(product)
  } catch (error) {
    console.error('Error createProduct:', error)
    let message = 'Error al crear producto'
    if (error.code === 'P2002') {
      message = `Ya existe un producto con el mismo ${error.meta.target.join(', ')}`
    }
    res.status(500).json({ error: message, detail: error.message })
  }
}

const searchProducts = async (req, res) => {
  const { query, page = 1 } = req.query
  if (!query) return res.json([])

  const currentPage = Math.max(1, parseInt(page))
  if (currentPage > 5) return res.json([]) // Limite de 50 productos (5 páginas * 10)

  try {
    const terms = query.trim().split(/\s+/)
    const andConditions = terms.map(term => ({
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { barcode: { contains: term, mode: 'insensitive' } },
        { legacy_code: { contains: term, mode: 'insensitive' } }
      ]
    }))

    const products = await prisma.product.findMany({
      where: {
        AND: andConditions
      },
      include: { 
        category: true, 
        line: true,
        tax_scheme: true,
        stock: { include: { branch: true } }
      },
      take: 10,
      skip: (currentPage - 1) * 10,
      orderBy: { name: 'asc' }
    })
    res.json(products)
  } catch (error) {
    res.status(500).json({ error: 'Error en la búsqueda' })
  }
}

const getProductKardex = async (req, res) => {
  const { id } = req.params
  try {
    const kardex = await prisma.kardex.findMany({
      where: { product_id: id },
      include: { branch: true },
      orderBy: { created_at: 'desc' },
      take: 50
    })
    res.json(kardex)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el historial de movimientos' })
  }
}

const updateProduct = async (req, res) => {
  const { id } = req.params
  const { 
    name, description, barcode, legacy_code, category_id, supplier_id, 
    model, base_unit, purchase_unit, sale_unit, unit_factor,
    weight, volume, tax_scheme_id, status,
    cost, last_cost, avg_cost, 
    price_1, price_2, price_3, price_4, price_5, price_6, 
    min_stock, max_stock,
    has_lots, has_series, is_service,
    line_id,
    p1, p2, p3, p4, p5, p6
  } = req.body

  try {
    const data = {
      name, description, barcode, legacy_code, 
      category_id: category_id && category_id !== "" ? category_id : undefined,
      supplier_id: supplier_id && supplier_id !== "" ? supplier_id : null,
      line_id: line_id && line_id !== "" ? line_id : null,
      tax_scheme_id: tax_scheme_id && tax_scheme_id !== "" ? tax_scheme_id : null,
      model, base_unit, purchase_unit, sale_unit,
      status: status || 'Activo',
      has_lots: has_lots !== undefined ? !!has_lots : undefined,
      has_series: has_series !== undefined ? !!has_series : undefined,
      is_service: is_service !== undefined ? !!is_service : undefined
    }

    if (unit_factor !== undefined) data.unit_factor = parseFloat(unit_factor) || 1
    if (weight !== undefined) data.weight = parseFloat(weight) || 0
    if (volume !== undefined) data.volume = parseFloat(volume) || 0
    if (cost !== undefined) data.cost = parseInt(cost) || 0
    if (last_cost !== undefined) data.last_cost = parseInt(last_cost) || 0
    if (avg_cost !== undefined) data.avg_cost = parseInt(avg_cost) || 0
    if (min_stock !== undefined) data.min_stock = parseInt(min_stock) || 0
    if (max_stock !== undefined) data.max_stock = parseInt(max_stock) || 0

    if (price_1 !== undefined) data.price_1 = parseInt(price_1) || 0
    else if (p1 !== undefined) data.price_1 = Math.round(parseFloat(p1 || 0) * 100)

    if (price_2 !== undefined) data.price_2 = parseInt(price_2) || 0
    else if (p2 !== undefined) data.price_2 = Math.round(parseFloat(p2 || 0) * 100)

    if (price_3 !== undefined) data.price_3 = parseInt(price_3) || 0
    else if (p3 !== undefined) data.price_3 = Math.round(parseFloat(p3 || 0) * 100)

    if (price_4 !== undefined) data.price_4 = parseInt(price_4) || 0
    else if (p4 !== undefined) data.price_4 = Math.round(parseFloat(p4 || 0) * 100)

    if (price_5 !== undefined) data.price_5 = parseInt(price_5) || 0
    else if (p5 !== undefined) data.price_5 = Math.round(parseFloat(p5 || 0) * 100)

    if (price_6 !== undefined) data.price_6 = parseInt(price_6) || 0
    else if (p6 !== undefined) data.price_6 = Math.round(parseFloat(p6 || 0) * 100)

    Object.keys(data).forEach(key => data[key] === undefined && delete data[key])

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...data,
        barcode: barcode && barcode !== "" ? barcode : null,
        legacy_code: legacy_code && legacy_code !== "" ? legacy_code : null
      }
    })
    res.json(product)
  } catch (error) {
    console.error('Error updateProduct:', error)
    res.status(500).json({ error: 'Error al actualizar producto' })
  }
}

const getProductById = async (req, res) => {
  const { id } = req.params
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        line: true,
        tax_scheme: true,
        stock: { include: { branch: true } }
      }
    })
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' })
    res.json(product)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener producto' })
  }
}

module.exports = { getProducts, createProduct, searchProducts, getProductKardex, updateProduct, getProductById }
