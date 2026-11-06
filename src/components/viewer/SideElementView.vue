<template>
  <!-- ── THE SIDE ELEMENT VIEW (2026-10-07, user ask: "a new component that
       is going to be used to render any kind of platform element inside the
       side viewer … take as a reference the current post card … extending
       it inside its container below the side viewer's friezebar … adjust
       the content on the header and the label section so it is slightly
       bigger … by default display the comments the item has … about 1/3 of
       the side viewer's height … if i click on the fork button of this new
       component, show the forks instead of the comments there").

       A COLUMN that fills the side viewer's well, wall to wall under the
       divider:
         · THE FACE (the remaining ~2/3): a POST is the postcard itself
           (`<FeedStream :embed-item>`, the flyout's post face) stretched to
           the well's width, its cap and label rail one step bigger; any
           other element is its kind's CARD (`ElementCard :address` — the
           card family, 2026-10-08; it was the kind's Mini, the flyout's
           element face, until then).
         · THE THREAD (1/3 of the height, `--sev-thread-h`): a bar with the
           two sections — COMMENTS (the default) and FORKS — each with its
           chain total, then the section's acts (comment / fork), then ONE
           paged list. The card's own foot doors (the comment and fork
           tallies) switch the same section, so "the fork button of this
           component" is either door.

       Everything here reads and writes through the server's HOLDER RULE
       (api/services/threadService.js): GET /refs/comments | /refs/forks for
       the page, POST /refs/comment for any kind the comment composer cannot
       route by id, the kind's own fork route for a fork. A kind whose
       schemas give it no COMMENTS / FORKS holder (moments, secrets,
       entities; forks of paths and links) shows its section `supported:
       false` — the act is not offered rather than offered and refused. -->
  <!-- ⭐ 2026-11-02 — SIDE BY SIDE (user ask: "we're displaying the element
       on a subsection on top and the comments/forks on a subsection below.
       This doesn't work very well. Please help me making the subsection
       separation horizontal instead of vertical and then, on the left, let's
       put the element, prioritizing the element is fully displayed, using all
       available height and width on the side viewer. make the layout
       slightly denser please. Then, we're going to have the feed-like section
       on the right … divided on 2 subsections: the fork/comments part on the
       top, and then the reference path below").

       A ROW now: THE FACE on the left takes every pixel the right column
       leaves — the card STRETCHED to the well's full height (its pit grows,
       a tall body scrolls inside it), never capped at its content height;
       THE SIDE on the right (`--sev-side-w`) stacks the THREAD box over the
       REFERENCES box (`SideReferences` — every element the item holds, as
       minis). The band no longer hangs off the card's foot: card, thread and
       references are three whole boxes with their own four corners. A narrow
       viewer (the phone strip, a squeezed track) stacks them instead — the
       face over the side, the side's two boxes side by side. -->
  <!-- ⭐ 2026-11-04 — THE SPLITS (user ask: "we want to be able to modify the
       proportion between the content container and the comments/reference
       section (horizontally), and also between the comments and the
       references section (vertically) … dividing those sections using thin
       bars made like the checkered frieze bar on the side viewer header. Use
       the lips, but make them thinner and then for the inner pattern … a
       single thin line … that color that represents the viewed element").
       The three sections stand FLUSH now — no well padding, no gaps: two
       draggable dividers (`__split`) part them, each the header rail's
       material thinned to 1px cream lips round a 1px line in the kind's ink
       (`--side-viewer-plate`), wall to wall with bare ends like the rail.
       A drag sets a SHARE (a fraction of the box it divides) per axis,
       remembered in this browser (`pathos_side_split`); a double-click or
       Home puts the default back; arrows step it 2%. -->
  <div class="side-element" :class="{ 'is-fill': fills, 'is-splitting': !!dragging }">
    <div ref="layoutEl" class="side-element__layout" :style="splitStyle">
    <div class="side-element__face" :class="{ 'is-skeleton': skeletonOn }">
      <FeedStream
        v-if="card"
        :key="'sev:' + card.skeleton_id"
        class="side-element__card"
        :embed-item="card"
        :thread-on="section"
        thread-host
        @select="$emit('select', $event)"
        @pins-changed="$emit('pins-changed')"
        @thread="(_, slot) => show(slot)"
      />
      <!-- ⭐ 2026-10-08 — THE CARD FAMILY (user ask: "use this card on the
           side viewer instead of the mini components. The Cards should be
           more enriched and full, while mini components are meant for
           quick visualization"): any other element is its kind's CARD
           (`shared/ElementCard` — the post card's grammar around the
           element's full reading), the band's totals handed to its foot
           doors, its open doors spawning WINDOWS through the viewer
           (`window-host` → `select`), a filling kind (the label's unravel)
           asking for its full-height viewer through `resolved`. -->
      <div v-else-if="el" class="side-element__card-host">
        <ElementCard
          :key="'sev:' + el.address"
          :address="el.address"
          :thread="threadTotals"
          :thread-on="section"
          thread-host
          window-host
          :fill="fills"
          @select="$emit('select', $event)"
          @thread="show"
          @pins-changed="$emit('pins-changed')"
          @resolved="onResolved"
        />
      </div>
      <!-- ⭐ 2026-11-06 — THE SKELETON FACE, IN PLACE (user ask: "make sure
           they're displayed inside the side viewer content viewer section. i
           do not want u to open a flyout window. just change the icon on the
           header like the button the flyout does"): the card's skeleton door
           (useElementCard `skeletonAct` / FeedStream's cap cell) flips
           `skeletonOn` through the `cardSkeletonFace` seam provided here; the
           card folds to its CAP (its door now wearing the element's glyph,
           the flyout switch's grammar) and the flyout's skeleton face fills
           the rest of the face in a pit. The card stays mounted, so flipping
           back is instant. -->
      <div v-if="skeletonOn && el" class="side-element__skeleton">
        <SideSkeletonFace :item="card" :address="el.address" />
      </div>
    </div>

    <div
      v-if="el"
      class="side-element__split side-element__split--side"
      :class="{ 'is-dragging': dragging === 'side' }"
      role="separator"
      tabindex="0"
      :aria-orientation="axes.side === 'x' ? 'vertical' : 'horizontal'"
      :aria-valuenow="shareNow('side')"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-label="Resize the element and the column beside it"
      title="Drag to resize · double-click to reset"
      @pointerdown="beginSplit('side', $event)"
      @dblclick="resetSplit('side')"
      @keydown="keySplit('side', $event)"
    />

    <aside v-if="el" ref="sideEl" class="side-element__side" aria-label="Around this element">
    <section ref="threadEl" class="side-element__thread" aria-label="Comments and forks">
      <header class="side-element__bar">
        <button
          v-for="s in SECTIONS" :key="s.key"
          type="button"
          class="side-element__tab"
          :class="{ 'is-on': section === s.key }"
          :aria-pressed="section === s.key"
          :title="s.word"
          @click="show(s.key)"
        >
          <q-icon :name="s.icon" size="13px" />
          <span class="side-element__tab-word">{{ s.word }}</span>
          <span class="side-element__tab-n">{{ totals[s.key] ?? '·' }}</span>
        </button>
        <span class="side-element__bar-fill" />
        <button
          v-if="section === 'comments' && supported.comments && !composing"
          type="button" class="side-element__act"
          title="Write a comment" @click="openComposer"
        >
          <q-icon name="add_comment" size="13px" /><span>Comment</span>
        </button>
        <button
          v-if="section === 'forks' && canFork && !forkConfirm"
          type="button" class="side-element__act"
          :title="'Fork this ' + kindWord" @click="forkConfirm = true"
        >
          <q-icon name="alt_route" size="13px" /><span>Fork</span>
        </button>
      </header>

      <!-- Writing takes the WHOLE box (the ask: "use the available space of
           the comment section … the comment maker embedded on the comment
           section"): the CommentMaker family's `fill` member, in place of the
           list until it posts or cancels. -->
      <div v-if="composing && parent" class="side-element__compose">
        <CommentMaker variant="fill" :parent="parent" @posted="onPosted" @cancel="closeComposer" />
      </div>
      <div v-show="!composing" ref="listEl" class="side-element__list">
        <div v-if="forkConfirm" class="side-element__composer">
          <ForkConfirmPanel :kind="kindWord" :loading="forking" @cancel="forkConfirm = false" @confirm="doFork" />
          <div v-if="forkError" class="side-element__note is-error">{{ forkError }}</div>
        </div>

        <template v-if="!supported[section]">
          <div class="side-element__note">
            {{ kindWord === 'element' ? 'This element' : 'A ' + kindWord }} does not take {{ section }}.
          </div>
        </template>
        <!-- ⭐ 2026-11-04 — THE THREAD IS ITS PATH (user ask: "for the
             comment, forks and references on the side viewer, instead of the
             weird design used to display them currently, help me using the
             same family that is used inside the skeleton viewers to represent
             paths … keep the representation of the same things consistent" +
             "attach the voting section on the footer of the family … thumbs
             up and down"). A section's items ARE a chain path — the holder
             rule's COMMENTS / FORKS slot (`pathRef` on GET /refs/comments |
             forks) — so the section draws that path the way a skeleton
             viewer draws a bound path: its PathMini, vertical, enriched
             (each member its Mini, a link chip on every bond, the family's
             own paging), the thumbs on every member's foot (MiniVotesScope).
             Keyed by the section's total, so a comment or fork landing here
             re-walks it. The comment cards (PostCommentItem) left this box. -->
        <!-- ⭐ 2026-11-06 — THE REFERENCES' LIST (user ask: "for the
             comments, please make sure we're using the same kind of viewer
             component as the ones we're using on the references section …
             The current one's aesthetic comes from a old place"): the
             holder path's PathMini (2026-11-04) left this box; each comment
             (a post) and each fork is its kind's MINI in SideMiniList, the
             very list SideReferences draws — the thumbs on every foot, a
             locked row as its chip, "+N more" paging the chain. -->
        <SideMiniList
          v-else
          :items="rowsOf(section)"
          :loading="loading || paging"
          :error="listError"
          :empty="forkConfirm ? '' : (section === 'comments' ? 'No comments yet.' : 'No forks yet.')"
          :more="Math.max((totals[section] || 0) - lists[section].length, 0)"
          @more="loadMore"
        />
      </div>
    </section>

    <div
      class="side-element__split side-element__split--thread"
      :class="{ 'is-dragging': dragging === 'thread' }"
      role="separator"
      tabindex="0"
      :aria-orientation="axes.thread === 'x' ? 'vertical' : 'horizontal'"
      :aria-valuenow="shareNow('thread')"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-label="Resize the comments and the references"
      title="Drag to resize · double-click to reset"
      @pointerdown="beginSplit('thread', $event)"
      @dblclick="resetSplit('thread')"
      @keydown="keySplit('thread', $event)"
    />

    <SideReferences
      :key="'refs:' + el.address"
      class="side-element__refs"
      :address="el.address"
      :kind-word="kindWord"
    />
    </aside>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch, provide, onMounted, onBeforeUnmount } from 'vue'
import FeedStream from 'src/components/posts/FeedStream.vue'
import ElementCard from 'src/components/shared/ElementCard.vue'
import CommentMaker from 'src/components/comments/CommentMaker.vue'
import ForkConfirmPanel from 'src/components/nodes/ForkConfirmPanel.vue'
import SideReferences from 'src/components/viewer/SideReferences.vue'
import SideMiniList from 'src/components/viewer/SideMiniList.vue'
import SideSkeletonFace from 'src/components/viewer/SideSkeletonFace.vue'
import { refService } from 'src/services/ref.service'
import { skeletonService } from 'src/services/skeleton.service'
import { nodeService } from 'src/services/node.service'
import { labelService } from 'src/services/label.service'
import { useMakerStore } from 'src/stores/maker'
import { useFlyoutViewersStore } from 'src/stores/flyoutViewers'

const SECTIONS = [
  { key: 'comments', word: 'Comments', icon: 'chat_bubble_outline' },
  { key: 'forks', word: 'Forks', icon: 'alt_route' }
]
// The maker's comment-parent kind per element prefix (PostMakerSurface
// routes node → its route, the skeleton family → the skeleton route, any
// other kind → POST /refs/comment by address).
const PARENT_KIND = { skeletons: 'skeleton', nodes: 'node', labels: 'label', paths: 'path', links: 'link' }
// One page of a thread section (the references page 12; a conversation 20).
const THREAD_PAGE = 20
const WORD = { skeletons: 'skeleton', nodes: 'node', labels: 'label', paths: 'path', links: 'link', moments: 'moment', secrets: 'secret', entities: 'entity' }

// ── THE SPLITS (2026-11-04). Two dividers, each with a SHARE per axis — the
// layout flips with the viewer's width (container queries below), so the
// side's share across a row (x) and down a stack (y) are two numbers, and
// so are the thread's. A share is the fraction of the dividing box the
// SECOND pane takes for `side` (the column beside the face) and the FIRST
// for `thread` (the thread over / beside the references). Remembered per
// browser — a viewer convenience, never state anyone else needs.
const SPLIT_KEY = 'pathos_side_split'
// The floors a drag (and the CSS clamp on a stored share) keeps, in px.
const SPLIT_MIN = {
  side: { x: [200, 240], y: [90, 120] }, // [the side's floor, the face's floor]
  thread: { x: [140, 140], y: [32, 72] } // [the thread's floor, the references' floor]
}
const readSplit = () => {
  try {
    const s = JSON.parse(localStorage.getItem(SPLIT_KEY) || '{}')
    return (s && typeof s === 'object') ? s : {}
  } catch (_) { return {} }
}
const pct = (f) => (Math.round(f * 10000) / 100) + '%'

export default defineComponent({
  name: 'SideElementView',
  components: { FeedStream, ElementCard, CommentMaker, ForkConfirmPanel, SideReferences, SideMiniList, SideSkeletonFace },
  props: {
    // A feed item (`GET /feed` row) — the element is that POST, drawn as
    // its postcard. Either this or `address`.
    item: { type: Object, default: null },
    // Any element as '<kind>/<hash>' — drawn as its kind's Card.
    address: { type: String, default: '' },
    // The section to open with ('comments' default, 'forks').
    initialSection: { type: String, default: 'comments' }
  },
  emits: ['select', 'pins-changed'],
  setup (props) {
    const maker = useMakerStore()
    const flyouts = useFlyoutViewersStore()

    // The card is a local COPY of the feed row so its foot tallies can
    // follow the chain as comments and forks land here.
    const card = ref(props.item ? { ...props.item } : null)
    const el = ref(null) // { kind, id, hash, address, primary }

    const resolve = async () => {
      if (props.item) {
        const hash = String(props.item.skeleton_path || '').split('/').pop()
        el.value = { kind: 'skeletons', id: props.item.skeleton_id, hash, address: 'skeletons/' + hash, primary: props.item.title }
        return
      }
      if (!props.address) { el.value = null; return }
      try {
        const r = await refService.summary(props.address)
        const s = r?.summary || r
        el.value = s?.kind
          ? { kind: s.kind, id: s.id, hash: s.hash, address: s.address || `${s.kind}/${s.hash}`, primary: s.primary }
          : null
      } catch (_) { el.value = null }
    }

    const kindWord = computed(() => (props.item ? 'post' : WORD[el.value?.kind]) || 'element')

    // ── THE FACE SWITCH (2026-11-06 — the template note at
    // `.side-element__skeleton`): element | skeleton, this view's own. The
    // card's skeleton door reads + flips it through `cardSkeletonFace`
    // (useElementCard / FeedStream take it for the face's card alone); a new
    // element opens on its element face.
    const skeletonOn = ref(false)
    provide('cardSkeletonFace', { on: skeletonOn, toggle: () => { skeletonOn.value = !skeletonOn.value } })

    const section = ref(props.initialSection === 'forks' ? 'forks' : 'comments')
    const totals = ref({ comments: null, forks: null })
    const supported = ref({ comments: true, forks: true })
    // ⭐ 2026-11-04: each section's HOLDER PATH (`pathRef`, 'paths/<hash>') —
    // drawn as its PathMini until 2026-11-06; kept as the record's address
    // now that the rows are SideMiniList's (`lists` below).
    const pathRefs = ref({ comments: null, forks: null })
    const loading = ref(false)
    const listEl = ref(null)

    // ⭐ 2026-11-06: each section's ROWS — the thread draws them as
    // SideMiniList (the references' list), paged off the same reads.
    const lists = ref({ comments: [], forks: [] })
    const paging = ref(false)
    const listError = ref('')
    // A thread row → SideMiniList's row: a skeleton target (a comment, a
    // post fork) names itself by `path`, a node / label fork by `address`.
    const rowsOf = (slot) => lists.value[slot].map((it, i) => {
      const address = String(it.address || it.path || '').replace(/^pathos:/, '')
      return { key: slot + ':' + (address || i) + ':' + i, address, locked: !!it.locked }
    }).filter((r) => r.address)
    const readSlot = (slot, offset) => (slot === 'forks'
      ? refService.forks(el.value.address, { limit: THREAD_PAGE, offset })
      : refService.comments(el.value.address, { limit: THREAD_PAGE, offset }))

    // BOTH sections in one go (the bar shows both tallies): each section's
    // first page, its total, its support verdict and its holder path.
    let seq = 0
    const reload = async () => {
      if (!el.value) return
      const my = ++seq
      loading.value = true
      listError.value = ''
      const [c, f] = await Promise.all([
        readSlot('comments', 0).catch(() => null),
        readSlot('forks', 0).catch(() => null)
      ])
      if (my !== seq) return
      totals.value = { comments: c?.total ?? 0, forks: f?.total ?? 0 }
      supported.value = { comments: c?.supported !== false, forks: f?.supported !== false }
      pathRefs.value = { comments: c?.pathRef || null, forks: f?.pathRef || null }
      lists.value = { comments: c?.items || [], forks: f?.items || [] }
      if (!c && !f) listError.value = 'The thread could not be read'
      if (card.value) {
        card.value = { ...card.value, comment_count: totals.value.comments, fork_count: totals.value.forks }
      }
      loading.value = false
    }

    // "+N more": the open section's next page, appended.
    const loadMore = async () => {
      if (!el.value || paging.value) return
      const slot = section.value
      const my = seq
      paging.value = true
      try {
        const r = await readSlot(slot, lists.value[slot].length)
        if (my === seq) lists.value = { ...lists.value, [slot]: lists.value[slot].concat(r?.items || []) }
      } catch (e) {
        if (my === seq) listError.value = e?.response?.data?.error?.message || 'The next page could not be read'
      }
      paging.value = false
    }

    const show = (slot) => {
      const next = slot === 'forks' ? 'forks' : 'comments'
      if (next === section.value) return
      section.value = next
      forkConfirm.value = false
      if (listEl.value) listEl.value.scrollTop = 0
    }

    // ── the comment composer: the CommentMaker family's `fill` member,
    // in the band itself — no dock draft, no window.
    const composing = ref(false)
    const parent = computed(() => el.value && {
      kind: props.item ? 'post' : (PARENT_KIND[el.value.kind] || el.value.kind.replace(/s$/, '')),
      id: el.value.id,
      hash: el.value.hash,
      address: el.value.address,
      label: el.value.primary || (kindWord.value + ' #' + el.value.id)
    })
    const openComposer = () => {
      if (!el.value) return
      if (section.value !== 'comments') show('comments')
      forkConfirm.value = false
      composing.value = true
    }
    const closeComposer = () => { composing.value = false }
    const onPosted = () => {
      composing.value = false
      reload()
    }
    // A comment on THIS element posted from anywhere else (the dock, a
    // flyout) re-reads the page too.
    watch(() => maker.lastPosted?.at, () => {
      const p = maker.lastPosted?.parent
      if (!p || !el.value || composing.value) return
      if (p.id === el.value.id || (p.hash && p.hash === el.value.hash)) reload()
    })

    // ── fork: the kind's own route (each registers the fork on the
    // source's FORKS chain server-side); the new fork opens in its window.
    const forkConfirm = ref(false)
    const forking = ref(false)
    const forkError = ref('')
    // A FILLING face (2026-10-07: the label's unravel viewer) asks its card
    // for the full-height viewer inside it; since 2026-11-02 every card
    // stretches to the face's height anyway (the styles). The card says
    // which it is once its kind resolves (`ElementCard` → `resolved`).
    const fills = ref(false)
    const onResolved = ({ fills: f } = {}) => { fills.value = !card.value && !!f }

    // The band's totals, handed to the card's foot doors so the card and
    // the band state one count (the feed card gets them patched into its
    // row; the family's cards read them as `thread`).
    const threadTotals = computed(() => ({
      comments: totals.value.comments,
      forks: totals.value.forks,
      supported: supported.value
    }))

    const canFork = computed(() => supported.value.forks &&
      ['skeletons', 'nodes', 'labels'].includes(el.value?.kind))
    const doFork = async () => {
      if (!el.value || forking.value) return
      forking.value = true
      forkError.value = ''
      try {
        const k = el.value.kind
        const r = k === 'nodes'
          ? await nodeService.forkOfNode(el.value.id, {})
          : k === 'labels'
            ? await labelService.fork(el.value.id, {})
            : await skeletonService.forkOf(el.value.id, {})
        if (!r?.success) throw new Error(r?.error?.message || 'The fork was refused')
        forkConfirm.value = false
        const made = r.skeleton?.path || r.node?.path || r.label?.path
        if (made) flyouts.spawnRef(made)
        await reload()
      } catch (e) {
        forkError.value = e?.response?.data?.error?.message || e?.message || 'The fork failed'
      }
      forking.value = false
    }

    watch(() => [props.item?.skeleton_id, props.address], async () => {
      card.value = props.item ? { ...props.item } : null
      skeletonOn.value = false
      pathRefs.value = { comments: null, forks: null }
      lists.value = { comments: [], forks: [] }
      listError.value = ''
      composing.value = false
      forkConfirm.value = false
      fills.value = false
      await resolve()
      await reload()
    }, { immediate: true })

    watch(() => props.initialSection, (s) => show(s))

    // ── THE SPLITS (2026-11-04 — the notes at SPLIT_KEY above) ────────────
    const layoutEl = ref(null)
    const sideEl = ref(null)
    const threadEl = ref(null)
    const split = ref(readSplit()) // { side: { x, y }, thread: { x, y } }
    const dragging = ref('')
    // Which way each divider runs right now: `x` = it parts a ROW (the bar
    // is vertical, a sideways drag), `y` = it parts a STACK. Read off the
    // live flex direction the container queries set, so the thresholds
    // stay written once (in the styles).
    const axes = ref({ side: 'x', thread: 'y' })
    const axisOf = (box) => (box && getComputedStyle(box).flexDirection.startsWith('row')) ? 'x' : 'y'
    const readAxes = () => {
      axes.value = { side: axisOf(layoutEl.value), thread: sideEl.value ? axisOf(sideEl.value) : 'y' }
    }
    let ro = null
    onMounted(() => {
      readAxes()
      if (typeof ResizeObserver !== 'undefined' && layoutEl.value) {
        ro = new ResizeObserver(readAxes)
        ro.observe(layoutEl.value)
      }
    })
    onBeforeUnmount(() => { if (ro) ro.disconnect() })
    watch(el, () => setTimeout(readAxes, 0))

    // The stored shares → the layout's dials. Each share is clamped again
    // in CSS against the box it divides, so a share taken in a wide viewer
    // never squeezes a pane under its floor once the viewer narrows.
    const splitStyle = computed(() => {
      const s = split.value
      const out = {}
      const [sx0, sx1] = SPLIT_MIN.side.x
      const [sy0, sy1] = SPLIT_MIN.side.y
      const [tx0, tx1] = SPLIT_MIN.thread.x
      const [ty0, ty1] = SPLIT_MIN.thread.y
      if (s.side?.x != null) out['--sev-side-w'] = `clamp(${sx0}px, ${s.side.x * 100}cqw, calc(100cqw - ${sx1}px))`
      if (s.side?.y != null) out['--sev-side-h'] = `clamp(${sy0}px, ${s.side.y * 100}cqh, calc(100cqh - ${sy1}px))`
      if (s.thread?.y != null) {
        out['--sev-thread-flex-y'] = `0 0 clamp(${ty0}px, ${pct(s.thread.y)}, calc(100% - ${ty1}px))`
        out['--sev-thread-max-y'] = 'none'
      }
      if (s.thread?.x != null) out['--sev-thread-flex-x'] = `0 0 clamp(${tx0}px, ${pct(s.thread.x)}, calc(100% - ${tx1}px))`
      return out
    })
    const saveSplit = () => {
      try { localStorage.setItem(SPLIT_KEY, JSON.stringify(split.value)) } catch (_) { /* a private window keeps it for the session */ }
    }
    const setShare = (which, axis, f) => {
      split.value = { ...split.value, [which]: { ...(split.value[which] || {}), [axis]: Math.round(f * 10000) / 10000 } }
    }
    // The box a divider parts, and the pane whose size IS the share.
    const boxOf = (which) => which === 'side' ? layoutEl.value : sideEl.value
    const paneOf = (which) => which === 'side' ? sideEl.value : threadEl.value
    const sizeOf = (node, axis) => {
      const r = node.getBoundingClientRect()
      return axis === 'x' ? r.width : r.height
    }
    // A pane size in px → a share, held between the two panes' floors.
    const shareFor = (which, axis, size, boxSize, barT) => {
      const [lo0, hi0] = SPLIT_MIN[which][axis]
      const hi = boxSize - barT - hi0
      const px = Math.max(Math.min(lo0, hi), Math.min(hi, size))
      return boxSize > 0 ? px / boxSize : 0
    }

    const beginSplit = (which, e) => {
      if (e.button !== 0) return
      const bar = e.currentTarget
      const box = boxOf(which)
      const pane = paneOf(which)
      if (!box || !pane) return
      e.preventDefault()
      const axis = axisOf(box)
      const boxSize = sizeOf(box, axis)
      const barT = sizeOf(bar, axis)
      const start = sizeOf(pane, axis)
      const p0 = axis === 'x' ? e.clientX : e.clientY
      // The side is the SECOND pane (dragging toward it shrinks it); the
      // thread the FIRST (dragging away grows it).
      const sign = which === 'side' ? -1 : 1
      try { bar.setPointerCapture(e.pointerId) } catch (_) { /* old engines: the listeners still run */ }
      dragging.value = which
      const move = (ev) => {
        const d = (axis === 'x' ? ev.clientX : ev.clientY) - p0
        setShare(which, axis, shareFor(which, axis, start + sign * d, boxSize, barT))
      }
      const end = () => {
        bar.removeEventListener('pointermove', move)
        bar.removeEventListener('pointerup', end)
        bar.removeEventListener('pointercancel', end)
        dragging.value = ''
        saveSplit()
      }
      bar.addEventListener('pointermove', move)
      bar.addEventListener('pointerup', end)
      bar.addEventListener('pointercancel', end)
    }

    // Back to the layout's own proportion — for the axis the divider runs
    // on now (the other axis keeps whatever it was given).
    const resetSplit = (which) => {
      const axis = axes.value[which]
      const next = { ...(split.value[which] || {}) }
      delete next[axis]
      split.value = { ...split.value, [which]: next }
      saveSplit()
    }

    // The keyboard: arrows step the BAR 2% of its box (toward the start —
    // left / up — or the end), Home resets.
    const keySplit = (which, e) => {
      const axis = axes.value[which]
      if (e.key === 'Home') { e.preventDefault(); resetSplit(which); return }
      const back = axis === 'x' ? 'ArrowLeft' : 'ArrowUp'
      const fwd = axis === 'x' ? 'ArrowRight' : 'ArrowDown'
      if (e.key !== back && e.key !== fwd) return
      e.preventDefault()
      const box = boxOf(which)
      const pane = paneOf(which)
      if (!box || !pane) return
      const boxSize = sizeOf(box, axis)
      const bar = e.currentTarget
      const step = 0.02 * boxSize * (e.key === fwd ? 1 : -1) * (which === 'side' ? -1 : 1)
      setShare(which, axis, shareFor(which, axis, sizeOf(pane, axis) + step, boxSize, sizeOf(bar, axis)))
      saveSplit()
    }
    const shareNow = (which) => {
      const f = split.value[which]?.[axes.value[which]]
      return f == null ? undefined : Math.round(f * 100)
    }

    return {
      layoutEl,
      sideEl,
      threadEl,
      dragging,
      axes,
      splitStyle,
      beginSplit,
      resetSplit,
      keySplit,
      shareNow,
      SECTIONS,
      skeletonOn,
      fills,
      onResolved,
      threadTotals,
      card,
      el,
      kindWord,
      section,
      pathRefs,
      lists,
      rowsOf,
      paging,
      listError,
      loadMore,
      totals,
      supported,
      loading,
      listEl,
      reload,
      show,
      composing,
      parent,
      openComposer,
      closeComposer,
      onPosted,
      forkConfirm,
      forking,
      forkError,
      canFork,
      doFork
    }
  }
})
</script>

<style scoped lang="scss">
// ── THE ROW (2026-11-02). `.side-element` fills the side viewer's well and
// is a SIZE container; `__layout` inside it is the row — the face and the
// side, both the well's full height — because a container query styles a
// container's DESCENDANTS, never the container itself: the queries below
// read `.side-element`'s width and stack `__layout` when the viewer is too
// narrow to hold a card beside a column. Dense: 8px between the boxes (the
// well's own pad came down to 8 with it).
.side-element {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  display: flex;
  container-type: size;
  // NAMED (2026-11-04): the narrow queries below also restyle the CARD
  // (`:deep(.post-square)`), whose nearest container is one of FeedStream's
  // own — an unnamed query read THAT box (≈ the face's width, always under
  // 620) and squared the card's corner on a wide viewer.
  container-name: side-element;
  // ⭐ 2026-11-04 — ONE FLOOR, ONE CORNER (user ask: "the background color
  // for all 3 sections is the same as the content container on the bigger
  // section, on the same tone of grey … the aesthetic of the three sections
  // consistent"; "remove the outer padding around them and make their corner
  // roundness match the roundness of their containers").
  //   `--sev-floor`  the post card's PIT coat (`--pit-coat`, grey-1) — the
  //                  floor of the face, the thread and the references alike
  //                  (the two side boxes stood on grey-2 until today).
  //   `--sev-r`      the corner a section's box takes where it meets the
  //                  VIEWER's own rounded corner — the viewer's radius seen
  //                  from inside its 1px rim (`--side-viewer-inner-r`: the
  //                  flyout coat's 10px less the rim = 9px; 0 on the phone
  //                  strip, which is square). Every corner a
  //                  box turns against a divider or the header rail is
  //                  square: the sections stand flush, so a rounded corner
  //                  there would open a notch of the viewer's grey.
  --sev-floor: var(--grey-1, #fafafa);
  --sev-r: var(--side-viewer-inner-r, 9px);
  // ⭐ THE FRAME (2026-11-04, user ask: "the content container … a grey
  // layout outside the content container and then a white inner content
  // container with slightly rounded corners … apply the gray frame onto the
  // other sections on the right so they look consistent"): every section is
  // the CARD's grammar — a grey FRAME (`--sev-frame`, the card's own coat,
  // grey-4) with its head on it and its content in a PIT (`--sev-floor`,
  // a 1px grey-5 rim, `--sev-pit-r` = the card's `--pit-r`, set
  // `--sev-pit-m` inside the frame — the card pit's own 3px 4px 4px).
  --sev-frame: var(--card-coat, var(--grey-4, #e0e0e0));
  --sev-pit-r: 6.34px;
  --sev-pit-m: 3px 4px 4px;
}
// While a divider is dragged: no text selection, and no embed (an iframe is
// another document) may swallow the pointer under the moving bar.
.side-element.is-splitting {
  user-select: none;
  :deep(iframe) { pointer-events: none; }
}
.side-element__layout {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: row;
  // ⭐ 2026-11-04 — no gap: the DIVIDERS part the sections (8px of the
  // viewer's grey stood between them since 2026-11-02).
  gap: 0;
  // THE SIDE'S WIDTH — the element first (the ask: "prioritizing the element
  // is fully displayed"): ~36% of the viewer, never under 240px (a comment
  // card's floor) nor over 380px (past that the face gives up reading width
  // for a list). A DRAG replaces it (`splitStyle`, inline on this element:
  // the stored share, clamped to the floors). THE THREAD — by default its
  // content's height, at most half the side (an empty thread is its bar and
  // one line), the references taking everything it leaves; a drag gives it
  // a fixed share instead (`--sev-thread-flex-y` + `--sev-thread-max-y`).
  --sev-side-w: clamp(240px, 36cqw, 380px);
}

// THE FACE — every pixel the side leaves, the card stretched to its height.
.side-element__face {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--sev-frame);
}

// ── THE SKELETON FACE (2026-11-06): the card folds to its cap — every
// other child of the card hidden, nothing stretched — and the skeleton's
// pit takes the face's remaining height, on the frame like the other two
// sections' pits. The card stays mounted under the fold.
.side-element__face.is-skeleton {
  .side-element__card,
  .side-element__card-host { flex: 0 0 auto; }
  .side-element__card :deep(.feed-stream__well),
  .side-element__card :deep(.feed-stream),
  .side-element__card :deep(.feed-stream__block),
  .side-element__card :deep(.post-square),
  .side-element__card-host > :deep(.element-card-host),
  .side-element__card-host > :deep(.element-card-host > .element-card) { flex: 0 0 auto; }
  .side-element__card :deep(.post-square > :not(.post-square__cap)),
  .side-element__card-host :deep(.element-card > :not(.element-card__cap)) { display: none; }
  .side-element__card :deep(.post-square),
  .side-element__card-host :deep(.element-card) { border-radius: 0; }
}
.side-element__skeleton {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  overflow: auto;
  margin: var(--sev-pit-m, 3px 4px 4px);
  background: var(--sev-floor, var(--grey-1, #fafafa));
  border: 1px solid var(--grey-5, #bdbdbd);
  border-radius: var(--sev-pit-r, 6.34px);
  padding: 6px;
  scrollbar-width: thin;
}

// ── THE CORNERS (2026-11-04). The card fills its section to the edge now,
// so it turns where the section turns: square under the header rail and
// against the divider, the viewer's own corner at the bottom left. (The
// card's PIT keeps its 6.34 — it is the card's inner box, not the
// section's.) A face with no column beside it (an element still resolving)
// owns both bottom corners.
.side-element__card :deep(.post-square),
.side-element__card-host :deep(.element-card) {
  border-radius: 0 0 0 var(--sev-r);
}
.side-element__face:only-child .side-element__card :deep(.post-square),
.side-element__face:only-child .side-element__card-host :deep(.element-card) {
  border-radius: 0 0 var(--sev-r) var(--sev-r);
}
// NO INNER RING (2026-11-04, user ask: "remove the subtle inner white
// border"): the card's veil (`::before`, the frosted sheet over its coat)
// carries a 1px grey-1 ring at 7px corners — inside a flush, square-cornered
// section it read as a white hairline inside the rim and notched the three
// square corners. Here the veil keeps its job but drops the ring and turns
// with the card.
.side-element__card :deep(.post-square)::before,
.side-element__card-host :deep(.element-card)::before {
  border: 0;
  border-radius: inherit;
}

// ── THE DIVIDERS (2026-11-04, user ask — the template note): the header
// rail's material, thinned. The rail is 2px cream LIPS round a 3-row
// checker in the kind's ink; a divider is 1px lips (`--plaque-flat`, the
// coat as one flat colour — a border takes a <color>, never the coat's
// layer list) round ONE 1px line in that same ink (`--side-viewer-plate`,
// set by SideViewer per shown kind), 3px in all, running wall to wall with
// bare ends like the rail. It meets the boxes' own grey-5 rims on both
// faces, so it reads rim · lip · line · lip · rim — the rail's sandwich.
// The grab is wider than the paint: `::before` reaches 4px over each
// neighbour, so a 3px bar is still easy to take. Hover, focus and a drag
// light the line in the kind's own colour (the rail's lip line).
.side-element__split {
  --sev-split-lip: 1px;
  --sev-split-line: 1px;
  // The grab's reach past each face: 4px beyond the PAINT — an absolute
  // pseudo is placed from the padding box, inside the lips, so the lip is
  // added back or the reach comes up a pixel short on both sides.
  --sev-split-grab: calc(-4px - var(--sev-split-lip));
  position: relative;
  z-index: 4;
  flex: 0 0 calc(2 * var(--sev-split-lip) + var(--sev-split-line));
  align-self: stretch;
  box-sizing: border-box;
  min-width: 0;
  min-height: 0;
  background: var(--side-viewer-plate, var(--indigo-10, #1a237e));
  border: 0 solid var(--plaque-flat, #f8f2e4);
  touch-action: none;
  outline: none;
  transition: background-color 0.15s;
  &::before {
    content: '';
    position: absolute;
  }
  &:hover,
  &:focus-visible,
  &.is-dragging {
    background: var(--side-viewer-lip, var(--indigo-6, #3949ab));
  }
}
// A bar between two panes side by side (a sideways drag) …
@mixin sev-split-x {
  cursor: col-resize;
  border-width: 0 var(--sev-split-lip);
  &::before { top: 0; bottom: 0; left: var(--sev-split-grab); right: var(--sev-split-grab); }
}
// … and one between two stacked panes.
@mixin sev-split-y {
  cursor: row-resize;
  border-width: var(--sev-split-lip) 0;
  &::before { left: 0; right: 0; top: var(--sev-split-grab); bottom: var(--sev-split-grab); }
}
.side-element__split--side { @include sev-split-x; }
.side-element__split--thread { @include sev-split-y; }

// THE CARD AT FULL HEIGHT. The post card is FeedStream's embed (pane → well
// → stream → block → `.post-square`), each a content-height column; flexed
// here, from the host, so the square takes the face's height and its pit
// takes the stretch (`.post-square__pit` is `flex: 1 1 auto`). The square's
// own ceiling (`--post-ceiling`, 100cqh in an embed) is lifted — the face
// bounds it — and a tall body scrolls inside the pit, never the face.
.side-element__card {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
}
.side-element__card :deep(.feed-stream__well) {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.side-element__card :deep(.feed-stream),
.side-element__card :deep(.feed-stream__block) {
  flex: 1 1 auto;
  min-height: 0;
}
.side-element__card :deep(.post-square) {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none;
}
// …and its MEDIA BUDGET is the pit (2026-11-02 — the X-Cards' note on
// `.side-element__card-host`): the feed's `ceiling − 249` left a quoted
// Instagram post 80px short of a pit that had the room. The pit is a size
// container here, so `100cqh` is its own inner height; a quoted medium
// gets that less its Mini's chrome (head + label strip + well rims, 61px
// measured on a NodeMini), so a post whose body is one embed fills the pit.
.side-element__card :deep(.post-square__pit) {
  overflow-y: auto;
  container-type: size;
  --media-max-h: calc(100cqh - 61px);
}

// The card host: a column the card stretches inside (its pit scrolls),
// never a scroller of its own — a card scrolling inside a scroller is two
// bars. Every kind's card fills it (`.element-card-host--fill` is only the
// labels' own ask; the stretch here is the face's, for all of them).
.side-element__card-host {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  > :deep(.element-card-host) { flex: 1 1 auto; min-height: 0; }
  > :deep(.element-card-host > .element-card) { flex: 1 1 auto; min-height: 0; }
  // THE MEDIA BUDGET IS THE PIT (2026-11-02, user ask, on an Instagram node:
  // "not properly extended inside its container. it looks cutted off …
  // taking advantage of all available space"). A card's media budget is
  // `--element-card-media` (60vh) less the feed card's chrome — sized for a
  // card in a list, so in this stretched face a tall embed (Instagram ≈ 700
  // reported) found a ~290px budget, past EmbedFrame's shrink floor, and
  // drew full size in a SCROLLING box over an empty pit. Here the budget is
  // what the face really leaves: the view's height (`100cqh` — the nearest
  // size container is `.side-element`) for a prose pit, and for a FIGURE
  // pit (`pit-fit` — a node that IS its medium) the pit itself, made a size
  // container so `100cqh` reads its own box, less its figure's 6px pads. A
  // fit embed then lands whole (natively, or shrunk ≤ a fifth) wherever the
  // pit can hold it. A web link's figure also prints its address under the
  // frame (NodeContentViewer `.ncv-link`, 20px + the frame's 4px margin) —
  // that line comes off the budget so it stays in view.
  --element-card-media: 100cqh;
  :deep(.element-card__pit--fit) {
    container-type: size;
    --media-max-h: calc(100cqh - 12px);
  }
  :deep(.element-card__pit--fit:has(.ncv-link)) {
    --media-max-h: calc(100cqh - 12px - 24px);
  }
}

// ONE STEP BIGGER on the cap and the label rail (2026-10-07, the ask:
// "adjust the content on the header and the label section so it is
// slightly bigger"). The card's own dials, set on its root from outside:
// `--cap-scale` 0.62 → 0.7 (the strip: kind marks, origin words, acts) and
// `--cap-title-scale` 0.8 → 0.9 (the name's pill, which divides the cap's
// scale back out), the label members' 0.62em → 0.7em. The pit (the body)
// keeps its 0.88. The family's cards read the SAME dials (CardPanel /
// CardCap / CardByline), so one rule steps every kind up.
.side-element__card :deep(.post-square),
.side-element__card-host :deep(.post-square),
.side-element__card-host :deep(.element-card) {
  --cap-scale: 0.7;
  --cap-title-scale: 0.9;
}
.side-element__card :deep(.post-square__label),
.side-element__card-host :deep(.post-square__label),
.side-element__card-host :deep(.element-card__label) {
  font-size: 0.7em;
}

// ── THE SIDE — the feed-like column: the thread box over the references
// box, each its share of the height, each scrolling its own list.
.side-element__side {
  flex: 0 0 var(--sev-side-w);
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

// THE THREAD BOX — a whole box since 2026-11-02 (it hung off the card's
// foot with a shared rim from 2026-10-07): the card's line ink (`--grey-5`)
// for its rim. ⭐ 2026-11-04: flush in its section — the pit's floor
// (`--sev-floor`, grey-2 until today), square corners (it meets the header
// rail and two dividers; the narrow layouts give it the viewer's corner).
.side-element__thread {
  flex: var(--sev-thread-flex-y, 0 1 auto);
  max-height: var(--sev-thread-max-y, 50%);
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--sev-frame);
  border: 1px solid var(--grey-5, #bdbdbd);
  border-radius: 0;
  overflow: hidden;
}

// THE REFERENCES BOX — the rest of the side (`SideReferences` draws it; its
// floor reads `--sev-floor` too). Two classes so this host's corner beats
// the component's own rule whatever order the two sheets land in.
.side-element__refs {
  flex: 1 1 0;
  min-height: 72px;
}
.side-element__side .side-element__refs {
  border-radius: 0 0 var(--sev-r) 0;
}

// ── NARROW (a squeezed track, the phone strip): the face over the side,
// the side's two boxes side by side at 42% of the height; under 420px the
// two boxes stack too, each half of that. The dividers turn with them —
// the side's runs across, the thread's stands up between the two boxes
// (and lies down again under 420) — and so do the corners.
@container side-element (max-width: 620px) {
  .side-element__layout { flex-direction: column; }
  .side-element__face { flex: 1 1 0; }
  .side-element__side {
    flex: 0 0 var(--sev-side-h, 42cqh);
    flex-direction: row;
  }
  .side-element__thread { flex: var(--sev-thread-flex-x, 1 1 0); min-width: 0; max-height: none; min-height: 0; }
  .side-element__refs { flex: 1 1 0; min-width: 0; min-height: 0; }
  .side-element__split--side { @include sev-split-y; }
  .side-element__split--thread { @include sev-split-x; }
  .side-element__card :deep(.post-square),
  .side-element__card-host :deep(.element-card) { border-radius: 0; }
  .side-element__thread { border-radius: 0 0 0 var(--sev-r); }
}
@container side-element (max-width: 420px) {
  .side-element__side { flex-direction: column; }
  .side-element__thread { flex: var(--sev-thread-flex-y, 1 1 0); border-radius: 0; }
  .side-element__split--thread { @include sev-split-y; }
  .side-element__side .side-element__refs { border-radius: 0 0 var(--sev-r) var(--sev-r); }
}

// Writing: the CommentMaker (`fill`) takes the box below the bar.
.side-element__compose {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  padding: 4px;
  margin: var(--sev-pit-m);
  background: var(--sev-floor);
  border: 1px solid var(--grey-5, #bdbdbd);
  border-radius: var(--sev-pit-r);
  overflow: hidden;
}

.side-element__bar {
  flex: 0 0 auto;
  display: flex;
  align-items: stretch;
  gap: 2px;
  padding: 2px;
  // ON THE FRAME since 2026-11-04 (a grey-3 band over a grey-5 line before):
  // the head of the section the way the cap is the card's — the pit's rim
  // under it is the only line.
  background: transparent;
  font-family: var(--font-display);
  font-size: 0.72em;
  letter-spacing: 0.02em;
}

.side-element__tab,
.side-element__act {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 7px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: rgba(var(--ink-rgb), 0.62);
  cursor: pointer;
  font: inherit;
  &:hover { color: rgba(var(--ink-rgb), 0.92); background: rgba(var(--ink-rgb), 0.06); }
}

.side-element__tab.is-on {
  color: var(--red-10, #b71c1c);
  background: var(--light-cream, #fcf3e0);
  border-color: var(--grey-5, #bdbdbd);
}

.side-element__tab-n {
  font-variant-numeric: tabular-nums;
  opacity: 0.85;
}

.side-element__bar-fill { flex: 1 1 auto; }

.side-element__act {
  border-color: var(--grey-5, #bdbdbd);
  background: var(--grey-1, #fafafa);
}

// The list IS the section's pit (2026-11-04): the card's content container,
// inset in the frame.
.side-element__list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  margin: var(--sev-pit-m);
  background: var(--sev-floor);
  border: 1px solid var(--grey-5, #bdbdbd);
  border-radius: var(--sev-pit-r);
  padding: 6px;
  // The pit is the ONE scroller (2026-11-04): a long thread scrolls here,
  // not in a box in a box (SideMiniList's rows since 2026-11-06; the holder
  // path's PathMini lifted its own lane cap for it until then).
  display: flex;
  flex-direction: column;
  gap: 6px;
  scrollbar-width: thin;
}

.side-element__composer { flex: 0 0 auto; }

</style>
