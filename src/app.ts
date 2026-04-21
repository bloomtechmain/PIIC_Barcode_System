import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'path'

import authRoutes from './routes/auth.routes'
import customerRoutes from './routes/customer.routes'
import itemRoutes from './routes/item.routes'
import releaseRoutes from './routes/release.routes'
import auditRoutes from './routes/audit.routes'
import reportRoutes from './routes/report.routes'
import importRoutes from './routes/import.routes'
import activityLogRoutes from './routes/activity-log.routes'
import { errorHandler } from './middleware/error'

const app = express()

// ─── Security & Parsing ───────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ─── Logging ──────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'))
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/items', itemRoutes)
app.use('/api/releases', releaseRoutes)
app.use('/api/audits', auditRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/import', importRoutes)
app.use('/api/activity-logs', activityLogRoutes)

// ─── Static Frontend (Production) ─────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '..', 'frontend', 'dist')
  app.use(express.static(frontendDist))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'))
  })
}

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found', data: null })
})

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler)

export default app
