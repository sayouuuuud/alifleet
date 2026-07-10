import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Instrument_Serif } from 'next/font/google'
import './globals.css'

const _inter = Inter({ subsets: ['latin'] })
const _instrumentSerif = Instrument_Serif({ subsets: ['latin'], weight: '400' })

export const metadata: Metadata = {
  title: 'ALI FLEET — Luxurious Commercial Vehicles, Import & Spare Parts',
  description:
    'ALI FLEET delivers luxurious commercial vehicles — new and used — global importing of trucks and luxury vehicles, and genuine spare parts services worldwide.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#fafafa',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
