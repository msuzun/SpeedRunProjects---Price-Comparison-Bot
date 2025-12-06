/**
 * Content script for Price Compare Assistant
 * Detects product pages and extracts product information
 */

(function () {
  'use strict'

  // Product detection patterns for common e-commerce sites
  const PRODUCT_PATTERNS = {
    amazon: {
      title: [
        '#productTitle',
        'h1.a-size-large',
        '[data-automation-id="title"]',
        'h1',
      ],
      price: [
        '.a-price-whole',
        '#priceblock_ourprice',
        '#priceblock_dealprice',
        '.a-price .a-offscreen',
        '[data-a-color="price"] .a-offscreen',
      ],
      brand: [
        '#bylineInfo',
        '#brand',
        '.po-brand .po-break-word',
      ],
      image: [
        '#landingImage',
        '#main-image',
        '.a-dynamic-image',
      ],
    },
    trendyol: {
      title: [
        '.pr-new-br h1',
        'h1.pr-new-br',
        '.product-name',
      ],
      price: [
        '.pr-bx-w-dv .prc-dsc',
        '.pr-bx-w-dv .prc-slg',
        '.price',
      ],
      brand: [
        '.pr-bx-w-dv .pr-bx-nm',
        '.brand-name',
      ],
      image: [
        '.product-slider img',
        '.gallery img',
      ],
    },
    hepsiburada: {
      title: [
        'h1[data-test-id="product-name"]',
        'h1.product-name',
        'h1',
      ],
      price: [
        '[data-test-id="price-current-price"]',
        '.price-value',
        '.product-price',
      ],
      brand: [
        '[data-test-id="product-brand"]',
        '.brand-name',
      ],
      image: [
        '.product-image img',
        '.gallery img',
      ],
    },
    generic: {
      title: [
        'h1',
        '[property="og:title"]',
        'meta[name="title"]',
        '.product-title',
      ],
      price: [
        '.price',
        '[data-price]',
        '.product-price',
        'meta[property="product:price:amount"]',
      ],
      brand: [
        '.brand',
        '[data-brand]',
        'meta[property="product:brand"]',
      ],
      image: [
        'meta[property="og:image"]',
        '.product-image img',
        '#product-image',
      ],
    },
  }

  /**
   * Extract text content from element
   */
  function extractText(selector, isAttribute = false, attrName = 'content') {
    const element = document.querySelector(selector)
    if (!element) return null

    if (isAttribute) {
      return element.getAttribute(attrName) || null
    }

    return element.textContent?.trim() || null
  }

  /**
   * Extract price from text
   */
  function extractPrice(text) {
    if (!text) return null

    // Remove currency symbols and extract numbers
    const cleaned = text.replace(/[^\d.,]/g, '')
    const match = cleaned.match(/[\d.,]+/)

    if (!match) return null

    // Handle Turkish format (1.234,56) or US format (1,234.56)
    let priceStr = match[0]
    if (priceStr.includes(',')) {
      // Turkish format: 1.234,56
      priceStr = priceStr.replace(/\./g, '').replace(',', '.')
    } else {
      // US format: 1,234.56
      priceStr = priceStr.replace(/,/g, '')
    }

    const price = parseFloat(priceStr)
    return isNaN(price) ? null : price
  }

  /**
   * Detect which site pattern to use
   */
  function detectSite() {
    const hostname = window.location.hostname.toLowerCase()

    if (hostname.includes('amazon')) return 'amazon'
    if (hostname.includes('trendyol')) return 'trendyol'
    if (hostname.includes('hepsiburada')) return 'hepsiburada'

    return 'generic'
  }

  /**
   * Extract product information from current page
   */
  function extractProductInfo() {
    const site = detectSite()
    const patterns = PRODUCT_PATTERNS[site] || PRODUCT_PATTERNS.generic

    let title = null
    let price = null
    let brand = null
    let image = null

    // Try to extract title
    for (const selector of patterns.title) {
      if (selector.startsWith('meta[')) {
        title = extractText(selector, true, 'content')
      } else {
        title = extractText(selector)
      }
      if (title) break
    }

    // Try to extract price
    for (const selector of patterns.price) {
      const priceText = extractText(selector)
      if (priceText) {
        price = extractPrice(priceText)
        if (price) break
      }
    }

    // Try to extract brand
    for (const selector of patterns.brand) {
      brand = extractText(selector)
      if (brand) break
    }

    // Try to extract image
    for (const selector of patterns.image) {
      if (selector.startsWith('meta[')) {
        image = extractText(selector, true, 'content')
      } else {
        const imgElement = document.querySelector(selector)
        if (imgElement) {
          image = imgElement.src || imgElement.getAttribute('data-src')
        }
      }
      if (image) break
    }

    return {
      title,
      price,
      brand,
      image,
      url: window.location.href,
      domain: window.location.hostname,
    }
  }

  /**
   * Check if current page looks like a product page
   */
  function isProductPage() {
    // Check for common product page indicators
    const indicators = [
      document.querySelector('[data-product-id]'),
      document.querySelector('.product'),
      document.querySelector('#product'),
      document.querySelector('[itemtype*="Product"]'),
      document.querySelector('meta[property="og:type"][content*="product"]'),
    ]

    return indicators.some((indicator) => indicator !== null)
  }

  /**
   * Send product info to popup
   */
  function sendProductInfo() {
    if (!isProductPage()) {
      return
    }

    const productInfo = extractProductInfo()

    // Only send if we found at least a title or price
    if (productInfo.title || productInfo.price) {
      chrome.runtime.sendMessage(
        {
          type: 'PRODUCT_DETECTED',
          product: productInfo,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            // Extension popup might not be open, that's okay
            console.log('[Price Compare] Product detected:', productInfo)
          }
        }
      )
    }
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_PRODUCT_INFO') {
      const productInfo = extractProductInfo()
      sendResponse({ product: productInfo })
      return true
    }
  })

  // Run extraction when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sendProductInfo)
  } else {
    sendProductInfo()
  }

  // Also listen for dynamic content changes (SPA navigation)
  let lastUrl = location.href
  new MutationObserver(() => {
    const url = location.href
    if (url !== lastUrl) {
      lastUrl = url
      setTimeout(sendProductInfo, 1000) // Wait a bit for content to load
    }
  }).observe(document, { subtree: true, childList: true })
})()

