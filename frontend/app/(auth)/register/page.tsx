'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Leaf, Mail, Lock, Eye, EyeOff, User, Loader2, Check } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/lib/auth-context'
import { authApi, tokenStore } from '@/lib/api'
import { toast } from 'sonner'
import { GoogleLogin } from '@react-oauth/google'

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0
  if (password.length >= 8) score += 25
  if (password.match(/[A-Z]/)) score += 25
  if (password.match(/[0-9]/)) score += 25
  if (password.match(/[^A-Za-z0-9]/)) score += 25

  if (score <= 25) return { score, label: 'Weak', color: 'bg-destructive' }
  if (score <= 50) return { score, label: 'Fair', color: 'bg-warning' }
  if (score <= 75) return { score, label: 'Good', color: 'bg-info' }
  return { score, label: 'Strong', color: 'bg-primary' }
}

export default function RegisterPage() {
  const router = useRouter()
  const { register, isAuthenticated, isLoading: authLoading } = useAuth()
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  })
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  // Redirect if already authenticated
  React.useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/dashboard')
    }
  }, [authLoading, isAuthenticated, router])

  const passwordStrength = getPasswordStrength(formData.password)

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!formData.name) newErrors.name = 'Name is required'
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    if (!formData.agreeTerms) newErrors.agreeTerms = 'You must agree to the terms'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsLoading(true)
    try {
      await register({
        email: formData.email,
        password: formData.password,
        full_name: formData.name,
      })
      toast.success('Account created! Welcome to EcoCart 🌿')
      // router.push('/dashboard') is handled inside register()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.'
      toast.error(msg)
      if (msg.toLowerCase().includes('email')) {
        setErrors({ email: msg })
      }
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
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      {/* Background Effects */}
      <div className="absolute inset-0 gradient-mesh opacity-50" />

      <Card className="relative w-full max-w-md border-0 shadow-2xl bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-0">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
          <p className="text-muted-foreground mt-1">Start your sustainability journey</p>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="flex justify-center mb-6 w-full overflow-hidden rounded-md border border-border shadow-sm">
            <div className="w-full relative py-1 flex items-center justify-center bg-white hover:bg-gray-50 transition-colors">
              <div className="absolute inset-0 z-0">
                 <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => { toast.error('Google Sign-in failed') }}
                  useOneTap
                  theme="outline"
                  size="large"
                  text="continue_with"
                  width="100%"
                 />
              </div>
              {/* Invisible spacer so the parent takes the right height */}
              <div className="h-10 invisible"></div>
            </div>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-4 text-muted-foreground">or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  className={`pl-10 ${errors.name ? 'border-destructive' : ''}`}
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                    if (errors.name) setErrors({ ...errors, name: '' })
                  }}
                />
              </div>
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

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
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
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
              {formData.password && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Password strength</span>
                    <span className={`font-medium ${
                      passwordStrength.label === 'Weak' ? 'text-destructive' :
                      passwordStrength.label === 'Fair' ? 'text-warning' :
                      passwordStrength.label === 'Good' ? 'text-info' : 'text-primary'
                    }`}>{passwordStrength.label}</span>
                  </div>
                  <Progress value={passwordStrength.score} className={`h-2 ${passwordStrength.color}`} />
                </div>
              )}
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value })
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' })
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <Check className="absolute right-10 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                )}
              </div>
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
            </div>

            {/* Terms */}
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeTerms}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, agreeTerms: checked as boolean })
                  }
                  className="mt-1"
                />
                <Label htmlFor="terms" className="text-sm font-normal leading-relaxed">
                  I agree to the{' '}
                  <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                </Label>
              </div>
              {errors.agreeTerms && <p className="text-sm text-destructive">{errors.agreeTerms}</p>}
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
