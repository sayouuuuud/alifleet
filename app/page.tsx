import { SiteHeader } from '@/components/site-header'
import { Hero } from '@/components/hero'
import { StatsStrip } from '@/components/stats-strip'
import { GlobalReach } from '@/components/global-reach'
import { MarqueeStrip } from '@/components/marquee-strip'
import { FleetShowcase } from '@/components/fleet-showcase'
import { Services } from '@/components/services'
import { CtaSection } from '@/components/cta-section'
import { SiteFooter } from '@/components/site-footer'
import { fetchPageImages } from '@/lib/wp/page-images'

export default async function Page() {
  const images = await fetchPageImages()

  return (
    <>
      <SiteHeader />
      <main>
        <Hero wpImages={images} />
        <StatsStrip />
        <FleetShowcase wpImages={images} />
        <MarqueeStrip />
        <GlobalReach />
        <Services wpImages={images} />
        <CtaSection />
      </main>
      <SiteFooter />
    </>
  )
}
