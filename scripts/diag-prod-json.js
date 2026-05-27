const axios = require('axios');

async function check() {
  try {
    const res = await axios.get('http://localhost:3001/api/products');
    const firstProd = res.data[0];
    console.log('--- Product Mapping Diagnostic ---');
    console.log('Product Name:', firstProd?.name);
    console.log('tax_scheme_id field:', firstProd?.tax_scheme_id);
    console.log('tax_scheme object exists:', !!firstProd?.tax_scheme);
    if (firstProd?.tax_scheme) {
      console.log('tax_scheme.id:', firstProd.tax_scheme.id);
      console.log('tax_scheme.name:', firstProd.tax_scheme.name);
    }
  } catch (e) { console.error('Error reaching API:', e.message); }
}
check();
