'use client'

import { useState } from 'react'
import UrlInputForm from '@/components/UrlInputForm'
import ComparisonResult from '@/components/ComparisonResult'

export default function Home() {
  const [urls, setUrls] = useState<{ url1: string; url2: string } | null>(null)

  const handleSubmit = (submittedUrls: { url1: string; url2: string }) => {
    setUrls(submittedUrls)
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

        <UrlInputForm onSubmit={handleSubmit} />

        <ComparisonResult />
      </div>
    </main>
  )
}

