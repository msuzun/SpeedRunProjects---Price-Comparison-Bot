'use client'

import { useState, useMemo, useRef } from 'react'
import { toPng } from 'html-to-image'
import type { ComparisonResult } from '@/lib/types'
import {
  formatPrice,
  formatPriceDifference,
  extractDomain,
  comparePrices,
} from '@/lib/utils'
import { getPriceHistory, clearPriceHistory } from '@/lib/history/clientHistory'
import PriceHistoryChart from '@/components/PriceHistoryChart'

type ComparisonResultProps = {
  result: ComparisonResult | null
  isLoading: boolean
  error: string | null
}

export default function ComparisonResult({
  result,
  isLoading,
  error,
}: ComparisonResultProps) {
  const [copySuccess, setCopySuccess] = useState(false)
  const [historyCleared1, setHistoryCleared1] = useState(false)
  const [historyCleared2, setHistoryCleared2] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const comparisonRef = useRef<HTMLDivElement>(null)

  // Get price history for both products
  const history1 = useMemo(() => {
    if (!result || historyCleared1) return []
    return getPriceHistory(result.url1)
  }, [result?.url1, historyCleared1])

  const history2 = useMemo(() => {
    if (!result || historyCleared2) return []
    return getPriceHistory(result.url2)
  }, [result?.url2, historyCleared2])

  const handleClearHistory1 = () => {
    if (!result) return
    if (confirm('Are you sure you want to clear the price history for Product 1?')) {
      clearPriceHistory(result.url1)
      setHistoryCleared1(true)
    }
  }

  const handleClearHistory2 = () => {
    if (!result) return
    if (confirm('Are you sure you want to clear the price history for Product 2?')) {
      clearPriceHistory(result.url2)
      setHistoryCleared2(true)
    }
  }

  const handleDownloadScreenshot = async () => {
    if (!comparisonRef.current || !result) return

    setIsDownloading(true)
    try {
      const dataUrl = await toPng(comparisonRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      })

      // Create download link
      const link = document.createElement('a')
      link.download = `price-comparison-${Date.now()}.png`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Failed to generate screenshot:', error)
      alert('Failed to generate screenshot. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <svg
            className="animate-spin h-8 w-8 text-indigo-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <div className="text-center">
            <p className="text-gray-700 font-medium">Fetching and comparing prices...</p>
            <p className="text-sm text-gray-500 mt-1">This may take a few seconds</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-xl shadow-lg p-6">
        <div className="flex items-start space-x-3">
          <svg
            className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-red-800 font-semibold mb-1">Error</p>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  // No result state
  if (!result) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <p className="text-gray-500 text-center">
          No comparison yet. Enter two URLs above.
        </p>
      </div>
    )
  }

  // Both prices are null
  if (result.price1 === null && result.price2 === null) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <p className="text-gray-700 text-center font-medium mb-4">
          Could not detect prices from these URLs. Please try different URLs.
        </p>
        {(result.error1 || result.error2) && (
          <div className="mt-4 space-y-3 text-sm">
            {result.error1 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="font-medium text-red-800 mb-1">URL 1 Error:</p>
                <p className="text-red-700">{result.error1}</p>
              </div>
            )}
            {result.error2 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="font-medium text-red-800 mb-1">URL 2 Error:</p>
                <p className="text-red-700">{result.error2}</p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Determine which price is cheaper using helper function
  const comparison = comparePrices(result.price1, result.price2)
  const {
    price1Valid,
    price2Valid,
    isPrice1Cheaper,
    isPrice2Cheaper,
    pricesEqual,
    bothValid,
  } = comparison

  // Check if currencies match
  const currenciesMatch =
    result.currency1 &&
    result.currency2 &&
    result.currency1 === result.currency2

  // Generate shareable summary text
  const generateSummary = (): string => {
    if (!result) return ''

    const domain1 = extractDomain(result.url1)
    const domain2 = extractDomain(result.url2)
    const title1 = result.title1 || domain1
    const title2 = result.title2 || domain2

    if (comparison.bothValid && currenciesMatch) {
      if (comparison.pricesEqual) {
        return `Price Comparison: ${title1} vs ${title2} → Same price: ${formatPrice(result.price1, result.currency1)}`
      } else if (comparison.isPrice1Cheaper) {
        const savings = result.price2! - result.price1!
        return `Price Comparison: ${title1} vs ${title2} → Cheaper: ${domain1} by ${formatPriceDifference(savings, result.currency1)}`
      } else {
        const savings = result.price1! - result.price2!
        return `Price Comparison: ${title1} vs ${title2} → Cheaper: ${domain2} by ${formatPriceDifference(savings, result.currency2)}`
      }
    } else if (comparison.price1Valid && !comparison.price2Valid) {
      return `Price Comparison: ${title1} vs ${title2} → Only ${domain1} price found: ${formatPrice(result.price1, result.currency1)}`
    } else if (comparison.price2Valid && !comparison.price1Valid) {
      return `Price Comparison: ${title1} vs ${title2} → Only ${domain2} price found: ${formatPrice(result.price2, result.currency2)}`
    } else {
      return `Price Comparison: ${title1} vs ${title2} → Prices not available`
    }
  }

  const handleCopySummary = async () => {
    const summary = generateSummary()
    try {
      await navigator.clipboard.writeText(summary)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl shadow-lg p-6" ref={comparisonRef}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            Comparison Results
          </h2>
          {result && (
            <div className="relative group">
              <button
                onClick={handleDownloadScreenshot}
                disabled={isDownloading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {isDownloading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    <span>Download Screenshot</span>
                  </>
                )}
              </button>
              <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Save comparison for later
              </div>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product 1 Card */}
          <div
            className={`rounded-xl shadow-md p-6 transition-all border-2 hover:shadow-lg ${
              isPrice1Cheaper && price1Valid && bothValid
                ? 'bg-green-50 border-green-300'
                : 'bg-white border-gray-200 hover:border-indigo-300'
            }`}
          >
            <div className="space-y-4">
              {/* Image and Title Section */}
              <div className="flex gap-4">
                {result.image1 ? (
                  <div className="flex-shrink-0">
                    <img
                      src={result.image1}
                      alt={result.title1 || 'Product 1'}
                      className="w-20 h-20 object-contain rounded-lg border border-gray-200 bg-gray-50"
                      onError={(e) => {
                        // Hide image on error
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 flex-shrink-0 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-semibold">
                    Product 1
                  </p>
                  {result.title1 ? (
                    <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                      {result.title1}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 italic mb-1">No title available</p>
                  )}
                  {result.brand1 && (
                    <p className="text-xs text-gray-600 mb-1">Brand: {result.brand1}</p>
                  )}
                  <p className="text-xs text-gray-400">{extractDomain(result.url1)}</p>
                </div>
              </div>

              {/* Price Section */}
              <div className="pt-2 border-t border-gray-100">
                {result.price1 !== null ? (
                  <>
                    <p
                      className={`text-3xl font-bold ${
                        isPrice1Cheaper && price1Valid && bothValid
                          ? 'text-green-600'
                          : 'text-gray-900'
                      }`}
                    >
                      {formatPrice(result.price1, result.currency1)}
                    </p>
                    {result.currency1 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Currency: {result.currency1}
                      </p>
                    )}
                  </>
                ) : (
                  <div>
                    <p className="text-2xl font-semibold text-gray-400">Price not found</p>
                    {result.rawPriceText1 && (
                      <p className="text-xs text-gray-400 mt-1 italic">
                        Raw text: {result.rawPriceText1}
                      </p>
                    )}
                  </div>
                )}
                {isPrice1Cheaper && price1Valid && bothValid && (
                  <p className="text-sm text-green-600 font-semibold mt-2 flex items-center gap-1">
                    <span>✓</span>
                    <span>Cheaper option</span>
                  </p>
                )}
              </div>

              {/* Category (if available) */}
              {result.category1 && result.category1.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Category:</p>
                  <div className="flex flex-wrap gap-1">
                    {result.category1.map((cat, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Price History Chart */}
              {history1.length >= 2 && (
                <div>
                  <PriceHistoryChart url={result.url1} history={history1} />
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={handleClearHistory1}
                      className="text-xs text-red-600 hover:text-red-700 underline"
                    >
                      Reset History
                    </button>
                  </div>
                </div>
              )}

              {/* Error Messages */}
              {result.error1 && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">
                  {result.error1}
                </div>
              )}
              {price1Valid && !price2Valid && (
                <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 p-2 rounded-lg">
                  ⚠️ Only this price was found
                </p>
              )}
            </div>
          </div>

          {/* Product 2 Card */}
          <div
            className={`rounded-xl shadow-md p-6 transition-all border-2 hover:shadow-lg ${
              isPrice2Cheaper && price2Valid && bothValid
                ? 'bg-green-50 border-green-300'
                : 'bg-white border-gray-200 hover:border-indigo-300'
            }`}
          >
            <div className="space-y-4">
              {/* Image and Title Section */}
              <div className="flex gap-4">
                {result.image2 ? (
                  <div className="flex-shrink-0">
                    <img
                      src={result.image2}
                      alt={result.title2 || 'Product 2'}
                      className="w-20 h-20 object-contain rounded-lg border border-gray-200 bg-gray-50"
                      onError={(e) => {
                        // Hide image on error
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 flex-shrink-0 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-semibold">
                    Product 2
                  </p>
                  {result.title2 ? (
                    <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                      {result.title2}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 italic mb-1">No title available</p>
                  )}
                  {result.brand2 && (
                    <p className="text-xs text-gray-600 mb-1">Brand: {result.brand2}</p>
                  )}
                  <p className="text-xs text-gray-400">{extractDomain(result.url2)}</p>
                </div>
              </div>

              {/* Price Section */}
              <div className="pt-2 border-t border-gray-100">
                {result.price2 !== null ? (
                  <>
                    <p
                      className={`text-3xl font-bold ${
                        isPrice2Cheaper && price2Valid && bothValid
                          ? 'text-green-600'
                          : 'text-gray-900'
                      }`}
                    >
                      {formatPrice(result.price2, result.currency2)}
                    </p>
                    {result.currency2 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Currency: {result.currency2}
                      </p>
                    )}
                  </>
                ) : (
                  <div>
                    <p className="text-2xl font-semibold text-gray-400">Price not found</p>
                    {result.rawPriceText2 && (
                      <p className="text-xs text-gray-400 mt-1 italic">
                        Raw text: {result.rawPriceText2}
                      </p>
                    )}
                  </div>
                )}
                {isPrice2Cheaper && price2Valid && bothValid && (
                  <p className="text-sm text-green-600 font-semibold mt-2 flex items-center gap-1">
                    <span>✓</span>
                    <span>Cheaper option</span>
                  </p>
                )}
              </div>

              {/* Category (if available) */}
              {result.category2 && result.category2.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Category:</p>
                  <div className="flex flex-wrap gap-1">
                    {result.category2.map((cat, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Price History Chart */}
              {history2.length >= 2 && (
                <div>
                  <PriceHistoryChart url={result.url2} history={history2} />
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={handleClearHistory2}
                      className="text-xs text-red-600 hover:text-red-700 underline"
                    >
                      Reset History
                    </button>
                  </div>
                </div>
              )}

              {/* Error Messages */}
              {result.error2 && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">
                  {result.error2}
                </div>
              )}
              {price2Valid && !price1Valid && (
                <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 p-2 rounded-lg">
                  ⚠️ Only this price was found
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Copy Summary Button */}
      {result && (
        <div className="flex justify-center">
          <button
            onClick={handleCopySummary}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            {copySuccess ? 'Copied! ✅' : 'Copy Summary'}
          </button>
        </div>
      )}

      {/* Summary */}
      {bothValid && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl shadow-lg p-6">
          {!currenciesMatch ? (
            <div className="text-center">
              <p className="text-amber-800 font-semibold text-lg mb-2">
                ⚠️ Currency Mismatch
              </p>
              <p className="text-amber-700">
                Prices are in different currencies ({result.currency1 || 'Unknown'} vs{' '}
                {result.currency2 || 'Unknown'}). Direct comparison may not be accurate.
              </p>
            </div>
          ) : pricesEqual ? (
            <div className="text-center">
              <p className="text-indigo-900 font-semibold text-lg">
                Both products have the same price: {formatPrice(result.price1, result.currency1)}
              </p>
            </div>
          ) : isPrice1Cheaper ? (
            <div className="text-center space-y-2">
              <p className="text-indigo-900 font-semibold text-lg">
                Cheaper option: Product 1
              </p>
              <p className="text-indigo-700">
                You save:{' '}
                <span className="font-bold text-xl">
                  {formatPriceDifference(
                    result.price2! - result.price1!,
                    result.currency1
                  )}
                </span>
              </p>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <p className="text-indigo-900 font-semibold text-lg">
                Cheaper option: Product 2
              </p>
              <p className="text-indigo-700">
                You save:{' '}
                <span className="font-bold text-xl">
                  {formatPriceDifference(
                    result.price1! - result.price2!,
                    result.currency2
                  )}
                </span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
