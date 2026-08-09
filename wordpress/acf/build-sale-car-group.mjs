/**
 * Generates the `group_sale_car_fields` ACF field group for the `cars` post
 * type (the "Cars For Sale" listings) and merges it into
 * alifleet-acf-schema.json.
 *
 * Why generated rather than hand-written: the group mirrors
 * group_import_car_fields so the frontend can reuse one mapper and one card
 * component for both sections. ACF free has no repeater, so the gallery and
 * highlights are eight numbered groups each — that is ~110 field definitions
 * which are far safer to generate than to copy by hand.
 *
 * Run:  node wordpress/acf/build-sale-car-group.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const schemaPath = join(here, 'alifleet-acf-schema.json')

const GROUP_KEY = 'group_sale_car_fields'
/** Keys are prefixed so they can never collide with the import group's keys. */
const k = (name) => `field_sale_${name}`

const text = (name, label, extra = {}) => ({
  key: k(name),
  label,
  name,
  type: 'text',
  instructions: '',
  required: 0,
  conditional_logic: 0,
  wrapper: { width: '', class: '', id: '' },
  default_value: '',
  placeholder: '',
  prepend: '',
  append: '',
  maxlength: '',
  show_in_graphql: 1,
  ...extra,
})

const textarea = (name, label, extra = {}) => ({
  key: k(name),
  label,
  name,
  type: 'textarea',
  instructions: '',
  required: 0,
  conditional_logic: 0,
  wrapper: { width: '', class: '', id: '' },
  default_value: '',
  placeholder: '',
  maxlength: '',
  rows: 4,
  new_lines: '',
  show_in_graphql: 1,
  ...extra,
})

const number = (name, label, extra = {}) => ({
  key: k(name),
  label,
  name,
  type: 'number',
  instructions: '',
  required: 0,
  conditional_logic: 0,
  wrapper: { width: '', class: '', id: '' },
  default_value: '',
  placeholder: '',
  prepend: '',
  append: '',
  min: '',
  max: '',
  step: '',
  show_in_graphql: 1,
  ...extra,
})

const select = (name, label, choices, defaultValue, extra = {}) => ({
  key: k(name),
  label,
  name,
  type: 'select',
  instructions: '',
  required: 0,
  conditional_logic: 0,
  wrapper: { width: '', class: '', id: '' },
  choices,
  default_value: defaultValue,
  return_format: 'value',
  multiple: 0,
  allow_null: 0,
  ui: 0,
  ajax: 0,
  placeholder: '',
  show_in_graphql: 1,
  ...extra,
})

const image = (name, label, extra = {}) => ({
  key: k(name),
  label,
  name,
  type: 'image',
  instructions: '',
  required: 0,
  conditional_logic: 0,
  wrapper: { width: '', class: '', id: '' },
  // `id` keeps the GraphQL type a MediaItem, which is what the frontend
  // selects (`image { node { sourceUrl altText } }`).
  return_format: 'id',
  preview_size: 'medium',
  library: 'all',
  min_width: '',
  min_height: '',
  min_size: '',
  max_width: '',
  max_height: '',
  max_size: '',
  mime_types: '',
  show_in_graphql: 1,
  ...extra,
})

const trueFalse = (name, label, extra = {}) => ({
  key: k(name),
  label,
  name,
  type: 'true_false',
  instructions: '',
  required: 0,
  conditional_logic: 0,
  wrapper: { width: '', class: '', id: '' },
  message: '',
  default_value: 0,
  ui: 1,
  ui_on_text: '',
  ui_off_text: '',
  show_in_graphql: 1,
  ...extra,
})

const group = (name, label, subFields, extra = {}) => ({
  key: k(name),
  label,
  name,
  type: 'group',
  instructions: '',
  required: 0,
  conditional_logic: 0,
  wrapper: { width: '', class: '', id: '' },
  layout: 'block',
  sub_fields: subFields,
  show_in_graphql: 1,
  ...extra,
})

/* ------------------------------------------------------------------ fields */

const fields = [
  text('car_model', 'Model name', {
    instructions:
      'Shown as the listing headline, e.g. "Mercedes-Benz Sprinter 316". Falls back to the post title when empty.',
  }),
  text('car_subtitle_ar', 'Subtitle (Arabic)'),
  text('car_subtitle_en', 'Subtitle (English)'),
  text('car_subtitle_he', 'Subtitle (Hebrew)'),

  select(
    'body_type',
    'Body type',
    {
      van: 'Van',
      suv: 'SUV',
      pickup: 'Pickup',
      luxury_mpv: 'Luxury MPV',
      truck: 'Truck',
      minivan: 'Minivan',
    },
    'van'
  ),

  // Replaces the import group's `origin`: a car already in the yard is
  // described by its condition, not by the country it was shipped from.
  select(
    'condition',
    'Condition',
    { new: 'New', used: 'Used', demo: 'Demo / showroom' },
    'used',
    {
      instructions:
        'Drives the badge on the card. "New" hides the mileage figure.',
    }
  ),

  select(
    'status',
    'Availability',
    { available: 'Available', reserved: 'Reserved', sold: 'Sold' },
    'available',
    { instructions: 'Sold listings stay published but are marked as sold.' }
  ),

  number('year', 'Year'),
  number('mileage', 'Mileage (km)'),
  number('price', 'Price', {
    instructions: 'Leave empty to show "price on request" instead of a figure.',
  }),
  number('previous_owners', 'Previous owners'),

  trueFalse('featured', 'Feature this listing', {
    instructions: 'Featured listings are pinned to the front of the grid.',
  }),

  image('featured_image', 'Main photo', {
    instructions: 'Used on the card and as the first gallery photo.',
  }),

  // ACF free has no repeater, so eight numbered groups it is.
  ...Array.from({ length: 8 }, (_, i) =>
    group(`gallery_image_${i + 1}`, `Gallery photo ${i + 1}`, [
      image('gallery_image', 'Photo', { key: k(`gallery_${i + 1}_image`), name: 'image' }),
      text('gallery_alt_ar', 'Alt text (Arabic)', {
        key: k(`gallery_${i + 1}_alt_ar`),
        name: 'alt_text_ar',
      }),
      text('gallery_alt_en', 'Alt text (English)', {
        key: k(`gallery_${i + 1}_alt_en`),
        name: 'alt_text_en',
      }),
      text('gallery_alt_he', 'Alt text (Hebrew)', {
        key: k(`gallery_${i + 1}_alt_he`),
        name: 'alt_text_he',
      }),
    ])
  ),

  textarea('description_ar', 'Description (Arabic)'),
  textarea('description_en', 'Description (English)'),
  textarea('description_he', 'Description (Hebrew)'),

  ...Array.from({ length: 8 }, (_, i) =>
    group(`highlight_${i + 1}`, `Highlight ${i + 1}`, [
      text('highlight_ar', 'Item (Arabic)', {
        key: k(`highlight_${i + 1}_ar`),
        name: 'item_ar',
      }),
      text('highlight_en', 'Item (English)', {
        key: k(`highlight_${i + 1}_en`),
        name: 'item_en',
      }),
      text('highlight_he', 'Item (Hebrew)', {
        key: k(`highlight_${i + 1}_he`),
        name: 'item_he',
      }),
    ])
  ),

  group('specs', 'Specifications', [
    text('specs_engine', 'Engine', { key: k('specs_engine'), name: 'engine' }),
    select(
      'specs_transmission',
      'Transmission',
      { auto: 'Automatic', manual: 'Manual' },
      'auto',
      { key: k('specs_transmission'), name: 'transmission' }
    ),
    select(
      'specs_fuel',
      'Fuel',
      { diesel: 'Diesel', petrol: 'Petrol', hybrid: 'Hybrid', electric: 'Electric' },
      'diesel',
      { key: k('specs_fuel'), name: 'fuel' }
    ),
    text('specs_drivetrain', 'Drivetrain', {
      key: k('specs_drivetrain'),
      name: 'drivetrain',
    }),
    text('specs_color_ar', 'Colour (Arabic)', { key: k('specs_color_ar'), name: 'color_ar' }),
    text('specs_color_en', 'Colour (English)', { key: k('specs_color_en'), name: 'color_en' }),
    text('specs_color_he', 'Colour (Hebrew)', { key: k('specs_color_he'), name: 'color_he' }),
    number('specs_seats', 'Seats', { key: k('specs_seats'), name: 'seats' }),
  ]),

  // Replaces the import group's `eta_*`: a car on the lot has a handover note
  // ("ready for immediate delivery"), not an arrival estimate.
  text('availability_ar', 'Availability note (Arabic)'),
  text('availability_en', 'Availability note (English)'),
  text('availability_he', 'Availability note (Hebrew)'),
]

const saleGroup = {
  key: GROUP_KEY,
  title: 'Cars For Sale CPT Fields',
  fields,
  location: [[{ param: 'post_type', operator: '==', value: 'cars' }]],
  menu_order: 0,
  position: 'normal',
  style: 'default',
  label_placement: 'top',
  instruction_placement: 'label',
  hide_on_screen: '',
  active: true,
  description:
    'Every field the Next.js frontend reads for the "Cars For Sale" section on /cars.',
  show_in_graphql: 1,
  graphql_field_name: 'saleCarFields',
}

/* ------------------------------------------------------------------ merge */

const schema = JSON.parse(readFileSync(schemaPath, 'utf8'))
const groups = Array.isArray(schema) ? schema : [schema]
const existing = groups.findIndex((g) => g.key === GROUP_KEY)

if (existing >= 0) {
  groups[existing] = saleGroup
} else {
  groups.push(saleGroup)
}

/*
 * The page carrying the import-section copy lives at the `cars` slug, so its
 * field group binds to exactly that one page. An earlier revision kept a second
 * `page_slug == import` rule alive during the rename; leaving it in place would
 * silently re-attach the whole group to any future page called "import", so the
 * location is normalised down to the single live rule.
 */
const carsPage = groups.find((g) => g.key === 'group_import_page')
if (carsPage) {
  carsPage.title = 'Cars Page Fields'
  carsPage.location = [
    [{ param: 'page_slug', operator: '==', value: 'cars' }],
  ]
}

writeFileSync(schemaPath, `${JSON.stringify(groups, null, 4)}\n`)

const count = (list) =>
  list.reduce((n, f) => n + 1 + (f.sub_fields ? count(f.sub_fields) : 0), 0)

console.log(
  `${existing >= 0 ? 'Replaced' : 'Added'} ${GROUP_KEY} (${count(fields)} field definitions). Schema now has ${groups.length} groups.`
)
