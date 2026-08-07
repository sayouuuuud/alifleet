// Throwaway stand-in for the real WPGraphQL + WooGraphQL endpoint, used only to
// verify the catalog mapping against Hebrew product data. Not part of the app.
import { createServer } from 'node:http'

const hebrew = [
  ['מצמד קומפלט לאיווקו דיילי', 'IVE-CL-4912', '3180.00', 'clutch'],
  ['רפידות בלם קדמיות מרצדס ספרינטר', 'MB-BP-9071', '640.50', 'brakes'],
  ['מסנן שמן מנוע פורד טרנזיט', 'FRD-OF-2203', '89.90', 'filters'],
  ['משאבת מים לרנו מאסטר', 'RNL-WP-5514', '', 'cooling'],
  ['אלטרנטור 24 וולט וולוו', 'VLV-ALT-7788', '2450.00', 'electrical'],
  ['בולם זעזועים אחורי מאן', 'MAN-SA-3310', '1120.00', 'suspension'],
  ['ערכת תזמון קומפלט', 'GEN-TK-0091', '780.00', ''],
]

const nodes = hebrew.map(([name, sku, price, cat], i) => ({
  id: `cG9zdDoxMj${i}`,
  databaseId: 7100 + i * 13,
  name,
  slug: sku.toLowerCase(),
  sku,
  // WooGraphQL's RAW format returns a bare decimal string; the app aliases it
  // to rawPrice, so the mock must answer with that key.
  rawPrice: price || null,
  stockStatus: i === 3 ? 'OUT_OF_STOCK' : 'IN_STOCK',
  shortDescription: '<p>חלק מקורי באיכות גבוהה, מתאים לדגמים שונים.</p>',
  description: null,
  featured: i < 2,
  image: { sourceUrl: `https://picsum.photos/seed/p${i}/800/800`, altText: '' },
  productCategories: { nodes: cat ? [{ name: cat, slug: cat }] : [] },
  productTags: { nodes: [] },
  spareParts: null,
}))

createServer((req, res) => {
  let body = ''
  req.on('data', (c) => (body += c))
  req.on('end', () => {
    const { query } = JSON.parse(body || '{}')
    let data
    if (query.includes('storeSettings')) {
      data = {
        storeSettings: {
          phone: '+972 4 123 4567',
          whatsapp: '972501234567',
          email: 'sales@alifleet.com',
          addressLines: ['רחוב התעשייה 12', 'אזור תעשייה', 'חיפה 3508409'],
          hours: 'א׳–ה׳ 08:00–17:00',
          instagram: '',
          facebook: '',
          linkedin: '',
          currencyCode: 'ILS',
          currencySymbol: '₪',
          storeUrl: 'http://localhost:8098',
          cartPath: '/cart/',
        },
      }
    } else {
      data = {
        products: { pageInfo: { hasNextPage: false, endCursor: null }, nodes },
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ data }))
  })
}).listen(8098, () => console.log('mock wpgraphql on 8099'))
