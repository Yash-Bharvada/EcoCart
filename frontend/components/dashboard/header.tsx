'use client'

import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Bell, Search, Moon, Sun, Command } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'

const pageNames: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/analyze': 'New Analysis',
  '/history': 'History',
  '/products': 'Products',
  '/offsets': 'Carbon Offsets',
  '/stats': 'Statistics',
  '/leaderboard': 'Leaderboard',
  '/settings': 'Settings',
  '/help': 'Help Center',
  '/achievements': 'Achievements',
}

export function DashboardHeader() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const currentPage = pageNames[pathname] || 'Dashboard'

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur px-4 lg:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-6" />

      {/* Breadcrumb */}
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          {pathname !== '/dashboard' && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{currentPage}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Search */}
      <div className="flex-1 flex justify-center">
        <Button
          variant="outline"
          className="hidden md:flex items-center gap-2 w-full max-w-sm text-muted-foreground hover:text-foreground"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search analyses, products...</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <Command className="h-3 w-3" />K
          </kbd>
        </Button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
            3
          </Badge>
          <span className="sr-only">Notifications</span>
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* User Avatar */}
        <Avatar className="h-8 w-8 md:hidden">
          <AvatarImage src="https://i.pravatar.cc/100?img=32" alt="Sarah Johnson" />
          <AvatarFallback>SJ</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
