import { NextRequest, NextResponse } from 'next/server'
import { loginWithEmail } from '@/actions/auth.actions'

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email (passwordless)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Login successful - OTP sent to email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid email or login failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many login attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const result = await loginWithEmail(formData)
    
    if (result?.error) {
      return NextResponse.json(
        { error: 'Login failed', message: result.error },
        { status: 400 }
      )
    }

    // If no error, the login was successful and OTP was sent
    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email'
    })
  } catch (error) {
    // Check if this is a Next.js redirect (not a real error)
    const errorStr = JSON.stringify(error)
    if (errorStr.includes('NEXT_REDIRECT') || errorStr.includes('redirect')) {
      // Login successful, redirect would happen in web context
      return NextResponse.json({
        success: true,
        message: 'OTP sent to your email'
      })
    }
    
    console.error('Login API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
