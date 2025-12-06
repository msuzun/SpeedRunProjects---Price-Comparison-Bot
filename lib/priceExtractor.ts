import * as cheerio from 'cheerio'

/**
 * Result of price extraction with metadata
 */
export type PriceExtractionResult = {
  price: number | null
  currency?: string | null
  rawText?: string | null
  sourceHint?: string | null // e.g. "amazon-offscreen-span", "generic-regex"
}

/**
 * Domain-aware price extraction from HTML.
 * Routes to domain-specific extractors or falls back to generic extraction.
 * 
 * @param html - The HTML content to search
 * @param url - The URL of the page (used to determine domain)
 * @returns PriceExtractionResult with price and metadata
 */
export function extractPriceFromHtml(
  html: string,
  url: string
): PriceExtractionResult {
  // Parse domain from URL
  let domain = ''
  try {
    const urlObj = new URL(url)
    domain = urlObj.hostname.toLowerCase()
  } catch {
    // If URL parsing fails, use generic extractor
    return extractPriceGeneric(html)
  }

  // Development logging
  if (process.env.NODE_ENV === 'development') {
    console.log(`[PriceExtractor] Detected domain: ${domain}`)
  }

  // Route to domain-specific extractors
  if (domain.includes('amazon.')) {
    const result = extractAmazonPrice(html)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PriceExtractor] Amazon result:`, {
        price: result.price,
        currency: result.currency,
        rawText: result.rawText,
        sourceHint: result.sourceHint,
      })
    }
    return result
  }

  // Generic fallback for other domains
  return extractPriceGeneric(html)
}

/**
 * Extracts price from Amazon product pages using Cheerio.
 * Targets Amazon's specific DOM structure for prices.
 * 
 * @param html - The HTML content
 * @returns PriceExtractionResult
 */
function extractAmazonPrice(html: string): PriceExtractionResult {
  try {
    // Check if Amazon is blocking with bot detection
    if (
      html.includes('captcha') ||
      html.includes('robot') ||
      html.includes('unusual traffic') ||
      html.includes('bot') ||
      html.length < 1000 // Very short response might be an error page
    ) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[PriceExtractor] Possible bot detection or error page from Amazon')
      }
      // Still try to extract, but note it might be blocked
    }

    const $ = cheerio.load(html)

    // Development: Log HTML snippet to debug
    if (process.env.NODE_ENV === 'development') {
      const htmlSnippet = html.substring(0, 5000)
      const title = $('title').text() || 'No title'
      console.log('[PriceExtractor] Page title:', title)
      console.log('[PriceExtractor] HTML length:', html.length)
      if (html.length < 10000) {
        console.log('[PriceExtractor] Full HTML:', html)
      } else {
        console.log('[PriceExtractor] HTML snippet (first 5000 chars):', htmlSnippet)
      }
    }

    // Try multiple Amazon price selectors in order of reliability
    const selectors = [
      // Most common: offscreen price in price container
      'span.a-price span.a-offscreen',
      'span.a-price .a-offscreen',
      '.a-price .a-offscreen',
      
      // Direct offscreen spans
      'span.a-offscreen',
      '.a-offscreen',
      
      // Price whole number and fraction
      'span.a-price-whole',
      '.a-price-whole',
      
      // Price symbol
      'span.a-price-symbol',
      '.a-price-symbol',
      
      // Price block
      '#priceblock_ourprice',
      '#priceblock_dealprice',
      '#priceblock_saleprice',
      '.a-price.a-text-price',
      '.a-price.a-color-price',
      
      // Price in buybox
      '#buybox .a-price',
      '#buyNewSection .a-price',
      '#buybox_feature_div .a-price',
      
      // Kindle price
      '#kindle-price',
      '#ebooks-price',
      
      // Alternative price formats
      '[data-a-color="price"]',
      '.a-color-price',
      '.priceToPay',
      '.a-price.a-color-base',
      
      // Price in product details
      '#price',
      '.price',
      '#productPrice',
      '.productPrice',
    ]

    let priceText: string | null = null
    let sourceHint: string = 'amazon-no-match'

    // Try each selector
    for (const selector of selectors) {
      const elements = $(selector)
      
      if (elements.length > 0) {
        // Try to get text from the element
        let text = elements.first().text().trim()
        
        // If empty, try getting from data attributes
        if (!text) {
          text = elements.first().attr('data-a-color') || ''
          text = text || elements.first().attr('data-price') || ''
        }
        
        // If still empty, try getting from parent
        if (!text && elements.first().parent().length > 0) {
          text = elements.first().parent().text().trim()
        }
        
        if (text) {
          // Check if it looks like a price
          const priceMatch = text.match(/[\d.,]+/)
          if (priceMatch) {
            priceText = text
            sourceHint = `amazon-${selector.replace(/[^a-zA-Z0-9]/g, '-')}`
            
            if (process.env.NODE_ENV === 'development') {
              console.log(`[PriceExtractor] Found price with selector "${selector}":`, text)
            }
            break
          }
        }
      }
    }

    // If still no price, try searching in the entire HTML for price patterns
    if (!priceText) {
      // Look for price in JSON data attributes
      const priceDataMatches = html.match(/data-price=["']([^"']+)["']/i)
      if (priceDataMatches && priceDataMatches[1]) {
        priceText = priceDataMatches[1]
        sourceHint = 'amazon-data-attribute'
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[PriceExtractor] Found price in data attribute:', priceText)
        }
      }
    }

    // Try extracting from meta tags
    if (!priceText) {
      const metaPrice = $('meta[property="product:price:amount"]').attr('content') ||
                       $('meta[name="price"]').attr('content') ||
                       $('meta[property="og:price:amount"]').attr('content')
      
      if (metaPrice) {
        priceText = metaPrice
        sourceHint = 'amazon-meta-tag'
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[PriceExtractor] Found price in meta tag:', priceText)
        }
      }
    }

    // Try extracting from JSON-LD structured data (Amazon sometimes uses this)
    if (!priceText) {
      const jsonLdMatches = html.match(
        /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis
      )
      
      if (jsonLdMatches) {
        for (const match of jsonLdMatches) {
          try {
            const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '')
            const data = JSON.parse(jsonContent)
            
            // Look for Amazon-specific price fields
            const amazonPrice = 
              data?.offers?.price ||
              data?.offers?.[0]?.price ||
              data?.price ||
              data?.aggregateRating?.priceRange
            
            if (amazonPrice) {
              priceText = String(amazonPrice)
              sourceHint = 'amazon-json-ld'
              
              if (process.env.NODE_ENV === 'development') {
                console.log('[PriceExtractor] Found price in JSON-LD:', priceText)
              }
              break
            }
          } catch (e) {
            // Invalid JSON, continue
          }
        }
      }
    }

    // If still no price, try regex search in HTML for Turkish Lira patterns
    if (!priceText) {
      const turkishPricePattern = /(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*(?:TL|TRY|₺)/gi
      const matches = html.match(turkishPricePattern)
      if (matches && matches.length > 0) {
        // Take the first match that looks reasonable
        for (const match of matches) {
          const parsed = parseLocalizedPrice(match)
          if (parsed.value !== null && parsed.value >= 1 && parsed.value <= 100000) {
            priceText = match
            sourceHint = 'amazon-regex-turkish'
            
            if (process.env.NODE_ENV === 'development') {
              console.log('[PriceExtractor] Found price via regex:', priceText)
            }
            break
          }
        }
      }
    }

    if (!priceText) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[PriceExtractor] No price found. Trying generic extractor as fallback.')
      }
      // Fall back to generic extraction
      return extractPriceGeneric(html)
    }

    // Parse the price text (e.g., "1.980,46 TL" or "1,980.46 USD")
    const parsed = parseLocalizedPrice(priceText)

    if (parsed.value === null) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[PriceExtractor] Failed to parse price text:', priceText)
      }
      // Try generic extraction as fallback
      return extractPriceGeneric(html)
    }

    return {
      price: parsed.value,
      currency: parsed.currency || 'TRY',
      rawText: priceText,
      sourceHint: sourceHint,
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[PriceExtractor] Amazon extraction error:', error)
    }
    // Fall back to generic extraction on error
    return extractPriceGeneric(html)
  }
}

/**
 * Generic price extraction using regex patterns.
 * Fallback for non-Amazon websites.
 * 
 * @param html - The HTML content
 * @returns PriceExtractionResult
 */
function extractPriceGeneric(html: string): PriceExtractionResult {
  // Try JSON-LD structured data first
  const jsonLdMatches = html.match(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis
  )

  if (jsonLdMatches) {
    for (const match of jsonLdMatches) {
      try {
        const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '')
        const data = JSON.parse(jsonContent)
        const price = extractPriceFromJsonLd(data)
        if (price !== null) {
          return {
            price,
            currency: null,
            rawText: null,
            sourceHint: 'generic-json-ld',
          }
        }
      } catch (e) {
        // Invalid JSON, continue
      }
    }
  }

  // Regex patterns for common price formats
  const pricePatterns = [
    // Turkish Lira: ₺1.980,46 or 1.980,46 TL
    /₺\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/g,
    /(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*TL/gi,
    // US Dollar: $1,980.46 or 1,980.46 USD
    /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
    /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*USD/gi,
    // Euro: €1.980,46 or 1.980,46 EUR
    /€\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/g,
    /(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*EUR/gi,
    // Generic: numbers near price keywords
    /(?:price|fiyat|cost|ücret)[\s:]*(\d{1,3}(?:[.,]\d{2,3})*(?:[.,]\d{2})?)/gi,
  ]

  // Try each pattern and collect potential prices
  const potentialPrices: Array<{ value: number; raw: string; currency?: string }> = []

  for (const pattern of pricePatterns) {
    const matches = html.matchAll(pattern)
    for (const match of matches) {
      const rawText = match[0]
      const priceStr = match[1] || match[0]
      const parsed = parseLocalizedPrice(priceStr)

      if (parsed.value !== null && parsed.value >= 0.01 && parsed.value <= 1000000) {
        potentialPrices.push({
          value: parsed.value,
          raw: rawText,
          currency: parsed.currency,
        })
      }
    }
  }

  // Return the first reasonable price found
  if (potentialPrices.length > 0) {
    const first = potentialPrices[0]
    return {
      price: first.value,
      currency: first.currency || null,
      rawText: first.raw,
      sourceHint: 'generic-regex',
    }
  }

  return {
    price: null,
    currency: null,
    rawText: null,
    sourceHint: 'generic-no-match',
  }
}

/**
 * Parses a localized price string to a number.
 * Handles Turkish format (1.980,46) and US format (1,980.46).
 * 
 * @param raw - The raw price string (e.g., "1.980,46 TL" or "$1,980.46")
 * @returns Object with parsed value and detected currency
 */
export function parseLocalizedPrice(raw: string): {
  value: number | null
  currency?: string | null
} {
  if (!raw || typeof raw !== 'string') {
    return { value: null, currency: null }
  }

  // Extract currency symbols
  const currencyMatch = raw.match(/(TL|TRY|USD|EUR|₺|\$|€)/i)
  const currency = currencyMatch ? currencyMatch[1].toUpperCase() : null

  // Remove currency symbols and trim
  let cleaned = raw
    .replace(/[₺$€TLTRYUSDEUR\s]/gi, '')
    .trim()

  if (!cleaned) {
    return { value: null, currency }
  }

  // Detect format by checking for Turkish-style (dot as thousand, comma as decimal)
  // Turkish: 1.980,46 (dot = thousands, comma = decimal)
  // US: 1,980.46 (comma = thousands, dot = decimal)

  // Check if it looks like Turkish format (has dots and ends with ,XX)
  const turkishPattern = /^\d{1,3}(?:\.\d{3})*,\d{2}$/
  const usPattern = /^\d{1,3}(?:,\d{3})*\.\d{2}$/

  if (turkishPattern.test(cleaned)) {
    // Turkish format: remove dots (thousands), replace comma with dot (decimal)
    cleaned = cleaned.replace(/\./g, '').replace(',', '.')
  } else if (usPattern.test(cleaned)) {
    // US format: remove commas (thousands), keep dot (decimal)
    cleaned = cleaned.replace(/,/g, '')
  } else {
    // Try to infer format
    // If there's a comma followed by exactly 2 digits at the end, it's likely decimal
    if (/,\d{2}$/.test(cleaned)) {
      // Likely Turkish format
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    } else if (/\.\d{2}$/.test(cleaned)) {
      // Likely US format
      cleaned = cleaned.replace(/,/g, '')
    } else {
      // No clear decimal separator, remove all non-digits except the last dot/comma
      // This is a fallback - may not work perfectly
      cleaned = cleaned.replace(/[^\d.,]/g, '')
      if (cleaned.includes(',')) {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.')
      } else {
        cleaned = cleaned.replace(/,/g, '')
      }
    }
  }

  const value = parseFloat(cleaned)
  return {
    value: isNaN(value) ? null : value,
    currency: currency || null,
  }
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
          const parsed = parseLocalizedPrice(value)
          if (parsed.value !== null) {
            return parsed.value
          }
        }

        if (typeof value === 'object' && value !== null) {
          // Handle offers array or object
          if (Array.isArray(value)) {
            for (const item of value) {
              const nestedPrice = extractPriceFromJsonLd(item)
              if (nestedPrice !== null) {
                return nestedPrice
              }
            }
          } else {
            // Recursively search nested objects
            const nestedPrice = extractPriceFromJsonLd(value)
            if (nestedPrice !== null) {
              return nestedPrice
            }
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
