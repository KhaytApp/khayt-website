/* ============================================================
   The directory's "Install in Khayt" link (KhaytApp/Khayt#2622).
   ------------------------------------------------------------
   The app accepts exactly one shape,
     khayt://plugin/install?id=<connector id>&version=<version>
   and nothing else: no manifest, no address, no extra or repeated field.
   It then reads Khayt's own signed index itself, so a link for a version the
   index does not list, or has withdrawn, only ends in a refusal in the app.
   This page offers the link only when it would succeed: a connector row in
   the VERIFIED index (the caller checks the signature; see signedIndex() in
   make-directory.js) at exactly this id and version, not withdrawn. Ids and
   versions are checked against the app's shapes, so nothing needs encoding.
   ============================================================ */
'use strict';

const ID_RE = /^[a-z0-9]+(\.[a-z0-9][a-z0-9-]*)+$/;
const VERSION_RE = /^(0|[1-9]\d{0,4})\.(0|[1-9]\d{0,4})\.(0|[1-9]\d{0,5})$/;

/** The link for this item, or null when the page must not offer one. */
function installHref(item, verifiedIndex) {
  if (!item || item.kind !== 'connector') return null;
  const { id, version } = item;
  if (typeof id !== 'string' || !ID_RE.test(id) || id.length > 100) return null;
  if (typeof version !== 'string' || !VERSION_RE.test(version)) return null;
  const entries = verifiedIndex && Array.isArray(verifiedIndex.entries) ? verifiedIndex.entries : [];
  const row = entries.find(r => r && r.kind === 'connector' && r.id === id && r.version === version);
  if (!row) return null;
  if (Array.isArray(row.revoked) && row.revoked.some(x => x && x.version === version)) return null;
  return `khayt://plugin/install?id=${id}&version=${version}`;
}

module.exports = { installHref, ID_RE, VERSION_RE };
