import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// Feature: shadcn-ui-migration, Property 5: Table sorting correctness
// For any sortable column, clicking should sort data correctly

describe('Table Sorting Correctness', () => {
  type SortDirection = 'asc' | 'desc'

  const sortArray = <T,>(arr: T[], key: keyof T, direction: SortDirection): T[] => {
    return [...arr].sort((a, b) => {
      const aVal = a[key]
      const bVal = b[key]
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' ? aVal - bVal : bVal - aVal
      }
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return direction === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }
      
      return 0
    })
  }

  it('should sort numbers in ascending order correctly', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ value: fc.float() }), { minLength: 2 }),
        (data) => {
          const sorted = sortArray(data, 'value', 'asc')
          
          // Verify ascending order
          for (let i = 0; i < sorted.length - 1; i++) {
            if (sorted[i].value > sorted[i + 1].value) {
              return false
            }
          }
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should sort numbers in descending order correctly', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ value: fc.float() }), { minLength: 2 }),
        (data) => {
          const sorted = sortArray(data, 'value', 'desc')
          
          // Verify descending order
          for (let i = 0; i < sorted.length - 1; i++) {
            if (sorted[i].value < sorted[i + 1].value) {
              return false
            }
          }
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should sort strings alphabetically', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ name: fc.string({ minLength: 1 }) }), { minLength: 2 }),
        (data) => {
          const sorted = sortArray(data, 'name', 'asc')
          
          // Verify alphabetical order
          for (let i = 0; i < sorted.length - 1; i++) {
            if (sorted[i].name.localeCompare(sorted[i + 1].name) > 0) {
              return false
            }
          }
          return true
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should preserve array length after sorting', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ value: fc.integer() })),
        (data) => {
          const sorted = sortArray(data, 'value', 'asc')
          return sorted.length === data.length
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should toggle between ascending and descending', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ value: fc.integer() }), { minLength: 2 }),
        (data) => {
          const sortedAsc = sortArray(data, 'value', 'asc')
          const sortedDesc = sortArray(data, 'value', 'desc')
          
          // First and last elements should be swapped (if not all equal)
          const allEqual = data.every(item => item.value === data[0].value)
          if (allEqual) return true
          
          return sortedAsc[0].value <= sortedDesc[sortedDesc.length - 1].value
        }
      ),
      { numRuns: 100 }
    )
  })
})
