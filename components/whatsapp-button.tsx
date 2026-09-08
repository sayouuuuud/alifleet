'use client'

import { useLanguage } from '@/lib/i18n/language-context'
import { useStore } from '@/lib/store-context'

/**
 * Floating WhatsApp button, visible on every page. Most enquiries arrive on
 * WhatsApp (a part number, a photo, a model), so the fastest path to an order
 * is one tap away at all times. The number comes from WordPress; the button
 * disappears when none is set. Sits on the start side so it never overlaps
 * the back-to-top control on the end side.
 */
export function WhatsAppButton() {
  const { t } = useLanguage()
  const store = useStore()
  if (!store.whatsapp) return null

  return (
    <a
      href={`https://wa.me/${store.whatsapp}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t.common.whatsapp}
      title={t.common.whatsapp}
      className="fixed bottom-6 start-6 z-50 flex size-13 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <svg viewBox="0 0 32 32" aria-hidden="true" className="size-7 fill-current">
        <path d="M16 3C8.8 3 3 8.8 3 16c0 2.3.6 4.5 1.8 6.5L3 29l6.7-1.8C11.6 28.4 13.8 29 16 29c7.2 0 13-5.8 13-13S23.2 3 16 3zm0 23.6c-2 0-3.9-.5-5.6-1.5l-.4-.2-4 1.1 1.1-3.9-.3-.4A10.5 10.5 0 0 1 5.4 16C5.4 10.2 10.2 5.4 16 5.4S26.6 10.2 26.6 16 21.8 26.6 16 26.6zm5.8-7.9c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2s-.8 1-1 1.2c-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.5-1.6-.9-.8-1.6-1.9-1.8-2.2-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.8s1.2 3.3 1.4 3.5c.2.2 2.4 3.7 5.9 5.2.8.4 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 2.1-.9 2.4-1.7.3-.8.3-1.5.2-1.7-.1-.1-.3-.2-.6-.4z" />
      </svg>
    </a>
  )
}
