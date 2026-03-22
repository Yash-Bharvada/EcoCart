"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Trophy } from "lucide-react"
import { usersApi, type LeaderboardEntry } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userRank, setUserRank] = useState<{ rank: number; score: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    usersApi.leaderboard('all_time', 'eco_score', 50)
      .then((res) => {
        setLeaderboard(res.entries || [])
        setUserRank(res.current_user_rank ? { rank: res.current_user_rank, score: user.eco_score_average } : null)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [user])

  return (
    <div className="container max-w-5xl mx-auto p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Leaderboard</h1>
        <p className="text-muted-foreground">See how you rank globally among eco-conscious shoppers.</p>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Top Eco Shoppers
          </CardTitle>
          <CardDescription>Players ranked by average Eco Score</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {leaderboard.map((entry, index) => (
              <div 
                key={entry.user_id}
                className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                  entry.user_id === user?.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'
                }`}
              >
                <div className={`flex flex-shrink-0 h-10 w-10 items-center justify-center rounded-full text-sm font-bold shadow-sm ${
                  index === 0 ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                  index === 1 ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                  index === 2 ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                  'bg-muted text-muted-foreground'
                }`}>
                  #{index + 1}
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {entry.full_name?.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-base font-semibold truncate ${entry.user_id === user?.id ? 'text-primary' : 'text-foreground'}`}>
                    {entry.full_name || 'Anonymous User'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-foreground">
                    {Math.round(entry.value)}
                  </span>
                  <p className="text-xs text-muted-foreground">Eco Score</p>
                </div>
              </div>
            ))}
            
            {leaderboard.length === 0 && !isLoading && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No leaderboard data available.</p>
              </div>
            )}
            
            {isLoading && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading ranks...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {userRank && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Your current rank is <strong>#{userRank.rank}</strong> out of {leaderboard.length || 0} active users. Keep making eco-friendly choices to climb up!
          </p>
        </div>
      )}
    </div>
  )
}
