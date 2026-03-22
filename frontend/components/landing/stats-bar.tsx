'use client'

export function StatsBar() {
  const stats = [
    '500M kg CO₂ Calculated',
    '100K+ Analyses',
    '50K Trees Planted',
    '10K+ Happy Users',
  ]

  return (
    <section className="bg-primary py-4 overflow-hidden">
      <div className="relative flex">
        {/* First set of stats */}
        <div className="animate-scroll-left flex shrink-0 items-center gap-8 pr-8">
          {[...stats, ...stats, ...stats].map((stat, i) => (
            <div key={i} className="flex items-center gap-8 shrink-0">
              <span className="text-primary-foreground font-medium whitespace-nowrap">
                {stat}
              </span>
              <span className="text-primary-foreground/60">•</span>
            </div>
          ))}
        </div>
        {/* Duplicate for seamless loop */}
        <div className="animate-scroll-left flex shrink-0 items-center gap-8 pr-8" aria-hidden>
          {[...stats, ...stats, ...stats].map((stat, i) => (
            <div key={i} className="flex items-center gap-8 shrink-0">
              <span className="text-primary-foreground font-medium whitespace-nowrap">
                {stat}
              </span>
              <span className="text-primary-foreground/60">•</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
