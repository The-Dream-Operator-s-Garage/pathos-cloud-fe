// THE ENTITY DOOR (2026-09-11, user ask: "we want this flyout window to be
// triggered whenever we click on an entity from other window or from a post
// or from the entity window, wherever").
//
// Every place the platform names an entity is a `router-link` to
// `/entities/:id` — the feed's identity block, the postcard byline, the
// comment authors, the InfoChip / MicroChip / EntityInfo tiers, EntityMini's
// panel, the origin constellation's stars, the alter-ego and org member
// trees, the viewers' "owner" rows, the secret's receiver… forty-odd doors
// across the tree, and any new surface will add another without asking.
// Wiring each one to the window would miss the next one; so the rule is
// stated ONCE, at the document: a primary click on an anchor whose href is
// an entity route opens that entity's WINDOW instead of leaving the page.
//
// Capture phase, because the anchor's own listener is Vue Router's, and its
// guard (`guardEvent`) stands down the moment `defaultPrevented` is set —
// which a document-level capture listener sets before the event ever
// reaches the anchor. Nothing about the links changes: they still say where
// they go (hover, copy link, open in a new tab), and every escape hatch a
// link owes its user is honoured — modifier keys and non-primary buttons
// fall through to the browser, an anchor with `target` fall through, and
// an anchor marked `data-entity-page` (the window's own "open the page"
// door, should it ever be an anchor) walks through to the page as before.
//
// The PAGE stays: typed URLs, back/forward, the window's foot button and
// trail stops all still land on `/entities/:id`. Only the CLICK moved.
const ENTITY_HREF_RE = /(?:^|#)\/entities\/(\d+)(?:[/?#]|$)/

// `#/entities/12`, `/#/entities/12?x`, a full `http://…/#/entities/12` —
// the id, or null for anything that is not an entity route.
export function entityIdFromHref (href) {
  const m = ENTITY_HREF_RE.exec(String(href || ''))
  return m ? parseInt(m[1], 10) : null
}

// Installs the door; returns the remover. `open(id, anchor)` is the store's
// spawn, handed the anchor so a caller could read a richer seed off it.
export function installEntityLinkDoor (open) {
  const handler = (e) => {
    if (e.defaultPrevented || e.button !== 0) return
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const a = e.target && e.target.closest ? e.target.closest('a[href]') : null
    if (!a || a.hasAttribute('data-entity-page') || a.getAttribute('target')) return
    const id = entityIdFromHref(a.getAttribute('href'))
    if (id == null) return
    e.preventDefault()
    open(id, a)
  }
  document.addEventListener('click', handler, true)
  return () => document.removeEventListener('click', handler, true)
}
