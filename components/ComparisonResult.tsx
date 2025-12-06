'use client'

import { useState } from 'react'
import { ComparisonResult } from '@/lib/types'
import {
  formatPrice,
  formatPriceDifference,
  extractDomain,
  comparePrices,
} from '@/lib/utils'

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
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 text-center mb-6">
          Comparison Results
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product 1 Card */}
          <div
            className={`rounded-xl shadow-md p-6 transition-all border-2 ${
              isPrice1Cheaper && price1Valid && bothValid
                ? 'bg-green-50 border-green-300'
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-semibold">
                  Product 1
                </p>
                <p className="text-xs text-gray-400 mb-2">
                  {extractDomain(result.url1)}
                </p>
                {result.title1 ? (
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">
                    {result.title1}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 italic">No title available</p>
                )}
              </div>
              <div>
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
            className={`rounded-xl shadow-md p-6 transition-all border-2 ${
              isPrice2Cheaper && price2Valid && bothValid
                ? 'bg-green-50 border-green-300'
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-semibold">
                  Product 2
                </p>
                <p className="text-xs text-gray-400 mb-2">
                  {extractDomain(result.url2)}
                </p>
                {result.title2 ? (
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">
                    {result.title2}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 italic">No title available</p>
                )}
              </div>
              <div>
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
