#!/usr/bin/env python3
"""
Auto-update index.html when a new Khayt release is published.
Usage: python3 update_version.py v1.3.0-beta.1
"""
import sys, re

if len(sys.argv) < 2:
    print("Usage: update_version.py <new-tag>  e.g. v1.3.0-beta.1")
    sys.exit(1)

new_tag = sys.argv[1]                   # e.g. "v1.3.0-beta.1"
new_ver = new_tag.lstrip('v')           # e.g.  "1.3.0-beta.1"

with open('index.html') as f:
    html = f.read()

# Detect current version from a download URL (most reliable anchor)
m = re.search(r'releases/download/v([\w.\-]+)/', html)
if not m:
    print('ERROR: could not detect current version in index.html')
    sys.exit(1)

old_ver = m.group(1)

if old_ver == new_ver:
    print(f'Already at {new_ver} — nothing to do')
    sys.exit(0)

print(f'Updating {old_ver} → {new_ver}')

# Replace every occurrence: display badges, URL tag, filenames, Arabic text
html = html.replace(old_ver, new_ver)

with open('index.html', 'w') as f:
    f.write(html)

print('Done ✓')
