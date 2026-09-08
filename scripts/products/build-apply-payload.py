#!/usr/bin/env python3
"""Turn the owner's corrected review sheet into the payload apply-products.php consumes.

Inputs
  review.csv       the sheet from build-review-sheet.py after the owner filled `model`
                   (and possibly corrected brand / side / names)
  part-types.json  wording per part type, brand and side in he / ar / en
  backup.json      the full WordPress export (only used for SKU / status sanity)

Output: JSON  { "generated_at": ..., "products": [ { id, post_title, short_he, desc_he,
  acf: { name_he, name_ar, name_en, description_he, description_ar, description_en,
         part_category, brand, sku }, specs: [ {label_he,label_ar,label_en,value_he,value_ar,value_en} ],
  compat: [ "DAF XF" ] } ] }

Rules
- A row whose `new_name_he` the owner emptied is skipped (nothing is written for it).
- If the owner typed their own name in a `new_name_*` cell it is used verbatim; otherwise the
  name is rebuilt from type + brand + model + side so that the three languages stay aligned.
- No technical specification is invented: the spec block only carries facts we hold
  (brand, model, side, part type, condition, warranty).

Usage: build-apply-payload.py review.csv part-types.json backup.json out.json
"""
import csv, json, re, sys, datetime, pathlib

review, types_path, backup, out_path = sys.argv[1:5]
images_dir = pathlib.Path(sys.argv[5]) if len(sys.argv) > 5 else None
T = json.load(open(types_path, encoding='utf-8'))
TYPES, BRANDS, SIDES, QUAL = T['types'], T['brands'], T['sides'], T['qualifiers']
by_id = {p['id']: p for p in json.load(open(backup, encoding='utf-8'))['products']}
rows = list(csv.DictReader(open(review, encoding='utf-8-sig')))

def clean(s): return re.sub(r'\s+', ' ', (s or '').strip())

def join(parts): return ' '.join(x for x in parts if x)

def names(tid, q, brand, model, side):
    ty = TYPES[tid]; qd = QUAL.get(q) if q else None
    b = BRANDS.get(brand, {'he': brand, 'ar': brand, 'en': brand}) if brand else {'he': '', 'ar': '', 'en': ''}
    he = join([ty['he'], qd['he'] if qd else '', b['he'], model, SIDES[side]['he'] if side else ''])
    ar = join([ty['ar'], qd['ar'] if qd else '', b['ar'], localize_model(model, 'ar'), SIDES[side]['ar'] if side else ''])
    en_core = join([b['en'], localize_model(model, 'en'), ty['en'], qd['en'] if qd else ''])
    en = f"{en_core} – {SIDES[side]['en']}" if side else en_core
    return he, ar, en

MODEL_WORDS = {'ar': [('טון', 'طن'), ('יורו', 'يورو')], 'en': [('טון', 'ton'), ('יורו', 'Euro')], 'he': []}

def localize_model(model, lang):
    """Model labels are written Hebrew-market style ("12-15 טון יורו 6"); codes stay Latin."""
    out = model
    for src, dst in MODEL_WORDS[lang]:
        out = out.replace(src, dst)
    return out

BRAND_ALIASES = {
    'Daf': ['DAF', 'daf', 'דאף', 'داف'], 'Man': ['MAN', 'man', 'מאן', 'مان'], 'Volvo': ['Volvo', 'volvo', 'וולוו', 'فولفو'],
    'Scania': ['Scania', 'scania', 'סקניה', 'סקאניה', 'سكانيا'], 'Mercedes': ['Mercedes', 'mercedes', 'מרצדס', 'مرسيدس'], 'Iveco': ['Iveco', 'iveco', 'איווקו', 'إيفيكو', 'ايفيكو'],
}

def search_terms(tid, brand, model, side):
    """Hidden words the search may match: type synonyms in three languages, brand aliases, model tokens, side."""
    ty = TYPES[tid]; words = []
    for lang in ('he', 'ar', 'en'):
        words += ty.get('synonyms', {}).get(lang, [])
    words += BRAND_ALIASES.get(brand, [brand] if brand else [])
    if model:
        words += [model, localize_model(model, 'ar'), localize_model(model, 'en')]
    if side:
        words += [SIDES[side][l] for l in ('he', 'ar', 'en')]
    seen, out = set(), []
    for w in words:
        w = w.strip()
        if w and w.lower() not in seen:
            seen.add(w.lower()); out.append(w)
    return ', '.join(out)

def vehicle(brand, model, lang):
    b = BRANDS.get(brand, {}).get(lang, brand) if brand else ''
    return join([b, localize_model(model, lang) if model else ''])

SIDE_SENTENCE = {
    'he': {'R': 'מתאים לצד ימין של הרכב. ', 'L': 'מתאים לצד שמאל של הרכב. '},
    'ar': {'R': 'مخصصة للجهة اليمنى من المركبة. ', 'L': 'مخصصة للجهة اليسرى من المركبة. '},
    'en': {'R': 'Fits the right-hand side of the vehicle. ', 'L': 'Fits the left-hand side of the vehicle. '},
}

def aka_line(tid, lang):
    """'Also known as' with the 3 most common synonyms — what people actually search."""
    syn = TYPES[tid].get('synonyms', {}).get(lang, [])[:3]
    if not syn: return ''
    return {'he': 'נקרא גם: ', 'ar': 'يُعرف أيضاً باسم: ', 'en': 'Also known as: '}[lang] + ', '.join(syn) + '. '

def fits_line(compat, lang):
    if not compat: return ''
    return {'he': 'מתאים ל: ', 'ar': 'يناسب: ', 'en': 'Fits: '}[lang] + ', '.join(compat) + '. '

def descriptions(name, brand, model, side, sku, tid=None, compat=None):
    v_he, v_ar, v_en = vehicle(brand, model, 'he'), vehicle(brand, model, 'ar'), vehicle(brand, model, 'en')
    s_he, s_ar, s_en = (SIDE_SENTENCE[l].get(side, '') for l in ('he', 'ar', 'en'))
    aka = {l: aka_line(tid, l) if tid else '' for l in ('he', 'ar', 'en')}; fits = {l: fits_line(compat or [], l) for l in ('he', 'ar', 'en')}
    he = (f"{name['he']} – חלק חילוף חדש (תחליפי, לא מקורי){' ל' + v_he if v_he else ''}. {fits['he']}{s_he}{aka['he']}"
          f"מק\"ט: {sku}. מיועד להחלפה ישירה של החלק המקורי; לפני ההזמנה מומלץ לאמת התאמה לפי שנת הייצור ומספר השלדה, "
          f"ונשמח לבדוק עבורכם בוואטסאפ. אחריות 3 חודשים, אספקה לכל הארץ ואפשרות איסוף מהמחסן בריינה. "
          f"ALI FLEET מייבאת חלפים למשאיות מאירופה, ארה\"ב וקנדה עם מלאי זמין ומשלוח מהיר.")
    ar = (f"{name['ar']} – قطعة غيار جديدة (بديلة، غير أصلية){' لشاحنات ' + v_ar if v_ar else ''}. {fits['ar']}{s_ar}{aka['ar']}"
          f"رقم القطعة: {sku}. تُركَّب مكان القطعة الأصلية مباشرة؛ ننصح بالتأكد من التوافق حسب سنة الصنع ورقم الشاصي قبل الطلب، "
          f"ويسعدنا التحقق لك عبر واتساب. ضمان 3 أشهر، توصيل لكل أنحاء البلاد، وإمكانية الاستلام من مخزننا في الرينة. "
          f"علي فليت تستورد قطع غيار الشاحنات من أوروبا وأمريكا وكندا بمخزون متوفر وشحن سريع.")
    en = (f"{name['en']} – new aftermarket replacement part{' for ' + v_en + ' trucks' if v_en else ''}. {fits['en']}{s_en}{aka['en']}"
          f"Part number: {sku}. Direct replacement for the original part; please confirm fitment by production year and VIN "
          f"before ordering and we will gladly check it for you on WhatsApp. 3-month warranty, delivery across Israel, "
          f"and pickup from our warehouse in Reineh. ALI FLEET imports truck parts from Europe, the USA and Canada with stock on hand and fast shipping.")
    short_he = f"{name['he']} חדש, תחליפי, עם אחריות 3 חודשים ואספקה לכל הארץ. מק\"ט {sku}."
    return he, ar, en, short_he

def specs(tid, brand, model, side):
    ty = TYPES[tid]; cat = ty['cat']
    b = BRANDS.get(brand, {'he': brand, 'ar': brand, 'en': brand})
    out = []
    def row(lhe, lar, len_, vhe, var_, ven): out.append({'label_he': lhe, 'label_ar': lar, 'label_en': len_, 'value_he': vhe, 'value_ar': var_, 'value_en': ven})
    if brand: row('יצרן הרכב', 'ماركة الشاحنة', 'Vehicle make', b['he'], b['ar'], b['en'])
    if model: row('דגם', 'الطراز', 'Model', model, localize_model(model, 'ar'), localize_model(model, 'en'))
    if side: row('צד', 'الجهة', 'Side', SIDES[side]['he'], SIDES[side]['ar'], SIDES[side]['en'])
    row('סוג החלק', 'نوع القطعة', 'Part type', ty['he'], ty['ar'], ty['en'])
    row('מצב', 'الحالة', 'Condition', 'חדש, תחליפי (לא מקורי)', 'جديدة، بديلة (غير أصلية)', 'New, aftermarket')
    row('אחריות', 'الضمان', 'Warranty', '3 חודשים', '3 أشهر', '3 months')
    return out[:8]

payload, skipped, problems = [], [], []
for r in rows:
    pid = int(r['id']); p = by_id.get(pid)
    if not p or p['status'] == 'trash': skipped.append((pid, 'not in export / trashed')); continue
    tid = clean(r['part_type']); brand = clean(r['brand']); model = clean(r['model']); side = clean(r['side']).upper()[:1]
    if not clean(r['new_name_he']) and not tid: skipped.append((pid, 'owner emptied the name and no type')); continue
    if tid not in TYPES: problems.append((pid, f'unknown part_type {tid!r}')); continue
    if side and side not in SIDES: problems.append((pid, f'bad side {side!r}')); continue
    q = None
    for title, entry in T['titles'].items():
        if clean(title) == clean(p['title']): q = entry.get('q'); break
    he, ar, en = names(tid, q, brand, model, side)
    # Owner's own wording wins when it differs from what the sheet proposed.
    proposed_he, proposed_ar, proposed_en = names(tid, q, brand, '', side)
    if clean(r['new_name_he']) and clean(r['new_name_he']) != proposed_he: he = clean(r['new_name_he'])
    if clean(r['new_name_ar']) and clean(r['new_name_ar']) != proposed_ar: ar = clean(r['new_name_ar'])
    if clean(r['new_name_en']) and clean(r['new_name_en']) != proposed_en: en = clean(r['new_name_en'])
    name = {'he': he, 'ar': ar, 'en': en}
    sku = p['sku'] or r['sku']
    cat = clean(r['part_category']) or TYPES[tid]['cat']
    compat = [c.strip() for c in (r.get('compat_models') or '').split('|') if c.strip()] or ([vehicle(brand, model, 'en')] if (model and brand) else [])
    d_he, d_ar, d_en, short_he = descriptions(name, brand, model, side, sku, tid, compat)
    images = sorted(f.name for f in images_dir.glob(f"{sku}_*.webp")) if images_dir else []
    images.sort(key=lambda n: int(re.search(r'_(\d+)\.webp$', n).group(1)))
    payload.append({
        'id': pid, 'sku': sku, 'post_title': he, 'short_he': short_he, 'desc_he': d_he,
        'acf': {'name_he': he, 'name_ar': ar, 'name_en': en, 'description_he': d_he, 'description_ar': d_ar, 'description_en': d_en,
                'part_category': cat, 'brand': brand, 'sku': sku,
                'search_terms': search_terms(tid, brand, model, side), 'oe_number': (r.get('oe_number') or '').strip()},
        'specs': specs(tid, brand, model, side),
        'compat': compat[:10],
        'images': images,
    })

json.dump({'generated_at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'count': len(payload), 'products': payload},
          open(out_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f"payload: {len(payload)} products -> {out_path}")
print(f"with model: {sum(1 for x in payload if x['compat'])} | without model: {sum(1 for x in payload if not x['compat'])} | with OE: {sum(1 for x in payload if x['acf']['oe_number'])} | with images: {sum(1 for x in payload if x['images'])} ({sum(len(x['images']) for x in payload)} files)")
if skipped: print("skipped:", skipped)
if problems: print("PROBLEMS (fix the sheet):", problems); sys.exit(1)
