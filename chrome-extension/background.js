/**
 * Background service worker for Price Compare Assistant
 */

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Price Compare Assistant installed')
})

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PRODUCT_DETECTED') {
    // Store product info for popup
    if (sender.tab) {
      chrome.storage.local.set({
        [`product_${sender.tab.id}`]: message.product,
      })
    }
  }
  return true
})

