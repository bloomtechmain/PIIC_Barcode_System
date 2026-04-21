import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { requireRole } from '../middleware/role'
import { getLogs } from '../controllers/activity-log.controller'

const router = Router()

router.use(authenticate)
router.use(requireRole('SUPER_ADMIN'))

router.get('/', getLogs)

export default router
