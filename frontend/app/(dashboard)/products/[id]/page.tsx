"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft,
  Leaf,
  Droplets,
  Recycle,
  Factory,
  Truck,
  Package,
  Heart,
  Share2,
  ExternalLink,
  Star,
  Check,
  X,
  Info,
  ShoppingCart,
  TreePine,
  Wind,
  Award,
  ChevronRight
} from "lucide-react"

const product = {
  id: 1,
  name: "Organic Bamboo Toothbrush Set",
  brand: "EcoSmile",
  price: 12.99,
  ecoScore: 94,
  category: "Personal Care",
  image: "/placeholder.svg?height=400&width=400",
  description: "Sustainable bamboo toothbrush set with biodegradable handles and BPA-free bristles. Each brush lasts 3 months and can be composted after use.",
  certifications: ["FSC Certified", "Vegan", "Plastic-Free", "Carbon Neutral"],
  ratings: {
    overall: 4.8,
    reviewCount: 1247,
    quality: 4.9,
    sustainability: 4.8,
    value: 4.6
  },
  sustainability: {
    carbonFootprint: 0.3,
    waterUsage: 2.1,
    recyclability: 95,
    biodegradability: 90,
    packagingScore: 98
  },
  lifecycle: {
    sourcing: { score: 95, description: "FSC-certified bamboo from sustainable forests" },
    manufacturing: { score: 92, description: "Solar-powered facility with zero waste policy" },
    transportation: { score: 88, description: "Sea freight with carbon offset" },
    usage: { score: 100, description: "No environmental impact during use" },
    disposal: { score: 95, description: "Fully biodegradable handle, recyclable bristles" }
  },
  alternatives: [
    { id: 2, name: "Recycled Plastic Toothbrush", ecoScore: 72, price: 4.99, image: "/placeholder.svg" },
    { id: 3, name: "Electric Toothbrush Head", ecoScore: 65, price: 8.99, image: "/placeholder.svg" },
    { id: 4, name: "Standard Plastic Toothbrush", ecoScore: 28, price: 2.99, image: "/placeholder.svg" }
  ]
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-primary"
  if (score >= 50) return "text-amber-600"
  return "text-destructive"
}

function getScoreBg(score: number) {
  if (score >= 80) return "bg-primary"
  if (score >= 50) return "bg-amber-500"
  return "bg-destructive"
}

export default function ProductDetailPage() {
  const [isFavorite, setIsFavorite] = useState(false)

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/products" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>
        </Button>
      </div>

      {/* Product Header */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Product Image */}
        <Card className="overflow-hidden">
          <div className="relative aspect-square bg-muted">
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute top-4 left-4 flex gap-2">
              {product.certifications.slice(0, 2).map((cert) => (
                <Badge key={cert} className="bg-background/90 text-foreground backdrop-blur-sm">
                  {cert}
                </Badge>
              ))}
            </div>
            <div className="absolute top-4 right-4">
              <div className={`flex h-16 w-16 items-center justify-center rounded-full ${getScoreBg(product.ecoScore)} text-white shadow-lg`}>
                <div className="text-center">
                  <span className="text-2xl font-bold">{product.ecoScore}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <Badge variant="secondary" className="mb-2">{product.category}</Badge>
                <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
                <p className="text-muted-foreground">{product.brand}</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setIsFavorite(!isFavorite)}
                >
                  <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
                <Button variant="outline" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">₹{product.price}</span>
              <span className="text-sm text-muted-foreground">per set</span>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${star <= Math.round(product.ratings.overall) ? 'fill-amber-400 text-amber-400' : 'text-muted'}`}
                />
              ))}
            </div>
            <span className="font-medium text-foreground">{product.ratings.overall}</span>
            <span className="text-sm text-muted-foreground">({product.ratings.reviewCount} reviews)</span>
          </div>

          <p className="text-muted-foreground leading-relaxed">{product.description}</p>

          {/* Certifications */}
          <div className="flex flex-wrap gap-2">
            {product.certifications.map((cert) => (
              <Badge key={cert} variant="outline" className="gap-1">
                <Award className="h-3 w-3" />
                {cert}
              </Badge>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <TreePine className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Carbon Footprint</p>
                  <p className="font-semibold text-foreground">{product.sustainability.carbonFootprint}kg CO2</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Droplets className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Water Usage</p>
                  <p className="font-semibold text-foreground">{product.sustainability.waterUsage}L</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-3">
            <Button className="flex-1 gap-2 bg-primary hover:bg-primary/90">
              <ShoppingCart className="h-4 w-4" />
              Add to Cart
            </Button>
            <Button variant="outline" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Buy on Amazon
            </Button>
          </div>
        </div>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="sustainability" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
          <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="alternatives">Alternatives</TabsTrigger>
        </TabsList>

        {/* Sustainability Tab */}
        <TabsContent value="sustainability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Environmental Impact</CardTitle>
              <CardDescription>Detailed breakdown of this product's environmental footprint</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <TreePine className="h-4 w-4" />
                      Carbon Footprint
                    </span>
                    <span className="text-sm font-medium text-primary">Excellent</span>
                  </div>
                  <Progress value={95} className="h-2" />
                  <p className="text-xs text-muted-foreground">{product.sustainability.carbonFootprint}kg CO2 - 90% lower than average</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Droplets className="h-4 w-4" />
                      Water Usage
                    </span>
                    <span className="text-sm font-medium text-primary">Excellent</span>
                  </div>
                  <Progress value={92} className="h-2" />
                  <p className="text-xs text-muted-foreground">{product.sustainability.waterUsage}L - 85% lower than average</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Recycle className="h-4 w-4" />
                      Recyclability
                    </span>
                    <span className="text-sm font-medium text-primary">Excellent</span>
                  </div>
                  <Progress value={product.sustainability.recyclability} className="h-2" />
                  <p className="text-xs text-muted-foreground">{product.sustainability.recyclability}% of materials recyclable</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Leaf className="h-4 w-4" />
                      Biodegradability
                    </span>
                    <span className="text-sm font-medium text-primary">Excellent</span>
                  </div>
                  <Progress value={product.sustainability.biodegradability} className="h-2" />
                  <p className="text-xs text-muted-foreground">{product.sustainability.biodegradability}% biodegradable</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Packaging
                    </span>
                    <span className="text-sm font-medium text-primary">Excellent</span>
                  </div>
                  <Progress value={product.sustainability.packagingScore} className="h-2" />
                  <p className="text-xs text-muted-foreground">Plastic-free, recycled cardboard</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Wind className="h-4 w-4" />
                      Air Quality
                    </span>
                    <span className="text-sm font-medium text-primary">Excellent</span>
                  </div>
                  <Progress value={98} className="h-2" />
                  <p className="text-xs text-muted-foreground">No harmful emissions during production</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pros and Cons */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-primary flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  Eco Highlights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {[
                    "100% sustainably sourced bamboo",
                    "Biodegradable in 6 months",
                    "Plastic-free packaging",
                    "Carbon-neutral shipping",
                    "Vegan and cruelty-free"
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-amber-600 flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Considerations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {[
                    "Bristles are nylon (not biodegradable)",
                    "Higher price point than conventional",
                    "May require adjustment period"
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Lifecycle Tab */}
        <TabsContent value="lifecycle" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Lifecycle Analysis</CardTitle>
              <CardDescription>Environmental impact at each stage of the product lifecycle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(product.lifecycle).map(([stage, data], index) => {
                const icons: Record<string, typeof Factory> = {
                  sourcing: Leaf,
                  manufacturing: Factory,
                  transportation: Truck,
                  usage: Package,
                  disposal: Recycle
                }
                const Icon = icons[stage]
                const stageNames: Record<string, string> = {
                  sourcing: "Raw Material Sourcing",
                  manufacturing: "Manufacturing",
                  transportation: "Transportation",
                  usage: "Usage",
                  disposal: "End of Life"
                }

                return (
                  <div key={stage} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${getScoreBg(data.score)}/10`}>
                        <Icon className={`h-6 w-6 ${getScoreColor(data.score)}`} />
                      </div>
                      {index < 4 && <div className="w-0.5 flex-1 bg-border mt-2" />}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-foreground">{stageNames[stage]}</h4>
                        <Badge variant="outline" className={getScoreColor(data.score)}>
                          {data.score}/100
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{data.description}</p>
                      <Progress value={data.score} className="h-1.5 mt-2" />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Reviews</CardTitle>
              <CardDescription>What eco-conscious shoppers are saying</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Rating Summary */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <span className="text-5xl font-bold text-foreground">{product.ratings.overall}</span>
                    <div className="flex justify-center mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${star <= Math.round(product.ratings.overall) ? 'fill-amber-400 text-amber-400' : 'text-muted'}`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{product.ratings.reviewCount} reviews</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Quality", value: product.ratings.quality },
                    { label: "Sustainability", value: product.ratings.sustainability },
                    { label: "Value", value: product.ratings.value }
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground w-24">{label}</span>
                      <Progress value={value * 20} className="flex-1 h-2" />
                      <span className="text-sm font-medium w-8">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Sample Reviews */}
              {[
                {
                  author: "Sarah M.",
                  rating: 5,
                  date: "2 weeks ago",
                  comment: "Love these toothbrushes! Finally made the switch from plastic and couldn't be happier. Great quality and knowing they're biodegradable makes me feel good about my choice."
                },
                {
                  author: "James L.",
                  rating: 4,
                  date: "1 month ago",
                  comment: "Great product overall. The bamboo feels nice and the bristles are soft. Took a few days to get used to the different texture but now I prefer it."
                },
                {
                  author: "Emma R.",
                  rating: 5,
                  date: "1 month ago",
                  comment: "The packaging was beautiful and completely plastic-free. The toothbrushes work just as well as any conventional ones I've used. Highly recommend!"
                }
              ].map((review, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {review.author.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-medium text-foreground">{review.author}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{review.date}</span>
                  </div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted'}`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                  {i < 2 && <Separator className="mt-4" />}
                </div>
              ))}

              <Button variant="outline" className="w-full">Load More Reviews</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alternatives Tab */}
        <TabsContent value="alternatives" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compare Alternatives</CardTitle>
              <CardDescription>See how other products stack up environmentally</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Current Product */}
                <div className="flex items-center gap-4 p-4 rounded-lg border-2 border-primary bg-primary/5">
                  <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground truncate">{product.name}</h4>
                      <Badge className="bg-primary text-primary-foreground">Current</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{product.brand}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-2xl font-bold ${getScoreColor(product.ecoScore)}`}>{product.ecoScore}</div>
                    <p className="text-sm text-muted-foreground">${product.price}</p>
                  </div>
                </div>

                {/* Alternatives */}
                {product.alternatives.map((alt) => (
                  <div key={alt.id} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      <img src={alt.image} alt={alt.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">{alt.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {alt.ecoScore >= product.ecoScore ? (
                          <Badge variant="secondary" className="text-xs">Similar Impact</Badge>
                        ) : alt.ecoScore >= 50 ? (
                          <Badge variant="outline" className="text-xs text-amber-600">Moderate Impact</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-destructive">High Impact</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-2xl font-bold ${getScoreColor(alt.ecoScore)}`}>{alt.ecoScore}</div>
                      <p className="text-sm text-muted-foreground">${alt.price}</p>
                    </div>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/products/${alt.id}`}>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
