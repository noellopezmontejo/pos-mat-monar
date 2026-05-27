const express = require('express')
const router = express.Router()
const multer = require('multer')
const fs = require('fs')
const path = require('path')

const { getProfile, updateProfile } = require('../controllers/configController')
const { authenticateToken } = require('../middleware/auth')

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../../public/uploads/logos')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
})

router.get('/profile', getProfile)
router.post('/profile', authenticateToken, upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'app_logo', maxCount: 1 },
  { name: 'app_icon', maxCount: 1 }
]), updateProfile)

module.exports = router
