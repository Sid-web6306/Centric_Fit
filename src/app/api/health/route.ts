import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { serverConfig } from '@/lib/config'

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System is healthy or degraded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, unhealthy]
 *                   description: Overall system health status
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: Health check timestamp
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       $ref: '#/components/schemas/ServiceStatus'
 *                     auth:
 *                       $ref: '#/components/schemas/ServiceStatus'
 *                     email:
 *                       $ref: '#/components/schemas/ServiceStatus'
 *                     payment:
 *                       $ref: '#/components/schemas/ServiceStatus'
 *                 version:
 *                   type: string
 *                   description: Application version
 *       503:
 *         description: System is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [unhealthy]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 services:
 *                   type: object
 *                 version:
 *                   type: string
 */

interface ServiceStatus {
  status: 'ok' | 'error'
  latency?: number
  error?: string
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  services: {
    database: ServiceStatus
    auth: ServiceStatus
    email: ServiceStatus
    payment: ServiceStatus
  }
  version: string
}

async function checkDatabase(): Promise<ServiceStatus> {
  const start = Date.now()
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('gyms').select('id').limit(1)
    if (error) throw error
    return { status: 'ok', latency: Date.now() - start }
  } catch (e) {
    return { status: 'error', error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

async function checkAuth(): Promise<ServiceStatus> {
  const start = Date.now()
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.getSession()
    if (error) throw error
    return { status: 'ok', latency: Date.now() - start }
  } catch (e) {
    return { status: 'error', error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

function checkEmail(): ServiceStatus {
  const hasApiKey = !!serverConfig.msg91ApiKey
  const hasTemplateId = !!serverConfig.msg91InvitationTemplateId
  
  if (hasApiKey && hasTemplateId) {
    return { status: 'ok' }
  }
  return { 
    status: 'error', 
    error: !hasApiKey ? 'MSG91_API_KEY missing' : 'MSG91_INVITATION_TEMPLATE_ID missing' 
  }
}

function checkPayment(): ServiceStatus {
  const hasRazorpayKey = !!process.env.RAZORPAY_KEY_ID
  const hasRazorpaySecret = !!process.env.RAZORPAY_KEY_SECRET
  
  if (hasRazorpayKey && hasRazorpaySecret) {
    return { status: 'ok' }
  }
  return { 
    status: 'error', 
    error: !hasRazorpayKey ? 'RAZORPAY_KEY_ID missing' : 'RAZORPAY_KEY_SECRET missing' 
  }
}

export async function GET() {
  const [database, auth] = await Promise.all([
    checkDatabase(),
    checkAuth(),
  ])
  
  const email = checkEmail()
  const payment = checkPayment()
  
  const services = { database, auth, email, payment }
  const allServices = Object.values(services)
  const errorCount = allServices.filter(s => s.status === 'error').length
  
  const status: HealthResponse['status'] = 
    errorCount === 0 ? 'healthy' : 
    errorCount <= 2 ? 'degraded' : 'unhealthy'
  
  const response: HealthResponse = {
    status,
    timestamp: new Date().toISOString(),
    services,
    version: process.env.npm_package_version || '0.1.0',
  }
  
  return NextResponse.json(response, { 
    status: status === 'unhealthy' ? 503 : 200 
  })
}
