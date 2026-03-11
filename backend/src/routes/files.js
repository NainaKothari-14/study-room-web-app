const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const router = express.Router()

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${unique}-${file.originalname}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
})

// POST /api/files/upload
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
  res.json({
    id: Date.now(),
    name: req.file.originalname,
    size: req.file.size,
    type: req.file.mimetype,
    url,
    filename: req.file.filename,
  })
})

// Serve uploaded files statically (also add in app.js if needed)
router.get('/download/:filename', (req, res) => {
  const filePath = path.join(uploadsDir, req.params.filename)
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' })
  res.download(filePath)
})

module.exports = router