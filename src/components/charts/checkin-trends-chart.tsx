'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Activity } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

interface CheckinData {
  day: string
  checkins: number
  weekday: string
}

interface CheckinTrendsChartProps {
  data?: CheckinData[]
  isLoading?: boolean
}

// Generate mock check-in data for the last 7 days
const generateCheckinData = (): CheckinData[] => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const data: CheckinData[] = []
  
  const today = new Date()
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    const dayName = days[date.getDay()]
    const dayNum = date.getDate()
    
    // Generate realistic check-in patterns
    // Weekends and Monday/Friday typically lower, Tue-Thu higher
    let baseCheckins = 25
    if (dayName === 'Sat' || dayName === 'Sun') {
      baseCheckins = 15 // Lower weekend activity
    } else if (dayName === 'Mon' || dayName === 'Fri') {
      baseCheckins = 20 // Moderate on Mon/Fri
    } else {
      baseCheckins = 30 // Higher midweek
    }
    
    // Add some random variation
    const variation = Math.floor(Math.random() * 10) - 5
    const checkins = Math.max(5, baseCheckins + variation)
    
    data.push({
      day: `${dayName} ${dayNum}`,
      checkins,
      weekday: dayName
    })
  }
  
  return data
}

const getThemeColor = (theme: string | undefined): string => {
  switch (theme) {
    case 'blue':   return '#2563eb'
    case 'green':  return '#10b981'
    case 'purple': return '#8b5cf6'
    case 'rose':   return '#ec4899'
    default:       return '#f59e0b'
  }
}

export const CheckinTrendsChart = ({ data, isLoading = false }: CheckinTrendsChartProps) => {
  const [chartData, setChartData] = useState<CheckinData[]>([])
  const [isClient, setIsClient] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    setIsClient(true)
    if (!data) {
      setChartData(generateCheckinData())
    } else {
      setChartData(data)
    }
  }, [data])

  const color = getThemeColor(theme)

  if (!isClient || isLoading) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm animate-pulse">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="h-5 w-5 text-gray-400" />
          <div className="h-6 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="h-64 bg-gray-100 rounded"></div>
      </div>
    )
  }

  // Calculate metrics
  const totalCheckins = chartData.reduce((sum, day) => sum + day.checkins, 0)
  const averageCheckins = Math.round(totalCheckins / chartData.length)
  const todayCheckins = chartData[chartData.length - 1]?.checkins || 0
  const yesterdayCheckins = chartData[chartData.length - 2]?.checkins || 0
  const dailyChange = yesterdayCheckins > 0 
    ? ((todayCheckins - yesterdayCheckins) / yesterdayCheckins * 100)
    : 0

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className={`h-5 w-5 ${theme === 'blue' ? 'text-blue-600' : theme === 'green' ? 'text-emerald-600' : theme === 'purple' ? 'text-purple-600' : theme === 'rose' ? 'text-rose-600' : 'text-orange-600'}`} />
          <h3 className="text-sm font-medium text-card-foreground">Check-in Trends</h3>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">vs yesterday</p>
          <p className={`text-sm font-medium ${dailyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {dailyChange >= 0 ? '+' : ''}{dailyChange.toFixed(1)}%
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={256}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => [`${Number(value)} check-ins`, 'Check-ins']} />
          <Line type="monotone" dataKey="checkins" stroke={color} strokeWidth={2} dot={{ fill: color, r: 4 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Today</p>
            <p className="font-medium text-card-foreground">{todayCheckins} check-ins</p>
          </div>
          <div>
            <p className="text-muted-foreground">7-Day Average</p>
            <p className="font-medium text-card-foreground">{averageCheckins} check-ins</p>
          </div>
          <div>
            <p className="text-muted-foreground">Weekly Total</p>
            <p className="font-medium text-card-foreground">{totalCheckins} check-ins</p>
          </div>
        </div>
      </div>
    </div>
  )
}