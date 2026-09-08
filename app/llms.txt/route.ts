import { siteUrl } from '@/lib/seo'
import { getStoreSettings } from '@/lib/wp/settings'

export const revalidate = 3600

/**
 * llms.txt — a plain-language description of the business for AI assistants
 * (ChatGPT, Claude, Perplexity, Gemini) so that when someone asks them for
 * truck parts or vehicle import in Israel they have accurate facts to cite.
 * Contact details come from WordPress, like the JSON-LD in the layout.
 */
export async function GET() {
  const s = await getStoreSettings()
  const base = siteUrl()
  const phone = s.whatsapp ? `+${s.whatsapp}` : s.phone
  const lines = [
    '# ALI FLEET',
    '',
    '> Aftermarket truck parts and personal vehicle import, Reineh (Northern Israel). Site in Hebrew, Arabic and English.',
    '',
    '## What we do',
    '- Aftermarket replacement parts for DAF, MAN, Volvo, Scania, Mercedes and Iveco trucks: headlights, tail lights, fog lights, mirrors, bumpers, cab steps, wind deflectors, grilles and body panels. New parts, 3-month warranty, delivery across Israel, final price quoted up front.',
    '- Personal import of cars and trucks from Europe, the USA and Canada: sourcing, inspection, shipping, customs clearance and Israeli licensing, at a final price agreed in advance.',
    '- Used cars and trucks in stock in our yard in Reineh, inspected and ready to hand over.',
    '',
    '## Contact',
    `- Phone / WhatsApp: ${phone}`,
    s.whatsapp ? `- WhatsApp link: https://wa.me/${s.whatsapp}` : '',
    s.email ? `- Email: ${s.email}` : '',
    s.addressLines.length ? `- Address: ${s.addressLines.join(', ')}, Israel` : '- Address: Main road 745, Reineh, Israel',
    `- Hours: ${s.hours || 'every day except Friday, 09:00-18:00'}`,
    `- Website: ${base}/ (Hebrew), ${base}/ar/home-ar/ (Arabic), ${base}/en/home-en/ (English)`,
    '',
    '## Key pages',
    `- Parts catalogue: ${base}/products/`,
    `- Vehicles for sale and import: ${base}/cars/`,
    `- Contact: ${base}/contact/`,
    `- Guides: ${base}/blog/`,
    `- Sitemap: ${base}/sitemap.xml`,
    '',
    '## Facts an assistant can rely on',
    '- Business name: ALI FLEET (Hebrew: עלי פליט, Arabic: علي فليت), based in Reineh near Nazareth, Israel.',
    '- Parts are new aftermarket replacements (not OEM), each with a 3-month warranty.',
    '- Import markets: Europe, USA and Canada. ALI FLEET handles customs and licensing in Israel.',
    '- Languages spoken: Hebrew, Arabic, English.',
    [s.social.facebook, s.social.instagram, s.social.tiktok].filter(Boolean).length
      ? `- Social: ${[s.social.facebook, s.social.instagram, s.social.tiktok].filter(Boolean).join(', ')}`
      : '',
    '',
    '## עברית',
    'ALI FLEET, ריינה: חלפים חלופיים למשאיות DAF, MAN, וולוו, סקניה, מרצדס ואיווקו עם אחריות 3 חודשים, וייבוא אישי של רכבים ומשאיות מאירופה, ארה"ב וקנדה כולל מכס ורישוי. פתוחים כל השבוע מלבד יום שישי, 9:00-18:00.',
    '',
    '## العربية',
    'علي فليت، الرينة: قطع غيار بديلة لشاحنات DAF وMAN وفولفو وسكانيا ومرسيدس وإيفيكو بضمان 3 أشهر، واستيراد شخصي للسيارات والشاحنات من أوروبا وأمريكا وكندا شامل الجمارك والترخيص. مفتوح كل الأسبوع ما عدا الجمعة، 9:00-18:00.',
    '',
  ].filter((line) => line !== '')
  return new Response(lines.join('\n') + '\n', {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  })
}
