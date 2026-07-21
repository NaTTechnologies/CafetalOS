import { describe, expect, it } from 'vitest'
import { formatCurrency, formatDate, formatNumber } from '@/utils/formatters'
describe('formatters', () => {
  it('formats Honduran currency', () => expect(formatCurrency(1250)).toMatch(/1[,.]250/))
  it('formats decimals', () => expect(formatNumber(10.25, 1)).toMatch(/10[,.]3/))
  it('handles empty dates', () => expect(formatDate('')).toBe('Sin fecha'))
})
