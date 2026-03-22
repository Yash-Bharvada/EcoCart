'use client'

import React, { useState } from 'react'
import { Leaf, TreePine, Droplets, Sun, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { usersApi } from '@/lib/api'
import { toast } from 'sonner'

const projects = [
  {
    id: 1,
    title: 'Amazon Reforestation Project',
    organization: 'Rainforest Trust',
    description: 'Protecting tropical ecosystems and planting native tree species to restore the Amazon basin.',
    icon: TreePine,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    link: 'https://www.rainforesttrust.org/',
    tags: ['Reforestation', 'Biodiversity']
  },
  {
    id: 2,
    title: 'Ocean Plastic Cleanup',
    organization: 'The Ocean Cleanup',
    description: 'Developing advanced technologies to rid the oceans of plastic and protect marine life.',
    icon: Droplets,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    link: 'https://theoceancleanup.com/',
    tags: ['Marine Conservation', 'Waste Reduction']
  },
  {
    id: 3,
    title: 'Global Solar Initiative',
    organization: 'SolarAid',
    description: 'Providing clean, renewable solar energy to developing communities to replace kerosene lamps.',
    icon: Sun,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    link: 'https://solar-aid.org/',
    tags: ['Renewable Energy', 'Community']
  }
]

export default function CarbonOffsetsPage() {
  const { user } = useAuth()
  const [loggingId, setLoggingId] = useState<number | null>(null)
  
  return (
    <div className="container max-w-5xl mx-auto p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Leaf className="h-6 w-6 text-primary" />
          Carbon Offsets
        </h1>
        <p className="text-muted-foreground mt-2">
          Explore global environmental projects. EcoCart is 100% free and open-source, so we do not process payments. 
          You can support these verified initiatives directly.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-primary text-primary-foreground border-none">
          <CardHeader>
            <CardTitle className="text-primary-foreground/90">Your Lifetime Impact</CardTitle>
            <CardDescription className="text-primary-foreground/70">Total carbon offset tracked in EcoCart</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {user?.total_carbon_offset_kg?.toFixed(1) || '0.0'} <span className="text-2xl font-normal opacity-80">kg CO₂</span>
            </div>
            <p className="mt-4 text-sm opacity-90">
              Keep analyzing receipts and making sustainable choices to grow your eco footprint!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Global Community Impact</CardTitle>
            <CardDescription>Together we are making a difference</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col justify-center">
            <div className="text-4xl font-bold text-primary flex items-baseline gap-2">
              1,245.8 <span className="text-2xl text-muted-foreground font-normal">tons CO₂</span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Estimated carbon saved by EcoCart users globally this month.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="pt-6">
        <h2 className="text-xl font-bold mb-6">Featured Projects</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${project.bgColor}`}>
                  <project.icon className={`h-6 w-6 ${project.color}`} />
                </div>
                <CardTitle className="text-lg">{project.title}</CardTitle>
                <CardDescription className="font-medium text-foreground/80">{project.organization}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="font-normal">{tag}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-2 group" onClick={() => window.open(project.link, '_blank')}>
                    Support
                    <ExternalLink className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </Button>
                  <Button 
                    variant="default" 
                    className="flex-1"
                    disabled={loggingId === project.id}
                    onClick={async () => {
                      setLoggingId(project.id)
                      try {
                        await usersApi.logOffset(10)
                        toast.success('Logged 10kg of CO₂ offset!')
                        setTimeout(() => window.location.reload(), 1500)
                      } catch (e: any) {
                        toast.error(e.message || 'Failed to log offset')
                      } finally {
                        setLoggingId(null)
                      }
                    }}
                  >
                    {loggingId === project.id ? 'Logging...' : 'Log 10kg'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
