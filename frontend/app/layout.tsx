import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/lib/auth-context'
import { Toaster } from '@/components/ui/sonner'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'EcoCart - AI-Powered Sustainable Shopping',
  description: 'Shop smarter for the planet. Upload your receipts, understand your carbon footprint, and make sustainable choices with AI-powered recommendations.',
  keywords: ['sustainability', 'carbon footprint', 'eco-friendly', 'shopping', 'AI', 'climate', 'green living'],
  authors: [{ name: 'EcoCart' }],
  creator: 'EcoCart',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ecocart.app',
    title: 'EcoCart - AI-Powered Sustainable Shopping',
    description: 'Shop smarter for the planet. Upload your receipts, understand your carbon footprint, and make sustainable choices.',
    siteName: 'EcoCart',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EcoCart - AI-Powered Sustainable Shopping',
    description: 'Shop smarter for the planet.',
  },
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#10b981' },
    { media: '(prefers-color-scheme: dark)', color: '#059669' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy_client_id'}>
            <AuthProvider>
              {children}
              <Toaster richColors position="top-right" />
            </AuthProvider>
          </GoogleOAuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
