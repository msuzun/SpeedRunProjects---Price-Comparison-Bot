'use client'

import { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { PriceHistoryEntry } from '@/lib/history/types'
import { formatPrice } from '@/lib/utils'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

type PriceHistoryChartProps = {
  url: string
  history: PriceHistoryEntry[]
}

export default function PriceHistoryChart({
  url,
  history,
}: PriceHistoryChartProps) {
  // Filter out entries with null prices and sort by timestamp
  const validHistory = useMemo(() => {
    return history
      .filter((entry) => entry.price !== null)
      .sort((a, b) => a.timestamp - b.timestamp)
  }, [history])

  // Need at least 2 points to draw a line
  if (validHistory.length < 2) {
    return null
  }

  // Get currency from the first entry (assuming all entries have same currency)
  const currency = validHistory[0]?.currency || null

  // Prepare data for chart
  const labels = validHistory.map((entry) => {
    const date = new Date(entry.timestamp)
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
    }
    // Add hour if it's not midnight
    if (date.getHours() > 0 || date.getMinutes() > 0) {
      options.hour = 'numeric'
    }
    return date.toLocaleDateString('en-US', options)
  })

  const prices = validHistory.map((entry) => entry.price as number)

  // Calculate min and max for better Y-axis scaling
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const priceRange = maxPrice - minPrice
  // Use 10% padding, or 5% of the price if range is 0 (all prices same)
  const padding = priceRange > 0 ? priceRange * 0.1 : maxPrice * 0.05

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Price',
        data: prices,
        borderColor: 'rgb(99, 102, 241)', // indigo-500
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(99, 102, 241)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Price History',
        font: {
          size: 14,
          weight: 'bold' as const,
        },
        color: '#374151',
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 12,
        },
        bodyFont: {
          size: 12,
        },
        callbacks: {
          label: (context: any) => {
            const value = context.parsed.y
            return formatPrice(value, currency)
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 10,
          },
          color: '#6B7280',
        },
      },
      y: {
        min: Math.max(0, minPrice - padding),
        max: maxPrice + padding,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 10,
          },
          color: '#6B7280',
          callback: (value: any) => {
            return formatPrice(value, currency)
          },
        },
      },
    },
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="h-48">
        <Line data={chartData} options={chartOptions} />
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">
        {validHistory.length} price point{validHistory.length !== 1 ? 's' : ''} tracked
      </p>
    </div>
  )
}

