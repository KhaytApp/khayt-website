#!/usr/bin/env python3
"""
Auto-update index.html when a new Khayt release is published.

Fetches real asset names from the GitHub API so that filename-format changes
(e.g. Khayt.Setup.X.exe → Khayt-Setup-X.exe) are handled correctly.

Usage: python3 update_version.py v2.0.2
"""
import sys, re, json, urllib.request

REPO = "Alballaa/Khayt"

# ── Helpers ────────────────────────────────────────────────────────────────

def gh_api(path):
    url = f"https://api.github.com/{path}"
    req = urllib.request.Request(url, headers={"Accept": "application/vnd.github+json",
                                                "X-GitHub-Api-Version": "2022-11-28",
                                                "User-Agent": "khayt-website-sync/1"})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


def asset_url(tag, name):
    return f"https://github.com/{REPO}/releases/download/{tag}/{name}"


# ── Main ───────────────────────────────────────────────────────────────────

if len(sys.argv) < 2:
    print("Usage: update_version.py <new-tag>  e.g. v2.0.2")
    sys.exit(1)

new_tag = sys.argv[1]           # e.g. "v2.0.2"
new_ver = new_tag.lstrip('v')   # e.g. "2.0.2"

# Detect current version from any download URL in the HTML
with open('index.html') as f:
    html = f.read()

m = re.search(r'releases/download/v([\w.\-]+)/', html)
if not m:
    print('ERROR: could not detect current version in index.html')
    sys.exit(1)

old_ver = m.group(1)
old_tag = f"v{old_ver}"

if old_ver == new_ver:
    print(f'Already at {new_ver} — nothing to do')
    sys.exit(0)

print(f'Updating {old_ver} → {new_ver}')

# ── Fetch real asset names from GitHub API ─────────────────────────────────
try:
    releases = gh_api(f"repos/{REPO}/releases")
    release  = next((r for r in releases if r['tag_name'] == new_tag and not r['draft']), None)
    if not release:
        print(f"WARNING: release {new_tag} not found via API — falling back to simple string replace")
        release = None
except Exception as e:
    print(f"WARNING: GitHub API error ({e}) — falling back to simple string replace")
    release = None

if release:
    # Build a map: platform keyword → actual asset download URL
    asset_map = {}
    for asset in release.get('assets', []):
        name = asset['name']
        url  = asset['browser_download_url']
        n = name.lower()
        if n.endswith('.dmg'):
            asset_map['macos'] = url
        elif n.endswith('.exe'):
            asset_map['windows'] = url
        elif n.endswith('.appimage'):
            asset_map['appimage'] = url
        elif n.endswith('.deb'):
            asset_map['deb'] = url

    # Replace each old per-platform URL with the real new URL
    def replace_url(html, old_tag, old_ver, ext_pattern, new_url):
        """Replace a single download URL matched by its extension pattern."""
        old_url_pattern = re.compile(
            r'https://github\.com/' + re.escape(REPO) +
            r'/releases/download/' + re.escape(old_tag) +
            r'/[^\'"]+' + ext_pattern
        )
        return old_url_pattern.sub(new_url, html)

    if 'macos' in asset_map:
        html = replace_url(html, old_tag, old_ver, r'\.dmg', asset_map['macos'])
    if 'windows' in asset_map:
        html = replace_url(html, old_tag, old_ver, r'\.exe', asset_map['windows'])
    if 'appimage' in asset_map:
        html = replace_url(html, old_tag, old_ver, r'\.AppImage', asset_map['appimage'])
    if 'deb' in asset_map:
        html = replace_url(html, old_tag, old_ver, r'\.deb', asset_map['deb'])

    # Now do a plain string replace for everything else (version badges, JSON-LD, etc.)
    # but NOT inside URLs we already fixed
    html = html.replace(old_ver, new_ver)

else:
    # Fallback: plain string replace (may break if filename format changed)
    html = html.replace(old_ver, new_ver)

with open('index.html', 'w') as f:
    f.write(html)

print('Done ✓')
