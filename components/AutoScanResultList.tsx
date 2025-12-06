'use client'

import { useMemo } from 'react'
import { formatPrice } from '@/lib/utils'

type AutoScanResult = {
  store: string
  url: string
  price: number | null
}

type AutoScanResultListProps = {
  results: AutoScanResult[]
}

/**
 * Get store logo/icon based on store name
 */
function getStoreIcon(store: string): string {
  const storeLower = store.toLowerCase()
  
  if (storeLower.includes('trendyol')) {
    return '🛍️'
  } else if (storeLower.includes('hepsiburada')) {
    return '🛒'
  } else if (storeLower.includes('n11')) {
    return '📦'
  }
  
  return '🏪'
}

/**
 * Get store color scheme
 */
function getStoreColor(store: string): {
  bg: string
  border: string
  text: string
  hover: string
} {
  const storeLower = store.toLowerCase()
  
  if (storeLower.includes('trendyol')) {
    return {
      bg: 'bg-purple-50',
      border: 'border-purple-300',
      text: 'text-purple-700',
      hover: 'hover:bg-purple-100',
    }
  } else if (storeLower.includes('hepsiburada')) {
    return {
      bg: 'bg-orange-50',
      border: 'border-orange-300',
      text: 'text-orange-700',
      hover: 'hover:bg-orange-100',
    }
  } else if (storeLower.includes('n11')) {
    return {
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      text: 'text-blue-700',
      hover: 'hover:bg-blue-100',
    }
  }
  
  return {
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    text: 'text-gray-700',
    hover: 'hover:bg-gray-100',
  }
}

export default function AutoScanResultList({
  results,
}: AutoScanResultListProps) {
  // Filter out results without prices and find the cheapest
  const validResults = useMemo(() => {
    return results.filter((r) => r.price !== null && r.url)
  }, [results])

  const cheapestPrice = useMemo(() => {
    if (validResults.length === 0) return null
    return Math.min(...validResults.map((r) => r.price as number))
  }, [validResults])

  if (results.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Multi-Store Scan Results
      </h3>
      
      {validResults.length === 0 ? (
        <p className="text-sm text-gray-500 italic">
          No prices found from other stores.
        </p>
      ) : (
        <div className="space-y-3">
          {results.map((result, index) => {
            const isCheapest =
              result.price !== null &&
              result.price === cheapestPrice &&
              validResults.length > 1
            const colors = getStoreColor(result.store)
            const icon = getStoreIcon(result.store)

            return (
              <div
                key={index}
                className={`rounded-lg border-2 p-4 transition-all ${
                  isCheapest
                    ? 'bg-green-50 border-green-400 shadow-md'
                    : `${colors.bg} ${colors.border} ${colors.hover}`
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-2xl flex-shrink-0">{icon}</div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-semibold text-sm ${
                          isCheapest ? 'text-green-800' : colors.text
                        }`}
                      >
                        {result.store}
                      </p>
                      {result.price !== null ? (
                        <p
                          className={`text-2xl font-bold mt-1 ${
                            isCheapest ? 'text-green-700' : 'text-gray-900'
                          }`}
                        >
                          {formatPrice(result.price, null)}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 mt-1">
                          Price not available
                        </p>
                      )}
                    </div>
                  </div>

                  {isCheapest && (
                    <div className="flex-shrink-0 ml-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                        <span>✓</span>
                        <span>Cheapest</span>
                      </span>
                    </div>
                  )}
                </div>

                {result.url && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs text-indigo-600 hover:text-indigo-700 underline"
                    >
                      <span>View Product</span>
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {results.length > validResults.length && (
        <p className="text-xs text-gray-500 mt-4 text-center">
          {results.length - validResults.length} store(s) returned no price
        </p>
      )}
    </div>
  )
}

