import { NextRequest, NextResponse } from 'next/server'
import { fetchPageHtml } from '@/lib/fetchPageHtml'
import { extractPriceFromHtml } from '@/lib/priceExtractor'

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
    const response: {
      url1: string
      url2: string
      price1: number | null
      price2: number | null
      error1?: string
      error2?: string
    } = {
      url1,
      url2,
      price1: null,
      price2: null,
    }

    // Handle result1
    if (result1.status === 'fulfilled') {
      response.price1 = result1.value.price
      if (result1.value.error) {
        response.error1 = result1.value.error
      }
    } else {
      response.error1 = result1.reason?.message || 'Failed to fetch or parse URL 1'
    }

    // Handle result2
    if (result2.status === 'fulfilled') {
      response.price2 = result2.value.price
      if (result2.value.error) {
        response.error2 = result2.value.error
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
 * Helper function to fetch HTML and extract price from a URL.
 * 
 * @param url - The URL to fetch and parse
 * @returns Promise with price and optional error message
 */
async function fetchAndExtractPrice(
  url: string
): Promise<{ price: number | null; error?: string }> {
  try {
    // Fetch the HTML
    const html = await fetchPageHtml(url)

    // Extract the price
    const price = extractPriceFromHtml(html)

    if (price === null) {
      return {
        price: null,
        error: 'Could not extract price from page',
      }
    }

    return { price }
  } catch (error) {
    // Re-throw to be caught by Promise.allSettled
    throw error
  }
}

