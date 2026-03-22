'use client'

import { Star, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const testimonials = [
  {
    quote: "EcoCart helped me reduce my carbon footprint by 40% in just 3 months! The AI recommendations are spot on.",
    author: "Sarah Johnson",
    title: "Sustainable Lifestyle Blogger",
    avatar: "https://i.pravatar.cc/100?img=1",
    rating: 5,
  },
  {
    quote: "Finally, a tool that makes sustainable shopping easy and accessible. Love the receipt scanning feature!",
    author: "Michael Chen",
    title: "Environmental Scientist",
    avatar: "https://i.pravatar.cc/100?img=2",
    rating: 5,
  },
  {
    quote: "The carbon offset feature is brilliant. I feel good knowing I'm making a real difference.",
    author: "Emma Williams",
    title: "Small Business Owner",
    avatar: "https://i.pravatar.cc/100?img=3",
    rating: 5,
  },
  {
    quote: "Game-changer for our family! We've saved money while reducing our environmental impact.",
    author: "David Kim",
    title: "Parent & Eco-Advocate",
    avatar: "https://i.pravatar.cc/100?img=4",
    rating: 5,
  },
  {
    quote: "The product alternatives feature introduced me to so many amazing sustainable brands.",
    author: "Lisa Thompson",
    title: "Marketing Manager",
    avatar: "https://i.pravatar.cc/100?img=5",
    rating: 5,
  },
  {
    quote: "As a business owner, the detailed reports help me make better purchasing decisions for my company.",
    author: "James Rodriguez",
    title: "Restaurant Owner",
    avatar: "https://i.pravatar.cc/100?img=6",
    rating: 5,
  },
]

function TestimonialCard({ testimonial }: { testimonial: typeof testimonials[0] }) {
  return (
    <Card className="w-[400px] shrink-0 bg-card border border-border hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        {/* Rating */}
        <div className="flex gap-1 mb-4">
          {Array.from({ length: testimonial.rating }).map((_, i) => (
            <Star key={i} className="h-5 w-5 fill-warning text-warning" />
          ))}
        </div>

        {/* Quote */}
        <blockquote className="text-foreground mb-6 leading-relaxed">
          &ldquo;{testimonial.quote}&rdquo;
        </blockquote>

        {/* Author */}
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={testimonial.avatar} alt={testimonial.author} />
            <AvatarFallback>{testimonial.author[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-foreground">{testimonial.author}</p>
              <CheckCircle className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">{testimonial.title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function TestimonialsSection() {
  const firstRow = testimonials.slice(0, 3)
  const secondRow = testimonials.slice(3, 6)

  return (
    <section id="testimonials" className="py-24 lg:py-32 bg-background overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
            Loved by eco-conscious shoppers
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of users making a difference
          </p>
        </div>
      </div>

      {/* Marquee Row 1 - Scrolling Left */}
      <div className="relative mb-6">
        <div className="flex gap-6 animate-scroll-left hover:[animation-play-state:paused]">
          {[...firstRow, ...firstRow, ...firstRow, ...firstRow].map((testimonial, i) => (
            <TestimonialCard key={i} testimonial={testimonial} />
          ))}
        </div>
      </div>

      {/* Marquee Row 2 - Scrolling Right */}
      <div className="relative">
        <div className="flex gap-6 animate-scroll-right hover:[animation-play-state:paused]">
          {[...secondRow, ...secondRow, ...secondRow, ...secondRow].map((testimonial, i) => (
            <TestimonialCard key={i} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  )
}
