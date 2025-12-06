/**
 * Fetches HTML content from a given URL on the server side.
 * Includes timeout and error handling.
 * 
 * @param url - The URL to fetch HTML from
 * @returns Promise<string> - The HTML content as a string
 * @throws Error if the fetch fails or times out
 */
export async function fetchPageHtml(url: string): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

  try {
    // Determine if this is Amazon and set appropriate headers
    const isAmazon = url.toLowerCase().includes('amazon.')
    const isAmazonTR = url.toLowerCase().includes('amazon.com.tr')
    
    const headers: HeadersInit = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': isAmazonTR ? 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7' : 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
    }

    if (isAmazon) {
      // Add referer for Amazon to make it look more legitimate
      headers['Referer'] = 'https://www.google.com/'
    }

    const response = await fetch(url, {
      signal: controller.signal,
      headers,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const html = await response.text()
    return html
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout')
      }
      throw error
    }
    
    throw new Error('Failed to fetch page')
  }
}

