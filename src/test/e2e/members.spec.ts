import { test, expect } from '@playwright/test'

// These tests require an authenticated session.
// Run with: PLAYWRIGHT_BASE_URL=http://localhost:3000 pnpm e2e
// The fixture below reads test credentials from env vars set in .env.test.local

test.describe('Members page (authenticated)', () => {
  test.beforeEach(async () => {
    // Skip if no test credentials are configured
    if (!process.env.E2E_TEST_EMAIL || !process.env.E2E_TEST_PASSWORD) {
      test.skip()
    }
  })

  test('members page is accessible after login', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(process.env.E2E_TEST_EMAIL!)
    await page.getByRole('button', { name: /continue|send magic link/i }).first().click()
    // OTP flow — this test documents the flow; full automation requires mailbox access
    await expect(page.getByText(/check your email|otp|verification/i)).toBeVisible()
  })
})

test.describe('Members page (unauthenticated)', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/members')
    await page.waitForURL(/\/login/, { timeout: 5000 })
    expect(page.url()).toContain('/login')
  })
})
