'use client'

import { ComparisonResult } from '@/app/page'

type ComparisonResultProps = {
  result: ComparisonResult | null
  isLoading: boolean
  error: string | null
}

/**
 * Extracts the domain from a URL for display purposes
 */
function getDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return url
  }
}

/**
 * Formats a price number to a string with 2 decimal places
 */
function formatPrice(price: number | null): string {
  if (price === null) return 'Price not found'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)
}

export default function ComparisonResult({
  result,
  isLoading,
  error,
}: ComparisonResultProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center space-x-2">
          <svg
            className="animate-spin h-6 w-6 text-indigo-600"
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
          <span className="text-gray-600">Fetching and comparing prices...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2">
          <svg
            className="h-5 w-5 text-red-600"
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
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      </div>
    )
  }

  // No result state
  if (!result) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500 text-center">
          No comparison yet. Enter two URLs above.
        </p>
      </div>
    )
  }

  // Both prices are null
  if (result.price1 === null && result.price2 === null) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600 text-center">
          Could not detect prices from these URLs. Please try different URLs.
        </p>
        {(result.error1 || result.error2) && (
          <div className="mt-4 space-y-2 text-sm text-gray-500">
            {result.error1 && (
              <p>
                <span className="font-medium">URL 1:</span> {result.error1}
              </p>
            )}
            {result.error2 && (
              <p>
                <span className="font-medium">URL 2:</span> {result.error2}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  // Determine which price is cheaper
  const price1Valid = result.price1 !== null
  const price2Valid = result.price2 !== null
  const isPrice1Cheaper =
    price1Valid &&
    price2Valid &&
    result.price1! < result.price2!
  const isPrice2Cheaper =
    price2Valid &&
    price1Valid &&
    result.price2! < result.price1!

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-gray-900 text-center">
        Comparison Results
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Product 1 Card */}
        <div
          className={`rounded-lg shadow-md p-6 transition-all ${
            isPrice1Cheaper && price1Valid
              ? 'bg-green-50 border-2 border-green-200'
              : 'bg-white border border-gray-200'
          }`}
        >
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 mb-1">Product 1</p>
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
                <p className="text-sm text-green-600 font-medium mt-1">
                  ✓ Cheaper option
                </p>
              )}
            </div>
            {result.error1 && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {result.error1}
              </div>
            )}
            {price1Valid && !price2Valid && (
              <p className="text-sm text-amber-600">
                Note: Only this price was found
              </p>
            )}
          </div>
        </div>

        {/* Product 2 Card */}
        <div
          className={`rounded-lg shadow-md p-6 transition-all ${
            isPrice2Cheaper && price2Valid
              ? 'bg-green-50 border-2 border-green-200'
              : 'bg-white border border-gray-200'
          }`}
        >
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 mb-1">Product 2</p>
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
                <p className="text-sm text-green-600 font-medium mt-1">
                  ✓ Cheaper option
                </p>
              )}
            </div>
            {result.error2 && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {result.error2}
              </div>
            )}
            {price2Valid && !price1Valid && (
              <p className="text-sm text-amber-600">
                Note: Only this price was found
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      {price1Valid && price2Valid && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-center">
          <p className="text-indigo-900">
            {isPrice1Cheaper ? (
              <>
                <span className="font-semibold">Product 1</span> is cheaper by{' '}
                <span className="font-bold">
                  {formatPrice(result.price2! - result.price1!)}
                </span>
              </>
            ) : (
              <>
                <span className="font-semibold">Product 2</span> is cheaper by{' '}
                <span className="font-bold">
                  {formatPrice(result.price1! - result.price2!)}
                </span>
              </>
            )}
          </p>
        </div>
      )}
    </div>
  )
}
