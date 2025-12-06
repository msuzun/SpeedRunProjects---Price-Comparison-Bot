import { PriceHistoryEntry } from './types'

const STORAGE_PREFIX = 'price-history:'

/**
 * Gets the storage key for a given URL
 */
function getStorageKey(url: string): string {
  return `${STORAGE_PREFIX}${url}`
}

/**
 * Adds a price history entry for a URL.
 * Stores entries in localStorage under the key `price-history:<url>`.
 * 
 * @param url - The product URL
 * @param entry - The price history entry to add
 */
export function addPriceHistory(url: string, entry: PriceHistoryEntry): void {
  try {
    const storageKey = getStorageKey(url)
    const existing = getPriceHistory(url)
    
    // Add the new entry
    const updated = [entry, ...existing]
    
    // Limit to last 100 entries per URL to prevent storage bloat
    const limited = updated.slice(0, 100)
    
    // Store in localStorage
    localStorage.setItem(storageKey, JSON.stringify(limited))
  } catch (error) {
    // Handle localStorage errors (quota exceeded, etc.)
    if (process.env.NODE_ENV === 'development') {
      console.error('[PriceHistory] Failed to save history:', error)
    }
  }
}

/**
 * Gets all price history entries for a URL.
 * Returns entries sorted by timestamp (newest first).
 * 
 * @param url - The product URL
 * @returns Array of price history entries
 */
export function getPriceHistory(url: string): PriceHistoryEntry[] {
  try {
    const storageKey = getStorageKey(url)
    const stored = localStorage.getItem(storageKey)
    
    if (!stored) {
      return []
    }
    
    const parsed = JSON.parse(stored)
    
    // Validate that it's an array
    if (!Array.isArray(parsed)) {
      return []
    }
    
    // Validate and filter entries
    const validEntries = parsed.filter((entry): entry is PriceHistoryEntry => {
      return (
        typeof entry === 'object' &&
        entry !== null &&
        typeof entry.url === 'string' &&
        typeof entry.timestamp === 'number' &&
        (entry.price === null || typeof entry.price === 'number')
      )
    })
    
    // Sort by timestamp (newest first)
    return validEntries.sort((a, b) => b.timestamp - a.timestamp)
  } catch (error) {
    // Handle JSON parsing errors or other issues
    if (process.env.NODE_ENV === 'development') {
      console.error('[PriceHistory] Failed to load history:', error)
    }
    return []
  }
}

/**
 * Clears all price history for a specific URL.
 * 
 * @param url - The product URL
 */
export function clearPriceHistory(url: string): void {
  try {
    const storageKey = getStorageKey(url)
    localStorage.removeItem(storageKey)
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[PriceHistory] Failed to clear history:', error)
    }
  }
}

/**
 * Gets all URLs that have price history stored.
 * 
 * @returns Array of URLs with stored history
 */
export function getAllHistoryUrls(): string[] {
  try {
    const urls: string[] = []
    
    // Iterate through all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(STORAGE_PREFIX)) {
        // Extract URL from key
        const url = key.substring(STORAGE_PREFIX.length)
        urls.push(url)
      }
    }
    
    return urls
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[PriceHistory] Failed to get all URLs:', error)
    }
    return []
  }
}

/**
 * Clears all price history for all URLs.
 * Use with caution!
 */
export function clearAllPriceHistory(): void {
  try {
    const urls = getAllHistoryUrls()
    urls.forEach((url) => clearPriceHistory(url))
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[PriceHistory] Failed to clear all history:', error)
    }
  }
}

