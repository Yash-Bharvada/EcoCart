'use client'

import Link from 'next/link'
import { ArrowRight, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CTASection() {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-eco-green-dark" />
      
      {/* Animated gradient mesh */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse-glow delay-1000" />
      </div>

      {/* Dot pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="h-20 w-20 rounded-3xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <Globe className="h-10 w-10 text-white" />
          </div>
        </div>

        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6">
          Ready to Make an Impact?
        </h2>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-10">
          Join thousands of shoppers making sustainable choices every day. Start your journey to a greener future.
        </p>

        {/* CTA Button */}
        <Button
          size="lg"
          className="bg-white text-primary hover:bg-white/90 px-10 py-7 text-lg font-semibold group"
          asChild
        >
          <Link href="/register">
            Start Your Journey
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>

        {/* Subtext */}
        <p className="mt-6 text-sm text-white/60">
          No credit card required
        </p>
      </div>
    </section>
  )
}
