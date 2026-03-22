'use client'

import * as React from 'react'
import Link from 'next/link'
import { 
  Search, 
  SlidersHorizontal, 
  Grid3X3, 
  List, 
  Leaf, 
  ArrowUpDown,
  X,
  ChevronDown,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

// Mock products data
const products = [
  {
    id: '1',
    name: 'Beyond Meat Plant-Based Burger',
    brand: 'Beyond Meat',
    category: 'Food & Beverages',
    carbon: 1.5,
    carbonComparison: 78,
    price: 12.99,
    originalPrice: 15.99,
    rating: 5,
    badge: 'Best Seller',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
  },
  {
    id: '2',
    name: 'Organic Cotton T-Shirt',
    brand: 'Patagonia',
    category: 'Fashion & Apparel',
    carbon: 2.3,
    carbonComparison: 65,
    price: 45.00,
    originalPrice: 60.00,
    rating: 5,
    badge: 'Carbon Neutral',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
  },
  {
    id: '3',
    name: 'Bamboo Utensil Set',
    brand: 'EcoVibe',
    category: 'Home & Living',
    carbon: 0.4,
    carbonComparison: 92,
    price: 15.99,
    rating: 5,
    badge: null,
    image: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400',
  },
  {
    id: '4',
    name: 'Reusable Water Bottle',
    brand: 'Hydro Flask',
    category: 'Accessories',
    carbon: 0.8,
    carbonComparison: 85,
    price: 34.99,
    rating: 5,
    badge: 'Popular',
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400',
  },
  {
    id: '5',
    name: 'Organic Oat Milk',
    brand: 'Oatly',
    category: 'Food & Beverages',
    carbon: 0.9,
    carbonComparison: 71,
    price: 4.99,
    rating: 4,
    badge: null,
    image: 'https://images.unsplash.com/photo-1600788886242-5c96aabe3757?w=400',
  },
  {
    id: '6',
    name: 'Recycled Yoga Mat',
    brand: 'Manduka',
    category: 'Outdoor & Sports',
    carbon: 1.2,
    carbonComparison: 68,
    price: 78.00,
    originalPrice: 98.00,
    rating: 5,
    badge: 'Eco Choice',
    image: 'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=400',
  },
  {
    id: '7',
    name: 'Natural Shampoo Bar',
    brand: 'Ethique',
    category: 'Personal Care',
    carbon: 0.2,
    carbonComparison: 95,
    price: 16.00,
    rating: 4,
    badge: 'Plastic-Free',
    image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400',
  },
  {
    id: '8',
    name: 'Solar Phone Charger',
    brand: 'BigBlue',
    category: 'Electronics',
    carbon: 3.5,
    carbonComparison: 45,
    price: 49.99,
    rating: 4,
    badge: null,
    image: 'https://images.unsplash.com/photo-1620891594592-c7f3da47d2cb?w=400',
  },
  {
    id: '9',
    name: 'Beeswax Food Wraps',
    brand: "Bee's Wrap",
    category: 'Home & Living',
    carbon: 0.3,
    carbonComparison: 88,
    price: 18.00,
    rating: 5,
    badge: 'Zero Waste',
    image: 'https://images.unsplash.com/photo-1602142946018-34606aa83259?w=400',
  },
]

const categories = [
  { name: 'All Products', count: 127 },
  { name: 'Food & Beverages', count: 34 },
  { name: 'Fashion & Apparel', count: 28 },
  { name: 'Home & Living', count: 24 },
  { name: 'Personal Care', count: 18 },
  { name: 'Electronics', count: 12 },
  { name: 'Outdoor & Sports', count: 11 },
]

const certifications = [
  'Organic',
  'Fair Trade',
  'Carbon Neutral',
  'Vegan',
  'Plastic-Free',
  'B Corp',
]

import { useRequireAuth } from '@/lib/auth-context'
import { productsApi, type Product, type PaginationMeta } from '@/lib/api'
import { toast } from 'sonner'

// Leaf rating component
function LeafRating({ rating }: { rating: number }) {
  const leaves = Math.max(1, Math.min(5, Math.round((5 - rating) / 10 * 5 + 1)))
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Leaf key={i} className={`h-4 w-4 ${i <= leaves ? 'text-primary fill-primary' : 'text-muted-foreground/30'}`} />
      ))}
    </div>
  )
}

// Product card component
function ProductCard({ product }: { product: Product }) {
  const handleClick = async () => {
    try {
      const { redirect_url } = await productsApi.click(product.id)
      window.open(redirect_url || product.affiliate_link || '#', '_blank', 'noopener')
    } catch {
      if (product.affiliate_link) window.open(product.affiliate_link, '_blank', 'noopener')
    }
  }

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Leaf className="h-12 w-12 text-primary/20" />
          </div>
        )}
        {product.is_featured && (
          <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">Featured</Badge>
        )}
        {product.eco_certifications?.length > 0 && (
          <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">{product.eco_certifications[0]}</Badge>
        )}
      </div>

      <CardContent className="p-4">
        <LeafRating rating={product.carbon_rating} />
        <h3 className="font-semibold mt-2 line-clamp-2 group-hover:text-primary transition-colors">{product.name}</h3>
        <p className="text-sm text-muted-foreground">{product.category}</p>

        <div className="flex items-center gap-2 mt-3">
          <Badge variant="secondary" className="text-xs">{product.carbon_rating.toFixed(1)} kg CO₂</Badge>
          {product.eco_certifications?.map((cert) => (
            <Badge key={cert} variant="outline" className="text-xs">{cert}</Badge>
          ))}
        </div>

        <div className="flex items-baseline gap-2 mt-3">
          <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
          <span className="text-xs text-muted-foreground">{product.currency}</span>
        </div>

        <Button className="w-full mt-4" onClick={handleClick}>
          View Product
        </Button>
      </CardContent>
    </Card>
  )
}

function FiltersSidebar({ onApply, className }: { onApply: (params: Record<string, unknown>) => void; className?: string }) {
  const [priceRange, setPriceRange] = React.useState([0, 500])
  const [carbonRange, setCarbonRange] = React.useState([0, 10])

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-lg">Filters</h2>
        <Button variant="ghost" size="sm" className="text-primary" onClick={() => {
          setPriceRange([0, 500]);
          setCarbonRange([0, 10]);
          onApply({});
        }}>Clear All</Button>
      </div>

      <Accordion type="multiple" defaultValue={['carbon', 'price']} className="space-y-2">
        <AccordionItem value="carbon" className="border-0">
          <AccordionTrigger className="hover:no-underline py-3">Carbon Rating (kg CO₂)</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2 pb-4 px-1">
              <Slider value={carbonRange} onValueChange={setCarbonRange} max={10} step={0.5} className="w-full" />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>0 kg</span><span>10 kg max</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="price" className="border-0">
          <AccordionTrigger className="hover:no-underline py-3">Price Range</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2 pb-4 px-1">
              <Slider value={priceRange} onValueChange={setPriceRange} max={500} step={10} className="w-full" />
              <div className="flex gap-2 items-center mt-3">
                <Input type="number" value={priceRange[0]} onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])} placeholder="Min" className="text-center h-9" />
                <span className="text-muted-foreground self-center">-</span>
                <Input type="number" value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])} placeholder="Max" className="text-center h-9" />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button className="w-full mt-8 mb-4" onClick={() => onApply({ price_min: priceRange[0], price_max: priceRange[1], carbon_rating_max: carbonRange[1] })}>
        Apply Filters
      </Button>
    </div>
  )
}

export default function ProductsPage() {
  useRequireAuth()
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [sortBy, setSortBy] = React.useState('carbon_rating')
  const [sortOrder, setSortOrder] = React.useState('asc')
  const [products, setProducts] = React.useState<Product[]>([])
  const [pagination, setPagination] = React.useState<PaginationMeta | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  const [page, setPage] = React.useState(1)
  const [filters, setFilters] = React.useState<Record<string, unknown>>({})

  const loadProducts = React.useCallback(async (pageNum: number, append = false, query = searchQuery, sort = sortBy, order = sortOrder, activeFilters = filters) => {
    if (pageNum === 1) setIsLoading(true); else setIsLoadingMore(true)
    try {
      const res = await productsApi.list({ q: query || undefined, page: pageNum, limit: 12, sort_by: sort, sort_order: order, ...activeFilters as Record<string, number> })
      if (append) setProducts((p) => [...p, ...res.products]); else setProducts(res.products)
      setPagination(res.pagination)
    } catch {
      toast.error('Failed to load products')
    } finally {
      setIsLoading(false); setIsLoadingMore(false)
    }
  }, [searchQuery, sortBy, sortOrder, filters])

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => { setPage(1); loadProducts(1, false, searchQuery) }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  React.useEffect(() => { setPage(1); loadProducts(1) }, [sortBy, sortOrder, filters])

  const handleApplyFilters = (newFilters: Record<string, unknown>) => {
    setFilters(newFilters); setPage(1)
  }

  const handleLoadMore = async () => {
    const next = page + 1; setPage(next)
    await loadProducts(next, true)
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <aside className="hidden lg:block w-72 border-r bg-card p-6 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
        <FiltersSidebar onApply={handleApplyFilters} />
      </aside>

      <main className="flex-1 p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Sustainable Products</h1>
            <p className="text-muted-foreground">Showing {pagination?.total ?? 0} eco-friendly products</p>
          </div>
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden gap-2">
                  <SlidersHorizontal className="h-4 w-4" /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
                <FiltersSidebar onApply={handleApplyFilters} className="mt-6" />
              </SheetContent>
            </Sheet>

            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(v) => { const [s, o] = v.split('-'); setSortBy(s); setSortOrder(o) }}>
              <SelectTrigger className="w-[180px]"><ArrowUpDown className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="carbon_rating-asc">Carbon (Low to High)</SelectItem>
                <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                <SelectItem value="created_at-desc">Newest</SelectItem>
              </SelectContent>
            </Select>

            <div className="hidden sm:flex border rounded-lg">
              <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('grid')}><Grid3X3 className="h-4 w-4" /></Button>
              <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('list')}><List className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search eco products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          {searchQuery && <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setSearchQuery('')}><X className="h-4 w-4" /></Button>}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Leaf className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No products found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}

        {pagination?.has_next && (
          <div className="flex justify-center mt-12">
            <Button variant="outline" size="lg" className="gap-2" onClick={handleLoadMore} disabled={isLoadingMore}>
              {isLoadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
              Load More Products
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}

