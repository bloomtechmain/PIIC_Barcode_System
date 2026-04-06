import { Router } from 'express'
import * as customerController from '../controllers/customer.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

// GET  /api/customers
router.get('/', customerController.getAll)

// POST /api/customers
router.post('/', customerController.create)

// GET  /api/customers/:id
router.get('/:id', customerController.getById)

// PUT  /api/customers/:id
router.put('/:id', customerController.update)

export default router
