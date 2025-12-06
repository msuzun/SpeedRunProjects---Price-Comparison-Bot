# Price Comparison Bot

A Next.js web application that compares prices from two product URLs. Paste two product URLs, and the app attempts to detect prices and highlights the cheaper one in green.

## 🚀 Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS**

## ✨ Features

- **Two URL Comparison**: Enter two product URLs to compare their prices
- **Automatic Price Parsing**: Heuristic-based price extraction from HTML content
- **Visual Highlighting**: The cheaper option is highlighted in green
- **Real-time Validation**: URL validation with helpful error messages
- **Comparison History**: View your last 10 comparisons (client-side only)
- **Error Handling**: Comprehensive error handling for network and parsing errors
- **Responsive Design**: Mobile-friendly interface

## 📦 Installation

1. Clone the repository or navigate to the project directory

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🛠️ How It Works

1. Enter two product URLs in the form
2. Click "Compare Prices"
3. The app fetches both pages and attempts to extract prices using:
   - Regex patterns for common price formats
   - JSON-LD structured data parsing
   - Currency symbol detection
4. Results are displayed with the cheaper option highlighted in green
5. Comparison history is saved locally (client-side only)

## ⚠️ Important Notes

This is a **demo application**. Real-world price scraping may require:

- Dedicated APIs (e.g., e-commerce APIs, price comparison APIs)
- Headless browsers (e.g., Puppeteer, Playwright) for JavaScript-rendered content
- Site-specific selectors and parsers
- Rate limiting and respectful crawling practices
- Handling of anti-bot measures (CAPTCHAs, IP blocking, etc.)

The current implementation uses basic HTML parsing and may not work reliably on all websites, especially those with:
- JavaScript-rendered content
- Anti-scraping measures
- Complex price structures
- Dynamic pricing

## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   └── compare-prices/
│   │       └── route.ts          # API endpoint for price comparison
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Main page component
│   └── globals.css                # Global styles
├── components/
│   ├── ComparisonHistory.tsx     # History component
│   ├── ComparisonResult.tsx       # Results display component
│   └── UrlInputForm.tsx           # URL input form component
├── lib/
│   ├── fetchPageHtml.ts           # HTML fetching utility
│   ├── priceExtractor.ts          # Price extraction logic
│   └── utils.ts                   # Helper functions
└── README.md
```

## 🎯 Future Enhancements

Potential improvements for a production version:

- Support for multiple currencies
- More sophisticated price extraction algorithms
- Caching of fetched pages
- Support for more e-commerce platforms
- Price tracking over time
- Export comparison results
- User accounts and saved comparisons

## 📝 License

This project is built as part of a 100-day Cursor Speedrun demonstration.
