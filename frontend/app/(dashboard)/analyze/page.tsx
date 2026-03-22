'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Upload, Camera, Sparkles, ArrowRight, ArrowLeft,
  Share2, Download, Trash2, Award, Car, TreePine, Zap,
  ExternalLink, CheckCircle, AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useRequireAuth } from '@/lib/auth-context'
import { analysisApi, type AnalysisResult } from '@/lib/api'
import { toast } from 'sonner'

type AnalysisState = 'upload' | 'analyzing' | 'results'

const loadingMessages = [
  'Scanning receipt...',
  'Identifying products...',
  'Calculating carbon emissions...',
  'Finding eco alternatives...',
]

function EcoScoreGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 100
  const strokeDashoffset = circumference - (score / 100) * circumference

  const getColor = () => score >= 80 ? 'text-primary' : score >= 60 ? 'text-warning' : 'text-destructive'
  const getRating = () => score >= 80 ? 'Excellent!' : score >= 60 ? 'Very Good!' : score >= 40 ? 'Fair' : 'Needs Improvement'

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-60 h-60">
        <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 220 220">
          <circle cx="110" cy="110" r="100" fill="none" stroke="currentColor" strokeWidth="16" className="text-muted/20" />
          <circle cx="110" cy="110" r="100" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round"
            className={`${getColor()} transition-all duration-1000`}
            style={{ strokeDasharray: circumference, strokeDashoffset }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm text-muted-foreground">Eco Score</span>
          <span className="text-5xl font-bold">{score}</span>
          <span className="text-sm text-muted-foreground">/100</span>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4">
        <Award className={`h-6 w-6 ${getColor()}`} />
        <span className="text-xl font-semibold">{getRating()}</span>
      </div>
    </div>
  )
}

function UploadState({ onUpload }: { onUpload: (file: File) => void }) {
  const [isDragging, setIsDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPEG, PNG, WebP)')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 20MB.')
      return
    }
    onUpload(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold">Upload Your Receipt</h1>
        <p className="text-muted-foreground mt-2">Snap a photo or upload an image to analyze your carbon footprint</p>
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleInputChange} />

      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-16 lg:py-24">
          <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
            <Upload className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Drag and drop or click to browse</h2>
          <p className="text-muted-foreground text-center max-w-md mb-6">Supports JPG, PNG, WEBP (max 20MB)</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="gap-2" onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}>
              <Upload className="h-5 w-5" /> Choose File
            </Button>
            <Button size="lg" variant="outline" className="gap-2" onClick={(e) => { e.stopPropagation(); inputRef.current?.setAttribute('capture', 'environment'); inputRef.current?.click() }}>
              <Camera className="h-5 w-5" /> Take Photo
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Tips for best results</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {['Ensure text is clear and readable', 'Good lighting helps accuracy', 'Place receipt on a flat surface', 'Make sure all items are visible'].map((tip) => (
              <li key={tip} className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />{tip}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

function AnalyzingState({ imagePreview }: { imagePreview?: string }) {
  const [messageIndex, setMessageIndex] = React.useState(0)

  React.useEffect(() => {
    const interval = setInterval(() => setMessageIndex((p) => (p + 1) % loadingMessages.length), 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="max-w-2xl mx-auto p-6 lg:p-8 flex flex-col items-center justify-center min-h-[60vh]">
      {imagePreview && (
        <div className="relative w-64 h-80 rounded-2xl bg-muted overflow-hidden mb-8">
          <img src={imagePreview} alt="Receipt being analyzed" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      )}
      <div className="w-full max-w-sm mb-6">
        <Progress value={undefined} className="h-2 animate-pulse" />
      </div>
      <div className="flex items-center gap-2 text-lg">
        <Sparkles className="h-5 w-5 text-primary animate-pulse" />
        <span className="text-foreground font-medium">{loadingMessages[messageIndex]}</span>
      </div>
      <p className="text-sm text-muted-foreground mt-2">Powered by Google Gemini AI</p>
    </div>
  )
}

function ResultsState({ result, onReset }: { result: AnalysisResult; onReset: () => void }) {
  const [deleting, setDeleting] = React.useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await analysisApi.delete(result.id)
      toast.success('Analysis deleted')
      onReset()
    } catch {
      toast.error('Failed to delete analysis')
    } finally {
      setDeleting(false)
    }
  }

  const drivingMiles = (result.total_carbon_kg * 2.5).toFixed(1)
  const treesNeeded = (result.total_carbon_kg / 10).toFixed(1)
  const electricityDays = (result.total_carbon_kg / 5).toFixed(1)

  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2" onClick={onReset}>
            <ArrowLeft className="h-4 w-4 mr-1" /> New Analysis
          </Button>
          <h1 className="text-2xl lg:text-3xl font-bold">Analysis Results</h1>
          <p className="text-muted-foreground">Analyzed on {new Date(result.created_at).toLocaleString()}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2 text-destructive" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      {!result.is_valid_receipt && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-warning shrink-0" />
            <p className="text-sm">This doesn&apos;t appear to be a shopping receipt. Results may be limited.</p>
          </CardContent>
        </Card>
      )}

      {/* Eco Score */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardContent className="py-12">
          <EcoScoreGauge score={result.eco_score} />
        </CardContent>
      </Card>

      {/* AI Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted/50 rounded-xl mb-6">
            <p className="text-foreground leading-relaxed">{result.summary}</p>
          </div>
          <div className="mt-4 p-4 bg-foreground/5 rounded-xl text-center">
            <p className="text-3xl font-bold">{result.total_carbon_kg.toFixed(2)} kg</p>
            <p className="text-sm text-muted-foreground">Total CO₂</p>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Extracted Items</CardTitle>
          <CardDescription>All products from your receipt</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Carbon Footprint</TableHead>
                <TableHead>Impact Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.products.map((product, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell><Badge variant="outline">{product.category}</Badge></TableCell>
                  <TableCell>{product.estimated_carbon_kg.toFixed(2)} kg</TableCell>
                  <TableCell>
                    <Badge className={
                      product.carbon_intensity === 'high' || product.carbon_intensity === 'very_high'
                        ? 'bg-destructive/10 text-destructive border-0'
                        : product.carbon_intensity === 'medium'
                        ? 'bg-warning/10 text-warning border-0'
                        : 'bg-primary/10 text-primary border-0'
                    }>
                      {product.carbon_intensity.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Suggestions */}
      {result.suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommended Swaps</CardTitle>
            <CardDescription>Small changes, big impact</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {result.suggestions.map((s, i) => (
                <a 
                  key={i} 
                  href={`https://www.amazon.in/s?k=${encodeURIComponent(s.alternative_name || s.text)}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-start gap-3 p-4 rounded-xl border hover:border-primary/50 hover:bg-primary/5 transition-colors group cursor-pointer"
                >
                  <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                       {s.text} <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </p>
                    {s.estimated_savings_kg > 0 && (
                      <p className="text-xs text-primary font-medium mt-1">
                        💚 Save {s.estimated_savings_kg.toFixed(1)} kg CO₂
                      </p>
                    )}
                  </div>
                  <Badge className={`ml-auto shrink-0 ${s.priority === 'high' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'} border-0`}>
                    {s.priority}
                  </Badge>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Impact Visualization */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <Car className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Driving Equivalent</p>
              <p className="text-lg font-semibold">{drivingMiles} miles</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <TreePine className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Trees to Offset</p>
              <p className="text-lg font-semibold">{treesNeeded} trees</p>
              <Link href="/carbon-offsets" className="text-xs text-primary hover:underline">Plant Trees →</Link>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <Zap className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Home Electricity</p>
              <p className="text-lg font-semibold">{electricityDays} days</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-4 justify-center pt-4">
        <Button size="lg" onClick={onReset}>Analyze Another Receipt</Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/products">Find Eco Products <ExternalLink className="ml-2 h-4 w-4" /></Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/carbon-offsets">Offset This Carbon</Link>
        </Button>
      </div>
    </div>
  )
}

export default function AnalyzePage() {
  useRequireAuth()
  const searchParams = useSearchParams()
  const analysisId = searchParams.get('id')

  const [state, setState] = React.useState<AnalysisState>('upload')
  const [imagePreview, setImagePreview] = React.useState<string>()
  const [result, setResult] = React.useState<AnalysisResult | null>(null)

  React.useEffect(() => {
    if (analysisId) {
      setState('analyzing')
      analysisApi.getById(analysisId)
        .then(res => {
          setResult(res)
          setState('results')
        })
        .catch(() => {
          toast.error('Failed to load analysis details')
          setState('upload')
        })
    }
  }, [analysisId])

  const handleUpload = async (file: File) => {
    // Preview the image
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)

    setState('analyzing')
    try {
      const res = await analysisApi.analyzeReceipt(file)
      setResult(res)
      setState('results')
      toast.success('Analysis complete!')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis failed. Please try again.'
      toast.error(msg)
      setState('upload')
    }
  }

  const handleReset = () => {
    setState('upload')
    setResult(null)
    setImagePreview(undefined)
  }

  return (
    <>
      {state === 'upload' && <UploadState onUpload={handleUpload} />}
      {state === 'analyzing' && <AnalyzingState imagePreview={imagePreview} />}
      {state === 'results' && result && <ResultsState result={result} onReset={handleReset} />}
    </>
  )
}
