# تحويل الـ repeaters لمجموعات مرقّمة — ACF المجانية

> المرجع اللي بتشاور عليه رسايل الخطأ في `validate-content.mjs` و `alifleet-import.php`.
> للاستخدام اليومي (تحرير المحتوى، إضافة عنصر) اقرأ **القسم 8** في `WORDPRESS-SETUP.md`.

> 📖 **الملف ده مرجع للفهم — مفيش فيه خطوة تنفيذ واحدة.**
> التحويل **اتعمل خلاص** في `wordpress/acf/alifleet-acf-schema.json`. لو انت agent: اقرأه لو محتاج تفهم رسالة خطأ من المدقّق أو سكربت الاستيراد، و**ممنوع** تعدّل الـ schema أو الـ seed بناءً عليه. لقيت غلط؟ بلّغ وقف. خطتك في `AGENT.md`.

---

## 1) السبب

حقل `repeater` في ACF **مدفوع** (PRO). ومعاه في نفس القايمة: `flexible_content` و `clone` و `gallery`. الـ schema كانت فيها **١٤ repeater**، يعني المشروع كان مربوط بترخيص PRO عشان الشرائح والمواصفات والجاليري تشتغل.

اللي بيحصل لو استوردت schema فيها repeater على ACF مجانية: الاستيراد بينجح **في سكوت**، الحقل بيتسجّل بنوع مش معروف، ولوحة التحكم مش بتعرض له خانات، والـ GraphQL بيرجع فاضي. مفيش رسالة خطأ في أي مرحلة — وده بالظبط اللي خلّى التحويل ده لازم.

---

## 2) القاعدة

كل repeater بقى **عدد ثابت من المجموعات المرقّمة**، الترقيم **من ١**:

```
قبل:   hero_slides (repeater)
         └── slide_image, slide_label_ar, slide_label_en, …

بعد:   hero_slide_1 (group) ── نفس الحقول الفرعية بالحرف
       hero_slide_2 (group)
       hero_slide_3 (group)
       hero_slide_4 (group)
       hero_slide_5 (group)
```

- **الاسم:** مفرد + `_N` (`hero_slides` → `hero_slide_N`، `highlights` → `highlight_N`)
- **العنوان في اللوحة:** `Hero Slide 1` … `Hero Slide 5`
- **الحقول الفرعية:** زي ما هي، بمفاتيح `field_*` جديدة فريدة لكل خانة
- **السقف:** عدد الخانات = أكبر عدد عناصر في الداتا، مع خانات زيادة في القوائم اللي بتكبر (الجاليري ٨، المميزات ٨، المواصفات ٨، الموديلات المتوافقة ١٠)

### المفتاح في قاعدة البيانات

```
قبل:   hero_section_hero_slides_0_slide_label_en   + عدّاد hero_section_hero_slides = 5
بعد:   hero_section_hero_slide_1_slide_label_en    (مفيش عدّاد خالص)
```

**العدّاد اختفى** — ده كان أخطر بند في الاستيراد اليدوي (عمود ناقص = صفر صفوف على الموقع والداتا موجودة في الجدول).

---

## 3) الملفات اللي اتغيّرت

| الملف | التغيير |
|---|---|
| `wordpress/acf/alifleet-acf-schema.json` | ١٤ repeater → ١٧ عائلة مجموعات مرقّمة / ٩٠ خانة. صفر `repeater` / `flexible_content` / `clone` / `gallery` |
| `wordpress/scripts/seed-data.json` | كل مصفوفة صفوف بقت مفاتيح مرقّمة. الخانة غير المستخدمة `{}` |
| `wordpress/import/*.csv` | أعمدة `..._0_...` بقت `..._1_...`، وأعمدة العدّاد اتشالت |
| `wordpress/scripts/validate-content.mjs` | بيرفض أنواع PRO، وبيمسك الداتا اللي بتتعدّى السقف |
| `wordpress/scripts/alifleet-import.php` | بيحذّر ويتخطّى أي قيمة لسه مصفوفة صفوف بدل ما يكتبها كـ meta ميّت |

---

## 4) المقايضات

| | repeater (PRO) | مجموعات مرقّمة (مجاني) |
|---|---|---|
| العدد | مفتوح | سقف ثابت في الـ schema |
| زيادة عنصر فوق السقف | `+ Add Row` | تعديل الـ schema + `wp acf import` |
| إعادة الترتيب | سحب بالماوس | نقل القيم بين الخانات بإيدك |
| الخانة الفاضية | مش موجودة | موجودة في اللوحة وفاضية، والفرونت بيتجاهلها |
| حجم فورم اللوحة | بيكبر مع الداتا | ثابت — عشان كده `max_input_vars = 5000` لازم |

---

## 5) إضافة خانة جديدة

1. في `wordpress/acf/alifleet-acf-schema.json`، انسخ آخر مجموعة في العائلة (`hero_slide_5`)
2. غيّر `name` و `label` للرقم الجديد، و**كل** مفتاح `field_*` جوّاها لمفتاح فريد
3. `node wordpress/scripts/validate-content.mjs` — لازم `All checks passed`
4. على السيرفر: `wp acf import --json-file=...` وبعدها أعد سكربت الاستيراد

المدقّق بيقولك السقف الحالي كام لو الداتا تعدّته:

```
has only 8 fixed slots (gallery_image_1 … gallery_image_8)
```

---

## 6) اللي لسه محتاج ACF PRO

حاجة واحدة، ومش حقل: **`acf_add_options_page`** لشاشة **Site Settings** في `wordpress/mu-plugin/alifleet-cms.php`. على المجانية الـ mu-plugin بيتخطاها بهدوء، فالمجموعة مش بيبان لها مكان في اللوحة — لكن القيم بتتكتب وتتقرأ من `wp_options` عادي والفرونت شغّال. التفاصيل والاختيارين في **القسم 3.2** في `WORDPRESS-SETUP.md`.
