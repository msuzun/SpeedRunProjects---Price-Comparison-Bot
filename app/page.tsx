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

      const data = await response.json()

      if (!response.ok) {
        // Handle error response
        setError(data.error || 'Failed to compare prices')
        setResult(null)
      } else {
        // Success response
        setResult(data)
        setError(null)
      }
    } catch (err) {
      setError('Network error. Please try again.')
      setResult(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-3xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">
            Price Comparison Bot
          </h1>
          <p className="text-lg text-gray-600">
            Paste two product URLs and compare their prices.
          </p>
        </div>

        <UrlInputForm onSubmit={handleCompare} isLoading={isLoading} />

        <ComparisonResult result={result} isLoading={isLoading} error={error} />
      </div>
    </main>
  )
}
