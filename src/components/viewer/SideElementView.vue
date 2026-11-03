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
  <div class="side-element" :class="{ 'is-fill': fills }">
    <div class="side-element__layout">
    <div class="side-element__face">
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
    </div>

    <aside v-if="el" class="side-element__side" aria-label="Around this element">
    <section class="side-element__thread" aria-label="Comments and forks">
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
        <template v-else>
          <template v-for="row in rows" :key="row.kind + ':' + row.id">
            <PostCommentItem v-if="row.kind === 'skeletons' && !row.locked" :child="row" @reply-posted="reload" />
            <div v-else-if="row.locked" class="side-element__row is-locked">
              <q-icon name="lock" size="12px" /> a {{ section === 'forks' ? 'fork' : 'comment' }} you cannot read
            </div>
            <div v-else class="side-element__row">
              <MicroChip :kind="row.kind" :id="row.id" :path="row.address" />
              <span class="side-element__row-text">{{ row.primary }}</span>
              <span class="side-element__row-by">{{ row.secondary }}</span>
            </div>
          </template>
          <div v-if="loading" class="side-element__note"><q-spinner size="14px" /> loading…</div>
          <div v-else-if="!rows.length && !forkConfirm" class="side-element__note">
            {{ section === 'comments' ? 'No comments yet.' : 'No forks yet.' }}
          </div>
          <button
            v-if="!loading && rows.length < (totals[section] || 0)"
            type="button" class="side-element__more" @click="load(true)"
          >
            {{ (totals[section] || 0) - rows.length }} more
          </button>
        </template>
      </div>
    </section>

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
import { defineComponent, ref, computed, watch } from 'vue'
import FeedStream from 'src/components/posts/FeedStream.vue'
import ElementCard from 'src/components/shared/ElementCard.vue'
import MicroChip from 'src/components/shared/MicroChip.vue'
import PostCommentItem from 'src/components/posts/PostCommentItem.vue'
import CommentMaker from 'src/components/comments/CommentMaker.vue'
import ForkConfirmPanel from 'src/components/nodes/ForkConfirmPanel.vue'
import SideReferences from 'src/components/viewer/SideReferences.vue'
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
const PAGE = 20
// The maker's comment-parent kind per element prefix (PostMakerSurface
// routes node → its route, the skeleton family → the skeleton route, any
// other kind → POST /refs/comment by address).
const PARENT_KIND = { skeletons: 'skeleton', nodes: 'node', labels: 'label', paths: 'path', links: 'link' }
const WORD = { skeletons: 'skeleton', nodes: 'node', labels: 'label', paths: 'path', links: 'link', moments: 'moment', secrets: 'secret', entities: 'entity' }

export default defineComponent({
  name: 'SideElementView',
  components: { FeedStream, ElementCard, MicroChip, PostCommentItem, CommentMaker, ForkConfirmPanel, SideReferences },
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

    const section = ref(props.initialSection === 'forks' ? 'forks' : 'comments')
    const rows = ref([])
    const totals = ref({ comments: null, forks: null })
    const supported = ref({ comments: true, forks: true })
    const loading = ref(false)
    const listEl = ref(null)

    // The tallies of BOTH sections (the bar shows both) — one row each.
    const loadTotals = async () => {
      if (!el.value) return
      const [c, f] = await Promise.all([
        refService.comments(el.value.address, { limit: 1 }).catch(() => null),
        refService.forks(el.value.address, { limit: 1 }).catch(() => null)
      ])
      totals.value = { comments: c?.total ?? 0, forks: f?.total ?? 0 }
      supported.value = { comments: c?.supported !== false, forks: f?.supported !== false }
      if (card.value) {
        card.value = { ...card.value, comment_count: totals.value.comments, fork_count: totals.value.forks }
      }
    }

    let seq = 0
    const load = async (more = false) => {
      if (!el.value) return
      const my = ++seq
      loading.value = true
      const offset = more ? rows.value.length : 0
      try {
        const r = section.value === 'forks'
          ? await refService.forks(el.value.address, { limit: PAGE, offset })
          : await refService.comments(el.value.address, { limit: PAGE, offset })
        if (my !== seq) return
        rows.value = more ? rows.value.concat(r.items || []) : (r.items || [])
        totals.value = { ...totals.value, [section.value]: r.total ?? 0 }
        supported.value = { ...supported.value, [section.value]: r.supported !== false }
      } catch (_) {
        if (my === seq && !more) rows.value = []
      }
      if (my === seq) loading.value = false
    }

    const reload = async () => { await Promise.all([loadTotals(), load(false)]) }

    const show = (slot) => {
      const next = slot === 'forks' ? 'forks' : 'comments'
      if (next === section.value) return
      section.value = next
      forkConfirm.value = false
      rows.value = []
      load(false)
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
      rows.value = []
      composing.value = false
      forkConfirm.value = false
      fills.value = false
      await resolve()
      await reload()
    }, { immediate: true })

    watch(() => props.initialSection, (s) => show(s))

    return {
      SECTIONS,
      fills,
      onResolved,
      threadTotals,
      card,
      el,
      kindWord,
      section,
      rows,
      totals,
      supported,
      loading,
      listEl,
      load,
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
}
.side-element__layout {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: row;
  gap: 8px;
  // THE SIDE'S WIDTH — the element first (the ask: "prioritizing the element
  // is fully displayed"): ~36% of the viewer, never under 240px (a comment
  // card's floor) nor over 380px (past that the face gives up reading width
  // for a list). THE THREAD'S CEILING — its share of the side's height at
  // most; under it the box is its content's height (an empty thread is its
  // bar and one line), and the references take everything it leaves.
  --sev-side-w: clamp(240px, 36cqw, 380px);
  --sev-thread-share: 50%;
}

// THE FACE — every pixel the side leaves, the card stretched to its height.
.side-element__face {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

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
  gap: 8px;
}

// THE THREAD BOX — a whole box since 2026-11-02 (it hung off the card's
// foot with a shared rim from 2026-10-07): the card's line ink (`--grey-5`)
// for its rim, the card's corner (`--pit-r`), the grey-2 floor.
.side-element__thread {
  flex: 0 1 auto;
  max-height: var(--sev-thread-share);
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--grey-2, #eeeeee);
  border: 1px solid var(--grey-5, #bdbdbd);
  border-radius: var(--pit-r, 6.34px);
  overflow: hidden;
}

// THE REFERENCES BOX — the rest of the side (`SideReferences` draws it).
.side-element__refs {
  flex: 1 1 0;
  min-height: 120px;
}

// ── NARROW (a squeezed track, the phone strip): the face over the side,
// the side's two boxes side by side at 42% of the height; under 420px the
// two boxes stack too, each half of that.
@container (max-width: 620px) {
  .side-element__layout { flex-direction: column; }
  .side-element__face { flex: 1 1 0; }
  .side-element__side {
    flex: 0 0 42cqh;
    flex-direction: row;
  }
  .side-element__thread,
  .side-element__refs { flex: 1 1 0; min-width: 0; max-height: none; min-height: 0; }
}
@container (max-width: 420px) {
  .side-element__side { flex-direction: column; }
}

// Writing: the CommentMaker (`fill`) takes the box below the bar.
.side-element__compose {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  padding: 4px;
}

.side-element__bar {
  flex: 0 0 auto;
  display: flex;
  align-items: stretch;
  gap: 2px;
  padding: 2px;
  border-bottom: 1px solid var(--grey-5, #bdbdbd);
  background: var(--grey-3, #e0e0e0);
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

.side-element__list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  scrollbar-width: thin;
}

.side-element__composer { flex: 0 0 auto; }

.side-element__row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 0.8em;
  &.is-locked { color: rgba(var(--ink-rgb), 0.5); gap: 4px; }
}
.side-element__row-text {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.side-element__row-by { color: rgba(var(--ink-rgb), 0.5); flex-shrink: 0; }

.side-element__note {
  color: rgba(var(--ink-rgb), 0.55);
  font-size: 0.8em;
  padding: 4px 0;
  &.is-error { color: var(--red-10, #b71c1c); }
}

.side-element__more {
  align-self: flex-start;
  border: 0;
  background: transparent;
  color: rgba(var(--ink-rgb), 0.6);
  font-size: 0.76em;
  cursor: pointer;
  padding: 2px 0;
  &:hover { color: rgba(var(--ink-rgb), 0.95); }
}
</style>
