import * as cheerio from 'cheerio'

/**
 * Product metadata extracted from HTML
 */
export type ProductMetadata = {
  title: string | null
  image: string | null
  brand: string | null
  category: string[] | null
}

/**
 * Extracts product metadata from HTML content.
 * Uses domain-aware strategies for better extraction.
 * 
 * @param html - The HTML content
 * @param url - The URL of the page (used to determine domain)
 * @returns ProductMetadata with extracted information
 */
export function extractProductMetadata(
  html: string,
  url: string
): ProductMetadata {
  try {
    const $ = cheerio.load(html)

    // Parse domain to determine extraction strategy
    let domain = ''
    try {
      const urlObj = new URL(url)
      domain = urlObj.hostname.toLowerCase()
    } catch {
      // If URL parsing fails, use generic extraction
    }

    const isAmazon = domain.includes('amazon.')

    // Extract title
    const title = extractTitle($, isAmazon)

    // Extract image
    const image = extractImage($, isAmazon, url)

    // Extract brand
    const brand = extractBrand($, isAmazon)

    // Extract category
    const category = extractCategory($, isAmazon)

    return {
      title,
      image,
      brand,
      category,
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[ProductExtractor] Error extracting metadata:', error)
    }
    return {
      title: null,
      image: null,
      brand: null,
      category: null,
    }
  }
}

/**
 * Extracts product title from HTML
 */
function extractTitle($: cheerio.CheerioAPI, isAmazon: boolean): string | null {
  // Strategy 1: Open Graph title (most reliable)
  const ogTitle = $('meta[property="og:title"]').attr('content')?.trim()
  if (ogTitle) {
    return cleanTitle(ogTitle)
  }

  // Strategy 2: Meta name="title"
  const metaTitle = $('meta[name="title"]').attr('content')?.trim()
  if (metaTitle) {
    return cleanTitle(metaTitle)
  }

  // Strategy 3: Standard title tag
  const titleTag = $('title').text()?.trim()
  if (titleTag) {
    return cleanTitle(titleTag)
  }

  // Strategy 4: Amazon-specific - product title
  if (isAmazon) {
    const amazonTitle = $('#productTitle').text()?.trim()
    if (amazonTitle) {
      return cleanTitle(amazonTitle)
    }
  }

  // Strategy 5: h1 tag (fallback)
  const h1 = $('h1').first().text()?.trim()
  if (h1) {
    return cleanTitle(h1)
  }

  return null
}

/**
 * Extracts product image from HTML
 */
function extractImage(
  $: cheerio.CheerioAPI,
  isAmazon: boolean,
  url: string
): string | null {
  // Strategy 1: Open Graph image (most reliable)
  const ogImage = $('meta[property="og:image"]').attr('content')?.trim()
  if (ogImage) {
    return resolveImageUrl(ogImage, url)
  }

  // Strategy 2: Twitter card image
  const twitterImage = $('meta[name="twitter:image"]').attr('content')?.trim()
  if (twitterImage) {
    return resolveImageUrl(twitterImage, url)
  }

  // Strategy 3: Amazon-specific - landing image
  if (isAmazon) {
    const amazonImage = $('#landingImage').attr('src')?.trim()
    if (amazonImage) {
      return resolveImageUrl(amazonImage, url)
    }

    // Alternative Amazon image selector
    const altAmazonImage = $('#imgBlkFront').attr('src')?.trim()
    if (altAmazonImage) {
      return resolveImageUrl(altAmazonImage, url)
    }
  }

  // Strategy 4: Look for main product image with common IDs/classes
  const mainImage =
    $('#main-image').attr('src') ||
    $('#product-image').attr('src') ||
    $('.product-image').first().attr('src') ||
    $('img[class*="product"]').first().attr('src')

  if (mainImage) {
    return resolveImageUrl(mainImage, url)
  }

  // Strategy 5: First large image (fallback)
  const firstLargeImage = $('img[width][height]')
    .filter((_, el) => {
      const width = parseInt($(el).attr('width') || '0')
      const height = parseInt($(el).attr('height') || '0')
      return width > 200 && height > 200
    })
    .first()
    .attr('src')

  if (firstLargeImage) {
    return resolveImageUrl(firstLargeImage, url)
  }

  return null
}

/**
 * Extracts product brand from HTML
 */
function extractBrand($: cheerio.CheerioAPI, isAmazon: boolean): string | null {
  // Strategy 1: Amazon-specific - byline info
  if (isAmazon) {
    const amazonBrand = $('#bylineInfo').text()?.trim()
    if (amazonBrand) {
      // Clean up "Visit the [Brand] Store" or "Brand: [Brand]"
      const cleaned = amazonBrand
        .replace(/^Visit the\s+/i, '')
        .replace(/\s+Store$/i, '')
        .replace(/^Brand:\s*/i, '')
        .trim()
      if (cleaned) {
        return cleaned
      }
    }

    // Alternative Amazon brand selector
    const altBrand = $('a#brand').text()?.trim()
    if (altBrand) {
      return altBrand
    }
  }

  // Strategy 2: Meta brand tag
  const metaBrand = $('meta[name="brand"]').attr('content')?.trim()
  if (metaBrand) {
    return metaBrand
  }

  // Strategy 3: Schema.org brand
  const schemaBrand = $('meta[property="product:brand"]').attr('content')?.trim()
  if (schemaBrand) {
    return schemaBrand
  }

  // Strategy 4: Look for brand in structured data
  const jsonLdMatches = $('script[type="application/ld+json"]')
  for (let i = 0; i < jsonLdMatches.length; i++) {
    try {
      const jsonContent = $(jsonLdMatches[i]).html()
      if (jsonContent) {
        const data = JSON.parse(jsonContent)
        const brand = extractBrandFromJsonLd(data)
        if (brand) {
          return brand
        }
      }
    } catch {
      // Invalid JSON, continue
    }
  }

  return null
}

/**
 * Extracts category breadcrumbs from HTML
 */
function extractCategory(
  $: cheerio.CheerioAPI,
  isAmazon: boolean
): string[] | null {
  // Strategy 1: Amazon-specific breadcrumbs
  if (isAmazon) {
    const breadcrumbs: string[] = []
    $('#wayfinding-breadcrumbs_feature_div a').each((_, el) => {
      const text = $(el).text()?.trim()
      if (text && text !== '›') {
        breadcrumbs.push(text)
      }
    })
    if (breadcrumbs.length > 0) {
      return breadcrumbs
    }
  }

  // Strategy 2: Generic breadcrumb navigation
  const breadcrumbs: string[] = []
  $('nav[aria-label*="breadcrumb"] a, .breadcrumb a, [class*="breadcrumb"] a').each(
    (_, el) => {
      const text = $(el).text()?.trim()
      if (text && !breadcrumbs.includes(text)) {
        breadcrumbs.push(text)
      }
    }
  )
  if (breadcrumbs.length > 0) {
    return breadcrumbs
  }

  // Strategy 3: Schema.org breadcrumb
  const schemaBreadcrumbs: string[] = []
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const jsonContent = $(el).html()
      if (jsonContent) {
        const data = JSON.parse(jsonContent)
        const crumbs = extractBreadcrumbsFromJsonLd(data)
        if (crumbs && crumbs.length > 0) {
          schemaBreadcrumbs.push(...crumbs)
        }
      }
    } catch {
      // Invalid JSON, continue
    }
  })
  if (schemaBreadcrumbs.length > 0) {
    return schemaBreadcrumbs
  }

  return null
}

/**
 * Cleans and shortens a title string
 */
function cleanTitle(title: string): string {
  if (!title) return ''

  // Remove extra whitespace
  let cleaned = title.replace(/\s+/g, ' ').trim()

  // Remove common suffixes/prefixes
  cleaned = cleaned
    .replace(/^\s*[-|:]\s*/, '') // Remove leading separators
    .replace(/\s*[-|:]\s*$/, '') // Remove trailing separators
    .replace(/\s*:\s*Amazon\.[a-z.]+/i, '') // Remove Amazon domain suffix
    .replace(/\s*-\s*Amazon\.[a-z.]+/i, '') // Remove Amazon domain with dash
    .trim()

  // Limit length to 150 characters
  if (cleaned.length > 150) {
    cleaned = cleaned.substring(0, 147) + '...'
  }

  return cleaned
}

/**
 * Resolves a relative image URL to an absolute URL
 */
function resolveImageUrl(imageUrl: string, baseUrl: string): string {
  if (!imageUrl) return ''

  // If already absolute, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  // If protocol-relative, add https
  if (imageUrl.startsWith('//')) {
    return 'https:' + imageUrl
  }

  // Otherwise, resolve relative to base URL
  try {
    const base = new URL(baseUrl)
    return new URL(imageUrl, base).toString()
  } catch {
    return imageUrl
  }
}

/**
 * Recursively searches JSON-LD data for brand information
 */
function extractBrandFromJsonLd(data: any): string | null {
  if (typeof data === 'object' && data !== null) {
    // Check for brand property
    if (data.brand) {
      if (typeof data.brand === 'string') {
        return data.brand
      }
      if (typeof data.brand === 'object' && data.brand.name) {
        return data.brand.name
      }
    }

    // Check for manufacturer
    if (data.manufacturer) {
      if (typeof data.manufacturer === 'string') {
        return data.manufacturer
      }
      if (typeof data.manufacturer === 'object' && data.manufacturer.name) {
        return data.manufacturer.name
      }
    }

    // Recursively search nested objects
    for (const key in data) {
      const result = extractBrandFromJsonLd(data[key])
      if (result) {
        return result
      }
    }
  }

  return null
}

/**
 * Recursively searches JSON-LD data for breadcrumb information
 */
function extractBreadcrumbsFromJsonLd(data: any): string[] | null {
  if (typeof data === 'object' && data !== null) {
    // Check for BreadcrumbList
    if (data['@type'] === 'BreadcrumbList' && Array.isArray(data.itemListElement)) {
      const crumbs: string[] = []
      for (const item of data.itemListElement) {
        if (item.name) {
          crumbs.push(item.name)
        }
      }
      if (crumbs.length > 0) {
        return crumbs
      }
    }

    // Recursively search nested objects
    for (const key in data) {
      const result = extractBreadcrumbsFromJsonLd(data[key])
      if (result && result.length > 0) {
        return result
      }
    }
  }

  return null
}

