import { Router } from 'express'
import multer from 'multer'
import * as importController from '../controllers/import.controller'
import { authenticate } from '../middleware/auth'

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel',                                           // .xls
      'text/csv',
      'application/csv',
      'application/octet-stream'
    ]
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls|csv)$/i)) {
      cb(null, true)
    } else {
      cb(new Error('Only Excel (.xlsx, .xls) and CSV files are allowed'))
    }
  }
})

router.use(authenticate)

// POST /api/import/csv
router.post('/csv', upload.single('file'), importController.importCSV)

export default router
