"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Trophy,
  Medal,
  Star,
  Flame,
  Target,
  Leaf,
  TreePine,
  Droplets,
  Recycle,
  ShoppingBag,
  Award,
  Crown,
  Zap,
  Heart,
  Users,
  Globe,
  Lock,
  Check,
  Share2
} from "lucide-react"

const achievements = [
  {
    id: 1,
    title: "Eco Warrior",
    description: "Complete 100 eco-friendly purchases",
    icon: Leaf,
    category: "milestones",
    progress: 87,
    total: 100,
    unlocked: false,
    points: 500,
    rarity: "epic"
  },
  {
    id: 2,
    title: "First Steps",
    description: "Make your first eco-conscious choice",
    icon: Star,
    category: "milestones",
    progress: 1,
    total: 1,
    unlocked: true,
    unlockedDate: "2024-01-01",
    points: 50,
    rarity: "common"
  },
  {
    id: 3,
    title: "Carbon Cutter",
    description: "Save 100kg of CO2 emissions",
    icon: Globe,
    category: "impact",
    progress: 48,
    total: 100,
    unlocked: false,
    points: 750,
    rarity: "legendary"
  },
  {
    id: 4,
    title: "Tree Hugger",
    description: "Equivalent of planting 10 trees through your choices",
    icon: TreePine,
    category: "impact",
    progress: 10,
    total: 10,
    unlocked: true,
    unlockedDate: "2024-01-10",
    points: 300,
    rarity: "rare"
  },
  {
    id: 5,
    title: "Streak Master",
    description: "Maintain a 30-day eco streak",
    icon: Flame,
    category: "streaks",
    progress: 24,
    total: 30,
    unlocked: false,
    points: 400,
    rarity: "epic"
  },
  {
    id: 6,
    title: "Week Warrior",
    description: "7-day eco shopping streak",
    icon: Zap,
    category: "streaks",
    progress: 7,
    total: 7,
    unlocked: true,
    unlockedDate: "2024-01-08",
    points: 100,
    rarity: "common"
  },
  {
    id: 7,
    title: "Water Saver",
    description: "Choose water-efficient products 25 times",
    icon: Droplets,
    category: "impact",
    progress: 18,
    total: 25,
    unlocked: false,
    points: 200,
    rarity: "rare"
  },
  {
    id: 8,
    title: "Recycling Champion",
    description: "Choose recyclable packaging 50 times",
    icon: Recycle,
    category: "impact",
    progress: 50,
    total: 50,
    unlocked: true,
    unlockedDate: "2024-01-12",
    points: 350,
    rarity: "epic"
  },
  {
    id: 9,
    title: "Community Leader",
    description: "Refer 5 friends to EcoCart",
    icon: Users,
    category: "social",
    progress: 3,
    total: 5,
    unlocked: false,
    points: 500,
    rarity: "epic"
  },
  {
    id: 10,
    title: "Social Sharer",
    description: "Share your impact on social media",
    icon: Share2,
    category: "social",
    progress: 1,
    total: 1,
    unlocked: true,
    unlockedDate: "2024-01-05",
    points: 75,
    rarity: "common"
  },
  {
    id: 11,
    title: "Perfect Score",
    description: "Purchase 10 products with 95+ eco score",
    icon: Target,
    category: "milestones",
    progress: 6,
    total: 10,
    unlocked: false,
    points: 250,
    rarity: "rare"
  },
  {
    id: 12,
    title: "Smart Shopper",
    description: "Scan 500 products total",
    icon: ShoppingBag,
    category: "milestones",
    progress: 312,
    total: 500,
    unlocked: false,
    points: 600,
    rarity: "legendary"
  }
]

const userStats = {
  totalPoints: 1875,
  level: 12,
  levelProgress: 65,
  rank: "Eco Champion",
  unlockedCount: 5,
  totalAchievements: 12
}

const leaderboard = [
  { rank: 1, name: "EcoMaster2024", points: 4250, avatar: "EM" },
  { rank: 2, name: "GreenLiving", points: 3890, avatar: "GL" },
  { rank: 3, name: "SustainableAlex", points: 3654, avatar: "SA" },
  { rank: 4, name: "You", points: 1875, avatar: "YO", isCurrentUser: true },
  { rank: 5, name: "NatureLover99", points: 1720, avatar: "NL" }
]

import { useRequireAuth } from "@/lib/auth-context"
import { usersApi, type Badge as UserBadge, type LeaderboardEntry } from "@/lib/api"
import { toast } from "sonner"

function getRarityColor(rarity: string) {
  switch (rarity) {
    case "common": return "bg-muted text-muted-foreground"
    case "rare": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
    case "epic": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
    case "legendary": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
    default: return "bg-muted text-muted-foreground"
  }
}

function getRarityBorder(rarity: string) {
  switch (rarity) {
    case "common": return "border-border"
    case "rare": return "border-blue-300 dark:border-blue-700"
    case "epic": return "border-purple-300 dark:border-purple-700"
    case "legendary": return "border-amber-300 dark:border-amber-700"
    default: return "border-border"
  }
}

export default function AchievementsPage() {
  const { user } = useRequireAuth()
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [badges, setBadges] = useState<UserBadge[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userRank, setUserRank] = useState<{ rank: number; score: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      usersApi.badges().catch(() => []),
      usersApi.leaderboard('all_time', 'eco_score', 10).catch(() => ({ entries: [], current_user_rank: null }))
    ]).then(([badgesRes, boardRes]) => {
      setBadges(badgesRes)
      if (typeof boardRes === 'object' && 'entries' in boardRes) {
        setLeaderboard((boardRes as any).entries || [])
        setUserRank((boardRes as any).current_user_rank ? { rank: (boardRes as any).current_user_rank, score: totalPoints } : null)
      }
    }).finally(() => setIsLoading(false))
  }, [user])

  // Split badges into lists based on earned
  const unlockedAchievements = badges.filter(b => b.earned)
  const lockedAchievements = badges.filter(b => !b.earned)

  // Calculate points
  const totalPoints = userRank?.score ?? 0
  const level = Math.floor(totalPoints / 500) + 1
  const levelProgress = ((totalPoints % 500) / 500) * 100

  return (
    <div className="container max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Achievements</h1>
        <p className="text-muted-foreground">Track your eco journey and earn rewards</p>
      </div>

      {/* User Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Global Rank</p>
                <p className="text-lg font-bold text-foreground">
                  {userRank ? `#${userRank.rank}` : "Unranked"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Star className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Points</p>
                <p className="text-lg font-bold text-foreground">{totalPoints.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Medal className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Level</p>
                <p className="text-lg font-bold text-foreground">{level}</p>
              </div>
            </div>
            <Progress value={levelProgress} className="mt-2 h-1.5" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Badges Unlocked</p>
                <p className="text-lg font-bold text-foreground">
                  {unlockedAchievements.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Achievements Grid */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="eco_score">Eco Score</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Unlocked Achievements */}
          {unlockedAchievements.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Unlocked ({unlockedAchievements.length})
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {unlockedAchievements.map((badge) => (
                  <Card key={badge.badge_id || badge.name} className="border-2 border-primary/20 bg-card">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                          <Check className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground truncate">{badge.name}</h4>
                            <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{badge.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-primary font-medium">Earned on {new Date(badge.earned_at || '').toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Locked Achievements */}
          {lockedAchievements.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                In Progress ({lockedAchievements.length})
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {lockedAchievements.map((b) => {
                  const badge = b as any
                  const progressPercent = badge.progress && badge.target ? Math.min((badge.progress / badge.target) * 100, 100) : 0
                  return (
                    <Card key={badge.badge_id || badge.name} className="bg-card">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground truncate">{badge.name}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">{badge.description}</p>
                            {badge.target > 0 && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-muted-foreground">
                                    {badge.progress?.toFixed(1) || 0} / {badge.target.toFixed(1)}
                                  </span>
                                </div>
                                <Progress value={progressPercent} className="h-1.5" />
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Leaderboard */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Leaderboard
              </CardTitle>
              <CardDescription>Top eco-conscious shoppers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div 
                  key={entry.user_id}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    entry.user_id === user?.id ? 'bg-primary/10 border border-primary/20' : ''
                  }`}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    index === 0 ? 'bg-amber-100 text-amber-700' :
                    index === 1 ? 'bg-slate-100 text-slate-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {entry.full_name?.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${entry.user_id === user?.id ? 'text-primary' : 'text-foreground'}`}>
                      {entry.full_name || 'Anonymous User'}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {Math.round(entry.value)}
                  </span>
                </div>
              ))}
              {leaderboard.length === 0 && !isLoading && (
                <p className="text-sm text-center text-muted-foreground py-4">No data yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
