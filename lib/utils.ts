/**
 * Formats a price number to a currency string
 * @param value - The price to format (can be null)
 * @param currency - Currency code (default: 'USD')
 * @returns Formatted price string or "—" if null
 */
export function formatPrice(value: number | null, currency?: string | null): string {
  if (value === null) return '—'
  
  // Determine locale based on currency
  let locale = 'en-US'
  if (currency === 'TRY' || currency === 'TL') {
    locale = 'tr-TR'
  } else if (currency === 'EUR') {
    locale = 'de-DE'
  } else if (currency === 'GBP') {
    locale = 'en-GB'
  }

  // Use provided currency or default to USD
  const currencyCode = currency || 'USD'
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  } catch (error) {
    // Fallback if currency code is invalid
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }
}

/**
 * Formats a price difference for display
 * @param difference - The price difference (always positive)
 * @param currency - Currency code (default: 'USD')
 * @returns Formatted difference string
 */
export function formatPriceDifference(
  difference: number,
  currency?: string | null
): string {
  return formatPrice(difference, currency || 'USD')
}

/**
 * Validates if a string looks like a valid URL
 * @param url - The URL string to validate
 * @returns true if the URL appears valid, false otherwise
 */
export function isValidUrlPattern(url: string): boolean {
  if (!url.trim()) return false
  
  // Check if it starts with http:// or https://
  const urlPattern = /^https?:\/\/.+/i
  if (!urlPattern.test(url.trim())) return false
  
  // Try to create a URL object
  try {
    new URL(url.trim())
    return true
  } catch {
    return false
  }
}

/**
 * Extracts the domain from a URL for display purposes
 * @param url - The URL to extract domain from
 * @returns The domain name or the original URL if parsing fails
 */
export function getDomain(url: string): string {
  return extractDomain(url)
}

/**
 * Extracts the domain from a URL for display purposes
 * @param url - The URL to extract domain from
 * @returns The domain name or the original URL if parsing fails
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return url
  }
}

/**
 * Determines which price is cheaper between two prices
 * @param price1 - First price (can be null)
 * @param price2 - Second price (can be null)
 * @returns Object with comparison results
 */
export function comparePrices(price1: number | null, price2: number | null) {
  const price1Valid = price1 !== null
  const price2Valid = price2 !== null
  
  return {
    price1Valid,
    price2Valid,
    isPrice1Cheaper: price1Valid && price2Valid && price1 < price2,
    isPrice2Cheaper: price2Valid && price1Valid && price2 < price1,
    pricesEqual: price1Valid && price2Valid && price1 === price2,
    bothValid: price1Valid && price2Valid,
  }
}

/**
 * Formats a timestamp to a relative time string (e.g., "2 hours ago", "Yesterday")
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted time string
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) {
    return 'Just now'
  } else if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  } else if (hours < 24) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  } else if (days === 1) {
    return 'Yesterday'
  } else if (days < 7) {
    return `${days} days ago`
  } else {
    // For older dates, show actual date
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    })
  }
}

