import { Router } from 'express'
import * as reportController from '../controllers/report.controller'
import { authenticate } from '../middleware/auth'
import { requireRole } from '../middleware/role'

const router = Router()

router.use(authenticate, requireRole('ADMIN', 'SUPER_ADMIN'))

// GET /api/reports/summary
router.get('/summary', reportController.getSummary)

// GET /api/reports/missing
router.get('/missing', reportController.getMissingItems)

// GET /api/reports/customer/:customerId
router.get('/customer/:customerId', reportController.getCustomerHistory)

export default router
