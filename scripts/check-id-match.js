const axios = require('axios');

async function check() {
  try {
    const prods = await axios.get('http://localhost:3001/api/products');
    const taxes = await axios.get('http://localhost:3001/api/tax-schemes');
    
    const firstProd = prods.data[0];
    const matchingTax = taxes.data.find(t => t.id === firstProd.tax_scheme_id);
    
    console.log('--- ID Matching Check ---');
    console.log('Product Tax ID:', firstProd.tax_scheme_id);
    console.log('Available Tax IDs:', taxes.data.map(t => t.id));
    console.log('Match found in list:', !!matchingTax);
    
  } catch (e) { console.error('Error reaching API:', e.message); }
}
check();
