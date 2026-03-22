'use client'

import { Camera, BarChart3, Leaf, Upload, Sparkles, ShoppingBag } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  {
    number: '01',
    icon: Camera,
    title: 'Snap & Upload',
    description: 'Take a photo of your receipt or upload from gallery. Supports all major retailers.',
    illustration: Upload,
  },
  {
    number: '02',
    icon: BarChart3,
    title: 'AI Analysis',
    description: 'Our AI analyzes every product and calculates its carbon footprint in seconds.',
    illustration: Sparkles,
  },
  {
    number: '03',
    icon: Leaf,
    title: 'Shop Greener',
    description: 'Get personalized sustainable alternatives and offset your carbon footprint.',
    illustration: ShoppingBag,
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 lg:py-32 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
            How EcoCart Works
          </h2>
          <p className="text-lg text-muted-foreground">
            Three simple steps to sustainable shopping
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className="group relative border border-border bg-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-8">
                {/* Number Badge */}
                <span className="absolute top-6 right-6 text-sm font-mono text-muted-foreground/50">
                  {feature.number}
                </span>

                {/* Icon */}
                <div className="mb-6">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                {/* Illustration */}
                <div className="mt-8 pt-6 border-t border-border">
                  <div className="h-24 w-full rounded-xl bg-muted/50 flex items-center justify-center">
                    <feature.illustration className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
