/**
 * Price history entry for tracking price changes over time
 */
export type PriceHistoryEntry = {
  url: string
  timestamp: number
  price: number | null
  currency?: string | null
}

