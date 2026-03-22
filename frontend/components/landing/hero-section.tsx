'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Play, Sparkles, Leaf, Cloud, Receipt } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background Effects */}
      <div className="absolute inset-0 gradient-mesh" />
      <div className="absolute inset-0 dot-pattern opacity-50" />
      
      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-info/10 rounded-full blur-3xl animate-pulse-glow delay-1000" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <div className="flex flex-col gap-8">
            {/* Badge */}
            <div className="animate-fade-up" style={{ animationDelay: '0ms' }}>
              <Badge variant="outline" className="w-fit px-4 py-2 gap-2 border-primary/30 bg-primary/5 text-primary">
                <Sparkles className="h-4 w-4" />
                AI-Powered Sustainability
              </Badge>
            </div>

            {/* Headline */}
            <div className="space-y-2 animate-fade-up" style={{ animationDelay: '100ms' }}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                Shop smarter for the{' '}
                <span className="text-primary">planet.</span>
              </h1>
            </div>

            {/* Subheadline */}
            <p 
              className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed animate-fade-up"
              style={{ animationDelay: '200ms' }}
            >
              Upload your receipts. Understand your carbon footprint. Make sustainable choices with AI-powered recommendations.
            </p>

            {/* CTA Buttons */}
            <div 
              className="flex flex-col sm:flex-row gap-4 animate-fade-up"
              style={{ animationDelay: '300ms' }}
            >
              <Button size="lg" className="gap-2 px-8 py-6 text-base group" asChild>
                <Link href="/register">
                  Try EcoCart AI
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="gap-2 px-8 py-6 text-base">
                <Play className="h-5 w-5" />
                Watch Demo
              </Button>
            </div>

            {/* Social Proof */}
            <div 
              className="flex items-center gap-4 animate-fade-up"
              style={{ animationDelay: '400ms' }}
            >
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <Avatar key={i} className="border-2 border-background w-10 h-10">
                    <AvatarImage src={`https://i.pravatar.cc/100?img=${i + 10}`} alt={`User ${i}`} />
                    <AvatarFallback>U{i}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Join <span className="font-semibold text-foreground">10,000+</span> eco-conscious shoppers
              </p>
            </div>
          </div>

          {/* Right Column - Animated Mockup */}
          <div className="relative lg:h-[600px] flex items-center justify-center">
            {/* Main Card */}
            <div className="relative z-10 animate-fade-up" style={{ animationDelay: '200ms' }}>
              <div className="glass rounded-3xl p-6 shadow-2xl max-w-sm">
                {/* Receipt Preview */}
                <div className="bg-muted rounded-2xl p-4 mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Grocery Receipt</p>
                      <p className="text-xs text-muted-foreground">Analyzed just now</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {['Organic Apples', 'Free-range Eggs', 'Plant Milk'].map((item, i) => (
                      <div key={item} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{item}</span>
                        <Badge variant="secondary" className="text-xs">
                          {['0.3', '0.8', '0.2'][i]} kg CO₂
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Eco Score */}
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/20">
                  <div>
                    <p className="text-sm text-muted-foreground">Eco Score</p>
                    <p className="text-3xl font-bold text-primary">85/100</p>
                  </div>
                  <div className="h-16 w-16 rounded-full border-4 border-primary flex items-center justify-center">
                    <Leaf className="h-8 w-8 text-primary" />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute top-10 right-0 animate-float" style={{ animationDelay: '0ms' }}>
              <div className="glass rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Cloud className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">CO₂ Saved</p>
                    <p className="font-semibold text-sm">-12.5 kg</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-20 left-0 animate-float" style={{ animationDelay: '500ms' }}>
              <div className="glass rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
                    <Leaf className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Trees Planted</p>
                    <p className="font-semibold text-sm">24 trees</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-info/5 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  )
}
