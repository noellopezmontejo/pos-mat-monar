const { prisma } = require('../src/api/db');

async function debugSave() {
  console.log('Testing product creation...');
  try {
    // Get first category
    const category = await prisma.category.findFirst();
    if (!category) {
      console.error('❌ No categories found! Product creation will fail.');
      return;
    }
    console.log('Using category:', category.name, category.id);

    const productData = {
      name: 'Test Product ' + Date.now(),
      legacy_code: 'TEST-' + Date.now(),
      description: 'Debug test product',
      barcode: '123456789' + Math.floor(Math.random() * 1000),
      category_id: category.id,
      line_id: '', // EMPTY STRING TEST
      brand_id: '', // EMPTY STRING TEST
      base_unit: 'PZA',
      purchase_unit: 'PZA',
      sale_unit: 'PZA',
      unit_factor: 1.0,
      weight: 0.5,
      volume: 0.1,
      tax_scheme: 1,
      status: 'Activo',
      cost: 1000, // 10.00
      last_cost: 950,
      avg_cost: 975,
      price_1: 1500, // 15.00
      price_2: 1400,
      price_3: 1300,
      price_4: 1200,
      price_5: 1100,
      price_6: 1050,
      min_stock: 5,
      max_stock: 100,
      has_lots: false,
      has_series: false,
      is_service: false
    };

    console.log('Attempting to create product...');
    const product = await prisma.product.create({ data: productData });
    console.log('✅ Product created successfully:', product.id);
  } catch (error) {
    console.error('❌ Error creating product:', error);
    if (error.code) console.error('Error Code:', error.code);
    if (error.meta) console.error('Error Meta:', error.meta);
  } finally {
    await prisma.$disconnect();
  }
}

debugSave();
