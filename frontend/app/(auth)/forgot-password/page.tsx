'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Leaf, Loader2, Mail } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { authApi } from '@/lib/api'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setIsLoading(true)
    try {
      await authApi.forgotPassword(email)
      setSubmitted(true)
      toast.success('Reset email sent! Check your inbox.')
    } catch (err: unknown) {
      // Always show success to prevent email enumeration
      setSubmitted(true)
      toast.success('If this email exists, you will receive a reset link.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="absolute inset-0 gradient-mesh opacity-50" />
      <Card className="relative w-full max-w-md border-0 shadow-2xl bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-0">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Reset password</h1>
          <p className="text-muted-foreground mt-1">Enter your email to receive a reset link</p>
        </CardHeader>
        <CardContent className="pt-6">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Check your email</h2>
              <p className="text-muted-foreground text-sm">
                If <strong>{email}</strong> is registered, you&apos;ll receive a reset link shortly.
              </p>
              <Button asChild className="w-full">
                <Link href="/login">Back to Sign In</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</>
                ) : (
                  'Send reset link'
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Remembered?{' '}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
