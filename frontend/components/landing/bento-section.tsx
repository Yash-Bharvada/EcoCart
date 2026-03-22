'use client'

import * as React from 'react'
import { TrendingDown, Package, TreePine } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

// Animated circular progress component
function CircularProgress({ value, max = 100 }: { value: number; max?: number }) {
  const percentage = (value / max) * 100
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative w-48 h-48">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/30"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          className="text-primary transition-all duration-1000 ease-out"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-foreground">{value}</span>
        <span className="text-sm text-muted-foreground">/ {max}</span>
      </div>
    </div>
  )
}

// Simple area chart component
function SimpleAreaChart() {
  const data = [30, 45, 35, 50, 40, 60, 55, 70, 65, 80, 75, 85]
  const max = Math.max(...data)
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = 100 - (value / max) * 80
    return `${x},${y}`
  }).join(' ')
  
  const areaPoints = `0,100 ${points} 100,100`

  return (
    <div className="w-full h-full">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Gradient definition */}
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Area */}
        <polygon
          points={areaPoints}
          fill="url(#areaGradient)"
        />
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  )
}

export function BentoSection() {
  return (
    <section className="py-24 lg:py-32 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
            See EcoCart in Action
          </h2>
          <p className="text-lg text-muted-foreground">
            Real-time tracking and insights for your sustainable journey
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Large Card 1 - Eco Score Gauge */}
          <Card className="lg:row-span-2 glass border-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
            <CardContent className="p-8 h-full flex flex-col items-center justify-center">
              <p className="text-sm font-medium text-muted-foreground mb-6">Your Eco Score</p>
              <CircularProgress value={75} />
              <p className="mt-6 text-sm text-muted-foreground">
                Better than <span className="font-semibold text-primary">68%</span> of users
              </p>
            </CardContent>
          </Card>

          {/* Large Card 2 - Carbon Footprint Chart */}
          <Card className="lg:col-span-2 glass border-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
            <CardContent className="p-8 h-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Carbon Trend</p>
                  <p className="text-2xl font-bold text-foreground mt-1">-23% this month</p>
                </div>
                <div className="flex gap-2">
                  {['7D', '1M', '3M', '6M'].map((period, i) => (
                    <button
                      key={period}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                        i === 1
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-48">
                <SimpleAreaChart />
              </div>
            </CardContent>
          </Card>

          {/* Small Card 1 - Total Carbon Saved */}
          <Card className="glass border-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <TrendingDown className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Carbon Saved</p>
                <p className="text-2xl font-bold text-foreground">127.5 kg</p>
                <p className="text-xs text-primary">23% vs last month</p>
              </div>
            </CardContent>
          </Card>

          {/* Small Card 2 - Products Analyzed */}
          <Card className="glass border-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-info/10 flex items-center justify-center shrink-0">
                <Package className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Products Analyzed</p>
                <p className="text-2xl font-bold text-foreground">348</p>
                <p className="text-xs text-muted-foreground">This month</p>
              </div>
            </CardContent>
          </Card>

          {/* Small Card 3 - Trees Planted */}
          <Card className="glass border-0 overflow-hidden group hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-success/10 flex items-center justify-center shrink-0">
                <TreePine className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trees Planted</p>
                <p className="text-2xl font-bold text-foreground">12</p>
                <p className="text-xs text-muted-foreground">Through offsets</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
