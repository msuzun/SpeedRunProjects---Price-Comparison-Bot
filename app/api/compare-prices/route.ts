import { NextRequest, NextResponse } from 'next/server'
import { fetchPageHtml } from '@/lib/fetchPageHtml'
import { extractPriceFromHtml, PriceExtractionResult } from '@/lib/priceExtractor'
import { extractProductMetadata } from '@/lib/productExtractor'
import { ComparisonResult } from '@/lib/types'

/**
 * API Route: POST /api/compare-prices
 * 
 * Compares prices from two product URLs by:
 * 1. Fetching HTML from both URLs
 * 2. Extracting prices from each page
 * 3. Returning structured comparison data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url1, url2 } = body

    // Validation: Check if both URLs are provided
    if (!url1 || !url2) {
      return NextResponse.json(
        { error: 'Both url1 and url2 are required' },
        { status: 400 }
      )
    }

    // Validation: Check if URLs are valid
    let validUrl1: URL
    let validUrl2: URL

    try {
      validUrl1 = new URL(url1)
    } catch (error) {
      return NextResponse.json(
        { error: 'url1 is not a valid URL' },
        { status: 400 }
      )
    }

    try {
      validUrl2 = new URL(url2)
    } catch (error) {
      return NextResponse.json(
        { error: 'url2 is not a valid URL' },
        { status: 400 }
      )
    }

    // Fetch and extract prices from both URLs in parallel
    const [result1, result2] = await Promise.allSettled([
      fetchAndExtractPrice(url1),
      fetchAndExtractPrice(url2),
    ])

    // Process results
    const response: ComparisonResult = {
      url1,
      url2,
      price1: null,
      price2: null,
    }

    // Handle result1
    if (result1.status === 'fulfilled') {
      const extraction = result1.value
      response.price1 = extraction.price
      response.currency1 = extraction.currency || null
      response.title1 = extraction.title || null
      response.image1 = extraction.image || null
      response.brand1 = extraction.brand || null
      response.category1 = extraction.category || null
      response.rawPriceText1 = extraction.rawText || null
      response.sourceHint1 = extraction.sourceHint || null

      if (extraction.price === null) {
        response.error1 = 'Could not extract price from page'
      }
    } else {
      response.error1 = result1.reason?.message || 'Failed to fetch or parse URL 1'
    }

    // Handle result2
    if (result2.status === 'fulfilled') {
      const extraction = result2.value
      response.price2 = extraction.price
      response.currency2 = extraction.currency || null
      response.title2 = extraction.title || null
      response.image2 = extraction.image || null
      response.brand2 = extraction.brand || null
      response.category2 = extraction.category || null
      response.rawPriceText2 = extraction.rawText || null
      response.sourceHint2 = extraction.sourceHint || null

      if (extraction.price === null) {
        response.error2 = 'Could not extract price from page'
      }
    } else {
      response.error2 = result2.reason?.message || 'Failed to fetch or parse URL 2'
    }

    // If both URLs failed, return 400
    if (response.price1 === null && response.price2 === null) {
      return NextResponse.json(
        {
          error: 'Failed to extract prices from both URLs',
          ...response,
        },
        { status: 400 }
      )
    }

    // Return successful response (200) even if one URL failed
    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    // Handle JSON parsing errors or other unexpected errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Helper function to fetch HTML and extract price and metadata from a URL.
 * 
 * @param url - The URL to fetch and parse
 * @returns Promise with PriceExtractionResult and product metadata
 */
async function fetchAndExtractPrice(
  url: string
): Promise<
  PriceExtractionResult & {
    title: string | null
    image: string | null
    brand: string | null
    category: string[] | null
  }
> {
  try {
    // Fetch the HTML
    const html = await fetchPageHtml(url)

    // Extract the price using domain-aware extractor
    const priceResult = extractPriceFromHtml(html, url)

    // Extract product metadata
    const metadata = extractProductMetadata(html, url)

    return {
      ...priceResult,
      title: metadata.title,
      image: metadata.image,
      brand: metadata.brand,
      category: metadata.category,
    }
  } catch (error) {
    // Re-throw to be caught by Promise.allSettled
    throw error
  }
}
