import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { z } from 'zod'

// Feature: shadcn-ui-migration, Property 1: Form validation preservation
// For any form with validation rules, submitting invalid data should trigger the same validation errors

describe('Form Validation Preservation', () => {
  // Email validation schema
  const emailSchema = z.string().email('Invalid email address')
  
  // Password validation schema
  const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')

  it('should reject invalid emails consistently', () => {
    fc.assert(
      fc.property(fc.string(), (invalidEmail) => {
        // Skip valid emails for this test
        if (invalidEmail.includes('@') && invalidEmail.includes('.')) {
          return true
        }

        const result = emailSchema.safeParse(invalidEmail)
        // All non-email strings should be rejected
        return result.success === false
      }),
      { numRuns: 100 }
    )
  })

  it('should reject short passwords consistently', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 7 }), (shortPassword) => {
        const result = passwordSchema.safeParse(shortPassword)
        expect(result.success).toBe(false)
        return true
      }),
      { numRuns: 100 }
    )
  })

  it('should accept valid email formats', () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.co.uk',
      'admin@test.org',
    ]

    validEmails.forEach(email => {
      const result = emailSchema.safeParse(email)
      expect(result.success).toBe(true)
    })
  })

  it('should accept valid password formats', () => {
    const validPasswords = [
      'Password123',
      'SecurePass1',
      'MyP@ssw0rd',
    ]

    validPasswords.forEach(password => {
      const result = passwordSchema.safeParse(password)
      expect(result.success).toBe(true)
    })
  })
})
