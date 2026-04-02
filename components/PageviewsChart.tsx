'use client'

import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

// Register Chart.js components
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

interface PageviewsChartProps {
  data: {
    date: string
    pageviews: number
    unique_visitors: number
  }[]
}

export default function PageviewsChart({ data }: PageviewsChartProps) {
  // Format dates for display (e.g., "Jan 15")
  // IMPORTANT: data.date comes already adjusted to user's timezone from SQL
  // We need to parse it WITHOUT timezone conversion to avoid double-conversion
  const labels = data.map(item => {
    // Parse date as local date, not UTC (avoids timezone shift)
    const [year, month, day] = item.date.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  })

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Pageviews',
        data: data.map(item => item.pageviews),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
      {
        label: 'Unique Visitors',
        data: data.map(item => item.unique_visitors),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        displayColors: true,
        boxPadding: 4,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(128, 128, 128, 0.5)',
          font: { size: 10 },
          maxTicksLimit: 6,
        },
        border: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(128, 128, 128, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(128, 128, 128, 0.5)',
          font: { size: 10 },
          precision: 0,
          maxTicksLimit: 4,
        },
        border: {
          display: false,
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  }

  // Handle empty data
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No data available for the selected period
      </div>
    )
  }

  return (
    <div className="h-full w-full overflow-hidden">
      <Line data={chartData} options={options} />
    </div>
  )
}
