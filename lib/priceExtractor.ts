/**
 * Extracts a price from HTML content using heuristic-based parsing.
 * Looks for common price patterns in the HTML.
 * 
 * @param html - The HTML content to search
 * @returns number | null - The extracted price, or null if not found
 */
export function extractPriceFromHtml(html: string): number | null {
  // Common price patterns to look for
  // This regex looks for numbers with optional decimal separators
  // Matches patterns like: 123.45, 123,45, 1234, $123.45, €123,45, ₺123.45, etc.
  const pricePatterns = [
    // Pattern 1: Currency symbols followed by numbers (most common)
    /[₺$€£¥]\s*(\d{1,3}(?:[.,]\d{2,3})*(?:[.,]\d{2})?)/g,
    // Pattern 2: Numbers followed by currency symbols
    /(\d{1,3}(?:[.,]\d{2,3})*(?:[.,]\d{2})?)\s*[₺$€£¥]/g,
    // Pattern 3: Numbers in price-related contexts (look for "price", "fiyat", etc.)
    /(?:price|fiyat|cost|ücret)[\s:]*(\d{1,3}(?:[.,]\d{2,3})*(?:[.,]\d{2})?)/gi,
    // Pattern 4: Standalone numbers that look like prices (2+ digits, possibly with decimals)
    /\b(\d{2,}(?:[.,]\d{2})?)\b/g,
  ]

  // Try each pattern and collect all potential prices
  const potentialPrices: number[] = []

  for (const pattern of pricePatterns) {
    const matches = html.matchAll(pattern)
    
    for (const match of matches) {
      // Extract the numeric part (group 1 or the full match)
      const priceStr = match[1] || match[0]
      
      // Clean the string: remove currency symbols and spaces
      let cleaned = priceStr.replace(/[₺$€£¥\s]/g, '')
      
      // Handle different number formats:
      // US format: 1,234.56 -> 1234.56
      // European format: 1.234,56 -> 1234.56
      // If there's a comma followed by 2 digits at the end, it's likely a decimal separator
      if (/,(\d{2})$/.test(cleaned)) {
        // European format: replace comma with dot for decimal
        cleaned = cleaned.replace(/\./g, '').replace(',', '.')
      } else {
        // US format or no decimals: remove commas (thousand separators)
        cleaned = cleaned.replace(/,/g, '')
      }
      
      // Convert to number
      const price = parseFloat(cleaned)
      
      // Validate: price should be reasonable (between 0.01 and 1,000,000)
      if (!isNaN(price) && price >= 0.01 && price <= 1000000) {
        potentialPrices.push(price)
      }
    }
  }

  // If we found prices, return the first reasonable one
  // In a more sophisticated implementation, we might look for the most likely price
  // (e.g., near "price" keywords, in specific HTML elements, etc.)
  if (potentialPrices.length > 0) {
    // Sort and return the median or first value
    // For simplicity, return the first found price
    return potentialPrices[0]
  }

  // Alternative: Look for structured data (JSON-LD, microdata, etc.)
  // This is a simple check for JSON-LD with price information
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis)
  
  if (jsonLdMatches) {
    for (const match of jsonLdMatches) {
      try {
        const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '')
        const data = JSON.parse(jsonContent)
        
        // Look for price in common schema.org properties
        const price = extractPriceFromJsonLd(data)
        if (price !== null) {
          return price
        }
      } catch (e) {
        // Invalid JSON, continue
      }
    }
  }

  return null
}

/**
 * Recursively searches JSON-LD data for price information.
 * 
 * @param data - The parsed JSON-LD data
 * @returns number | null - The extracted price, or null if not found
 */
function extractPriceFromJsonLd(data: any): number | null {
  if (typeof data === 'object' && data !== null) {
    // Check common price properties
    const priceKeys = ['price', 'offers', 'lowPrice', 'highPrice', 'priceRange']
    
    for (const key of priceKeys) {
      if (key in data) {
        const value = data[key]
        
        if (typeof value === 'number') {
          return value
        }
        
        if (typeof value === 'string') {
          const num = parseFloat(value.replace(/[^\d.]/g, ''))
          if (!isNaN(num) && num > 0) {
            return num
          }
        }
        
        if (typeof value === 'object' && value !== null) {
          // Recursively search nested objects
          const nestedPrice = extractPriceFromJsonLd(value)
          if (nestedPrice !== null) {
            return nestedPrice
          }
        }
      }
    }
    
    // Recursively search all properties
    for (const key in data) {
      const nestedPrice = extractPriceFromJsonLd(data[key])
      if (nestedPrice !== null) {
        return nestedPrice
      }
    }
  }
  
  return null
}

