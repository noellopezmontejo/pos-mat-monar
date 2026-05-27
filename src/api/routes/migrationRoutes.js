const express = require('express')
const router = express.Router()
const migrationController = require('../controllers/migrationController')

router.post('/start', migrationController.startMigration)
router.post('/test-connection', migrationController.testConnection)
router.get('/progress', migrationController.getMigrationProgress)

module.exports = router
