// THE CARD'S DYNAMICS (2026-10-08, the card family) — what every XCard DOES,
// lifted from the feed card so the nine kinds answer a press the one way:
//
//   · OPEN — the element as a floating WINDOW: a `select` emit for a host
//     that spawns windows itself (`window-host`: the side viewer, whose
//     sink would otherwise swallow the store call — `{ flyout: true }` is
//     the host's to add), else the store's own door;
//   · SHARE — the card panel's ConversationPicker, by injection;
//   · PIN — the PINS skeleton the pins widget reads (`pinService`), for the
//     kinds pins take (node | label | skeleton — posts ARE skeletons); the
//     state is read ONCE per session off `GET /pins` (a list of cards must
//     not pay a check each), optimistic on the press, authoritative on the
//     server, the nav trail told, `pins-changed` bubbled up;
//   · THE THREAD DOORS — the comment / fork tallies: a THREAD HOST (the
//     side viewer's band) gets the `thread` emit; without one the comment
//     door opens the card's own inline CommentMaker storey and the fork
//     door opens the window (FeedStream's rule). The counts are the
//     CHAIN's (`GET /refs/comments|forks`, the holder rule) — handed in by
//     the host (`thread`), read lazily when not, or off (`thread: false`)
//     on a list that shows no doors;
//   · OWNERSHIP — `owner_id` against the acting entity (SkeletonTable's
//     `canWrite`), the gate for the owner-only acts.
import { ref, computed, watch, inject, onMounted, unref } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { useFlyoutViewersStore } from 'src/stores/flyoutViewers'
import { useNavStore } from 'src/stores/navigation'
import { refService } from 'src/services/ref.service'
import { pinService } from 'src/services/pin.service'
import { hashOf, kindFor, prefixFor } from 'src/utils/kinds'

// The props every XCard declares, by name (spread into the component).
export const CARD_PROPS = {
  // Which thread section a host is showing ('comments' | 'forks' | null).
  threadOn: { type: String, default: null },
  // A host that shows threads itself: the doors EMIT `thread(slot)`.
  threadHost: { type: Boolean, default: false },
  // The chain's totals from the host ({ comments, forks, supported:
  // { comments, forks } }), null = read them here, false = no doors.
  thread: { type: [Object, Boolean], default: null },
  // A host that spawns windows itself: the open doors EMIT `select(target)`.
  windowHost: { type: Boolean, default: false },
  // The card takes the host's whole height (a filling viewer in the pit).
  fill: { type: Boolean, default: false }
}
export const CARD_EMITS = ['select', 'thread', 'pins-changed']

// The comment composer's parent kind per prefix (PostMakerSurface routes
// node → its route, the skeleton family → the skeleton route, any other
// kind → POST /refs/comment by address).
const PARENT_KIND = { skeletons: 'skeleton', posts: 'post', nodes: 'node', labels: 'label', paths: 'path', links: 'link', moments: 'moment', secrets: 'secret', entities: 'entity' }
// The kinds pins take (api: targetType ∈ node | label | skeleton).
const PIN_TYPE = { nodes: 'node', labels: 'label', skeletons: 'skeleton', posts: 'skeleton' }

// ── the session's pins, read once ──────────────────────────────────────
let pinsPromise = null
const pinsSet = ref(null) // Set<'type:id'>
const loadPins = () => {
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

// `spec` — a getter returning the card's facts as the row resolves:
//   { kind, address, id, label, ownerId, target }
//   · kind    a kinds.js prefix or slug
//   · address '<prefix>/<hash>' (posts on their skeletons/ address)
//   · target  the flyoutViewers.spawn target for the open door
export function useElementCard (props, emit, spec) {
  const auth = useAuthStore()
  const flyouts = useFlyoutViewersStore()
  const navStore = useNavStore()
  const openShare = inject('cardShare', null)

  const facts = computed(() => (typeof spec === 'function' ? spec() : unref(spec)) || {})
  const prefix = computed(() => prefixFor(facts.value.kind || 'unknown'))
  const meta = computed(() => kindFor(prefix.value))
  const address = computed(() => facts.value.address || '')
  const hash = computed(() => hashOf(address.value))
  const isOwner = computed(() => facts.value.ownerId != null && facts.value.ownerId === auth.entityId)

  // ── OPEN ──────────────────────────────────────────────────────────────
  const target = () => facts.value.target || (address.value ? { kind: 'ref', ref: address.value } : null)
  const openWindow = () => {
    const t = target()
    if (!t) return
    if (props.windowHost) emit('select', t)
    else flyouts.spawn(t)
  }
  // Lit while this element's window is open (the store dedupes by address).
  const isOpen = computed(() => {
    const h = hash.value
    const id = facts.value.id
    return (flyouts.viewers || []).some((v) => {
      if (!v || v.minimized) return false
      const t = v.target || {}
      const addr = t.kind === 'post'
        ? t.item?.skeleton_path
        : t.kind === 'node'
          ? t.node?.path
          : t.kind === 'ref'
            ? t.ref
            : t.kind === 'element' ? t.address : (t.kind === 'entity' ? t.entity?.path : '')
      if (h && addr && String(addr).replace(/^pathos:/, '').endsWith(h)) return true
      return t.kind === 'entity' && prefix.value === 'entities' && id != null && String(t.entity?.id) === String(id)
    })
  })

  // ── SHARE ─────────────────────────────────────────────────────────────
  const share = () => { if (openShare && address.value) openShare(address.value) }

  // ── PIN ───────────────────────────────────────────────────────────────
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
        targetPath: address.value || null
      })
      emit('pins-changed')
    } catch (_) {
      pinsPromise = null
      await loadPins()
    }
    pinBusy.value = false
  }
  const pinAct = computed(() => (pinType.value ? {
    key: 'pin',
    icon: 'push_pin',
    title: pinned.value ? `Unpin this ${meta.value.kind}` : `Pin this ${meta.value.kind}`,
    on: pinned.value,
    disabled: pinBusy.value,
    onClick: togglePin
  } : null))
  const shareAct = computed(() => ({
    key: 'share',
    icon: 'ios_share',
    title: `Share this ${meta.value.kind} to a conversation`,
    hidden: !address.value,
    onClick: share
  }))
  const openAct = computed(() => ({
    key: 'open',
    icon: 'open_in_new',
    title: `Open this ${meta.value.kind} in the flyout viewer`,
    on: isOpen.value,
    onClick: openWindow
  }))

  // ── THE THREAD ────────────────────────────────────────────────────────
  const read = ref(null) // { comments, forks, supported } read here
  const totals = computed(() => {
    if (props.thread === false) return null
    if (props.thread && typeof props.thread === 'object') return props.thread
    return read.value
  })
  let seq = 0
  const loadTotals = async () => {
    if (props.thread !== null || !address.value) return
    const my = ++seq
    const [c, f] = await Promise.all([
      refService.comments(address.value, { limit: 1 }).catch(() => null),
      refService.forks(address.value, { limit: 1 }).catch(() => null)
    ])
    if (my !== seq) return
    read.value = {
      comments: c?.total ?? 0,
      forks: f?.total ?? 0,
      supported: { comments: c?.supported !== false && c != null, forks: f?.supported !== false && f != null }
    }
  }
  onMounted(loadTotals)
  watch(address, loadTotals)

  const composing = ref(false)
  const threadStats = computed(() => {
    const t = totals.value
    if (props.thread === false) return []
    const sup = t?.supported || { comments: true, forks: true }
    return [
      sup.comments !== false && {
        key: 'comments',
        icon: 'chat_bubble_outline',
        n: t ? (t.comments ?? 0) : null,
        title: `${t?.comments ?? '…'} comments — show / write`,
        door: true,
        on: props.threadOn === 'comments' || (!props.threadHost && composing.value)
      },
      sup.forks !== false && {
        key: 'forks',
        icon: 'alt_route',
        n: t ? (t.forks ?? 0) : null,
        title: `${t?.forks ?? '…'} forks — show`,
        door: true,
        on: props.threadOn === 'forks'
      }
    ].filter(Boolean)
  })
  const onStat = (key) => {
    if (props.threadHost) { emit('thread', key); return }
    if (key === 'comments') composing.value = !composing.value
    else openWindow()
  }
  const commentParent = computed(() => (address.value ? {
    kind: PARENT_KIND[prefix.value] || meta.value.kind,
    id: facts.value.id,
    hash: hash.value,
    address: address.value,
    label: facts.value.label || `${meta.value.kind} #${facts.value.id}`
  } : null))
  const closeComposer = () => { composing.value = false }
  const onCommented = () => {
    composing.value = false
    if (read.value) read.value = { ...read.value, comments: (read.value.comments || 0) + 1 }
  }

  return {
    meta,
    prefix,
    address,
    hash,
    isOwner,
    isOpen,
    openWindow,
    share,
    shareAct,
    openAct,
    pinned,
    pinAct,
    togglePin,
    totals,
    threadStats,
    onStat,
    composing,
    commentParent,
    closeComposer,
    onCommented
  }
}
