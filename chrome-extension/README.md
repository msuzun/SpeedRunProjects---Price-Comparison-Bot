# Price Compare Assistant - Chrome Extension

A Chrome extension that automatically detects product pages and allows you to compare prices across multiple stores.

## Features

- **Automatic Product Detection**: Detects when you're on a product page and extracts product information
- **Price Comparison**: Compare prices between the current page and another product URL
- **Multi-Store Support**: Works with Amazon, Trendyol, Hepsiburada, and other e-commerce sites

## Installation

### Development Setup

1. **Build the Next.js backend** (if not already running):
   ```bash
   npm run dev
   ```

2. **Load the extension in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `chrome-extension` folder

3. **Update API endpoint** (if needed):
   - Edit `popup.js` and change the API URL from `http://localhost:3000` to your server URL

## File Structure

```
chrome-extension/
├── manifest.json       # Extension manifest
├── content.js         # Content script for product detection
├── popup.html         # Popup UI
├── popup.js           # Popup logic
├── background.js     # Background service worker
├── icons/             # Extension icons (create these)
└── README.md          # This file
```

## Icons

You'll need to create icon files:
- `icons/icon16.png` (16x16)
- `icons/icon48.png` (48x48)
- `icons/icon128.png` (128x128)

You can use any image editor or online icon generator to create these.

## Usage

1. Navigate to a product page (Amazon, Trendyol, Hepsiburada, etc.)
2. Click the extension icon in the toolbar
3. The extension will automatically detect the product and show its details
4. Enter another product URL in the comparison field
5. Click "Compare Prices" to see the comparison

## Development

### Testing

1. Make sure the Next.js backend is running on `http://localhost:3000`
2. Load the extension in Chrome
3. Visit a product page and test the extension

### Debugging

- **Content Script**: Check console on the product page
- **Popup**: Right-click extension icon → "Inspect popup"
- **Background**: Go to `chrome://extensions/` → Click "service worker" link

## Notes

- The extension requires the Next.js backend to be running for price comparison
- Product detection works on most major e-commerce sites
- The extension uses Chrome's storage API to cache product information

