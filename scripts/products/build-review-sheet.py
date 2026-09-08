#!/usr/bin/env python3
"""Build the product-naming review sheet.

Reads the full WordPress export (backup JSON) and wordpress/import/part-types.json,
derives part type / side / brand for every product and writes a CSV the shop owner
can correct in Excel (UTF-8 with BOM). The `model` column is intentionally empty:
the truck model is not stored anywhere in WordPress and the SKU prefix is not a
reliable source, so the owner fills it. `model_guess_from_sku` is only a hint.

Usage: build-review-sheet.py <backup.json> <part-types.json> <out.csv>
"""
import csv, json, re, sys, collections

backup, types_path, out_path = sys.argv[1:4]
P = json.load(open(backup, encoding='utf-8'))['products']
T = json.load(open(types_path, encoding='utf-8'))
TYPES, TITLES, BRANDS, SIDES, QUAL = T['types'], T['titles'], T['brands'], T['sides'], T['qualifiers']
EN_FALLBACK = {k: v for k, v in T['en_fallback'].items() if not k.startswith('_')}

# SKU prefix -> model hint (owner said the SKU is NOT always right; this is a hint only)
SKU_HINT = {'LF': 'LF', 'CF': 'CF', 'XF': 'XF', 'DXF': 'XF', 'XG': 'XG', 'VH': 'FH', 'VM': 'FM', 'SR': 'R', 'RR': 'R',
            'MTG': 'TGX/TGS?', 'NMX': 'TGX?', 'BP': '?', 'IA': '?', 'INS': 'Stralis?', 'ISW': 'S-Way?'}

def norm(s): return re.sub(r'\s+', ' ', (s or '').strip())

def detect_type(p):
    title = norm(p['title'])
    if title in TITLES: return TITLES[title]['type'], TITLES[title].get('q'), 'title'
    en = p['name_en'] or ''
    for kw, tid in EN_FALLBACK.items():
        if kw.lower() in en.lower(): return tid, None, 'en-fallback'
    return None, None, 'UNMATCHED'

def detect_side(p):
    sku = p['sku'] or ''
    if sku and sku[-1] in 'RL': return sku[-1], 'sku'
    t = ' '.join([p['title'], p['name_en'], p['name_ar'], p['name_he']])
    if re.search(r'ימין|يمين|أيمن|\bRight\b', t): return 'R', 'text'
    if re.search(r'שמאל|يسار|أيسر|\bLeft\b', t): return 'L', 'text'
    return '', 'none'

def detect_brand(p):
    if p['brand'] in BRANDS: return p['brand'], 'acf'
    for c in p['cats']:
        if c in BRANDS: return c, 'category'
    return '', 'none'

def build_names(tid, q, side, brand, model=''):
    ty = TYPES[tid]; qd = QUAL.get(q) if q else None
    def join(parts): return ' '.join(x for x in parts if x)
    # Owner's search phrase is 'part + brand + model'; the side closes the name.
    he = join([ty['he'], qd['he'] if qd else '', BRANDS[brand]['he'] if brand else '', model, SIDES[side]['he'] if side else ''])
    ar = join([ty['ar'], qd['ar'] if qd else '', BRANDS[brand]['ar'] if brand else '', model, SIDES[side]['ar'] if side else ''])
    en_core = join([BRANDS[brand]['en'] if brand else '', model, ty['en'], qd['en'] if qd else ''])
    en = f"{en_core} – {SIDES[side]['en']}" if side else en_core
    return he, ar, en

# Broken drafts moved to the trash on 2026-09-08 (export predates that).
TRASHED_2026_09_08 = {1237, 2626}

rows, stats = [], collections.Counter()
for p in sorted(P, key=lambda x: (x['brand'] or 'zz', x['sku'] or '')):
    if p['status'] == 'trash' or p['id'] in TRASHED_2026_09_08: continue
    tid, q, tsrc = detect_type(p); side, ssrc = detect_side(p); brand, bsrc = detect_brand(p)
    stats[f'type:{tsrc}'] += 1; stats[f'side:{ssrc}'] += 1; stats[f'brand:{bsrc}'] += 1
    m = re.match(r'HTP-([A-Z]+)', p['sku'] or ''); hint = SKU_HINT.get(m.group(1), '?') if m else ''
    he = ar = en = ''
    if tid: he, ar, en = build_names(tid, q, side, brand)
    notes = []
    if tsrc == 'UNMATCHED': notes.append('نوع القطعة غير معروف')
    if tsrc == 'en-fallback': notes.append('العنوان العبري كان #N/A')
    if not brand: notes.append('الماركة ناقصة')
    if not side and tid and TYPES[tid]['cat'] in ('lighting',) and tid not in ('roof_light',): notes.append('الجهة غير معروفة')
    if not p['price']: notes.append('بدون سعر')
    if not p['image']: notes.append('بدون صورة')
    if p['stock'] == 'outofstock': notes.append('غير متوفر')
    rows.append({
        'id': p['id'], 'sku': p['sku'], 'brand': brand, 'model': '', 'model_guess_from_sku': hint,
        'side': side, 'part_type': tid or '', 'part_category': TYPES[tid]['cat'] if tid else '',
        'new_name_he': he, 'new_name_ar': ar, 'new_name_en': en,
        'current_title_he': p['title'], 'current_name_ar': p['name_ar'], 'current_name_en': p['name_en'],
        'price': p['price'], 'stock': p['stock'], 'notes': '؛ '.join(notes),
    })

with open(out_path, 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
print(f"rows: {len(rows)} -> {out_path}")
print("stats:", dict(stats))
print("unmatched titles:", sorted({norm(p['title']) for p in P if p['status'] != 'trash' and detect_type(p)[2] == 'UNMATCHED'}))
print("\nsample (he | ar | en):")
for r in rows[:5] + rows[80:83] + rows[-3:]: print(f"  {r['sku']:16s} {r['new_name_he']} | {r['new_name_ar']} | {r['new_name_en']}")
dup = collections.Counter(r['new_name_he'] for r in rows); print("\nHebrew names still shared by 2+ products (expected until the model is filled):", sum(1 for v in dup.values() if v > 1), "names")
