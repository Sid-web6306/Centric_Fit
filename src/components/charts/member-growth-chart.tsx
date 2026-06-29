'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

interface MemberGrowthData {
  month: string
  members: number
  newMembers: number
}

interface MemberGrowthChartProps {
  data?: MemberGrowthData[]
  isLoading?: boolean
}

// Generate mock data for the last 12 months
const generateMemberGrowthData = (currentMembers: number): MemberGrowthData[] => {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]
  
  const currentMonth = new Date().getMonth()
  const data: MemberGrowthData[] = []
  
  // Start with a reasonable base number 12 months ago
  let totalMembers = Math.max(10, currentMembers - 50)
  
  for (let i = 0; i < 12; i++) {
    const monthIndex = (currentMonth - 11 + i + 12) % 12
    const monthName = months[monthIndex]
    
    // Generate realistic growth (2-8 new members per month)
    const newMembers = Math.floor(Math.random() * 7) + 2
    totalMembers += newMembers
    
    // Adjust the last month to match current members count
    if (i === 11) {
      const difference = currentMembers - totalMembers
      totalMembers = currentMembers
      data.push({
        month: monthName,
        members: totalMembers,
        newMembers: Math.max(0, newMembers + difference)
      })
    } else {
      data.push({
        month: monthName,
        members: totalMembers,
        newMembers
      })
    }
  }
  
  return data
}

const getThemeColor = (theme: string | undefined): string => {
  switch (theme) {
    case 'blue':   return '#2563eb'
    case 'green':  return '#10b981'
    case 'purple': return '#8b5cf6'
    case 'rose':   return '#ec4899'
    default:       return '#2563eb'
  }
}

export const MemberGrowthChart = ({ data, isLoading = false }: MemberGrowthChartProps) => {
  const [chartData, setChartData] = useState<MemberGrowthData[]>([])
  const [isClient, setIsClient] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    setIsClient(true)
    if (!data) {
      setChartData(generateMemberGrowthData(120))
    } else {
      setChartData(data)
    }
  }, [data])

  const color = getThemeColor(theme)

  if (!isClient || isLoading) {
    return (
      <div className="rounded-lg border bg-card p-6 shadow-sm animate-pulse">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-5 w-5 text-gray-400" />
          <div className="h-6 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="h-64 bg-gray-100 rounded"></div>
      </div>
    )
  }

  // Calculate growth percentage
  const firstMonth = chartData[0]?.members || 0
  const lastMonth = chartData[chartData.length - 1]?.members || 0
  const growthPercentage = firstMonth > 0 ? ((lastMonth - firstMonth) / firstMonth * 100) : 0

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className={`h-5 w-5 ${theme === 'blue' ? 'text-blue-600' : theme === 'green' ? 'text-emerald-600' : theme === 'purple' ? 'text-purple-600' : theme === 'rose' ? 'text-rose-600' : 'text-blue-600'}`} />
          <h3 className="text-sm font-medium text-card-foreground">Member Growth</h3>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">12-month growth</p>
          <p className={`text-sm font-medium ${growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {growthPercentage >= 0 ? '+' : ''}{growthPercentage.toFixed(1)}%
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={256}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.15} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => [`${Number(value)} members`, 'Members']} />
          <Area type="monotone" dataKey="members" stroke={color} strokeWidth={2} fill="url(#colorMembers)" />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between text-sm">
          <div>
            <p className="text-muted-foreground">Total Growth</p>
            <p className="font-medium text-card-foreground">+{lastMonth - firstMonth} members</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">Avg Monthly</p>
            <p className="font-medium text-card-foreground">+{Math.round((lastMonth - firstMonth) / 12)} members</p>
          </div>
        </div>
      </div>
    </div>
  )
}