import { Router } from 'express'
import * as authController from '../controllers/auth.controller'
import { authenticate } from '../middleware/auth'
import { requireRole } from '../middleware/role'

const router = Router()

// POST /api/auth/login
router.post('/login', authController.login)

// POST /api/auth/register  — ADMIN only
router.post('/register', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), authController.register)

// GET /api/auth/me
router.get('/me', authenticate, authController.getProfile)

export default router
