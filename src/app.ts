import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import authRoutes from './routes/auth.routes'
import customerRoutes from './routes/customer.routes'
import itemRoutes from './routes/item.routes'
import releaseRoutes from './routes/release.routes'
import auditRoutes from './routes/audit.routes'
import reportRoutes from './routes/report.routes'
import { errorHandler } from './middleware/error'

const app = express()

// ─── Security & Parsing ───────────────────────────────────────────────────────
app.use(helmet())
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

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found', data: null })
})

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler)

export default app
