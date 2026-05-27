const axios = require('axios');

async function testApiSave() {
    const apiUrl = 'http://localhost:3001/api/products';
    console.log('Testing API product creation...');
    
    // First get a category ID
    try {
        const catRes = await axios.get('http://localhost:3001/api/categories');
        const categoryId = catRes.data[0]?.id;
        if (!categoryId) {
            console.error('❌ No categories found to test with.');
            return;
        }
        console.log('Using Category ID:', categoryId);

        const payload = {
            name: 'API Test Product ' + Date.now(),
            legacy_code: 'API-TEST-' + Date.now(),
            description: 'Testing sanitized IDs',
            barcode: 'API' + Date.now(),
            category_id: categoryId,
            line_id: '', // THIS SHOULD BE CONVERTED TO NULL BY CONTROLLER
            brand_id: '', // THIS SHOULD BE CONVERTED TO NULL BY CONTROLLER
            base_unit: 'PZA',
            p1: 10.50,
            cost: 5.00
        };

        const res = await axios.post(apiUrl, payload);
        console.log('✅ API Creation Success:', res.data.id);
    } catch (error) {
        console.error('❌ API Creation Failed:', error.response?.data || error.message);
    }
}

testApiSave();
