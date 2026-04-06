import { Router } from 'express'
import * as itemController from '../controllers/item.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

// GET  /api/items?status=ACTIVE&customerId=...&page=1&limit=20
router.get('/', itemController.getAll)

// POST /api/items
router.post('/', itemController.create)

// GET  /api/items/barcode/:barcode  — must be before /:id to avoid conflict
router.get('/barcode/:barcode', itemController.getByBarcode)

// POST /api/items/verify/:barcode   — scan & log without linking to an audit
router.post('/verify/:barcode', itemController.verifyBarcode)

// GET  /api/items/:id
router.get('/:id', itemController.getById)

// PUT  /api/items/:id
router.put('/:id', itemController.update)

export default router
