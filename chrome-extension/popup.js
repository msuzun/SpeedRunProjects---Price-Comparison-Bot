/**
 * Popup script for Price Compare Assistant
 */

let currentProduct = null

// Listen for product detection from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PRODUCT_DETECTED') {
    currentProduct = message.product
    displayCurrentProduct(currentProduct)
  }
  return true
})

// Load current product on popup open
document.addEventListener('DOMContentLoaded', async () => {
  // Try to get current product from active tab
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.url) {
      // Request product info from content script
      chrome.tabs.sendMessage(
        tab.id,
        { type: 'GET_PRODUCT_INFO' },
        (response) => {
          if (response && response.product) {
            currentProduct = response.product
            displayCurrentProduct(response.product)
          }
        }
      )
    }
  } catch (error) {
    console.error('Error loading product:', error)
  }

  // Setup compare button
  document.getElementById('compareBtn').addEventListener('click', handleCompare)
})

/**
 * Display current product information
 */
function displayCurrentProduct(product) {
  const container = document.getElementById('currentProduct')
  if (!product || (!product.title && !product.price)) {
    container.classList.add('hidden')
    return
  }

  container.classList.remove('hidden')

  if (product.title) {
    document.getElementById('currentTitle').textContent = product.title
  }

  if (product.price) {
    document.getElementById('currentPrice').textContent = formatPrice(product.price)
  } else {
    document.getElementById('currentPrice').textContent = 'Price not found'
  }

  if (product.brand) {
    document.getElementById('currentBrand').textContent = `Brand: ${product.brand}`
  } else {
    document.getElementById('currentBrand').textContent = ''
  }

  if (product.image) {
    const img = document.getElementById('currentImage')
    img.src = product.image
    img.classList.remove('hidden')
  } else {
    document.getElementById('currentImage').classList.add('hidden')
  }
}

/**
 * Format price for display
 */
function formatPrice(price) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(price)
}

/**
 * Handle compare button click
 */
async function handleCompare() {
  const compareUrl = document.getElementById('compareUrl').value.trim()

  if (!compareUrl) {
    showError('Please enter a product URL to compare')
    return
  }

  if (!currentProduct || (!currentProduct.url && !currentProduct.title)) {
    showError('No product detected on current page. Please navigate to a product page first.')
    return
  }

  // Hide error and show loading
  hideError()
  showLoading()
  hideResults()

  try {
    // Get current product URL or use the page URL
    const currentUrl = currentProduct.url || (await getCurrentTabUrl())

    // Call comparison API
    const response = await fetch('http://localhost:3000/api/compare-prices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url1: currentUrl,
        url2: compareUrl,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to compare prices')
    }

    const data = await response.json()
    displayResults(data)
  } catch (error) {
    showError(error.message || 'Failed to compare prices. Make sure the Next.js server is running.')
  } finally {
    hideLoading()
  }
}

/**
 * Get current tab URL
 */
async function getCurrentTabUrl() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    return tab?.url || ''
  } catch {
    return ''
  }
}

/**
 * Display comparison results
 */
function displayResults(data) {
  const resultsDiv = document.getElementById('results')
  const contentDiv = document.getElementById('resultsContent')
  resultsDiv.classList.remove('hidden')

  contentDiv.innerHTML = ''

  // Product 1
  if (data.price1 !== null) {
    const item1 = createResultItem(
      data.title1 || 'Product 1',
      data.price1,
      data.currency1 || 'TRY',
      data.url1,
      data.price2 !== null && data.price1 < data.price2
    )
    contentDiv.appendChild(item1)
  }

  // Product 2
  if (data.price2 !== null) {
    const item2 = createResultItem(
      data.title2 || 'Product 2',
      data.price2,
      data.currency2 || 'TRY',
      data.url2,
      data.price1 !== null && data.price2 < data.price1
    )
    contentDiv.appendChild(item2)
  }

  // Show message if no prices found
  if (data.price1 === null && data.price2 === null) {
    contentDiv.innerHTML = '<p style="color: #6b7280; font-size: 12px;">No prices found</p>'
  }
}

/**
 * Create a result item element
 */
function createResultItem(title, price, currency, url, isCheaper) {
  const item = document.createElement('div')
  item.className = `result-item ${isCheaper ? 'cheaper' : ''}`

  const titleEl = document.createElement('div')
  titleEl.style.fontSize = '13px'
  titleEl.style.fontWeight = '500'
  titleEl.style.marginBottom = '4px'
  titleEl.textContent = title
  item.appendChild(titleEl)

  const priceEl = document.createElement('div')
  priceEl.className = 'result-price'
  priceEl.textContent = formatPrice(price)
  item.appendChild(priceEl)

  const domainEl = document.createElement('div')
  domainEl.className = 'result-domain'
  domainEl.textContent = new URL(url).hostname
  item.appendChild(domainEl)

  if (isCheaper) {
    const badge = document.createElement('div')
    badge.style.marginTop = '4px'
    badge.style.fontSize = '11px'
    badge.style.color = '#059669'
    badge.style.fontWeight = '600'
    badge.textContent = '✓ Cheapest'
    item.appendChild(badge)
  }

  return item
}

/**
 * Show error message
 */
function showError(message) {
  const errorDiv = document.getElementById('error')
  errorDiv.textContent = message
  errorDiv.classList.remove('hidden')
}

/**
 * Hide error message
 */
function hideError() {
  document.getElementById('error').classList.add('hidden')
}

/**
 * Show loading state
 */
function showLoading() {
  document.getElementById('loading').classList.remove('hidden')
  document.getElementById('compareBtn').disabled = true
}

/**
 * Hide loading state
 */
function hideLoading() {
  document.getElementById('loading').classList.add('hidden')
  document.getElementById('compareBtn').disabled = false
}

/**
 * Hide results
 */
function hideResults() {
  document.getElementById('results').classList.add('hidden')
}

