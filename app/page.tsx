import { SiteHeader } from '@/components/site-header'
import { Hero } from '@/components/hero'
import { StatsStrip } from '@/components/stats-strip'
import { GlobalReach } from '@/components/global-reach'
import { MarqueeStrip } from '@/components/marquee-strip'
import { FleetShowcase } from '@/components/fleet-showcase'
import { Services } from '@/components/services'
import { CtaSection } from '@/components/cta-section'
import { SiteFooter } from '@/components/site-footer'
import { ChatbotWidget } from '@/components/chatbot-widget'

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <StatsStrip />
        <FleetShowcase />
        <MarqueeStrip />
        <GlobalReach />
        <Services />
        <CtaSection />
      </main>
      <SiteFooter />
      <ChatbotWidget />
    </>
  )
}
