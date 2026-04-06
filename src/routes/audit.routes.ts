import { Router } from 'express'
import * as auditController from '../controllers/audit.controller'
import { authenticate } from '../middleware/auth'
import { requireRole } from '../middleware/role'

const router = Router()

router.use(authenticate)

// GET  /api/audits
router.get('/', auditController.getAll)

// GET  /api/audits/:id
router.get('/:id', auditController.getById)

// POST /api/audits  — ADMIN only
router.post('/', requireRole('ADMIN'), auditController.create)

// POST /api/audits/:id/scan  — any authenticated user
router.post('/:id/scan', auditController.scan)

// POST /api/audits/:id/finalize  — ADMIN only
router.post('/:id/finalize', requireRole('ADMIN'), auditController.finalize)

export default router
