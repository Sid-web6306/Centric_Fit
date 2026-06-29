import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('cn (classnames utility)', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('deduplicates Tailwind conflicts — last wins', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'skip', 'keep')).toBe('base keep')
  })

  it('handles undefined gracefully', () => {
    expect(cn(undefined, 'a')).toBe('a')
  })
})
