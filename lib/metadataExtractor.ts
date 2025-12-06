import * as cheerio from 'cheerio'

/**
 * Extracts the page title from HTML content.
 * Tries multiple strategies to get the best title.
 * 
 * @param html - The HTML content
 * @returns The extracted title, or null if not found
 */
export function extractTitleFromHtml(html: string): string | null {
  try {
    const $ = cheerio.load(html)

    // Strategy 1: Open Graph title (most reliable for product pages)
    const ogTitle = $('meta[property="og:title"]').attr('content')?.trim()
    if (ogTitle) {
      return cleanTitle(ogTitle)
    }

    // Strategy 2: Standard title tag
    const titleTag = $('title').text()?.trim()
    if (titleTag) {
      return cleanTitle(titleTag)
    }

    // Strategy 3: Twitter card title
    const twitterTitle = $('meta[name="twitter:title"]').attr('content')?.trim()
    if (twitterTitle) {
      return cleanTitle(twitterTitle)
    }

    // Strategy 4: h1 tag (fallback)
    const h1 = $('h1').first().text()?.trim()
    if (h1) {
      return cleanTitle(h1)
    }

    return null
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[MetadataExtractor] Error extracting title:', error)
    }
    return null
  }
}

/**
 * Cleans and shortens a title string.
 * 
 * @param title - The raw title string
 * @returns Cleaned title (max 100 characters)
 */
function cleanTitle(title: string): string {
  if (!title) return ''

  // Remove extra whitespace
  let cleaned = title.replace(/\s+/g, ' ').trim()

  // Remove common suffixes/prefixes that aren't useful
  cleaned = cleaned
    .replace(/^\s*[-|:]\s*/, '') // Remove leading separators
    .replace(/\s*[-|:]\s*$/, '') // Remove trailing separators
    .replace(/\s*:\s*Amazon\.[a-z.]+/i, '') // Remove Amazon domain suffix
    .replace(/\s*-\s*Amazon\.[a-z.]+/i, '') // Remove Amazon domain with dash
    .trim()

  // Limit length to 100 characters
  if (cleaned.length > 100) {
    cleaned = cleaned.substring(0, 97) + '...'
  }

  return cleaned
}

