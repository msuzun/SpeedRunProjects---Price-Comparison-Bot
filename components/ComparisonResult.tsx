'use client'

import { ComparisonResult } from '@/app/page'
import {
  formatPrice,
  formatPriceDifference,
  getDomain,
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
  } = comparison

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
              isPrice1Cheaper && price1Valid
                ? 'bg-green-50 border-green-300'
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
                  Product 1
                </p>
                <p className="text-sm font-medium text-gray-700 break-all">
                  {getDomain(result.url1)}
                </p>
              </div>
              <div>
                <p
                  className={`text-3xl font-bold ${
                    isPrice1Cheaper && price1Valid
                      ? 'text-green-600'
                      : 'text-gray-900'
                  }`}
                >
                  {formatPrice(result.price1)}
                </p>
                {isPrice1Cheaper && price1Valid && (
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
              isPrice2Cheaper && price2Valid
                ? 'bg-green-50 border-green-300'
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
                  Product 2
                </p>
                <p className="text-sm font-medium text-gray-700 break-all">
                  {getDomain(result.url2)}
                </p>
              </div>
              <div>
                <p
                  className={`text-3xl font-bold ${
                    isPrice2Cheaper && price2Valid
                      ? 'text-green-600'
                      : 'text-gray-900'
                  }`}
                >
                  {formatPrice(result.price2)}
                </p>
                {isPrice2Cheaper && price2Valid && (
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

      {/* Summary */}
      {price1Valid && price2Valid && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl shadow-lg p-6 text-center">
          {pricesEqual ? (
            <p className="text-indigo-900 font-semibold text-lg">
              Both products have the same price: {formatPrice(result.price1)}
            </p>
          ) : isPrice1Cheaper ? (
            <div className="space-y-2">
              <p className="text-indigo-900 font-semibold text-lg">
                Product 1 is the better deal!
              </p>
              <p className="text-indigo-700">
                You save{' '}
                <span className="font-bold text-xl">
                  {formatPriceDifference(result.price2! - result.price1!)}
                </span>{' '}
                by choosing Product 1
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-indigo-900 font-semibold text-lg">
                Product 2 is the better deal!
              </p>
              <p className="text-indigo-700">
                You save{' '}
                <span className="font-bold text-xl">
                  {formatPriceDifference(result.price1! - result.price2!)}
                </span>{' '}
                by choosing Product 2
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
