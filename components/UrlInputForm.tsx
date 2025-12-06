'use client'

import { useState, useEffect, FormEvent } from 'react'
import { isValidUrlPattern } from '@/lib/utils'

type UrlInputFormProps = {
  onSubmit: (urls: { url1: string; url2: string }) => void
  isLoading: boolean
  presetUrls?: { url1: string; url2: string } | null
  onPresetApplied?: () => void
}

export default function UrlInputForm({
  onSubmit,
  isLoading,
  presetUrls,
  onPresetApplied,
}: UrlInputFormProps) {
  const [url1, setUrl1] = useState('')
  const [url2, setUrl2] = useState('')

  // Apply preset URLs when they change
  useEffect(() => {
    if (presetUrls) {
      setUrl1(presetUrls.url1)
      setUrl2(presetUrls.url2)
      if (onPresetApplied) {
        onPresetApplied()
      }
    }
  }, [presetUrls, onPresetApplied])
  const [validationError, setValidationError] = useState<string | null>(null)
  const [url1Error, setUrl1Error] = useState<string | null>(null)
  const [url2Error, setUrl2Error] = useState<string | null>(null)

  const validateUrl1 = (value: string) => {
    if (!value.trim()) {
      setUrl1Error(null)
      return
    }
    if (!isValidUrlPattern(value)) {
      setUrl1Error('Please enter a valid URL starting with http:// or https://')
    } else {
      setUrl1Error(null)
    }
  }

  const validateUrl2 = (value: string) => {
    if (!value.trim()) {
      setUrl2Error(null)
      return
    }
    if (!isValidUrlPattern(value)) {
      setUrl2Error('Please enter a valid URL starting with http:// or https://')
    } else {
      setUrl2Error(null)
    }
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setValidationError(null)

    // Client-side validation
    if (!url1.trim() || !url2.trim()) {
      setValidationError('Please enter both URLs')
      return
    }

    // Validate URL patterns
    if (!isValidUrlPattern(url1)) {
      setValidationError('URL 1 is not a valid URL')
      setUrl1Error('Please enter a valid URL starting with http:// or https://')
      return
    }

    if (!isValidUrlPattern(url2)) {
      setValidationError('URL 2 is not a valid URL')
      setUrl2Error('Please enter a valid URL starting with http:// or https://')
      return
    }

    // Additional validation using URL constructor
    try {
      new URL(url1.trim())
    } catch {
      setValidationError('URL 1 is not a valid URL')
      setUrl1Error('Invalid URL format')
      return
    }

    try {
      new URL(url2.trim())
    } catch {
      setValidationError('URL 2 is not a valid URL')
      setUrl2Error('Invalid URL format')
      return
    }

    onSubmit({ url1: url1.trim(), url2: url2.trim() })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-lg p-6 space-y-5"
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
            validateUrl1(e.target.value)
          }}
          onBlur={(e) => validateUrl1(e.target.value)}
          placeholder="https://example.com/product-1"
          className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed ${
            url1Error
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-300'
          }`}
          required
          disabled={isLoading}
        />
        {url1Error && (
          <p className="text-xs text-red-600 mt-1">{url1Error}</p>
        )}
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
            validateUrl2(e.target.value)
          }}
          onBlur={(e) => validateUrl2(e.target.value)}
          placeholder="https://example.com/product-2"
          className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed ${
            url2Error
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-300'
          }`}
          required
          disabled={isLoading}
        />
        {url2Error && (
          <p className="text-xs text-red-600 mt-1">{url2Error}</p>
        )}
      </div>

      {validationError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
          {validationError}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !!url1Error || !!url2Error}
        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:bg-indigo-400 disabled:cursor-not-allowed disabled:hover:bg-indigo-400 disabled:hover:shadow-md"
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
