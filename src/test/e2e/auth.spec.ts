import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('login page loads and shows email input', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /sign in|log in|welcome/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
  })

  test('login page shows social auth buttons', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /facebook/i })).toBeVisible()
  })

  test('login page links to signup', async ({ page }) => {
    await page.goto('/login')
    const signupLink = page.getByRole('link', { name: /sign up|create account/i })
    await expect(signupLink).toBeVisible()
  })

  test('signup page loads and shows email input', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.getByLabel(/email/i)).toBeVisible()
  })

  test('invalid email shows validation error', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('not-an-email')
    await page.getByRole('button', { name: /continue|send|sign in/i }).first().click()
    await expect(page.getByText(/valid email/i)).toBeVisible()
  })

  test('unauthenticated access to dashboard redirects to login', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL(/\/login/, { timeout: 5000 })
    expect(page.url()).toContain('/login')
  })
})
