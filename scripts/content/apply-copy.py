#!/usr/bin/env python3
"""Apply a copy batch (content/*.json) to lib/i18n/dictionaries/{he,ar,en}.ts.

The dictionaries are TypeScript object literals with quoted strings, one key
per line (a few lines carry several keys, and some values sit on the line after
the key). This patches values in place by key path so formatting and comments
survive, and writes the `seo` section after `footer`.

Usage: apply-copy.py content/copy-2026-09-08.json
"""
import json, re, sys, pathlib

batch = json.load(open(sys.argv[1], encoding='utf-8'))
LOCALES = ('he', 'ar', 'en')

SINGLE = r"'((?:[^'\\]|\\.)*)'"
DOUBLE = r'"((?:[^"\\]|\\.)*)"'


def esc(value: str) -> str:
    return value.replace('\\', '\\\\').replace("'", "\\'")


def block_end(lines, start, indent):
    prefix = ' ' * indent
    for i in range(start + 1, len(lines)):
        if lines[i].startswith(prefix + '}') and not lines[i].startswith(prefix + ' '):
            return i
    raise ValueError(f'unclosed block at line {start + 1}')


def find_key(lines, lo, hi, indent, key):
    prefix = ' ' * indent
    own = re.compile(r'^' + re.escape(prefix) + re.escape(key) + r':')
    inline = re.compile(r'(?:^|,\s)' + re.escape(key) + r': ["\']')
    for i in range(lo, hi):
        if own.match(lines[i]):
            return i
        if lines[i].startswith(prefix) and not lines[i].startswith(prefix + ' ') and inline.search(lines[i]):
            return i
    return -1


def set_value(lines, path, value):
    parts = path.split('.')
    lo, hi, indent = 0, len(lines), 2
    for part in parts[:-1]:
        i = find_key(lines, lo, hi, indent, part)
        if i < 0:
            raise KeyError(path)
        lo, hi, indent = i + 1, block_end(lines, i, indent), indent + 2
    key = parts[-1]
    i = find_key(lines, lo, hi, indent, key)
    if i < 0:
        raise KeyError(path)
    for literal in (SINGLE, DOUBLE):
        m = re.search(r'(?<![A-Za-z0-9_])' + re.escape(key) + r': ' + literal, lines[i])
        if m:
            lines[i] = lines[i][:m.start(0)] + key + ": '" + esc(value) + "'" + lines[i][m.end(0):]
            return
    nxt = lines[i + 1]
    for literal in (SINGLE, DOUBLE):
        m = re.match(r'^(\s*)' + literal + r'(,?)$', nxt)
        if m:
            lines[i + 1] = f"{m.group(1)}'{esc(value)}'{m.group(3)}"
            return
    raise ValueError(f'unrecognised value shape for {path}: {lines[i]!r} / {nxt!r}')


def write_seo(lines, seo, locale):
    existing = [k for k, l in enumerate(lines) if l.startswith('  seo: {')]
    if existing:
        i = existing[0]
        del lines[i:block_end(lines, i, 2) + 1]
    i = next(k for k, l in enumerate(lines) if l.startswith('  footer: {'))
    j = block_end(lines, i, 2)
    block = ['  seo: {'] + [f"    {k}: '{esc(v[locale])}'," for k, v in seo.items() if not k.startswith('_')] + ['  },']
    lines[j + 1:j + 1] = block


def emit_section(name, node, locale, indent=2):
    """Render a nested section as TS object-literal lines. A leaf is a {he, ar, en} dict."""
    pad = ' ' * indent
    out = [f'{pad}{name}: {{']
    for key, value in node.items():
        if key.startswith('_'):
            continue
        if isinstance(value, dict) and set(value.keys()) >= set(LOCALES):
            out.append(f"{pad}  {key}: '{esc(value[locale])}',")
        else:
            out.extend(emit_section(key, value, locale, indent + 2))
    out.append(f'{pad}}},')
    return out


def write_section(lines, name, node, locale):
    existing = [k for k, l in enumerate(lines) if l.startswith(f'  {name}: {{')]
    if existing:
        i = existing[0]
        del lines[i:block_end(lines, i, 2) + 1]
    i = next(k for k, l in enumerate(lines) if l.startswith('  footer: {'))
    j = block_end(lines, i, 2)
    lines[j + 1:j + 1] = emit_section(name, node, locale)


for locale in LOCALES:
    path = pathlib.Path(f'lib/i18n/dictionaries/{locale}.ts')
    lines = path.read_text(encoding='utf-8').split('\n')
    for key_path, values in batch.get('strings', {}).items():
        set_value(lines, key_path, values[locale])
    if 'seo' in batch:
        write_seo(lines, batch['seo'], locale)
    for name, node in batch.get('sections', {}).items():
        write_section(lines, name, node, locale)
    path.write_text('\n'.join(lines), encoding='utf-8')
    print(f"{locale}.ts: {len(batch.get('strings', {}))} strings set; sections: {', '.join(list(batch.get('sections', {}).keys()) + (['seo'] if 'seo' in batch else []))}")
