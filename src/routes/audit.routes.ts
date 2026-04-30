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
router.post('/', requireRole('ADMIN', 'SUPER_ADMIN'), auditController.create)

// POST /api/audits/initial  — ADMIN only
router.post('/initial', requireRole('ADMIN', 'SUPER_ADMIN'), auditController.createInitial)

// GET /api/audits/:id/items  — initial audit items
router.get('/:id/items', auditController.getInitialAuditItems)

// POST /api/audits/:id/add-item  — ADMIN only
router.post('/:id/add-item', requireRole('ADMIN', 'SUPER_ADMIN'), auditController.addAuditItem)

// POST /api/audits/:id/scan  — any authenticated user
router.post('/:id/scan', auditController.scan)

// POST /api/audits/:id/finalize  — ADMIN only
router.post('/:id/finalize', requireRole('ADMIN', 'SUPER_ADMIN'), auditController.finalize)

// PATCH /api/audits/:id/items/:itemId  — any authenticated user
router.patch('/:id/items/:itemId', auditController.updateAuditItem)

// POST /api/audits/:id/bulk-release  — ADMIN only
router.post('/:id/bulk-release', requireRole('ADMIN', 'SUPER_ADMIN'), auditController.bulkRelease)

export default router
