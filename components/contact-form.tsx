'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { MessageCircle, Send } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { siteConfig, whatsappLink } from '@/lib/site-config'

type SubjectKey = 'parts' | 'import' | 'fleet' | 'other'
const subjectKeys: SubjectKey[] = ['parts', 'import', 'fleet', 'other']

export function ContactForm() {
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const initialSubject = searchParams.get('subject')

  const [subject, setSubject] = useState<SubjectKey>(
    subjectKeys.includes(initialSubject as SubjectKey)
      ? (initialSubject as SubjectKey)
      : 'parts'
  )
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const composed = [
    `${t.contact.subject}: ${t.contact.subjects[subject]}`,
    `${t.contact.name}: ${name}`,
    `${t.contact.phone}: ${phone}`,
    email ? `${t.contact.emailPlaceholder}: ${email}` : '',
    '',
    message,
  ]
    .filter(Boolean)
    .join('\n')

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const href = `mailto:${siteConfig.email}?subject=${encodeURIComponent(
      `${siteConfig.name} — ${t.contact.subjects[subject]}`
    )}&body=${encodeURIComponent(composed)}`
    window.location.href = href
  }

  const fieldClass =
    'mt-2 w-full rounded-2xl bg-background px-4 py-3 text-sm text-foreground ring-1 ring-border outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-accent'
  const labelClass = 'block text-sm font-medium text-foreground'

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl bg-card p-6 ring-1 ring-border md:p-8"
    >
      <h2 className="font-serif text-2xl tracking-tight text-foreground">
        {t.contact.formTitle}
      </h2>

      <div className="mt-7 flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="contact-name" className={labelClass}>
              {t.contact.name} <span className="text-accent">*</span>
            </label>
            <input
              id="contact-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.contact.namePlaceholder}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="contact-phone" className={labelClass}>
              {t.contact.phone} <span className="text-accent">*</span>
            </label>
            <input
              id="contact-phone"
              required
              type="tel"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t.contact.phonePlaceholder}
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="contact-email" className={labelClass}>
            {t.common.email}
          </label>
          <input
            id="contact-email"
            type="email"
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.contact.emailPlaceholder}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="contact-subject" className={labelClass}>
            {t.contact.subject}
          </label>
          <select
            id="contact-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value as SubjectKey)}
            className={fieldClass}
          >
            {subjectKeys.map((key) => (
              <option key={key} value={key}>
                {t.contact.subjects[key]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="contact-message" className={labelClass}>
            {t.contact.message} <span className="text-accent">*</span>
          </label>
          <textarea
            id="contact-message"
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t.contact.messagePlaceholder}
            className={`${fieldClass} resize-y`}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            <Send className="size-4" aria-hidden="true" />
            {t.contact.send}
          </button>
          <a
            href={whatsappLink(composed)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            {t.contact.sendWhatsapp}
          </a>
        </div>
      </div>
    </form>
  )
}
