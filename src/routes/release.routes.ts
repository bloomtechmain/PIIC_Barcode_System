import { Router } from 'express'
import * as releaseController from '../controllers/release.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

// GET  /api/releases
router.get('/', releaseController.getAll)

// POST /api/releases
router.post('/', releaseController.create)

// GET  /api/releases/:id
router.get('/:id', releaseController.getById)

export default router
