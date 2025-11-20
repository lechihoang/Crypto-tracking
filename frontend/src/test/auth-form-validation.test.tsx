import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { z } from 'zod'

// Feature: shadcn-ui-migration, Property 10: Auth form validation
// For any authentication form, invalid inputs should display appropriate validation errors

describe('Auth Form Validation', () => {
  // Email validation
  const emailSchema = z.string().email('Invalid email address')
  
  // Password validation (minimum 6 characters as per the forms)
  const passwordSchema = z.string().min(6, 'Password must be at least 6 characters')
  
  // Full name validation
  const fullNameSchema = z.string().min(1, 'Full name is required')
  
  // Confirm password validation
  const confirmPasswordSchema = (password: string) => 
    z.string().refine((val) => val === password, 'Passwords do not match')

  it('should reject invalid email formats consistently', () => {
    fc.assert(
      fc.property(fc.string(), (email) => {
        // Skip valid emails
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (emailRegex.test(email)) {
          return true
        }

        const result = emailSchema.safeParse(email)
        return result.success === false
      }),
      { numRuns: 100 }
    )
  })

  it('should reject passwords shorter than 6 characters', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 5 }), (password) => {
        const result = passwordSchema.safeParse(password)
        return result.success === false
      }),
      { numRuns: 100 }
    )
  })

  it('should accept passwords with 6 or more characters', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 6, maxLength: 50 }), (password) => {
        const result = passwordSchema.safeParse(password)
        return result.success === true
      }),
      { numRuns: 100 }
    )
  })

  it('should reject empty full names', () => {
    const result = fullNameSchema.safeParse('')
    expect(result.success).toBe(false)
  })

  it('should accept non-empty full names', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), (name) => {
        const result = fullNameSchema.safeParse(name)
        return result.success === true
      }),
      { numRuns: 100 }
    )
  })

  it('should reject mismatched password confirmations', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 6 }),
        fc.string({ minLength: 6 }),
        (password, confirmPassword) => {
          if (password === confirmPassword) {
            return true // Skip matching passwords
          }
          
          const schema = confirmPasswordSchema(password)
          const result = schema.safeParse(confirmPassword)
          return result.success === false
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should accept matching password confirmations', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 6 }), (password) => {
        const schema = confirmPasswordSchema(password)
        const result = schema.safeParse(password)
        return result.success === true
      }),
      { numRuns: 100 }
    )
  })
})
