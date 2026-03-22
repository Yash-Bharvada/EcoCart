/**
 * EcoCart API Client
 * ------------------
 * Typed, centralized client for all FastAPI backend calls.
 * Automatically attaches Bearer token from localStorage and handles
 * 401 token refresh before retrying the original request.
 */

const API_BASE = (process as any).env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface UserProfile {
  id: string
  email: string
  full_name: string
  profile_picture_url?: string
  total_carbon_footprint_kg: number
  total_carbon_offset_kg: number
  eco_score_average: number
  analysis_count: number
  analysis_count_this_month: number
  badges: Badge[]
  points: number
  level: string
  preferences: UserPreferences
  is_verified: boolean
  created_at: string
}

export interface UserPreferences {
  email_notifications: boolean
  marketing_emails: boolean
  weekly_report: boolean
  show_on_leaderboard: boolean
  units: string
  currency: string
}

export interface Badge {
  badge_id: string
  name: string
  description: string
  icon: string
  category: string
  earned_at: string
}

export interface AnalysisResult {
  id: string
  is_valid_receipt: boolean
  receipt_image_url?: string
  receipt_image_thumbnail?: string
  products: AnalysisProduct[]
  total_carbon_kg: number
  eco_score: number
  score_breakdown: Record<string, number>
  suggestions: Suggestion[]
  summary: string
  top_contributors: string[]
  comparison?: string
  processing_time_ms: number
  created_at: string
}

export interface AnalysisProduct {
  name: string
  category: string
  quantity?: string
  estimated_carbon_kg: number
  carbon_intensity: 'low' | 'medium' | 'high' | 'very_high'
  notes?: string
}

export interface Suggestion {
  text: string
  alternative_name?: string
  estimated_savings_kg: number
  priority: 'low' | 'medium' | 'high'
}

export interface HistoryItem {
  id: string
  receipt_image_thumbnail?: string
  total_carbon_kg: number
  eco_score: number
  product_count: number
  top_contributors: string[]
  created_at: string
  is_valid_receipt: boolean
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export interface Product {
  id: string
  name: string
  description: string
  category: string
  carbon_rating: number
  eco_certifications: string[]
  tags: string[]
  price: number
  currency: string
  image_url?: string
  affiliate_link?: string
  tracking_code?: string
  is_featured: boolean
  stock_status: string
}

export interface DashboardData {
  total_carbon_footprint_kg: number
  total_carbon_offset_kg: number
  average_eco_score: number
  total_analyses: number
  analysis_count_this_month: number
  monthly_trend: MonthlyTrend[]
  category_breakdown: CategoryBreakdown[]
  improvement_percent?: number
  recent_badges: Badge[]
}

export interface MonthlyTrend {
  month: string
  eco_score: number
  carbon_kg: number
  count: number
}

export interface CategoryBreakdown {
  category: string
  percentage: number
  carbon_kg: number
}

export interface LeaderboardEntry {
  rank: number
  user_id: string
  full_name: string
  profile_picture_url?: string
  value: number
  is_current_user?: boolean
}

export interface ApiError {
  message: string
  status: number
}

// ── Token Management ───────────────────────────────────────────────────────────

const TOKEN_KEY = 'ecocart_access_token'
const REFRESH_KEY = 'ecocart_refresh_token'

export const tokenStore = {
  getAccess: () => (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null),
  getRefresh: () => (typeof window !== 'undefined' ? localStorage.getItem(REFRESH_KEY) : null),
  set: (access: string, refresh: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, access)
      localStorage.setItem(REFRESH_KEY, refresh)
    }
  },
  clear: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_KEY)
    }
  },
}

// ── Core Fetch Wrapper ─────────────────────────────────────────────────────────

let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStore.getRefresh()
  if (!refreshToken) return null

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!res.ok) {
      tokenStore.clear()
      return null
    }

    const data: AuthTokens = await res.json()
    tokenStore.set(data.access_token, data.refresh_token)
    return data.access_token
  } catch {
    tokenStore.clear()
    return null
  }
}

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const token = tokenStore.getAccess()

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  // Try token refresh on 401
  if (response.status === 401 && retry) {
    if (!isRefreshing) {
      isRefreshing = true
      refreshPromise = refreshAccessToken().finally(() => {
        isRefreshing = false
        refreshPromise = null
      })
    }

    const newToken = await refreshPromise
    if (newToken) {
      return apiFetch<T>(endpoint, options, false)
    } else {
      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      throw new Error('Session expired. Please log in again.')
    }
  }

  if (!response.ok) {
    let errorMessage = `Request failed: ${response.status}`
    try {
      const errData = await response.json()
      errorMessage = errData.message ?? errData.detail ?? errorMessage
    } catch {}
    const err: ApiError & Error = Object.assign(new Error(errorMessage), {
      message: errorMessage,
      status: response.status,
    })
    throw err
  }

  // Handle empty responses (204 No Content)
  const contentType = response.headers.get('content-type')
  if (!contentType?.includes('application/json')) {
    return {} as T
  }

  return response.json()
}

// ── Auth API ───────────────────────────────────────────────────────────────────

export const authApi = {
  googleLogin: (token: string) =>
    apiFetch<AuthTokens>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),
  register: (data: { email: string; password: string; full_name: string }) =>
    apiFetch<AuthTokens>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (email: string, password: string) =>
    apiFetch<AuthTokens>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  refresh: (refreshToken: string) =>
    apiFetch<AuthTokens>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }),

  logout: () =>
    apiFetch<{ message: string }>('/auth/logout', { method: 'POST' }),

  me: () => apiFetch<UserProfile>('/auth/me'),

  forgotPassword: (email: string) =>
    apiFetch<{ message: string; success: boolean }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, new_password: string) =>
    apiFetch<{ message: string; success: boolean }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password }),
    }),

  verifyEmail: (token: string) =>
    apiFetch<{ message: string; success: boolean }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),
}

// ── Analysis API ───────────────────────────────────────────────────────────────

export const analysisApi = {
  analyzeReceipt: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiFetch<AnalysisResult>('/analyze/', {
      method: 'POST',
      body: form,
    })
  },

  getHistory: (params: {
    page?: number
    limit?: number
    sort_by?: string
    sort_order?: string
    eco_score_min?: number
    eco_score_max?: number
  } = {}) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => v !== undefined && qs.set(k, String(v)))
    return apiFetch<{ analyses: HistoryItem[]; pagination: PaginationMeta }>(
      `/analyze/history?${qs}`
    )
  },

  getStats: () =>
    apiFetch<{
      total_analyses: number
      average_eco_score: number
      total_carbon_kg: number
      monthly_trend: MonthlyTrend[]
      improvement_percent?: number
    }>('/analyze/stats'),

  getById: (id: string) => apiFetch<AnalysisResult>(`/analyze/${id}`),

  delete: (id: string) =>
    apiFetch<{ message: string; success: boolean }>(`/analyze/${id}`, { method: 'DELETE' }),
}

// ── Products API ───────────────────────────────────────────────────────────────

export const productsApi = {
  list: (params: {
    q?: string
    category?: string
    price_min?: number
    price_max?: number
    carbon_rating_max?: number
    is_featured?: boolean
    page?: number
    limit?: number
    sort_by?: string
    sort_order?: string
  } = {}) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => v !== undefined && qs.set(k, String(v)))
    return apiFetch<{ products: Product[]; pagination: PaginationMeta }>(`/products/?${qs}`)
  },

  getRecommendations: (limit = 20) =>
    apiFetch<Product[]>(`/products/recommendations?limit=${limit}`),

  getById: (id: string) => apiFetch<Product>(`/products/${id}`),

  click: (id: string) =>
    apiFetch<{ redirect_url: string; product_id: string }>(`/products/${id}/click`, {
      method: 'POST',
    }),
}

// ── User API ───────────────────────────────────────────────────────────────────

export const usersApi = {
  me: () => apiFetch<UserProfile>('/users/me'),

  update: (data: Partial<{ full_name: string; profile_picture_url: string; preferences: Partial<UserPreferences> }>) =>
    apiFetch<UserProfile>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  dashboard: () => apiFetch<DashboardData>('/users/dashboard'),

  badges: () => apiFetch<(Badge & { earned: boolean })[]>('/users/badges'),

  leaderboard: (period = 'monthly', metric = 'eco_score', limit = 50) =>
    apiFetch<{ period: string; metric: string; entries: LeaderboardEntry[]; current_user_rank?: number }>(
      `/users/leaderboard?period=${period}&metric=${metric}&limit=${limit}`
    ),

  updatePreferences: (prefs: Partial<UserPreferences>) =>
    apiFetch<{ preferences: UserPreferences; message: string }>('/users/preferences', {
      method: 'POST',
      body: JSON.stringify(prefs),
    }),

  deleteAccount: () =>
    apiFetch<{ message: string; success: boolean }>('/users/me', { method: 'DELETE' }),

  logOffset: (carbon_kg: number) =>
    apiFetch<{ message: string; total_offset: number }>('/users/me/offset', {
      method: 'POST',
      body: JSON.stringify({ carbon_kg }),
    }),
}


export interface Transaction {
  id: string
  transaction_type: string
  amount: number
  currency: string
  status: string
  description?: string
  created_at: string
  receipt_url?: string
}

// ── Carbon Offsets API ─────────────────────────────────────────────────────────

export const carbonApi = {
  listOffsets: (page = 1, limit = 20) =>
    apiFetch<{ offsets: CarbonOffset[]; pagination: PaginationMeta; total_offset_kg: number; total_spent: number }>(
      `/carbon-offsets?page=${page}&limit=${limit}`
    ),

  listProjects: () =>
    apiFetch<{ projects: OffsetProject[]; total: number }>('/carbon-offsets/projects'),
}

export interface CarbonOffset {
  id: string
  carbon_offset_kg: number
  total_cost: number
  currency: string
  project_name: string
  project_type: string
  verification_status: string
  certificate_url?: string
  created_at: string
}

export interface OffsetProject {
  project_id: string
  name: string
  description: string
  project_type: string
  location: string
  certification: string
  price_per_kg: number
  price_per_ton: number
  is_featured: boolean
}

// ── Health API ─────────────────────────────────────────────────────────────────

export const healthApi = {
  check: () =>
    apiFetch<{ status: string; mongodb: string; redis: string }>('/health'),
}
