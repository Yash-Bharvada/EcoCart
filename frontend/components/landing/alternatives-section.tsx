'use client'

import { ArrowRight, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const comparisons = [
  {
    before: {
      name: 'Regular Beef',
      carbon: 27,
      price: 15.99,
      impact: 'High',
    },
    after: {
      name: 'Beyond Meat Plant-Based',
      carbon: 1.5,
      price: 12.99,
      savings: 94,
    },
  },
  {
    before: {
      name: 'Plastic Water Bottles (24-pack)',
      carbon: 3.2,
      price: 8.99,
      impact: 'High',
    },
    after: {
      name: 'Reusable Steel Bottle',
      carbon: 0.1,
      price: 24.99,
      savings: 97,
    },
  },
  {
    before: {
      name: 'Fast Fashion T-Shirt',
      carbon: 8.1,
      price: 12.99,
      impact: 'Medium',
    },
    after: {
      name: 'Organic Cotton Tee',
      carbon: 2.3,
      price: 29.99,
      savings: 72,
    },
  },
]

export function AlternativesSection() {
  return (
    <section className="py-24 lg:py-32 bg-eco-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
            Smart Sustainable Swaps
          </h2>
          <p className="text-lg text-muted-foreground">
            Real alternatives, real impact
          </p>
        </div>

        {/* Comparison Cards */}
        <div className="grid lg:grid-cols-3 gap-6">
          {comparisons.map((item, index) => (
            <Card
              key={index}
              className="overflow-hidden border-0 bg-card shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <CardContent className="p-0">
                {/* Before */}
                <div className="p-6 border-b border-border">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
                      <span className="text-2xl">🚫</span>
                    </div>
                    <Badge variant="destructive" className="bg-destructive/10 text-destructive border-0">
                      {item.before.impact} Impact
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{item.before.name}</h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.before.carbon} kg CO₂</span>
                    <span className="font-semibold">${item.before.price}</span>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center py-3 bg-muted/30">
                  <div className="flex items-center gap-2 text-primary">
                    <ArrowRight className="h-5 w-5" />
                    <span className="text-sm font-medium">Switch to</span>
                  </div>
                </div>

                {/* After */}
                <div className="p-6 bg-primary/5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl">✓</span>
                    </div>
                    <Badge className="bg-primary text-primary-foreground">
                      -{item.after.savings}% CO₂
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{item.after.name}</h3>
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-primary font-medium">{item.after.carbon} kg CO₂</span>
                    <span className="font-semibold">${item.after.price}</span>
                  </div>
                  <Button variant="outline" className="w-full gap-2" size="sm">
                    View Product
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
