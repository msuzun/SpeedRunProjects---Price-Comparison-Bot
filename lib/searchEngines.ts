import * as cheerio from 'cheerio'
import { fetchPageHtml } from './fetchPageHtml'
import { extractPriceFromHtml } from './priceExtractor'

export type StoreSearchResult = {
  store: string
  url: string
  price: number | null
}

/**
 * Searches multiple Turkish e-commerce stores for a product title.
 * Returns the first matching product from each store.
 * 
 * @param title - The product title to search for
 * @returns Array of search results from different stores
 */
export async function searchStoresForTitle(
  title: string
): Promise<StoreSearchResult[]> {
  if (!title || !title.trim()) {
    return []
  }

  // Clean the title for URL encoding
  const searchQuery = encodeURIComponent(title.trim())

  // Search all stores in parallel
  const results = await Promise.allSettled([
    searchTrendyol(searchQuery),
    searchHepsiburada(searchQuery),
    searchN11(searchQuery),
  ])

  // Extract successful results
  const storeResults: StoreSearchResult[] = []

  if (results[0].status === 'fulfilled') {
    storeResults.push(results[0].value)
  }

  if (results[1].status === 'fulfilled') {
    storeResults.push(results[1].value)
  }

  if (results[2].status === 'fulfilled') {
    storeResults.push(results[2].value)
  }

  return storeResults
}

/**
 * Searches Trendyol for a product
 */
async function searchTrendyol(searchQuery: string): Promise<StoreSearchResult> {
  try {
    const searchUrl = `https://www.trendyol.com/sr?q=${searchQuery}`
    const html = await fetchPageHtml(searchUrl)

    const $ = cheerio.load(html)

    // Find first product card
    // Trendyol uses various selectors for product cards
    const productSelectors = [
      'a[href*="/p/"]',
      '.p-card-wrppr a',
      '.product-card a',
      '[data-testid="product-card"] a',
    ]

    let productUrl: string | null = null
    let productPrice: number | null = null

    for (const selector of productSelectors) {
      const productLink = $(selector).first()
      if (productLink.length > 0) {
        const href = productLink.attr('href')
        if (href) {
          // Make absolute URL if relative
          if (href.startsWith('/')) {
            productUrl = `https://www.trendyol.com${href}`
          } else if (href.startsWith('http')) {
            productUrl = href
          } else {
            productUrl = `https://www.trendyol.com/${href}`
          }
          break
        }
      }
    }

    // Try to extract price from search results page
    if (productUrl) {
      // Look for price in the product card
      const priceSelectors = [
        '.prc-box-dscntd',
        '.price-discounted',
        '.product-price',
        '[data-testid="price"]',
      ]

      for (const selector of priceSelectors) {
        const priceElement = $(selector).first()
        if (priceElement.length > 0) {
          const priceText = priceElement.text().trim()
          const priceMatch = priceText.match(/[\d.,]+/)
          if (priceMatch) {
            // Parse Turkish price format (1.234,56)
            const cleaned = priceMatch[0].replace(/\./g, '').replace(',', '.')
            const price = parseFloat(cleaned)
            if (!isNaN(price) && price > 0) {
              productPrice = price
              break
            }
          }
        }
      }

      // If price not found on search page, fetch product page
      if (productPrice === null && productUrl) {
        try {
          const productHtml = await fetchPageHtml(productUrl)
          const priceResult = extractPriceFromHtml(productHtml, productUrl)
          productPrice = priceResult.price
        } catch {
          // If fetching product page fails, continue without price
        }
      }
    }

    return {
      store: 'Trendyol',
      url: productUrl || '',
      price: productPrice,
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[SearchEngine] Trendyol search error:', error)
    }
    return {
      store: 'Trendyol',
      url: '',
      price: null,
    }
  }
}

/**
 * Searches Hepsiburada for a product
 */
async function searchHepsiburada(
  searchQuery: string
): Promise<StoreSearchResult> {
  try {
    const searchUrl = `https://www.hepsiburada.com/ara?q=${searchQuery}`
    const html = await fetchPageHtml(searchUrl)

    const $ = cheerio.load(html)

    // Find first product card
    const productSelectors = [
      'a[href*="/p/"]',
      '.product-item a',
      '.productListContent-item a',
      '[data-test-id="product-item"] a',
    ]

    let productUrl: string | null = null
    let productPrice: number | null = null

    for (const selector of productSelectors) {
      const productLink = $(selector).first()
      if (productLink.length > 0) {
        const href = productLink.attr('href')
        if (href) {
          // Make absolute URL if relative
          if (href.startsWith('/')) {
            productUrl = `https://www.hepsiburada.com${href}`
          } else if (href.startsWith('http')) {
            productUrl = href
          } else {
            productUrl = `https://www.hepsiburada.com/${href}`
          }
          break
        }
      }
    }

    // Try to extract price from search results page
    if (productUrl) {
      const priceSelectors = [
        '.price-value',
        '.product-price',
        '[data-test-id="price"]',
        '.price',
      ]

      for (const selector of priceSelectors) {
        const priceElement = $(selector).first()
        if (priceElement.length > 0) {
          const priceText = priceElement.text().trim()
          const priceMatch = priceText.match(/[\d.,]+/)
          if (priceMatch) {
            // Parse Turkish price format (1.234,56)
            const cleaned = priceMatch[0].replace(/\./g, '').replace(',', '.')
            const price = parseFloat(cleaned)
            if (!isNaN(price) && price > 0) {
              productPrice = price
              break
            }
          }
        }
      }

      // If price not found on search page, fetch product page
      if (productPrice === null && productUrl) {
        try {
          const productHtml = await fetchPageHtml(productUrl)
          const priceResult = extractPriceFromHtml(productHtml, productUrl)
          productPrice = priceResult.price
        } catch {
          // If fetching product page fails, continue without price
        }
      }
    }

    return {
      store: 'Hepsiburada',
      url: productUrl || '',
      price: productPrice,
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[SearchEngine] Hepsiburada search error:', error)
    }
    return {
      store: 'Hepsiburada',
      url: '',
      price: null,
    }
  }
}

/**
 * Searches N11 for a product
 */
async function searchN11(searchQuery: string): Promise<StoreSearchResult> {
  try {
    const searchUrl = `https://www.n11.com/arama?q=${searchQuery}`
    const html = await fetchPageHtml(searchUrl)

    const $ = cheerio.load(html)

    // Find first product card
    const productSelectors = [
      'a[href*="/urun/"]',
      '.productItem a',
      '.product a',
      '[data-product-id] a',
    ]

    let productUrl: string | null = null
    let productPrice: number | null = null

    for (const selector of productSelectors) {
      const productLink = $(selector).first()
      if (productLink.length > 0) {
        const href = productLink.attr('href')
        if (href) {
          // Make absolute URL if relative
          if (href.startsWith('/')) {
            productUrl = `https://www.n11.com${href}`
          } else if (href.startsWith('http')) {
            productUrl = href
          } else {
            productUrl = `https://www.n11.com/${href}`
          }
          break
        }
      }
    }

    // Try to extract price from search results page
    if (productUrl) {
      const priceSelectors = [
        '.priceContainer .price',
        '.productPrice',
        '[data-price]',
        '.price',
      ]

      for (const selector of priceSelectors) {
        const priceElement = $(selector).first()
        if (priceElement.length > 0) {
          const priceText = priceElement.text().trim()
          const priceMatch = priceText.match(/[\d.,]+/)
          if (priceMatch) {
            // Parse Turkish price format (1.234,56)
            const cleaned = priceMatch[0].replace(/\./g, '').replace(',', '.')
            const price = parseFloat(cleaned)
            if (!isNaN(price) && price > 0) {
              productPrice = price
              break
            }
          }
        }
      }

      // If price not found on search page, fetch product page
      if (productPrice === null && productUrl) {
        try {
          const productHtml = await fetchPageHtml(productUrl)
          const priceResult = extractPriceFromHtml(productHtml, productUrl)
          productPrice = priceResult.price
        } catch {
          // If fetching product page fails, continue without price
        }
      }
    }

    return {
      store: 'N11',
      url: productUrl || '',
      price: productPrice,
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[SearchEngine] N11 search error:', error)
    }
    return {
      store: 'N11',
      url: '',
      price: null,
    }
    }
}

