'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Cloud, Award, FileText, TreePine, TrendingDown, TrendingUp,
  Eye, Trash2, Upload, Leaf, ArrowRight, Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useRequireAuth } from '@/lib/auth-context'
import { usersApi, analysisApi, productsApi, type HistoryItem, type Product, type DashboardData } from '@/lib/api'
import { toast } from 'sonner'

function useGreeting() {
  const [greeting, setGreeting] = React.useState('Welcome')
  React.useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 18) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])
  return greeting
}

function Sparkline({ data, color = 'text-primary' }: { data: number[]; color?: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((value, i) => (
        <div
          key={i}
          className={`w-1 rounded-full ${color} bg-current opacity-60`}
          style={{ height: `${((value - min) / range) * 100}%`, minHeight: '4px' }}
        />
      ))}
    </div>
  )
}

function CircularProgress({ value, size = 80 }: { value: number; size?: number }) {
  const circumference = 2 * Math.PI * 35
  const strokeDashoffset = circumference - (value / 100) * circumference
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size} viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="35" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/30" />
        <circle cx="40" cy="40" r="35" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"
          className="text-primary transition-all duration-500"
          style={{ strokeDasharray: circumference, strokeDashoffset }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold">{value}</span>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useRequireAuth()
  const greeting = useGreeting()
  const [dashboard, setDashboard] = React.useState<DashboardData | null>(null)
  const [recentAnalyses, setRecentAnalyses] = React.useState<HistoryItem[]>([])
  const [products, setProducts] = React.useState<Product[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    if (!user) return
    Promise.all([
      usersApi.dashboard().catch(() => null),
      analysisApi.getHistory({ limit: 5, sort_by: 'created_at', sort_order: 'desc' }).catch(() => ({ analyses: [], pagination: null })),
      productsApi.getRecommendations(4).catch(() => []),
    ]).then(([dash, history, prods]) => {
      setDashboard(dash)
      setRecentAnalyses(history?.analyses ?? [])
      setProducts(prods ?? [])
    }).finally(() => setIsLoading(false))
  }, [user])

  const handleDeleteAnalysis = async (id: string) => {
    try {
      await analysisApi.delete(id)
      setRecentAnalyses((prev) => prev.filter((a) => a.id !== id))
      toast.success('Analysis deleted')
    } catch {
      toast.error('Failed to delete analysis')
    }
  }

  const monthlyTrend = dashboard?.monthly_trend?.map(m => m.eco_score) ?? [40, 45, 38, 65, 48, 72, 58]

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          {greeting}, {user?.full_name?.split(' ')[0] ?? 'there'}!
        </h1>
        <p className="text-muted-foreground mt-1">Here&apos;s your sustainability overview</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {/* Total Carbon Footprint */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Carbon Footprint</p>
                    <p className="text-3xl font-bold mt-2">
                      {dashboard?.total_carbon_footprint_kg?.toFixed(1) ?? user?.total_carbon_footprint_kg?.toFixed(1) ?? '0'} kg
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      {(dashboard?.improvement_percent ?? 0) > 0 ? (
                        <><TrendingDown className="h-4 w-4 text-primary" />
                        <span className="text-sm text-primary font-medium">{dashboard?.improvement_percent?.toFixed(0)}% improved</span></>
                      ) : (
                        <span className="text-sm text-muted-foreground">Track your footprint</span>
                      )}
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                    <Cloud className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                <div className="mt-4">
                  <Sparkline data={monthlyTrend} />
                </div>
              </CardContent>
            </Card>

            {/* Eco Score Average */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Eco Score Average</p>
                    <div className="flex items-center gap-4 mt-2">
                      <CircularProgress value={Math.round(dashboard?.average_eco_score ?? user?.eco_score_average ?? 0)} />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {(dashboard?.average_eco_score ?? 0) >= 80 ? 'Excellent' :
                           (dashboard?.average_eco_score ?? 0) >= 60 ? 'Good' :
                           (dashboard?.average_eco_score ?? 0) >= 40 ? 'Fair' : 'Getting Started'}
                        </p>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          <span className="text-sm text-primary font-medium">Improving</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                    <Award className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analyses This Month */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Analyses This Month</p>
                    <p className="text-3xl font-bold mt-2">{user?.analysis_count_this_month ?? 0}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-sm text-primary font-medium">
                        Unlimited
                      </span>
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Carbon Offset */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Carbon Offset</p>
                    <p className="text-3xl font-bold mt-2">
                      {dashboard?.total_carbon_offset_kg?.toFixed(1) ?? user?.total_carbon_offset_kg?.toFixed(1) ?? '0'} kg
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      ≈ {Math.floor((dashboard?.total_carbon_offset_kg ?? 0) / 10)} trees equivalent
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                    <TreePine className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
                  <Link href="/carbon-offsets">Offset More</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Analyses */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Analyses</CardTitle>
                  <CardDescription>Your last receipt scans</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/history">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </CardHeader>
              <CardContent>
                {recentAnalyses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p>No analyses yet.</p>
                    <Button size="sm" className="mt-3" asChild>
                      <Link href="/analyze">Analyze your first receipt</Link>
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Receipt</TableHead>
                        <TableHead>Carbon</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentAnalyses.map((analysis) => (
                        <TableRow key={analysis.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 rounded-lg">
                                <AvatarImage src={analysis.receipt_image_thumbnail ?? ''} alt="Receipt" />
                                <AvatarFallback>R</AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-muted-foreground">
                                {new Date(analysis.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span>{analysis.total_carbon_kg.toFixed(1)} kg</span>
                              {analysis.total_carbon_kg < 10 && <TrendingDown className="h-3 w-3 text-primary" />}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              analysis.eco_score >= 85 ? 'bg-primary/10 text-primary border-0' :
                              analysis.eco_score >= 70 ? 'bg-warning/10 text-warning border-0' :
                              'bg-destructive/10 text-destructive border-0'
                            }>{analysis.eco_score}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={`/history?id=${analysis.id}`}><Eye className="h-4 w-4" /></Link>
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteAnalysis(analysis.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions + Products */}
            <div className="space-y-6">
              {/* Recommended Products */}
              {products.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Recommended for You</CardTitle>
                      <CardDescription>Based on your shopping habits</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/products">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {products.map((product) => (
                        <div key={product.id} className="shrink-0 w-40 group cursor-pointer">
                          <div className="relative aspect-square rounded-xl overflow-hidden bg-muted mb-3">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Leaf className="h-10 w-10 text-primary/40" />
                              </div>
                            )}
                            <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs">
                              {product.carbon_rating.toFixed(1)} CO₂
                            </Badge>
                          </div>
                          <p className="text-sm font-medium line-clamp-2">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.category}</p>
                          <p className="text-sm font-semibold mt-1">$ {product.price.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { href: '/analyze', icon: Upload, label: 'Scan Receipt' },
                  { href: '/carbon-offsets', icon: Leaf, label: 'Buy Offsets' },
                  { href: '/history?export=1', icon: FileText, label: 'Export Report' },
                  { href: '/achievements', icon: Award, label: 'Achievements' },
                ].map(({ href, icon: Icon, label }) => (
                  <Card key={href} className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <Link href={href} className="font-medium text-sm">{label}</Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
