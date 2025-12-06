'use client'

import { useState, FormEvent } from 'react'

type UrlInputFormProps = {
  onSubmit: (urls: { url1: string; url2: string }) => void
}

export default function UrlInputForm({ onSubmit }: UrlInputFormProps) {
  const [url1, setUrl1] = useState('')
  const [url2, setUrl2] = useState('')

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit({ url1, url2 })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow-md p-6 space-y-4"
    >
      <div className="space-y-2">
        <label
          htmlFor="url1"
          className="block text-sm font-medium text-gray-700"
        >
          Product URL 1
        </label>
        <input
          type="url"
          id="url1"
          value={url1}
          onChange={(e) => setUrl1(e.target.value)}
          placeholder="https://example.com/product1"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          required
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="url2"
          className="block text-sm font-medium text-gray-700"
        >
          Product URL 2
        </label>
        <input
          type="url"
          id="url2"
          value={url2}
          onChange={(e) => setUrl2(e.target.value)}
          placeholder="https://example.com/product2"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          required
        />
      </div>

      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md font-medium hover:bg-indigo-700 transition-colors duration-200 shadow-sm hover:shadow-md"
      >
        Compare Prices
      </button>
    </form>
  )
}

