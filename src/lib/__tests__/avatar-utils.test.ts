import { describe, it, expect } from 'vitest'
import { validateImageFile, generateAvatarFilename } from '../avatar-utils'

describe('validateImageFile', () => {
  function makeFile(name: string, type: string, size: number) {
    return new File(['x'.repeat(size)], name, { type })
  }

  it('accepts a valid JPEG under the size limit', () => {
    const file = makeFile('photo.jpg', 'image/jpeg', 1024)
    expect(validateImageFile(file).isValid).toBe(true)
  })

  it('rejects a non-image file type', () => {
    const file = makeFile('doc.pdf', 'application/pdf', 1024)
    const result = validateImageFile(file)
    expect(result.isValid).toBe(false)
    expect(result.error).toMatch(/image/i)
  })

  it('rejects a file that exceeds 1 MB', () => {
    const file = makeFile('big.png', 'image/png', 2 * 1024 * 1024)
    const result = validateImageFile(file)
    expect(result.isValid).toBe(false)
    expect(result.error).toMatch(/1MB/i)
  })
})

describe('generateAvatarFilename', () => {
  it('returns a string with the userId embedded', () => {
    const name = generateAvatarFilename('user-123', 'photo.jpg')
    expect(name).toContain('user-123')
  })

  it('produces a path with the correct extension', () => {
    const name = generateAvatarFilename('user-abc', 'selfie.png')
    expect(name).toMatch(/\.png$/)
  })
})
