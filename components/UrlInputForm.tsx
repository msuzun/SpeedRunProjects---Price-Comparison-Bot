'use client'

import { useState, FormEvent } from 'react'

type UrlInputFormProps = {
  onSubmit: (urls: { url1: string; url2: string }) => void
  isLoading: boolean
}

export default function UrlInputForm({
  onSubmit,
  isLoading,
}: UrlInputFormProps) {
  const [url1, setUrl1] = useState('')
  const [url2, setUrl2] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setValidationError(null)

    // Client-side validation
    if (!url1.trim() || !url2.trim()) {
      setValidationError('Please enter both URLs')
      return
    }

    // Basic URL validation
    try {
      new URL(url1.trim())
    } catch {
      setValidationError('URL 1 is not a valid URL')
      return
    }

    try {
      new URL(url2.trim())
    } catch {
      setValidationError('URL 2 is not a valid URL')
      return
    }

    onSubmit({ url1: url1.trim(), url2: url2.trim() })
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
          onChange={(e) => {
            setUrl1(e.target.value)
            setValidationError(null)
          }}
          placeholder="https://example.com/product-1"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          required
          disabled={isLoading}
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
          onChange={(e) => {
            setUrl2(e.target.value)
            setValidationError(null)
          }}
          placeholder="https://example.com/product-2"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          required
          disabled={isLoading}
        />
      </div>

      {validationError && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
          {validationError}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md font-medium hover:bg-indigo-700 transition-colors duration-200 shadow-sm hover:shadow-md disabled:bg-indigo-400 disabled:cursor-not-allowed disabled:hover:bg-indigo-400"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
            Comparing...
          </span>
        ) : (
          'Compare Prices'
        )}
      </button>
    </form>
  )
}
