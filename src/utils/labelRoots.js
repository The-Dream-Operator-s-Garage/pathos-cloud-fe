// THE ROOT-MARK REGISTRY — a label TREE drawn as a mark instead of a word.
//
// A classification on this platform is a PATH, root to leaf, and every chip
// that states one spells the whole thing: `PATHCHAIN › POST › ORIGINAL`. The
// root is the least informative step in that run and the most repeated — it
// is the same word on every chip of a tree — so a tree that has a mark of its
// own can spend the space on the mark instead. The leaf, which is the step
// that actually says something, gets the room back.
//
// ── WHY THE REGISTRY LIVES HERE AND NOT ON THE LABEL ──────────────────────
// A LABEL IS A FINITE CATEGORY AND NOTHING ELSE. That is the rule the
// FILE_PATH removal settled on 2026-07-14 (`docs/concepts/labels.md`; labels
// stopped carrying a doc's source path, which moved to line 2 of the FILE
// node's content), and an icon is data by exactly the same test: it is a
// string that varies per row and that nothing about the category implies.
// What a root's mark actually is, is a PRESENTATION decision this dashboard
// makes about trees it already knows by name — which is the job
// `utils/kinds.js` does for element kinds, in the same shape.
//
// ── HOW TO ADD ONE ────────────────────────────────────────────────────────
// Keyed by the root label's NAME. Names are data and label lookups on this
// platform have been name-based since 2026-07-19, so this is the same handle
// `findTemplateHead` and the seed scripts use. A root with no entry renders
// its name exactly as before: the registry is additive, it never hides a tree
// it does not know, and adding a mark is one entry.
//
// The full path stays reachable — every surface that draws a mark also
// carries the whole chain in its tooltip, and the mark is labelled with the
// root's own name for assistive tech, so the word is never lost. A mark
// REPLACES a name on screen; it never replaces it in the data.
//
// ⚠ PICK ARTWORK WHOSE ALPHA IS THE DRAWING. A mark is painted as a flat
// colour clipped to the image's alpha channel (a CSS mask), not drawn as a
// bitmap — that is what lets one dial carry both its resting tone and its
// hover tone on any surface. It also means COLOUR IS DISCARDED: a mark whose
// detail lives in its hues masks down to a filled blob. The planet below
// survives because it is a line drawing (measured inside its ink box: 14% of
// pixels fully opaque, 41% partial, 45% clear — the strokes ARE the alpha).
// Check that before adding an entry; if a tree's artwork is a solid badge,
// it wants a different mechanism, not this one.

const MARKS = {
  // THE PATHOS MARK — the ringed planet, and specifically `favicon.ico`,
  // which is the binary the BROWSER TAB actually wears on both installs
  // (verified against prod: the deployed `favicon.ico` is byte-identical to
  // this repo's).
  //
  // ⚠ NOT `icons/favicon-*.png`. `src/index.template.html` declares five
  // icons — four PNGs and then the `.ico` — and the two sets are DIFFERENT
  // ARTWORK: the PNGs are a turbine rosette in a cyan ring, the `.ico` is the
  // planet. The template's comment calls the PNG set "the pathos mark", which
  // is how this chip drew the rosette for one pass before the ask corrected
  // it ("the pretty planet, not the quasar loco"). Whatever the PNGs are,
  // they are not what a reader sees in their tab, and this chip's whole point
  // is to be the same mark.
  //
  // An `.ico` in an `<img>` is well-supported (every engine this app targets
  // renders one); the container holds 16px and 32px frames and the browser
  // scales the one it picks down to the 11px this is drawn at.
  //
  // The file is referenced, never copied — the tab and the plumbing chips
  // must not be able to drift apart. (`public/landing/**` holds a third,
  // byte-frozen set from the retired landing page; do not reach for it.)
  //
  // ⚠ RELATIVE, not root-relative. The app is a HASH router, so the document
  // URL is always the deployment root plus a fragment, and a relative href
  // resolves against that root on every install — including one served from
  // a sub-path, where a leading `/` would point outside the app. This is the
  // same form `index.template.html` uses, for the same reason.
  PATHCHAIN: {
    src: 'favicon.ico',
    // The word the mark stands in for — used as `alt`, and as the tooltip
    // fallback on any surface that does not already carry the full chain.
    name: 'PATHCHAIN'
  }
}

// The mark for a root label's name, or null. Callers draw the name when this
// returns null, which is every tree but one today.
export function rootMark (name) {
  return (name && MARKS[name]) || null
}

// True when a chain's ROOT has a mark. The distinction matters because a mark
// is only ever drawn for step 0: a tree's identity is its root, and a middle
// step that happened to share a root's name is a different label.
export function hasRootMark (names) {
  return !!rootMark(Array.isArray(names) ? names[0] : names)
}
