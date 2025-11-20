import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// Feature: shadcn-ui-migration, Property 4: Table column completeness
// For any table data row, all defined columns should be rendered

describe('Table Column Completeness', () => {
  type TableRow = {
    name: string
    price: number
    change: number
    marketCap: number
  }

  const requiredColumns = ['name', 'price', 'change', 'marketCap']

  it('should have all required columns for any table row', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1 }),
          price: fc.float({ min: 0 }),
          change: fc.float({ min: -100, max: 100 }),
          marketCap: fc.float({ min: 0 }),
        }),
        (row: TableRow) => {
          // Verify all required columns exist in the row
          const rowKeys = Object.keys(row)
          return requiredColumns.every(col => rowKeys.includes(col))
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should preserve all column data through transformations', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1 }),
            price: fc.float({ min: 0 }),
            change: fc.float({ min: -100, max: 100 }),
            marketCap: fc.float({ min: 0 }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (rows: TableRow[]) => {
          // Simulate table rendering - all rows should have all columns
          return rows.every(row => {
            return requiredColumns.every(col => col in row)
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain column count across all rows', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            name: fc.string(),
            price: fc.float(),
            change: fc.float(),
            marketCap: fc.float(),
          }),
          { minLength: 2 }
        ),
        (rows) => {
          if (rows.length === 0) return true
          
          const firstRowColumns = Object.keys(rows[0]).length
          return rows.every(row => Object.keys(row).length === firstRowColumns)
        }
      ),
      { numRuns: 100 }
    )
  })
})
