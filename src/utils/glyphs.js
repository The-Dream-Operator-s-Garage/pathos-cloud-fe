// ─────────────────────────────────────────────────────────────────────────────
// GLYPHS THE INSTALLED FONT DOES NOT CARRY (2026-09-21)
//
// The dashboard draws its symbols from `@quasar/extras` 1.18.0's Material
// Symbols Outlined font (the `sym_o_*` names). Google keeps adding glyphs and
// the package's 1.x line stopped at 1.18.0 — everything newer ships only in
// its 2.x major, a different Quasar generation, so a bump for one glyph is
// not on. A glyph the design wants and the font lacks is carried HERE as its
// SVG path instead, in the string form QIcon reads natively —
// `"<path>|<viewBox>"` — sized and coloured exactly like a font glyph.
//
// Use: `<q-icon :name="GLOBE_CLOCK" size="10px" />`. Grep this file before
// reaching for a lookalike; the second glyph the font lacks goes beside the
// first. Each path is the one the 2.1.0 package exports, verbatim (its
// `symOutlined*` constant is named on the line), on Material Symbols' own
// `0 -960 960 960` box.

// `symOutlinedGlobeClock` — the byline's moment pill (FeedStream): a globe
// with a clock, "when and where" in one mark. (user ask, 2026-09-21: "use
// the 'globe_clock' material icon"; the font has globe / globe_asia /
// globe_book / globe_location_pin / globe_uk and no clock.)
export const GLOBE_CLOCK = 'M636-848.5Q709-817 763-763t85.5 127Q880-563 880-480v11q-19-13-39-23t-42-17q-8-89-61-161.5T600-776v16q0 33-23.5 56.5T520-680h-80v80q0 17-11.5 28.5T400-560h-80v80h257q-62 37-99.5 100.5T440-240q-33 0-56.5-23.5T360-320v-40L168-552q-3 18-5.5 36t-2.5 36q0 125 83 216.5T451-161q7 23 17 42.5T491-80h-11q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5Zm-57.5 750Q520-157 520-240t58.5-141.5Q637-440 720-440t141.5 58.5Q920-323 920-240T861.5-98.5Q803-40 720-40T578.5-98.5ZM786-146l28-28-74-74v-112h-40v128l86 86Z|0 -960 960 960'

// ── THE ROACH (2026-11-02, user ask: "a big debug bug button … Choose a
// roach-like bug for the button please") — the footer's BUGS chip, its
// window's plate and its parked tab. Not a font glyph: Material's two bugs
// (`bug_report`, `pest_control`) are beetles — round shells, short feelers —
// and a roach reads by exactly what they lack: a long flat body, the
// pronotum's shield over the head, feelers longer than the body sweeping
// back, and spiny legs splayed wide. Drawn on a 24-unit box, head up: the
// shield, the two wing halves (the seam between them is the gap, not a
// line, so it survives 13px), and eight strokes — two feelers, six legs —
// as QIcon's `@@` per-path style (the `&&`-joined form QIcon reads natively).
const ROACH_STROKE = '@@fill:none;stroke:currentColor;stroke-width:1.35;stroke-linecap:round;stroke-linejoin:round'
export const ROACH = [
  // head nub + shield (pronotum) — small, so the body reads long
  'M12 4.2c.8 0 1.4.5 1.5 1.2 1.6.4 2.6 1.4 2.6 2.5 0 1.1-1.8 1.8-4.1 1.8s-4.1-.7-4.1-1.8c0-1.1 1-2.1 2.6-2.5.1-.7.7-1.2 1.5-1.2z',
  // the wings, left and right of the seam — a long flat oval, twice as long as wide
  'M11.65 10.4c-2.2.2-3.5 2.3-3.5 5.6 0 3.6 1.3 6.3 3.5 7.4z',
  'M12.35 10.4c2.2.2 3.5 2.3 3.5 5.6 0 3.6-1.3 6.3-3.5 7.4z',
  // feelers — longer than the body, arcing out and back
  'M11.2 4.6C10.4 2.6 8.4 1.2 5.6.9 3.8.7 2.3 1.5 1.5 3.1' + ROACH_STROKE,
  'M12.8 4.6C13.6 2.6 15.6 1.2 18.4.9 20.2.7 21.7 1.5 22.5 3.1' + ROACH_STROKE,
  // legs — front (reaching forward), middle (splayed), hind (long, swept back)
  'M8.4 8.6 6.2 7.2 5.6 4.8' + ROACH_STROKE,
  'M15.6 8.6l2.2-1.4.6-2.4' + ROACH_STROKE,
  'M8.3 12.6 5.2 12.4 3 15.4' + ROACH_STROKE,
  'M15.7 12.6l3.1-.2 2.2 3' + ROACH_STROKE,
  'M8.6 16.4 5.6 18.8 4.6 22.8' + ROACH_STROKE,
  'M15.4 16.4l3 2.4 1 4' + ROACH_STROKE
].join('&&') + '|0 0 24 24'
