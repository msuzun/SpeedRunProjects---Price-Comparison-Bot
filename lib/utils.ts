/**
 * Formats a price number to a currency string
 * @param price - The price to format
 * @param currency - Currency code (default: 'USD')
 * @returns Formatted price string
 */
export function formatPrice(price: number | null, currency: string = 'USD'): string {
  if (price === null) return 'Price not found'
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)
}

/**
 * Formats a price difference for display
 * @param difference - The price difference (always positive)
 * @param currency - Currency code (default: 'USD')
 * @returns Formatted difference string
 */
export function formatPriceDifference(difference: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(difference)
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
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return url
  }
}

