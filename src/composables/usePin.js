// THE PIN (2026-10-18 — lifted out of `useElementCard`, where the card
// family's pin act was born on 2026-10-08, the day the MINI family got a pin
// button of its own: "to the mini viewer family … add a new button to pin
// that element"). One session-wide pinned set, so a card and a Mini showing
// the same element light the same way.
//
//   · the KINDS pins take — node | label | skeleton (posts ARE skeletons);
//     the API refuses any other `targetType` (pinSkeletonService), so the
//     other kinds simply have no pin;
//   · the STATE — read ONCE per session off `GET /pins` (a list of cards or
//     a lane of minis must not pay a check each), optimistic on the press,
//     authoritative on the server, re-read when the pins widget changes;
//   · the TRAIL — every flip is a PIN / UNPIN action on the nav trail;
//   · the EPOCH — `pinsEpoch` ticks on every flip made here. MainLayout
//     watches it and re-reads the pins widget: a Mini deep inside a post
//     body has no `pins-changed` emit chain to the layout (the cards'
//     route), and the widget must still show the new pin.
import { ref, computed, onMounted } from 'vue'
import { pinService } from 'src/services/pin.service'
import { useNavStore } from 'src/stores/navigation'
import { kindFor, prefixFor } from 'src/utils/kinds'

// The kinds pins take (api: targetType ∈ node | label | skeleton).
export const PIN_TYPE = { nodes: 'node', labels: 'label', skeletons: 'skeleton', posts: 'skeleton' }

// ── the session's pins, read once ──────────────────────────────────────
let pinsPromise = null
const pinsSet = ref(null) // Set<'type:id'>
export const pinsEpoch = ref(0)

export function loadPins () {
  if (!pinsPromise) {
    pinsPromise = pinService.list()
      .then((r) => {
        const s = new Set()
        for (const p of (r?.pins || [])) if (p.target_type && p.target_id) s.add(`${p.target_type}:${p.target_id}`)
        pinsSet.value = s
        return s
      })
      .catch(() => { pinsPromise = null; return pinsSet.value || new Set() })
  }
  return pinsPromise
}

// Someone else changed the pins (the widget's own unpin, a page's pin):
// drop the session read so the next look asks the server again.
export function reloadPins () {
  pinsPromise = null
  if (pinsSet.value) loadPins()
}

// `spec` — a getter returning the element's facts as its row resolves:
//   { kind, id, address, label }  (kind: a kinds.js prefix or slug)
// `onChanged` — called after a flip lands (the card's `pins-changed`).
export function usePin (spec, { onChanged = null } = {}) {
  const navStore = useNavStore()
  const facts = computed(() => spec() || {})
  const prefix = computed(() => prefixFor(facts.value.kind || 'unknown'))
  const meta = computed(() => kindFor(prefix.value))

  const pinType = computed(() => PIN_TYPE[prefix.value] || null)
  const pinKey = computed(() => (pinType.value && facts.value.id != null ? `${pinType.value}:${facts.value.id}` : null))
  const pinned = computed(() => !!(pinKey.value && pinsSet.value?.has(pinKey.value)))
  const pinBusy = ref(false)
  onMounted(() => { if (pinType.value) loadPins() })

  const togglePin = async () => {
    if (!pinKey.value || pinBusy.value) return
    const set = await loadPins()
    const was = set.has(pinKey.value)
    const next = new Set(set)
    if (was) next.delete(pinKey.value); else next.add(pinKey.value)
    pinsSet.value = next
    pinBusy.value = true
    try {
      if (was) await pinService.unpin(pinType.value, facts.value.id)
      else await pinService.pin(pinType.value, facts.value.id)
      navStore.recordAction?.(was ? 'UNPIN' : 'PIN', {
        targetType: pinType.value,
        targetId: facts.value.id,
        targetRoute: meta.value.route ? meta.value.route(facts.value.id) : null,
        targetLabel: facts.value.label || `${meta.value.kind} #${facts.value.id}`,
        targetPath: facts.value.address || null
      })
      pinsEpoch.value++
      if (onChanged) onChanged()
    } catch (_) {
      pinsPromise = null
      await loadPins()
    }
    pinBusy.value = false
  }

  const pinTitle = computed(() => (pinned.value ? `Unpin this ${meta.value.kind}` : `Pin this ${meta.value.kind}`))

  return { pinType, pinnable: computed(() => !!pinKey.value), pinned, pinBusy, pinTitle, togglePin }
}
