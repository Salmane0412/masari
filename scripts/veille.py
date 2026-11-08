#!/usr/bin/env python3
"""Génère veille/latest.json à partir des flux RSS/Atom de veille/feeds.json (bibliothèque standard seulement)."""
import json, re, sys, urllib.request, xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime

cfg = json.load(open('veille/feeds.json'))
now = datetime.now(timezone.utc); since = now - timedelta(days=cfg.get('days', 8))
NS = {'a': 'http://www.w3.org/2005/Atom'}
strip = lambda s: re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', s or '')).strip()

def when(s):
    if not s: return None
    try: d = parsedate_to_datetime(s)
    except Exception:
        try: d = datetime.fromisoformat(s.replace('Z', '+00:00'))
        except Exception: return None
    return d if d.tzinfo else d.replace(tzinfo=timezone.utc)

def parse(xml):
    root = ET.fromstring(xml); out = []
    for it in root.iter('item'):
        out.append((strip(it.findtext('title')), (it.findtext('link') or '').strip(), when(it.findtext('pubDate') or it.findtext('{http://purl.org/dc/elements/1.1/}date')), strip(it.findtext('description'))[:240]))
    for e in root.findall('a:entry', NS):
        l = e.find('a:link', NS); out.append((strip(e.findtext('a:title', '', NS)), l.get('href') if l is not None else '', when(e.findtext('a:published', None, NS) or e.findtext('a:updated', None, NS)), strip(e.findtext('a:summary', '', NS))[:240]))
    return out

items, errors = [], []
for f in cfg['feeds']:
    try:
        req = urllib.request.Request(f['url'], headers={'User-Agent': 'Mozilla/5.0 (Masari veille)'})
        for t, u, d, s in parse(urllib.request.urlopen(req, timeout=25).read()):
            if t and u and d and d >= since: items.append({'t': t, 'u': u, 'd': d.date().isoformat(), 's': s, 'src': f['name'], 'cat': f['cat']})
    except Exception as e: errors.append(f"{f['name']}: {type(e).__name__}")

kw = cfg.get('ai_keywords', [])
for i in items:
    if i['cat'] in ('actus', 'soc', 'alertes') and any(k in (' ' + i['t'].lower() + ' ') for k in kw): i['ia_secu'] = True
seen, uniq = set(), []
for i in sorted(items, key=lambda x: x['d'], reverse=True):
    if i['u'] in seen: continue
    seen.add(i['u']); uniq.append(i)
cats, cap = {}, cfg.get('max_per_cat', 12)
for i in uniq:
    c = cats.setdefault(i['cat'], [])
    if len(c) < cap: c.append(i)
secia = [i for i in uniq if i.get('ia_secu')][:cap]
json.dump({'generated': now.isoformat(timespec='minutes'), 'days': cfg.get('days', 8), 'cats': cats, 'ia_secu': secia, 'errors': errors}, open('veille/latest.json', 'w'), ensure_ascii=False, indent=1)
print('items', len(uniq), 'errors', errors)
