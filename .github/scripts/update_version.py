#!/usr/bin/env python3
"""
Auto-update index.html when a new Khayt release is published.

Fetches real asset names from the GitHub API so that filename-format changes
(e.g. Khayt.Setup.X.exe → Khayt-Setup-X.exe) are handled correctly.

Usage: python3 update_version.py v2.0.2
"""
import sys, re, json, urllib.request, urllib.error

REPO = "khaytapp/Khayt"

# ── Helpers ────────────────────────────────────────────────────────────────

def gh_api(path):
    url = f"https://api.github.com/{path}"
    req = urllib.request.Request(url, headers={"Accept": "application/vnd.github+json",
                                                "X-GitHub-Api-Version": "2022-11-28",
                                                "User-Agent": "khayt-website-sync/1"})
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())


def asset_url(tag, name):
    return f"https://github.com/{REPO}/releases/download/{tag}/{name}"


MAC_START = '<!-- MAC-NATIVE:START'
MAC_END   = '<!-- MAC-NATIVE:END -->'

# Regions this script must not rewrite, as (start-marker, end-marker) pairs.
#
# The native Mac block, for the reason spelled out below. And the three
# PRERENDER blocks, for a different one: they are DERIVED. scripts/prerender.js
# owns them and regenerates them from data.js, so there is nothing in them this
# script could usefully update — and there is something in them it could break.
# They carry inline SVG path data, and a path reads "5.3 5.9.9-4.3" in exactly
# the shape of a version number. A blanket replace on the day this app releases
# v5.9.9 would rewrite a star icon's geometry into a shape nobody drew, on a
# page that still looks right in the diff.
FROZEN = [
    (MAC_START, MAC_END),
    ('<!-- PRERENDER:featGrid:START -->',   '<!-- PRERENDER:featGrid:END -->'),
    ('<!-- PRERENDER:betaGrid:START -->',   '<!-- PRERENDER:betaGrid:END -->'),
    ('<!-- PRERENDER:modesTable:START -->', '<!-- PRERENDER:modesTable:END -->'),
]


def replace_version_outside_mac_block(html, old_ver, new_ver):
    """Rewrite the version everywhere EXCEPT the frozen regions.

    The digit guards below stop "2.0.1" corrupting "2.0.11". They do NOT stop
    this app's version corrupting the MAC app's, because the two lines can
    legitimately share a prefix: with this app on 4.0.0 and the Mac app on
    4.0.0-alpha.1, a blanket replace of "4.0.0" turns the Mac string into
    "4.0.1-alpha.1" — a version that never existed, linking a download that
    does not, on a page that still looks right.

    So the Mac block is cut out, the replacement runs on the rest, and it is
    put back. The markers are in index.html and are the contract; a page
    missing them is handled as it always was, with a warning rather than a
    failure, because an older index.html is still a valid one.
    """
    sub = lambda t: re.sub(r'(?<!\d)' + re.escape(old_ver) + r'(?!\d)', new_ver, t)

    # Split the page into the parts that may be rewritten and the parts that
    # may not, then rewrite only the first kind. A page missing a marker is
    # handled as it always was, with a warning rather than a failure, because
    # an older index.html is still a valid one.
    #
    # Walked in the order the markers appear in the PAGE, not the order they
    # are listed above: the list is grouped by what each block is for, while
    # the page has modesTable first and the Mac block last. Splitting in list
    # order consumes a later block inside an earlier block's `head` and then
    # cannot find it, so it would silently stop freezing it.
    found = []
    for start, end in FROZEN:
        i = html.find(start)
        j = html.find(end)
        if i == -1 or j == -1 or j < i:
            print('NOTE: no %s block found — that region is not frozen' % start.strip('<!- '))
            continue
        found.append((i, j + len(end)))
    found.sort()

    out, cursor = '', 0
    for i, j in found:
        out += sub(html[cursor:i]) + html[i:j]
        cursor = j
    return out + sub(html[cursor:])


# ── Main ───────────────────────────────────────────────────────────────────

if len(sys.argv) < 2:
    print("Usage: update_version.py <new-tag>  e.g. v2.0.2")
    sys.exit(1)

new_tag = sys.argv[1]           # e.g. "v2.0.2"

# Validate tag format to prevent path traversal or shell injection downstream
if not re.fullmatch(r'v\d+\.\d+\.\d+', new_tag):
    print(f'ERROR: invalid tag format "{new_tag}" — expected vX.Y.Z')
    sys.exit(1)

new_ver = new_tag.lstrip('v')   # e.g. "2.0.2"

# Detect current version from any download URL in the HTML
with open('index.html') as f:
    html = f.read()

# ── WHICH VERSION, AND WHOSE ───────────────────────────────────────────────
#
# ANCHORED TO THIS REPO'S OWN URLS. It used to match the first
# `releases/download/vX/` anywhere in the page, which was fine while every
# download on the site came from khaytapp/Khayt. The site now also links the
# NATIVE Mac app, whose releases live in KhaytApp/khayt-mac on their own
# version line — 4.0.0-alpha.1 while this app is on 3.7.0.
#
# Unanchored, this would have read the Mac app's version as "the current
# version", then rewritten the page around a number that has nothing to do with
# the release being published.
m = re.search(r'github\.com/khaytapp/Khayt/releases/download/v([\w.\-]+)/', html, re.I)
if not m:
    print('ERROR: could not detect current version in index.html')
    print('       (looked for a khaytapp/Khayt download URL — the Mac app\'s own')
    print('        links live in KhaytApp/khayt-mac and are deliberately ignored)')
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

    # Now replace version in non-URL text (version badges, JSON-LD, etc.).
    # Use digit boundary guards so e.g. "2.0.1" won't corrupt "2.0.11" in newer URLs.
    html = replace_version_outside_mac_block(html, old_ver, new_ver)

else:
    # Fallback: plain string replace (may break if filename format changed)
    html = replace_version_outside_mac_block(html, old_ver, new_ver)

with open('index.html', 'w') as f:
    f.write(html)

print('Done ✓')
