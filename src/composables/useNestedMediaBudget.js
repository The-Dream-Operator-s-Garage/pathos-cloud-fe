// useNestedMediaBudget — THE NESTED MEDIUM'S SHARE (2026-10-18, user ask:
// "always adapt the inner elements width to fit the whole contained element
// inside. For example, for a twit on the second layer, it might be cut off by
// its container if it is formatted vertically … adapt the width
// proportionally to display the whole thing under the available space").
//
// A surface states ONE height budget for a medium, `--media-max-h` (the feed
// card's pit, a flyout's well, a dashboard cell), measured for a medium
// quoted in ONE Mini: the surface's constant already pays that Mini's head
// and foot. A medium one layer deeper (card → PostMini → NodeMini, the depth
// dial's layer 2) sits inside a SECOND Mini's chrome too, which nobody had
// subtracted — so a medium sized to the full budget ran that much past the
// card and was cut by the pit. A custom property cannot subtract from its own
// inherited value, so the nested Mini cannot simply restate the budget; it
// MEASURES what each outer Mini spends around it and publishes the sum as
// `--media-nest-h`, which every medium reader subtracts (NodeMini's picture,
// EmbedFrame's budget probe, its player's width cap, its page height).
//
// What an outer Mini spends, per layer: everything from its own top down to
// the inner panel's top (head, hairline, the body's margin and padding, any
// prose the quoted body prints first) plus everything from its body's content
// edge down to its own bottom (the body's padding, its margin, the foot).
// NOT what sits beside or below the inner panel inside the body: in a lane of
// side-by-side members a taller sibling would otherwise count against this
// one, the medium would shrink, the gap would grow, and it would shrink again
// — a share must never depend on the size of the thing it sizes.
//
// The walk stops at an element carrying `data-media-budget` — a surface
// INSIDE a Mini that states its own budget (a DashboardSlot), whose
// number was never the outer surface's to begin with.
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

function chainOf (el) {
  const own = el?.closest?.('.mini-panel')
  if (!own) return []
  const chain = [own]
  for (let p = own.parentElement?.closest('.mini-panel'); p; p = p.parentElement?.closest('.mini-panel')) {
    const scope = chain[chain.length - 1].parentElement?.closest('[data-media-budget]')
    if (scope && p.contains(scope)) break
    chain.push(p)
  }
  return chain
}

function shareOf (chain) {
  let sum = 0
  for (let i = 1; i < chain.length; i++) {
    const outer = chain[i]
    const inner = chain[i - 1]
    const o = outer.getBoundingClientRect()
    const n = inner.getBoundingClientRect()
    const body = [...outer.children].find(k => k.classList.contains('mini-panel__body') && k.contains(inner))
    let end = o.bottom
    if (body) {
      const b = body.getBoundingClientRect()
      end = b.bottom - (parseFloat(getComputedStyle(body).paddingBottom) || 0)
    }
    sum += Math.max(0, n.top - o.top) + Math.max(0, o.bottom - end)
  }
  return Math.round(sum)
}

// `elRef` — a ref to an element INSIDE the Mini that holds the medium. Answers
// a ref holding the px share (0 when the Mini is not nested).
export function useNestedMediaBudget (elRef) {
  const share = ref(0)
  let ro = null
  let raf = 0

  const measure = () => {
    raf = 0
    const chain = chainOf(elRef.value)
    const next = chain.length > 1 ? shareOf(chain) : 0
    if (next !== share.value) share.value = next
  }
  const schedule = () => { if (!raf) raf = requestAnimationFrame(measure) }

  onMounted(() => nextTick(() => {
    const chain = chainOf(elRef.value)
    if (chain.length < 2) return
    measure()
    if (typeof ResizeObserver === 'undefined') return
    ro = new ResizeObserver(schedule)
    chain.forEach(p => ro.observe(p))
  }))
  onBeforeUnmount(() => {
    if (ro) ro.disconnect()
    if (raf) cancelAnimationFrame(raf)
  })

  return share
}
