'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Leaf, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { authApi, tokenStore } from '@/lib/api'
import { toast } from 'sonner'
import { GoogleLogin } from '@react-oauth/google'

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, isLoading: authLoading } = useAuth()
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
    remember: false,
  })
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  // Redirect if already logged in
  React.useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/dashboard')
    }
  }, [authLoading, isAuthenticated, router])

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    try {
      await login(formData.email, formData.password)
      // router.push is done inside login()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please check your credentials.'
      toast.error(msg)
      setErrors({ password: msg })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true)
    try {
      if (!credentialResponse.credential) throw new Error('No Google token received')
      const tokens = await authApi.googleLogin(credentialResponse.credential)
      tokenStore.set(tokens.access_token, tokens.refresh_token)
      window.location.href = '/dashboard'
    } catch (err: any) {
      toast.error(err.message || 'Google Sign-in failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      {/* Background Effects */}
      <div className="absolute inset-0 gradient-mesh opacity-50" />

      <Card className="relative w-full max-w-md border-0 shadow-2xl bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-0">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-muted-foreground mt-1">Sign in to your account</p>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="flex justify-center mb-6 w-full overflow-hidden rounded-md border border-border shadow-sm">
            <div className="w-full relative py-1 flex items-center justify-center bg-white hover:bg-gray-50 transition-colors">
              <div className="absolute inset-0 z-0">
                 <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => { toast.error('Google Sign-in failed') }}
                  theme="outline"
                  size="large"
                  text="continue_with"
                  width="350"
                 />
              </div>
              {/* Invisible spacer so the parent takes the right height */}
              <div className="h-10 invisible"></div>
            </div>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-4 text-muted-foreground">or continue with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value })
                    if (errors.email) setErrors({ ...errors, email: '' })
                  }}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value })
                    if (errors.password) setErrors({ ...errors, password: '' })
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={formData.remember}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, remember: checked as boolean })
                  }
                />
                <Label htmlFor="remember" className="text-sm font-normal">
                  Remember me
                </Label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
