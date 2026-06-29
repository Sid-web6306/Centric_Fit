'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { DollarSign } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

interface RevenueData {
  month: string
  revenue: number
  target: number
}

interface RevenueChartProps {
  data?: RevenueData[]
  isLoading?: boolean
}

// Generate mock revenue data for the last 6 months
const generateRevenueData = (currentRevenue: number): RevenueData[] => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]
  
  const currentMonth = new Date().getMonth()
  const data: RevenueData[] = []
  
  for (let i = 0; i < 6; i++) {
    const monthIndex = (currentMonth - 5 + i + 12) % 12
    const monthName = months[monthIndex]
    
    // Generate realistic revenue data with some variation
    const baseRevenue = currentRevenue
    const variation = (Math.random() - 0.5) * 0.3 // ±15% variation
    const revenue = Math.round(baseRevenue * (1 + variation))
    const target = Math.round(baseRevenue * 1.1) // Target is 10% higher
    
    data.push({
      month: monthName,
      revenue,
      target
    })
  }
  
  // Set current month to actual current revenue
  data[data.length - 1].revenue = currentRevenue
  
  return data
}

const getThemeColors = (theme: string | undefined): [string, string] => {
  switch (theme) {
    case 'blue':   return ['#2563eb', '#0891b2']
    case 'green':  return ['#10b981', '#84cc16']
    case 'purple': return ['#8b5cf6', '#d946ef']
    case 'rose':   return ['#ec4899', '#f59e0b']
    default:       return ['#2563eb', '#0891b2']
  }
}

export const RevenueChart = ({ data, isLoading = false }: RevenueChartProps) => {
  const [chartData, setChartData] = useState<RevenueData[]>([])
  const [isClient, setIsClient] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    setIsClient(true)
    if (!data) {
      setChartData(generateRevenueData(6000))
    } else {
      setChartData(data)
    }
  }, [data])

  const [color1, color2] = getThemeColors(theme)


  if (!isClient || isLoading) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm animate-pulse">
        <div className="flex items-center gap-2 mb-6">
          <DollarSign className="h-5 w-5 text-gray-400" />
          <div className="h-6 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="h-64 bg-gray-100 rounded"></div>
      </div>
    )
  }

  // Calculate metrics
  const currentMonth = chartData[chartData.length - 1]
  const previousMonth = chartData[chartData.length - 2]
  const monthlyGrowth = previousMonth 
    ? ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue * 100)
    : 0

  const totalRevenue = chartData.reduce((sum, month) => sum + month.revenue, 0)
  const averageRevenue = Math.round(totalRevenue / chartData.length)

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <DollarSign className={`h-5 w-5 ${theme === 'blue' ? 'text-blue-600' : theme === 'green' ? 'text-emerald-600' : theme === 'purple' ? 'text-purple-600' : theme === 'rose' ? 'text-rose-600' : 'text-emerald-600'}`} />
          <h3 className="text-sm font-medium text-card-foreground">Monthly Revenue</h3>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">vs last month</p>
          <p className={`text-sm font-medium ${monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {monthlyGrowth >= 0 ? '+' : ''}{monthlyGrowth.toFixed(1)}%
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={256}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis width={48} tick={{ fontSize: 12 }} tickFormatter={(v: number) => `$${v.toLocaleString()}`} />
          <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, '']} />
          <Legend />
          <Bar dataKey="revenue" fill={color1} radius={[4, 4, 0, 0]} name="Revenue" />
          <Bar dataKey="target" fill={color2} radius={[4, 4, 0, 0]} name="Target" />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Current Month</p>
            <p className="font-medium text-card-foreground">${currentMonth.revenue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Target</p>
            <p className="font-medium text-card-foreground">${currentMonth.target.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">6-Month Avg</p>
            <p className="font-medium text-card-foreground">${averageRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}