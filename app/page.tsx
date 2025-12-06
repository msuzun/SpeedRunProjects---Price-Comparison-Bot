'use client'

import { useState } from 'react'
import UrlInputForm from '@/components/UrlInputForm'
import ComparisonResult from '@/components/ComparisonResult'

// Type matching the API response
export type ComparisonResult = {
  url1: string
  url2: string
  price1: number | null
  price2: number | null
  error1?: string
  error2?: string
}

export default function Home() {
  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCompare = async ({
    url1,
    url2,
  }: {
    url1: string
    url2: string
  }) => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/compare-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url1, url2 }),
      })

      // Handle non-200 responses
      if (!response.ok) {
        try {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to compare prices')
        } catch {
          // If JSON parsing fails, use a generic error message
          setError('Something went wrong while contacting the comparison service.')
        }
        setResult(null)
        return
      }

      // Parse successful response
      try {
        const data = await response.json()
        setResult(data)
        setError(null)
      } catch (parseError) {
        setError('Something went wrong while processing the comparison results.')
        setResult(null)
      }
    } catch (err) {
      // Network errors or unexpected exceptions
      setError('Something went wrong while contacting the comparison service.')
      setResult(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-3xl space-y-6">
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 text-center space-y-3">
          <h1 className="text-4xl font-bold text-gray-900">
            Price Comparison Bot
          </h1>
          <p className="text-lg text-gray-600">
            Paste two product URLs and compare their prices.
          </p>
          <p className="text-sm text-amber-600 flex items-center justify-center gap-1">
            <span>⚠️</span>
            <span>This is a demo. Real websites may block price scraping.</span>
          </p>
        </div>

        <UrlInputForm onSubmit={handleCompare} isLoading={isLoading} />

        <ComparisonResult result={result} isLoading={isLoading} error={error} />
      </div>
    </main>
  )
}
