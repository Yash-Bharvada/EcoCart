'use client'

import * as React from 'react'
import { Check, X, Leaf, Zap, Rocket } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

const tiers = [
  {
    name: 'Explorer',
    icon: Leaf,
    price: { monthly: 0, yearly: 0 },
    description: 'Perfect for getting started',
    features: [
      { name: '5 analyses per month', included: true },
      { name: 'Basic carbon tracking', included: true },
      { name: 'Product recommendations', included: true },
      { name: 'Email support', included: true },
      { name: 'Priority analysis', included: false },
      { name: 'API access', included: false },
    ],
    cta: 'Start Free',
    popular: false,
    gradient: false,
  },
  {
    name: 'Eco Warrior',
    icon: Zap,
    price: { monthly: 9.99, yearly: 96 },
    description: 'For serious sustainability',
    features: [
      { name: 'Unlimited analyses', included: true },
      { name: 'Advanced carbon tracking', included: true },
      { name: 'Priority AI processing', included: true },
      { name: 'Carbon offset recommendations', included: true },
      { name: 'Detailed reports', included: true },
      { name: 'Priority support', included: true },
      { name: 'API access', included: false },
      { name: 'White-label reports', included: false },
    ],
    cta: 'Start Free Trial',
    popular: true,
    gradient: true,
  },
  {
    name: 'Carbon Neutral',
    icon: Rocket,
    price: { monthly: 19.99, yearly: 192 },
    description: 'For businesses & power users',
    features: [
      { name: 'Everything in Premium', included: true },
      { name: 'API access (1000 req/month)', included: true },
      { name: 'Bulk analysis upload', included: true },
      { name: 'White-label reports', included: true },
      { name: 'Custom integrations', included: true },
      { name: 'Dedicated support', included: true },
    ],
    cta: 'Contact Sales',
    popular: false,
    gradient: false,
  },
]

export function PricingSection() {
  const [isYearly, setIsYearly] = React.useState(false)

  return (
    <section id="pricing" className="py-24 lg:py-32 bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Choose Your Plan
          </h2>
          <p className="text-lg text-background/70">
            Start free, upgrade anytime
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-16">
          <Label htmlFor="billing-toggle" className={`text-sm ${!isYearly ? 'text-background' : 'text-background/60'}`}>
            Monthly
          </Label>
          <Switch
            id="billing-toggle"
            checked={isYearly}
            onCheckedChange={setIsYearly}
            className="data-[state=checked]:bg-primary"
          />
          <Label htmlFor="billing-toggle" className={`text-sm ${isYearly ? 'text-background' : 'text-background/60'}`}>
            Yearly
          </Label>
          {isYearly && (
            <Badge className="bg-primary text-primary-foreground ml-2">Save 20%</Badge>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={`relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
                tier.popular
                  ? 'border-2 border-primary bg-background text-foreground shadow-xl shadow-primary/20'
                  : 'border border-background/20 bg-background/5 text-background'
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-none rounded-bl-lg bg-primary text-primary-foreground px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                    tier.popular ? 'bg-primary/10' : 'bg-background/10'
                  }`}>
                    <tier.icon className={`h-6 w-6 ${tier.popular ? 'text-primary' : 'text-background'}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{tier.name}</h3>
                    <p className={`text-sm ${tier.popular ? 'text-muted-foreground' : 'text-background/60'}`}>
                      {tier.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      ${isYearly ? (tier.price.yearly / 12).toFixed(2) : tier.price.monthly}
                    </span>
                    <span className={tier.popular ? 'text-muted-foreground' : 'text-background/60'}>
                      /month
                    </span>
                  </div>
                  {isYearly && tier.price.yearly > 0 && (
                    <p className={`text-sm mt-1 ${tier.popular ? 'text-muted-foreground' : 'text-background/60'}`}>
                      Billed ${tier.price.yearly}/year
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-8 pt-4">
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature.name} className="flex items-center gap-3">
                      {feature.included ? (
                        <Check className={`h-5 w-5 shrink-0 ${tier.popular ? 'text-primary' : 'text-primary'}`} />
                      ) : (
                        <X className={`h-5 w-5 shrink-0 ${tier.popular ? 'text-muted-foreground' : 'text-background/40'}`} />
                      )}
                      <span className={`text-sm ${
                        feature.included 
                          ? tier.popular ? 'text-foreground' : 'text-background'
                          : tier.popular ? 'text-muted-foreground' : 'text-background/40'
                      }`}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    tier.popular
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'bg-background text-foreground hover:bg-background/90'
                  }`}
                  size="lg"
                >
                  {tier.cta}
                </Button>

                {tier.popular && (
                  <p className="text-center text-sm text-muted-foreground mt-3">
                    14-day free trial
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
