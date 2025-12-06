'use client'

import { ComparisonResult } from '@/app/page'
import { formatPrice, getDomain, comparePrices } from '@/lib/utils'

type ComparisonHistoryProps = {
  history: ComparisonResult[]
}

export default function ComparisonHistory({ history }: ComparisonHistoryProps) {
  // Limit to last 10 entries
  const recentHistory = history.slice(0, 10)

  if (recentHistory.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Recent Comparisons
      </h3>
      <div className="space-y-3">
        {recentHistory.map((item, index) => {
          const comparison = comparePrices(item.price1, item.price2)
          const hasAtLeastOnePrice = comparison.price1Valid || comparison.price2Valid

          if (!hasAtLeastOnePrice) {
            return null
          }

          return (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {/* Product 1 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Product 1</p>
                    <p className="text-gray-700 font-medium truncate">
                      {getDomain(item.url1)}
                    </p>
                  </div>
                  <div className="ml-3 text-right">
                    <p
                      className={`font-semibold ${
                        comparison.isPrice1Cheaper
                          ? 'text-green-600'
                          : 'text-gray-900'
                      }`}
                    >
                      {formatPrice(item.price1)}
                    </p>
                  </div>
                </div>

                {/* Product 2 */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Product 2</p>
                    <p className="text-gray-700 font-medium truncate">
                      {getDomain(item.url2)}
                    </p>
                  </div>
                  <div className="ml-3 text-right">
                    <p
                      className={`font-semibold ${
                        comparison.isPrice2Cheaper
                          ? 'text-green-600'
                          : 'text-gray-900'
                      }`}
                    >
                      {formatPrice(item.price2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Comparison note */}
              {comparison.bothValid && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-600">
                    {comparison.pricesEqual ? (
                      <span>Both products have the same price</span>
                    ) : comparison.isPrice1Cheaper ? (
                      <span>
                        <span className="font-medium text-green-600">
                          Product 1
                        </span>{' '}
                        is cheaper
                      </span>
                    ) : (
                      <span>
                        <span className="font-medium text-green-600">
                          Product 2
                        </span>{' '}
                        is cheaper
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

