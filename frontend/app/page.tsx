import { HeroSection } from "@/components/landing/hero-section"
import { StatsBar } from "@/components/landing/stats-bar"
import { FeaturesSection } from "@/components/landing/features-section"
import { BentoSection } from "@/components/landing/bento-section"
import { AlternativesSection } from "@/components/landing/alternatives-section"
import { TestimonialsSection } from "@/components/landing/testimonials-section"
import { CTASection } from "@/components/landing/cta-section"
import { Footer } from "@/components/landing/footer"
import { Navbar } from "@/components/landing/navbar"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <StatsBar />
      <FeaturesSection />
      <BentoSection />
      <AlternativesSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </main>
  )
}
