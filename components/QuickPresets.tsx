'use client'

type QuickPresetsProps = {
  onSelect: (urls: { url1: string; url2: string }) => void
}

const PRESETS = [
  {
    label: 'Example: Amazon Products',
    url1: 'https://www.amazon.com.tr/dp/B08N5WRWNW',
    url2: 'https://www.amazon.com.tr/dp/B08N5WRWNW',
    description: 'Compare two Amazon product pages',
  },
  {
    label: 'Example: Different Shops',
    url1: 'https://www.amazon.com.tr/dp/B08N5WRWNW',
    url2: 'https://www.amazon.com.tr/dp/B08N5WRWNW',
    description: 'Compare products from different sellers',
  },
]

export default function QuickPresets({ onSelect }: QuickPresetsProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Quick Compare Presets
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {PRESETS.map((preset, index) => (
          <button
            key={index}
            onClick={() => onSelect({ url1: preset.url1, url2: preset.url2 })}
            className="text-left p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
          >
            <p className="text-sm font-medium text-gray-900">{preset.label}</p>
            <p className="text-xs text-gray-500 mt-1">{preset.description}</p>
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-3">
        💡 Click a preset to autofill the form above
      </p>
    </div>
  )
}

