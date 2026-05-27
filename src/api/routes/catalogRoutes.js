const express = require('express');
const router = express.Router();
const { getCatalogs, getZipCodeInfo } = require('../controllers/catalogController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, getCatalogs);
router.get('/cp/:zip', authenticateToken, getZipCodeInfo);

module.exports = router;
