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
    # A release-download URL is NEVER rewritten here. Its filename comes from
    # the asset map above, which only writes a URL for an asset the release
    # actually has. This blanket pass used to rewrite them anyway, which
    # defeated that guard completely: v3.8.0 shipped with no macOS artifacts,
    # the asset map correctly skipped the .dmg — and then this line rewrote
    # `v3.7.0/Khayt-3.7.0-arm64.dmg` into a v3.8.0 URL that was never built.
    # khaytapp.com offered macOS users a download that 404ed for two days.
    DL = re.compile(r'https://github\.com/[^"\s]*?/releases/download/[^"\s]*')
    def sub(t):
        bump = lambda x: re.sub(r'(?<!\d)' + re.escape(old_ver) + r'(?!\d)', new_ver, x)
        out, last = '', 0
        for m in DL.finditer(t):
            out += bump(t[last:m.start()]) + m.group(0)
            last = m.end()
        return out + bump(t[last:])

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

def sync_sizes(html, releases_by_tag):
    """Make each download button state the size of the file it actually links to.

    These were hand-written and every one of them was wrong: the page said
    131 MB for a 147 MB installer, 156 for a 166 MB AppImage, 124 for 134.
    They are beside a URL this script rewrites on every release, so they drift
    a little further each time and nothing notices — the same shape of bug as
    a hand-written release note next to an auto-synced version chip.

    Keyed off the filename in each link's own href, not off a platform guess,
    so the two Windows .exe builds cannot be told apart wrongly.
    """
    size_of = {}
    for rel in releases_by_tag.values():
        for a in rel.get('assets', []):
            size_of[a['name']] = a['size']

    LINK = re.compile(r'(<a class="dl-link"[^>]*href="[^"]*?/releases/download/[^/"]+/([^"/]+)"[^>]*>)(.*?)(</a>)', re.S)
    changed = []
    def fix(m):
        head, filename, body, tail = m.groups()
        size = size_of.get(filename)
        if size is None:
            return m.group(0)
        mb = round(size / 1024 / 1024)
        new_body, n = re.subn(r'\b\d+(?:\.\d+)?\s*MB\b', f'{mb} MB', body)
        if n and new_body != body:
            changed.append(f'{filename}: {mb} MB')
        return head + new_body + tail
    html = LINK.sub(fix, html)
    for c in changed:
        print('  size synced — ' + c)
    return html


# Every download URL on the page must name an asset this release really has.
# Belt and braces to the freeze above: if some future edit reintroduces a way
# for a URL to be invented, the sync fails here instead of committing a 404.
if release is not None:
    # Sizes come from whichever release each link actually points at — a link
    # left on an older tag (because this release has no such asset) must state
    # that older file's size, not this one's.
    by_tag = {new_tag: release}
    for t in set(re.findall(r'/releases/download/(v[0-9.]+)/', html)):
        if t not in by_tag:
            try:
                by_tag[t] = next(r for r in releases if r['tag_name'] == t)
            except Exception:
                pass
    html = sync_sizes(html, by_tag)

    real = {a['browser_download_url'] for a in release.get('assets', [])}
    bad = [u for u in re.findall(r'https://github\.com/[^"\s]*?/releases/download/[^"\s]*', html)
           if new_tag in u and u not in real]
    if bad:
        print('ERROR: these URLs name assets %s does not have:' % new_tag)
        for u in bad:
            print('  ' + u)
        sys.exit(1)

with open('index.html', 'w') as f:
    f.write(html)

print('Done ✓')
