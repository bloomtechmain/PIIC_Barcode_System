import { Router } from 'express'
import * as branchController from '../controllers/branch.controller'
import { authenticate } from '../middleware/auth'
import { requireRole } from '../middleware/role'

const router = Router()

router.use(authenticate)

// GET  /api/branches
router.get('/', branchController.getAll)

// GET  /api/branches/:id
router.get('/:id', branchController.getById)

// POST /api/branches (admin only)
router.post('/', requireRole('ADMIN', 'SUPER_ADMIN'), branchController.create)

// DELETE /api/branches/:id (admin only)
router.delete('/:id', requireRole('ADMIN', 'SUPER_ADMIN'), branchController.remove)

// POST /api/branches/:id/customers (admin only)
router.post('/:id/customers', requireRole('ADMIN', 'SUPER_ADMIN'), branchController.assignCustomer)

// DELETE /api/branches/:id/customers/:customerId (admin only)
router.delete('/:id/customers/:customerId', requireRole('ADMIN', 'SUPER_ADMIN'), branchController.removeCustomer)

export default router
