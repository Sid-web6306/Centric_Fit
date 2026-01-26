import { NextRequest, NextResponse } from 'next/server'
import { signupWithEmail } from '@/actions/auth.actions'

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Sign up with email (passwordless)
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
 *               inviteToken:
 *                 type: string
 *                 description: Optional invitation token
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
 *               inviteToken:
 *                 type: string
 *                 description: Optional invitation token
 *     responses:
 *       200:
 *         description: Signup successful - OTP sent to email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid email or signup failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many signup attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const result = await signupWithEmail(formData)
    
    if (result?.error) {
      return NextResponse.json(
        { error: 'Signup failed', message: result.error },
        { status: 400 }
      )
    }

    // If no error, the signup was successful and OTP was sent
    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email for verification'
    })
  } catch (error) {
    // Check if this is a Next.js redirect (not a real error)
    const errorStr = JSON.stringify(error)
    if (errorStr.includes('NEXT_REDIRECT') || errorStr.includes('redirect')) {
      // Signup successful, redirect would happen in web context
      return NextResponse.json({
        success: true,
        message: 'OTP sent to your email for verification'
      })
    }
    
    console.error('Signup API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
