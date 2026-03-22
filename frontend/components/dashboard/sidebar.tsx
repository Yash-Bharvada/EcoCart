'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home, Upload, Clock, ShoppingBag, Leaf, Trophy,
  Settings, HelpCircle, TrendingDown, ChevronDown, LogOut, Award,
} from 'lucide-react'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarSeparator,
} from '@/components/ui/sidebar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'

const mainNavItems = [
  { icon: Home, label: 'Dashboard', href: '/dashboard' },
  { icon: Upload, label: 'New Analysis', href: '/analyze', highlight: true },
  { icon: Clock, label: 'History', href: '/history' },
  { icon: ShoppingBag, label: 'Products', href: '/products' },
  { icon: Leaf, label: 'Carbon Offsets', href: '/carbon-offsets' },
  { icon: Trophy, label: 'Achievements', href: '/achievements' },
  { icon: Award, label: 'Leaderboard', href: '/leaderboard' },
]

const secondaryNavItems = [
  { icon: Settings, label: 'Settings', href: '/settings' },
  { icon: HelpCircle, label: 'Help & Support', href: '/help' },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  
  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const offsetKg = user?.total_carbon_offset_kg || 0

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-sidebar-foreground">EcoCart</span>
        </Link>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-sidebar-accent transition-colors">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.profile_picture_url ?? ''} alt={user?.full_name ?? ''} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-sidebar-foreground">{user?.full_name ?? 'Loading...'}</p>
                <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email ?? ''}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-sidebar-foreground/60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.full_name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive cursor-pointer" onSelect={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {/* Carbon Saved Card */}
        <div className="rounded-xl bg-primary p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-5 w-5 text-primary-foreground" />
            <span className="text-xs font-medium text-primary-foreground/80">Carbon Offset Total</span>
          </div>
          <p className="text-2xl font-bold text-primary-foreground">
            {user?.total_carbon_offset_kg?.toFixed(1) ?? '0'} kg
          </p>
          <p className="text-xs text-primary-foreground/80 mt-1">Keep making a difference! 🌿</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
