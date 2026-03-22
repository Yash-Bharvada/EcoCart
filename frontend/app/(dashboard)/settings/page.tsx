"use client"

import { useRequireAuth } from "@/lib/auth-context"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  CreditCard,
  Download,
  Trash2,
  Camera,
  Mail,
  Smartphone,
  Key,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  Leaf
} from "lucide-react"

export default function SettingsPage() {
  const { user } = useRequireAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    marketing: false,
    weeklyReport: true,
    achievements: true,
    productAlerts: true
  })
  const [preferences, setPreferences] = useState({
    language: "en",
    currency: "inr",
    theme: "system",
    ecoScoreDisplay: "percentage"
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and settings</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 lg:w-auto lg:grid-cols-5">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4 hidden sm:block" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4 hidden sm:block" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Palette className="h-4 w-4 hidden sm:block" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2">
            <Shield className="h-4 w-4 hidden sm:block" />
            Privacy
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details and profile picture</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.profile_picture_url ?? ''} alt="Profile" />
                  <AvatarFallback className="text-2xl">{user?.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Camera className="h-4 w-4" />
                    Change Photo
                  </Button>
                  <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max 2MB.</p>
                </div>
              </div>

              <Separator />

              {/* Form Fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" defaultValue={user?.full_name || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" type="email" defaultValue={user?.email || ""} className="pl-10" disabled />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="phone" type="tel" defaultValue="" placeholder="+1 (555) 000-0000" className="pl-10" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Input id="bio" placeholder="Tell us about yourself..." />
                <p className="text-xs text-muted-foreground">Brief description for your profile.</p>
              </div>

              <div className="flex justify-end">
                <Button className="gap-2 bg-primary hover:bg-primary/90">
                  <Check className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Password */}
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    id="currentPassword" 
                    type={showPassword ? "text" : "password"} 
                    className="pl-10 pr-10" 
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline">Update Password</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how and when you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch 
                    checked={notifications.email}
                    onCheckedChange={(checked) => setNotifications({...notifications, email: checked})}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive push notifications on your device</p>
                  </div>
                  <Switch 
                    checked={notifications.push}
                    onCheckedChange={(checked) => setNotifications({...notifications, push: checked})}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Weekly Impact Report</Label>
                    <p className="text-sm text-muted-foreground">Get a weekly summary of your eco impact</p>
                  </div>
                  <Switch 
                    checked={notifications.weeklyReport}
                    onCheckedChange={(checked) => setNotifications({...notifications, weeklyReport: checked})}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Achievement Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified when you earn new achievements</p>
                  </div>
                  <Switch 
                    checked={notifications.achievements}
                    onCheckedChange={(checked) => setNotifications({...notifications, achievements: checked})}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Product Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified about eco-friendly alternatives</p>
                  </div>
                  <Switch 
                    checked={notifications.productAlerts}
                    onCheckedChange={(checked) => setNotifications({...notifications, productAlerts: checked})}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">Receive tips and promotional content</p>
                  </div>
                  <Switch 
                    checked={notifications.marketing}
                    onCheckedChange={(checked) => setNotifications({...notifications, marketing: checked})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Display Preferences</CardTitle>
              <CardDescription>Customize how EcoCart looks and works for you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={preferences.language} onValueChange={(value) => setPreferences({...preferences, language: value})}>
                    <SelectTrigger>
                      <Globe className="mr-2 h-4 w-4" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={preferences.currency} onValueChange={(value) => setPreferences({...preferences, currency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD ($)</SelectItem>
                      <SelectItem value="eur">EUR</SelectItem>
                      <SelectItem value="gbp">GBP</SelectItem>
                      <SelectItem value="inr">INR (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select value={preferences.theme} onValueChange={(value) => setPreferences({...preferences, theme: value})}>
                    <SelectTrigger>
                      <Palette className="mr-2 h-4 w-4" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Eco Score Display</Label>
                  <Select value={preferences.ecoScoreDisplay} onValueChange={(value) => setPreferences({...preferences, ecoScoreDisplay: value})}>
                    <SelectTrigger>
                      <Leaf className="mr-2 h-4 w-4" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (85%)</SelectItem>
                      <SelectItem value="letter">Letter Grade (A+)</SelectItem>
                      <SelectItem value="stars">Stars (4.5/5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Control your privacy and data sharing preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Public Profile</Label>
                    <p className="text-sm text-muted-foreground">Allow others to see your eco achievements</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Show on Leaderboard</Label>
                    <p className="text-sm text-muted-foreground">Display your ranking on public leaderboards</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Share Anonymous Data</Label>
                    <p className="text-sm text-muted-foreground">Help improve EcoCart with anonymous usage data</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Download or delete your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground">Download Your Data</p>
                  <p className="text-sm text-muted-foreground">Get a copy of all your EcoCart data</p>
                </div>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground">Delete Account</p>
                  <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                </div>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
