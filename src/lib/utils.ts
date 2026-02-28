import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format cents as currency string, e.g. 123456 → "$1,234.56" */
export function formatCurrency(cents: number): string {
  const dollars = cents / 100
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars)
}

/** Format share count, e.g. 1.234567 → "1.234567" or 5 → "5" */
export function formatShares(shares: number): string {
  if (Number.isInteger(shares)) return shares.toString()
  return shares.toFixed(6).replace(/0+$/, '')
}

/** Format percentage, e.g. 12.345 → "+12.35%" or -5.1 → "-5.10%" */
export function formatPercent(pct: number): string {
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(2)}%`
}

/** Format a dollar amount (not cents), e.g. 1234.56 → "$1,234.56" */
export function formatDollars(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
