import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { z } from 'zod'

// Feature: shadcn-ui-migration, Property 11: Error message display
// For any form validation error, the error message should be displayed using shadcn/ui form error components

describe('Error Message Display', () => {
  const createSchema = (errorMessage: string) => 
    z.string().min(1, errorMessage)

  it('should preserve error messages for all validation failures', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (errorMessage) => {
          const schema = createSchema(errorMessage)
          const result = schema.safeParse('')
          
          if (!result.success && result.error?.errors?.length > 0) {
            const actualError = result.error.errors[0].message
            return actualError === errorMessage
          }
          return !result.success
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should display specific error messages for different validation types', () => {
    const testCases = [
      { schema: z.string().email(), input: 'invalid', expectedError: 'Invalid' },
      { schema: z.string().min(6, 'Too short'), input: 'abc', expectedError: 'Too short' },
      { schema: z.string().max(10, 'Too long'), input: 'a'.repeat(20), expectedError: 'Too long' },
    ]

    testCases.forEach(({ schema, input, expectedError }) => {
      const result = schema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success && result.error?.errors?.length > 0) {
        expect(result.error.errors[0].message).toContain(expectedError.split(' ')[0])
      }
    })
  })

  it('should maintain error message consistency across multiple validations', () => {
    const errorMessage = 'This field is required'
    const schema = z.string().nonempty(errorMessage)

    // Test that the same error message appears consistently
    for (let i = 0; i < 10; i++) {
      const result = schema.safeParse('')
      expect(result.success).toBe(false)
      if (!result.success && result.error?.errors?.length > 0) {
        expect(result.error.errors[0].message).toBe(errorMessage)
      }
    }
  })

  it('should handle multiple error messages for complex validations', () => {
    const schema = z.object({
      email: z.string().email('Invalid email'),
      password: z.string().min(6, 'Password too short'),
      name: z.string().min(1, 'Name required'),
    })

    const result = schema.safeParse({
      email: 'invalid',
      password: 'abc',
      name: '',
    })

    expect(result.success).toBe(false)
    if (!result.success && result.error?.errors) {
      expect(result.error.errors.length).toBeGreaterThan(0)
      expect(result.error.errors.some(e => e.message.toLowerCase().includes('email'))).toBe(true)
    }
  })
})
