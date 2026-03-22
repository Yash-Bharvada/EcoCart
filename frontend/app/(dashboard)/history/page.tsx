'use client'

import * as React from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Search, Calendar, ShoppingBag, Leaf, BarChart3, TreePine,
  Download, ChevronRight, Loader2, FileText,
} from 'lucide-react'
import { useRequireAuth } from '@/lib/auth-context'
import { analysisApi, type HistoryItem, type PaginationMeta } from '@/lib/api'
import { toast } from 'sonner'

function getScoreColor(score: number) {
  if (score >= 80) return 'text-primary bg-primary/10'
  if (score >= 50) return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30'
  return 'text-destructive bg-destructive/10'
}

export default function HistoryPage() {
  const { user } = useRequireAuth()
  const [analyses, setAnalyses] = React.useState<HistoryItem[]>([])
  const [pagination, setPagination] = React.useState<PaginationMeta | null>(null)
  const [stats, setStats] = React.useState<{ total_analyses: number; average_eco_score: number; total_carbon_kg: number } | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [page, setPage] = React.useState(1)

  const loadAnalyses = React.useCallback(async (pageNum: number, append = false) => {
    if (pageNum === 1) setIsLoading(true)
    else setIsLoadingMore(true)
    try {
      const [historyRes, statsRes] = await Promise.all([
        analysisApi.getHistory({ page: pageNum, limit: 20, sort_by: 'created_at', sort_order: 'desc' }),
        pageNum === 1 ? analysisApi.getStats() : Promise.resolve(null),
      ])
      if (append) {
        setAnalyses((prev) => [...prev, ...historyRes.analyses])
      } else {
        setAnalyses(historyRes.analyses)
      }
      setPagination(historyRes.pagination)
      if (statsRes) setStats(statsRes)
    } catch {
      toast.error('Failed to load history')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [])

  React.useEffect(() => {
    if (user) loadAnalyses(1)
  }, [user, loadAnalyses])

  const handleLoadMore = async () => {
    const nextPage = page + 1
    setPage(nextPage)
    await loadAnalyses(nextPage, true)
  }

  const handleExport = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/history/export`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('ecocart_access_token')}` },
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'ecocart-history.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Export failed')
    }
  }

  const filteredAnalyses = search
    ? analyses.filter((a) =>
        a.top_contributors?.some((c) => c.toLowerCase().includes(search.toLowerCase()))
      )
    : analyses

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Analysis History</h1>
          <p className="text-muted-foreground">All your receipt scans and eco scores</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleExport}>
          <Download className="h-4 w-4" /> Export Data
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { icon: ShoppingBag, label: 'Total Scans', value: stats.total_analyses },
            { icon: Leaf, label: 'Avg Eco Score', value: `${Math.round(stats.average_eco_score)}/100` },
            { icon: BarChart3, label: 'Total CO₂', value: `${stats.total_carbon_kg.toFixed(1)} kg` },
            { icon: TreePine, label: 'Trees Offset', value: `${Math.floor(stats.total_carbon_kg / 10)}` },
          ].map(({ icon: Icon, label, value }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-xl font-bold text-foreground">{value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by product name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredAnalyses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No analyses yet</h3>
            <p className="text-muted-foreground mb-4">Upload your first receipt to start tracking your carbon footprint</p>
            <Button asChild><Link href="/analyze">Analyze a Receipt</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAnalyses.map((item) => (
            <Card key={item.id} className="overflow-hidden transition-all hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Thumbnail */}
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.receipt_image_thumbnail ? (
                      <img src={item.receipt_image_thumbnail} alt="Receipt" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <FileText className="h-6 w-6 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {item.product_count} product{item.product_count !== 1 ? 's' : ''} analyzed
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {item.top_contributors?.join(', ') || 'No products identified'}
                        </p>
                      </div>
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold shrink-0 ${getScoreColor(item.eco_score)}`}>
                        {item.eco_score}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs">{item.total_carbon_kg.toFixed(2)} kg CO₂</Badge>
                      {!item.is_valid_receipt && (
                        <Badge variant="secondary" className="text-xs">Invalid receipt</Badge>
                      )}
                    </div>
                  </div>

                  {/* Date & View */}
                  <div className="hidden sm:flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                    <Button variant="ghost" size="sm" className="mt-1" asChild>
                      <Link href={`/analyze?id=${item.id}`}>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Load More */}
      {pagination?.has_next && (
        <div className="flex justify-center">
          <Button variant="outline" className="gap-2" onClick={handleLoadMore} disabled={isLoadingMore}>
            {isLoadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Load More
          </Button>
        </div>
      )}
    </div>
  )
}
