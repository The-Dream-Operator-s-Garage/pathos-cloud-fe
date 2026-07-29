<!--
  FEED STREAM — the feed container's content column (2026-07-25).

  The post stream that was parked in FeedPageLegacy.vue, refitted for the
  narrow blue-grey Feed Container on FeedPage. Two things change with the
  move, both forced by the column's width:

    · ONE column, not two. The legacy page laid the stream (col-md-7) beside
      a tall FeedPostPanel (col-md-5) across the whole page; Quasar's `col-md-*`
      breakpoints read the WINDOW, not the parent, so inside a ~50%-of-track
      box that split would still fire and leave two cramped strips.
    · The detail panel UNFOLDS IN PLACE. Selecting a card renders the very same
      FeedPostPanel directly beneath it, so nothing the legacy surface showed is
      lost — it just reads as an expanded card instead of a side column. Its
      sticky/max-height rules are neutralized below: in a side column they
      pinned it in the viewport, inline they would cut it off mid-card.

  The container's box is the frame, so the SCROLLER lives here, not on the
  window: one `overflow-y` well, with a sticky glass head band INSIDE it (the
  cards scroll behind that band, which is why it lives in the scroller). The
  StateHolder tracks that well instead of the page (`trackScroll: false`).

  CARD SHAPE (2026-07-25). A post square is a rounded, fully-bordered box that
  fills 100% of the column, inset from the frieze bars by the well's 10px side
  padding. (It was FULL-BLEED for most of that day — running lip to lip with its
  side borders and radius zeroed — until the well took that padding back.) Its
  height is min(content, width, 60vh): short posts stay short bands; long ones
  grow down until they are as tall as they are wide, or 60% of the window,
  whichever comes first, the body giving way before the origin row. See
  `.post-square` for the ceiling's mechanics.

  CARD ORDER (2026-07-25). A card reads top to bottom as who → what → about →
  how it's doing: the BYLINE band (author's face, name, handle, org badge) sits
  at the very top, an edge-to-edge hairline divides it from the TITLE strip, and
  the foot below the body is left holding only the post's address and its
  tallies. The author opened that foot until this pass, which put the person
  after the whole post instead of before it.

  CARD BODY. Post bodies are markdown, so the excerpt renders through
  `MarkdownBody` — the platform's one pipeline — under a COMPRESSED tier
  (`.post-square__md`): headings, lists, code, quotes and tables all keep their
  meaning at card scale, with the vertical rhythm squeezed to a single tight
  step so the square holds as much of the post as it can.
-->
<template>
  <div class="feed-stream-pane">
    <div ref="wellEl" class="feed-stream__well">
      <!-- Head band — INSIDE the scroller and `position: sticky` (2026-07-25),
           which is the whole reason the cards can pass behind it. As a sibling
           ABOVE the well it was a separate box: the well clipped its own
           content, so nothing could ever travel under the band and a
           translucent coat would have shown only the container's flat plaque.
           Sticky keeps it pinned to the scrollport's top edge while the stream
           runs underneath. -->
      <header class="feed-stream__head">
        <div class="feed-stream__title">
          <div class="feed-stream__heading nasalization" style="font-size:1.05em;">Public Feed</div>
          <div class="text-dim" style="font-size:0.74em;">Every POST instance, newest first.</div>
        </div>
        <q-space />
        <q-badge v-if="total > 0" color="primary" outline>{{ total }}</q-badge>
      </header>

      <div v-if="loading" class="text-center q-py-lg">
        <q-spinner color="primary" size="32px" />
      </div>

      <div v-else-if="items.length === 0" class="feed-stream__empty">
        <q-icon name="route" size="48px" style="opacity:0.18;" />
        <div class="q-mt-sm">Nothing posted yet.</div>
      </div>

      <div ref="streamEl" class="feed-stream">
        <template v-for="item in items" :key="item.skeleton_id">
          <!-- One square per post — bordered blue-grey-1 card, mono head strip,
               carved body pit holding the whole post. The card is NOT a
               select-toggle any more (2026-07-25): it used to unfold a
               FeedPostPanel underneath, and that panel obeyed no ceiling —
               card + panel measured 1185px against a 615px width, 1.93× the
               container, which is exactly the "taller than it is wide" the
               square rule forbids. Everything the panel showed now lives on
               the card itself (whole body, author, label paths, tallies); the
               rest is one click away in the post viewer, via the title. -->
          <article class="post-square" :class="{ 'is-open': isOpen(item) }">
            <!-- BYLINE band — the author's IDENTITY BLOCK, at the card's top
                 edge (2026-07-25). It used to open the foot, in the same run
                 as the post's hash chip and the tallies; a post is read
                 "who, then what", so the person now comes BEFORE the title
                 and the foot is left as a pure activity row.

                 The identity is CONDENSED into one unit: the profile photo on
                 the left, and stacked beside it the author's name over their
                 @handle — one link to the profile, one glance. The entity's
                 hash chip that used to sit beside it is gone: the avatar links
                 to the same place, and the card already carries one address
                 (the post's, down in the foot).

                 A post published through an org MASK adds that organization's
                 LOGO badge right after the block. A mask's own display name is
                 "<person> @ <org>" — one string doing the work of two facts;
                 the API answers with the PERSON (their face, name and handle)
                 and hands the organization over as a card, so the string
                 becomes a mark you recognise instead of text you read.

                 The band ABSORBED THE HEAD STRIP (2026-07-25, third pass):
                 the title and the open-post button used to sit in a second
                 strip below it, which said the same kind of thing twice —
                 two ruled rows of metadata stacked over the body. Everything
                 that IDENTIFIES a post now shares one band, read left to
                 right and divided by vertical hairlines:

                   [author] │ [when/where] │ [title] │ [open]

                 The three FACTS come first, in the order a post is read, and
                 the one CONTROL closes the run at the far end — mixed in
                 among them it read as another fact. The title takes whatever
                 width the facts leave. The strip's `article` icon did not
                 survive the move: it was already uniform (every row here is
                 a POST instance), so in a band this dense it stated nothing
                 the card does not.

                 The band's bottom border is the EDGE-TO-EDGE hairline that
                 divides it from the label rail below — see the style note. -->
            <div class="post-square__byline">
              <router-link
                v-if="item.author"
                :to="'/entities/' + item.author.id"
                class="post-square__identity"
                :title="authorName(item.author)"
                @click.stop
              >
                <EntityAvatar :entity="item.author" :size="28" />
                <span class="post-square__identity-text">
                  <span class="post-square__identity-name">{{ authorName(item.author) }}</span>
                  <span class="post-square__identity-handle mono">{{ authorHandle(item.author) }}</span>
                </span>
              </router-link>
              <!-- The badge, OUTSIDE the identity link (a link inside a link
                   is invalid, and these two go to different places: the
                   person, and the organization they published under). Drawn
                   only for a MASK — an org publishing as itself already has
                   its name in the block, so `org.self` suppresses it. -->
              <OrgLogoChip
                v-if="item.author?.org && !item.author.org.self"
                :org="item.author.org"
                :size="16"
              />

              <!-- Full-bleed vertical hairline closing the AUTHOR section,
                   the same device as the head strip's `__head-rule`: it runs
                   the band's whole height by cancelling the band's own
                   vertical padding with a negative margin. Decorative, so
                   aria-hidden. -->
              <span class="post-square__byline-rule" aria-hidden="true" />

              <!-- THE MOMENT, as time AND space. It replaced the bare
                   "1h ago" that used to sit at the head strip's right end:
                   a post is minted at a moment, and a moment is a WHEN and a
                   WHERE — one fact, so one chip, stacked on the identity
                   block's own two-line rhythm.

                   Top line is always the relative time (what you actually
                   read a feed by). The line under it is the moment's other
                   half: the PLACE when the author shared one, in the
                   platform's "City, Country" form, and the formatted date
                   when they did not — location is opt-in, so most posts
                   take the date branch. The icon says which of the two you
                   are looking at, and the tooltip carries both in full. -->
              <span class="post-square__moment" :title="momentTitle(item)">
                <span class="post-square__moment-ago">{{ timeAgo(item.created_at, item.moment) }}</span>
                <span class="post-square__moment-detail mono">
                  <q-icon :name="item.moment?.place ? 'place' : 'event'" size="10px" />
                  {{ momentDetail(item) }}
                </span>
              </span>
              <span class="post-square__byline-rule" aria-hidden="true" />

              <!-- The title, closing the run of facts. It is the card's one
                   INFORMATION trigger (2026-07-26): clicking it opens the
                   post information flyout beside the container — the box the
                   feed lost when the FeedPostPanel unfold was deleted the day
                   before. So it is a `<button>` and not a link: it no longer
                   navigates, and the way INTO the post viewer is the open
                   control closing this band (plus the flyout's own two
                   links). Clicking an open title again closes the flyout.

                   It keeps the PLATE it wore in the head strip — `--grey-1`
                   floor, `--blue-grey-3` rim — which is what marks it as the
                   card's subject rather than a fourth item in a run.

                   The text is CENTRED IN A FIXED TWO-LINE BOX: the plate is
                   stretched by the band (it takes all the leftover width), so
                   a short title left-aligned in it sits against a wide empty
                   field. The inner span is the clamp — up to two lines, then
                   an ellipsis — and the plate flex-centres it both ways, so a
                   one-line title sits in the middle of the same box a
                   two-line one fills. The box's height is what keeps the band
                   uniform down the column: sized to two lines always, it does
                   not grow or shrink with the title. -->
              <button
                type="button"
                class="post-square__name"
                :class="{ 'is-open': isOpen(item) }"
                :title="item.title"
                @click.stop="$emit('select', item)"
              >
                <span class="post-square__name-text">{{ cardName(item) }}</span>
              </button>

              <span class="post-square__byline-rule" aria-hidden="true" />
              <!-- The way INTO the post, closing the band at its right end.
                   It is the one CONTROL here, so it stands apart from the
                   facts rather than leading them. -->
              <router-link
                :to="'/posts/' + item.skeleton_id"
                class="post-square__go"
                title="Open post"
                @click.stop
              >
                <q-icon name="open_in_new" size="13px" />
              </router-link>
            </div>

            <!-- LABEL RAIL — the element's OWN classification, as the label
                 paths it holds, root to leaf. It sat BELOW the body until
                 2026-07-25 (fourth pass) and now occupies the strip the title
                 vacated, directly under the byline: a post's classification
                 belongs with the rest of what identifies it, not appended
                 after the reading.

                 The rail is a ROUNDED RECTANGLE that scrolls HORIZONTALLY,
                 rimmed in `--blue-grey-3` like the pit and the title plate but
                 floored in `--blue-grey-2` — the bed tone, one step off the
                 card, where the pit is the near-white reading surface.
                 Scrolling is what lets it keep its one-line height: chips used
                 to WRAP, so a post with four label paths grew a second and
                 third row and pushed the body down. A row that scrolls states
                 the same set in a fixed band and hands the overflow to the
                 reader. Rigid, like the foot: the square ceiling may never
                 trim a card's classification.

                 The STRIP around it carries the edge-to-edge hairline that
                 divides classification from content — the same device as the
                 byline band's bottom border, and it needs a full-width
                 element to sit on, which the inset rail is not. -->
            <div v-if="labelPaths(item).length" class="post-square__rail-strip">
              <div class="post-square__rail">
                <router-link
                  v-for="lp in labelPaths(item)"
                  :key="lp.id"
                  :to="'/labels/' + lp.id"
                  class="post-square__label mono"
                  :title="lp.path"
                  @click.stop
                >
                  <span
                    v-for="(name, i) in lp.names"
                    :key="i"
                    class="post-square__label-step"
                    :class="{ 'is-leaf': i === lp.names.length - 1 }"
                  >{{ name }}</span>
                </router-link>
              </div>
            </div>

            <!-- Body pit — the carved inset that echoes the dug-open label
                 squares. It holds the WHOLE post, not a preview: the feed is
                 fetched with `body=full`, so this is the actual markdown the
                 author wrote, rendered through MarkdownBody (the platform's
                 one pipeline) in a COMPRESSED tier — every construct keeps its
                 meaning (headings read as headings, lists as lists, code as
                 code) at card scale, with the vertical rhythm squeezed to one
                 tight step so a square holds as much of the post as possible.
                 `:breaks="false"` is load-bearing: post bodies are hard-wrapped
                 at ~72 chars, and the platform default would turn every source
                 line into a <br>, laying the text out at the AUTHOR's wrap
                 width instead of the card's.
                 The pit is the card's flexible middle — it is what gives way
                 when the square ceiling bites (so the foot's origin chips are
                 never clipped off), and it scrolls in place, which is what
                 makes the square a window onto the whole post rather than a
                 truncation of it. -->
            <div v-if="postBody(item)" class="post-square__pit" @click.stop>
              <MarkdownBody
                class="post-square__md"
                :text="postBody(item)"
                :breaks="false"
                ref-display="micro"
              />
            </div>

            <!-- Foot — the post's own chip and its activity tallies. The
                 author left this row for the byline band at the card's top
                 edge (2026-07-25): the foot is now purely what the post has
                 DONE (address, votes, comments, forks), and who made it is
                 stated once, before the title.

                 The CHIP is the card's second information trigger
                 (2026-07-26) — the post's address is what the flyout is a
                 read-out of, so the two belong on the same click. `linked:
                 false` renders it as a span: as a router-link it would carry
                 the viewer route and navigate on the same press. MicroChip
                 stops the click from bubbling, but a listener on the chip
                 itself still fires — stopPropagation does not cancel
                 handlers sharing an element. -->
            <div class="post-square__foot">
              <PostMicro
                class="post-square__chip"
                :class="{ 'is-open': isOpen(item) }"
                :id="item.skeleton_id"
                :path="item.skeleton_path"
                :show-type="false"
                :linked="false"
                @click="$emit('select', item)"
              />
              <q-space />
              <span class="post-square__stat" title="votes">
                <q-icon name="thumb_up" size="11px" />{{ item.votes?.up || 0 }}
              </span>
              <span class="post-square__stat" title="comments">
                <q-icon name="chat_bubble_outline" size="11px" />{{ item.comment_count || 0 }}
              </span>
              <span class="post-square__stat" title="forks">
                <q-icon name="alt_route" size="11px" />{{ item.fork_count || 0 }}
              </span>
            </div>
          </article>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, onBeforeUnmount } from 'vue'
import { feedService } from 'src/services/feed.service'
import { useStateHolder } from 'src/composables/useStateHolder'
import { timeAgo, absoluteTime } from 'src/utils/time'
import EntityAvatar from 'src/components/entities/EntityAvatar.vue'
import OrgLogoChip from 'src/components/organizations/OrgLogoChip.vue'
import PostMicro from 'src/components/posts/PostMicro.vue'
import MarkdownBody from 'src/components/shared/MarkdownBody.vue'

export default defineComponent({
  name: 'FeedStream',
  components: { EntityAvatar, OrgLogoChip, PostMicro, MarkdownBody },
  props: {
    // The post whose information flyout is open, if any. The stream does not
    // own that state: the flyout is placed OUTSIDE the feed container (it
    // floats in the free right half of the window slot), so FeedPage holds
    // the selection and hands the id back down for the cards' open marking.
    selectedId: { type: [Number, String], default: null }
  },
  emits: ['select'],
  setup (props) {
    const items = ref([])
    const total = ref(0)
    const loading = ref(false)
    const wellEl = ref(null)
    const streamEl = ref(null)

    // StateHolder — remember where the well was scrolled, so hopping into a
    // post and coming back lands on the same reading spot. The page itself
    // never scrolls, so window tracking is off and the well is tracked
    // instead.
    const holder = useStateHolder({}, { trackScroll: false })
    holder.trackContainer(wellEl, 'feed')

    // THE SQUARE CEILING, measured rather than inferred. A card may be no
    // taller than it is wide, and since the cards are full-bleed that width is
    // this column's. CSS can express it as `max-height: 100cqw` against a
    // `container-type: inline-size` parent — which the stylesheet still does as
    // the fallback — but a container-query unit is all-or-nothing: where it is
    // not understood the whole declaration is dropped at parse time and the
    // cards silently lose their ceiling entirely, growing to the full height of
    // a 7 000-character post. Publishing the measured width as
    // `--post-square-max` makes the rule a plain px value that cannot be
    // dropped, and keeps it live under drawer toggles and window resizes.
    let ro = null
    const publishCeiling = (el) => {
      if (el) el.style.setProperty('--post-square-max', `${el.clientWidth}px`)
    }
    onMounted(() => {
      if (!streamEl.value || typeof ResizeObserver === 'undefined') return
      ro = new ResizeObserver(() => publishCeiling(streamEl.value))
      ro.observe(streamEl.value)
      publishCeiling(streamEl.value)
    })
    onBeforeUnmount(() => { if (ro) ro.disconnect(); ro = null })

    const load = async () => {
      loading.value = true
      try {
        // `body: 'full'` — the cards ARE the posts here, so each item carries
        // its whole markdown body instead of the 280-char preview slice.
        const r = await feedService.getPublic({ limit: 30, body: 'full' })
        if (r.success) {
          items.value = r.items
          total.value = r.total
        }
      } catch (_) { items.value = [] }
      loading.value = false
      await holder.restore()
    }

    onMounted(load)

    // The two lines of the identity block. `display_name` is what the
    // author's USER_PROFILE says to call them, `username` is the login
    // handle underneath it — a name can change, a handle is the address you
    // type. Either may be missing on a bare entity, so each falls back to
    // the other and finally to the id.
    const authorName = (author) =>
      author?.display_name || author?.username || `entity #${author?.id}`

    const authorHandle = (author) =>
      author?.username ? `@${author.username}` : `entity #${author?.id}`

    // THE MOMENT CHIP's second line — the other half of a moment.
    //
    // Space wins when there is any: a post carries a PLACE only when its
    // author chose to share one (location is opt-in, and the platform rounds
    // what it stores to city precision), so when the string is there it is
    // the more particular of the two facts and the one worth the line. The
    // date is the fallback, not the loser — most posts have no coordinates
    // and take this branch.
    //
    // Both come RESOLVED from the API (`moment.place`, `moment.datetime`):
    // "City, Country" is `geo.resolvePlace`'s single seam, and the date is
    // `momentService.formatHumanDatetime` — formatted from `time_utc` in UTC
    // server-side precisely so every chip and viewer states a moment
    // identically. Only an item with no moment at all formats locally.
    const momentDetail = (item) => {
      if (item.moment?.place) return item.moment.place
      if (item.moment?.datetime) return item.moment.datetime
      const ms = new Date(item.created_at).getTime()
      if (!Number.isFinite(ms)) return ''
      return new Date(ms).toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    }

    // The tooltip carries BOTH halves — the chip can only show one at a time,
    // and a located post would otherwise have no way to tell you its date.
    const momentTitle = (item) => {
      const when = item.moment?.datetime || absoluteTime(item.created_at, item.moment)
      return item.moment?.place ? `${when} · ${item.moment.place}` : when
    }

    // Is this the card the flyout is currently reading out? Compared loosely
    // on purpose — the id arrives from the parent, which may be holding it as
    // a route-ish string while the feed item carries a number.
    const isOpen = (item) =>
      props.selectedId != null && String(props.selectedId) === String(item.skeleton_id)

    // A card is named by what the post CALLS itself — its TITLE — and by
    // nothing else it merely happens to carry. The CONTENT node's source
    // path (`concepts/embeds.md`) used to sit between title and fallback,
    // so every doc card was named after a repo file that has no existence
    // on this platform; classification belongs to the label rail below.
    const cardName = (item) => {
      if (item.title) return item.title
      if (item.parent_skeleton_id) return `comment on #${item.parent_skeleton_id}`
      return '(untitled)'
    }

    // The card's classification, taken from the element itself: every label it
    // holds, as its full root→leaf PATH. This replaced the header's kind
    // legend (doc / post / fork / comment), which asserted a category the card
    // had derived — `is_doc`, a parent id — rather than one the post carries.
    //
    // Deliberately NOT `utils/labelChain.js#displayLabels`: that filter drops
    // the bare `PATHCHAIN > DOC` marker and the whole `PATHCHAIN > POST`
    // family precisely BECAUSE a dedicated tag rendered them elsewhere. With
    // the tag gone those chains are the classification, so they belong here.
    //
    // The one thing that is dropped is a chain that is a strict PREFIX of
    // another one present (`PATHCHAIN > POST` beside `PATHCHAIN > POST >
    // ORIGINAL`) — the longer path already shows every step of it, so the
    // shorter is a duplicate rail entry, not a second fact. User
    // classification sorts ahead of the PATHCHAIN plumbing families.
    const labelPaths = (item) => {
      const labels = (item.labels || []).filter(l => l.chain?.length)
      const keyOfChain = (l) => l.chain.map(c => c.id).join('>')
      const keys = labels.map(keyOfChain)
      return labels
        .filter((l, i) => !keys.some((k, j) => j !== i && k.startsWith(`${keys[i]}>`)))
        .map(l => ({
          id: l.id,
          names: l.chain.map(c => c.name),
          path: l.chain.map(c => c.name).join(' > ')
        }))
        .sort((a, b) => {
          const plumbing = (p) => (p.names[0] === 'PATHCHAIN' ? 1 : 0)
          return plumbing(a) - plumbing(b) || a.path.localeCompare(b.path)
        })
    }

    // What the card renders. `body` is the WHOLE markdown body, present
    // because the load below asks for `body=full` — a feed card is an actual
    // post container, not a preview of one. `excerpt` (the 280-char slice
    // every other feed consumer reads) stays as the fallback for any item the
    // server couldn't resolve a body for, and only THAT path wears the
    // truncation ellipsis, appended into the markdown source so it reads as
    // part of the last sentence rather than as a stray glyph after the block.
    const postBody = (item) => {
      if (item.body) return item.body
      const text = item.excerpt || ''
      return text.length >= 280 ? `${text}…` : text
    }

    return {
      items,
      total,
      loading,
      wellEl,
      streamEl,
      authorName,
      authorHandle,
      momentDetail,
      momentTitle,
      isOpen,
      cardName,
      labelPaths,
      postBody,
      // `absoluteTime` is no longer exposed — the head strip's time-ago chip
      // it fed is gone, and `momentTitle` calls it directly for the one
      // tooltip that still needs an absolute form.
      timeAgo
    }
  }
})
</script>

<style lang="scss" scoped>
// Head band + one scrolling well, filling the container between its frieze
// edges. The pane never grows the page — everything past the fold scrolls
// inside the well.
// `min-width: 0` here and on the well is load-bearing, not tidiness: the
// container up on FeedPage is sized by a PERCENTAGE flex-basis, and a flex
// item's `min-width: auto` floor can push it PAST that basis when its content
// has a wide min-content size. Left unstated, the widest post title in the
// stream (nowrap, in a flex head strip) dragged the 50% box out to 54.6%.
// Zeroed all the way down, the intrinsic width stops propagating and the
// title's own ellipsis does the work instead.
.feed-stream-pane {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
}

// The band clears the crown strip the container runs up over, so the title
// does not sit on the window's very top edge.
//
// It is STICKY INSIDE THE WELL (2026-07-25), not a sibling above it — see the
// template note. That is what lets the post cards travel behind it, which in
// turn is what makes the translucent coat mean anything: `--blue-grey-3` at
// `0.82` alpha over a light `backdrop-filter: blur(5px)`, so the band reads as
// GLASS — its own tone, with the stream visibly moving behind it but softened
// rather than competing with the title. This is the ONE deliberate exception
// to the surface's flat-plaque rule (which bans sheen and glass everywhere
// else); it is also why the alpha sits at .82 rather than the .72 it launched
// at — a blur alone still let the moving text read as text under the title.
//
// Two rules keep it seated once it is inside a padded scroller:
//   `margin: 0 -10px 10px` — the side negatives cancel the well's side padding
//     so the band is FULL-BLEED, frieze lip to frieze lip, exactly as it was
//     when it sat outside the well. The bottom margin is the 10px gap to the
//     first card, which the well's top padding used to provide before the band
//     moved in. Keep the negatives in step with the well's side padding.
//   `top: 0` + `z-index: 1` — pins it to the scrollport and keeps it over the
//     cards. Anything higher is unnecessary; the card is not positioned.
//
// The margin-TOP is deliberately `0`, and the WELL's `padding-top` went to `0`
// with it, rather than the band cancelling that padding the way it cancels the
// side padding. A negative `margin-top` does NOT work here: sticky constrains
// the element's MARGIN box, so a `-10px` top margin (which puts the margin box
// 10px above the border box) is cancelled by `top: 0` and the band is pushed
// DOWN by exactly that 10px — it comes to rest 10px below the container's top
// edge and its bottom margin lands under the first card instead of above it.
// See gotchas.md.
.feed-stream__head {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  margin: 0 -10px 10px;
  // Symmetric 8px — the top padding used to be `calc(var(--frieze-h) + 8px)`,
  // clearing the crown strip the container runs up over so the title did not
  // sit on the window's very top edge. That clearance is gone (2026-07-25):
  // the band is deliberately SHORT now, and since it is opaque enough to be
  // its own surface it stands in for the strip across the container's width
  // rather than sitting below it — the same move the drawer and the stack
  // widget already make where they meet the top edge.
  padding: 8px 12px;
  // The band is a FLAT PLAQUE in the container's own coat (end of
  // 2026-07-25) — `--blue-grey-1`, the same tone the feed box, its frieze
  // bars' base and the post cards wear. It was the surface's one deliberate
  // exception to the flat-plaque rule: `rgba(--blue-grey-3-rgb, .82)` over
  // `backdrop-filter: blur(5px)`, so the cards read as movement behind
  // glass. Opaque, that whole device is moot — a coat at full alpha shows
  // nothing through it, and the blur is dead weight the compositor still
  // pays for — so both went with the alpha. The band is now the container
  // showing through the stream rather than a pane laid over it, and the
  // `2px --blue-grey-3` edge below is what states where it ends.
  //
  // It stays STICKY: the point of the sticky is the pinning (the head
  // travels with the scrollport), which an opaque band needs exactly as
  // much — and being opaque is what lets it hide, rather than soften, the
  // cards passing under it.
  background: var(--blue-grey-1, #eceff1);
  // Thicker, and in `--blue-grey-3` — the ink every other line on this surface
  // is drawn in, and the band's own tone at full opacity. So the border reads
  // as the solid edge of the translucent band rather than as a separate rule
  // laid under it (it was a generic `rgba(ink, .14)` hairline, then briefly
  // `--blue-grey-2`).
  border-bottom: 2px solid var(--blue-grey-3, #b0bec5);
}

.feed-stream__title { min-width: 0; }

// The band's MAIN TEXT is the colorway's ink (end of 2026-07-25) —
// `--blue-grey-8`, the same ink the post cards' titles carry on their
// plates, replacing the platform-wide `text-accent` teal. On a `-1` coat
// the accent read as a foreign colour dropped onto the container; the
// colorway's own dark end is what makes the head and the cards below it
// one surface. The sub-line stays the generic dim ink: it is a caption,
// and giving it the same ink would flatten the two into one block.
.feed-stream__heading {
  color: var(--blue-grey-8, #455a64);
}

.feed-stream__well {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  overflow-y: auto;
  overflow-x: hidden;
  // The SCROLL BED (2026-07-25) — `--blue-grey-2`, one step down from the
  // `--blue-grey-1` the container and the cards wear. It walked in from the
  // deep end the same day (-4, then -3, then here), and this is the setting
  // where the surface resolves: the bed only has to be far enough from the
  // card to separate it, and with the card now OUTLINED in -4 the separation
  // is the border's job — a dark field underneath as well was doing it twice.
  // -2 is also the one step NOT in the frieze bars' tone mapping (1/3/4), so
  // the bed reads as its own quiet layer rather than echoing an edge.
  background: var(--blue-grey-2, #cfd8dc);
  // The bed's REVEAL around the cards (2026-07-25 — the cards were full-bleed,
  // frieze lip to frieze lip, before this). `10px` on the sides is the gap
  // between the frieze bars and the cards. There is NO top padding: the sticky
  // head band is the well's first child and has to sit flush on the container's
  // top edge, and the 10px gap to the first card — which this padding used to
  // provide — is the band's own `margin-bottom` now. (Keeping the padding and
  // cancelling it with a negative margin on the band does not work; see the
  // sticky note on `.feed-stream__head`.) Both gaps still match the stream's
  // flex `gap`, so the bed reads as ONE uniform margin around every card.
  // The bottom padding is the exception and has a job of its own: clearing the
  // frieze footer band the container hovers over.
  // NOTE the side padding narrows `.feed-stream`, which is the element the
  // square ceiling is measured from — the ResizeObserver picks the new width
  // up on its own, so `--post-square-max` follows automatically.
  padding: 0 10px calc(var(--frieze-h) + 12px);
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--ink-rgb), 0.3) transparent;

  &::-webkit-scrollbar       { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(var(--ink-rgb), 0.3); border-radius: 3px; }
}

.feed-stream__empty {
  text-align: center;
  padding: 32px 12px;
  color: rgba(var(--ink-rgb), 0.55);
  font-size: 0.82em;
}

// The card column, and — since 2026-07-25 — the SIZE CONTAINER the square
// ceiling is measured against. The cards are full-bleed, so this element's
// inline size IS a card's width, and `100cqw` down in `.post-square` resolves
// to exactly that. It has to be stated on a real ancestor: an element cannot
// read its own width in its own `max-height` (that is circular), and the well
// above is off by its scrollbar/padding.
.feed-stream {
  display: flex;
  flex-direction: column;
  gap: 10px;
  container-type: inline-size;
}

// One post = one square, the same visual grammar as .label-square on the
// labels page: hairline border, mono uppercase head, and a carved inset pit
// for the body — but drawn entirely in the FEED CONTAINER's own colorway
// rather than the platform's white. One step, one job: `--blue-grey-1` coats
// the card (as it coats the container), `--blue-grey-2` is the scroll bed
// under it, and `--blue-grey-3` draws EVERY line — the card's 2px outer
// border, the pit's 1px inner one, and the frieze lips — so only the weight
// distinguishes them. `--blue-grey-4` is left to the frieze bars' wave layer.
//
// GEOMETRY (2026-07-25) — a true square, width-led and content-limited:
//
//   width  = 100% of the column, inset from the frieze bars by the well's 10px
//            side padding (the card was FULL-BLEED — lip to lip, side borders
//            and radius zeroed — for most of that day, until the well took
//            that padding back and the box was drawn on all four sides again).
//   height = min(content, width).
//
// So the square is a CEILING, not a fixed shape: a post with little to say
// stays a short band (the box height simply follows its content), and one with
// more grows down until it is exactly as tall as it is wide and then stops.
// `max-height: 100cqw` is what says that — 100% of the query container's
// (`.feed-stream`) inline size, which is the card's own width. `aspect-ratio`
// would have been the wrong tool: it *forces* height = width and would leave
// short posts sitting in a dead empty field.
//
// The card is a flex COLUMN so the clip lands where it should. Head and foot
// are rigid; the pit is the one flexible track, so when the ceiling bites it
// is the body text that gives way — the foot's author and tallies (a post's
// ORIGIN) are never the thing that gets cut off.
.post-square {
  display: flex;
  flex-direction: column;
  // The ceiling — the LOWER of two limits, so whichever bites first wins:
  //
  //   width  — `--post-square-max` is the column's measured width, published by
  //            the ResizeObserver in setup(); `100cqw` is the pure-CSS statement
  //            of the same thing and stands in for the one frame before that
  //            runs. The var comes FIRST on purpose — a container-query unit is
  //            dropped wholesale by any engine that does not understand it,
  //            which would leave the cards with no ceiling at all, and a px
  //            value cannot fail that way.
  //   60vh   — no card may take more than 60% of the WINDOW (2026-07-26; it was
  //            40vh since 2026-07-25). The square alone is a ratio, not a size:
  //            widen the feed container or flatten the window and a square card
  //            grows tall enough to fill the whole track, so the stream stops
  //            reading as a stream. This is the absolute cap that keeps a
  //            SECOND card in view whatever the column's width — which is the
  //            real constraint, and what fixes the ceiling's upper bound at
  //            just under two thirds: at 60vh a card plus the head band still
  //            leaves the next card's byline showing, so the stream reads as a
  //            stream. Past ~70vh it would not.
  //
  // Both limits land on the same flexible track (the pit), so a card that hits
  // either one trims its body and keeps its origin row.
  max-height: min(var(--post-square-max, 100cqw), 60vh);
  // A FULLY DRAWN, ROUNDED box (end of 2026-07-25). The card spent most of that
  // day full-bleed — running frieze lip to frieze lip with its side borders and
  // radius zeroed, because a side border would have collided with the frieze
  // lip it touched. The well's new 10px side padding removed that constraint,
  // so all four edges are drawn again and the corners are round.
  //
  // The ink is `--blue-grey-3` (end of 2026-07-25 — it was the deeper
  // `--blue-grey-4`). Lighter AND thicker was one move, not two opposing ones:
  // a hairline needs contrast to register, a wider band does not, so the
  // outline could drop to the colorway's lip tone and still read — as a drawn
  // EDGE rather than a dark line. It also puts the card's outer border on the
  // same ink as its inner one (the pit's) and as the frieze lips, so every
  // line on the surface is -3 and only the weight distinguishes them: -1 coats
  // container and card, -2 is the bed, -3 draws every line, -4 is left to the
  // frieze bars' wave layer.
  //
  // The weight is UNEVEN by design (end of 2026-07-25): 1px on top and the
  // sides, 2px along the bottom. All four were 2px for a moment and the box
  // read heavy — the border is the only line the card has, so it carries at
  // full strength everywhere. Thinning three of the four edges keeps a single
  // weighted BASE, which is enough to seat the card on the bed without the
  // outline shouting. Set the box at 1px and override the one edge, rather
  // than writing a four-value `border-width` — the intent is "hairline box,
  // heavier foot", and that is what this reads as.
  border: 1px solid var(--blue-grey-3, #b0bec5);
  border-bottom-width: 2px;
  border-radius: var(--radius-md, 0.85em);
  // The card's coat is the CONTAINER's coat (2026-07-25) — `--blue-grey-1`, the
  // same plaque tone the feed box and its frieze bars' base wear, not the
  // generic white `--paper-card` every other square on the platform uses. A
  // post square is a piece of this container, so it is cut from the container's
  // material.
  background: var(--blue-grey-1, #eceff1);
  // NO drop shadow (2026-07-25). The card used to cast `0 1px 3px` to lift
  // itself off the page; it has nothing to lift off now that the well beneath
  // it is a deliberately darker bed (`--blue-grey-3`) — the tonal step already
  // separates card from field, and a cast edge on top of it only muddied the
  // 10px gap between two adjacent cards. Flat plaque on a darker bed.
  overflow: hidden;
  transition: border-color 0.12s;

  &:hover { border-color: rgba(0, 130, 156, 0.45); }

  // The card the flyout is currently reading out (2026-07-26). The box floats
  // clear of the container, so nothing but this says which card it belongs
  // to: the outline goes to the accent at full strength — one step past the
  // hover, which is the same ink at 0.45 — and it must not go anywhere else,
  // since the card is height-capped and any added weight would come out of
  // the pit.
  &.is-open { border-color: #00829c; }
}

// THE BYLINE BAND — the card's first strip, holding the author (2026-07-25).
//
// Rigid like the head and the foot: who published a post is not something the
// square ceiling may trim, so it stays out of the flex give-and-take and only
// the pit gives way.
//
// The bottom border is the EDGE-TO-EDGE hairline the band is divided from the
// title strip by, and it needs no negative-margin trick to get there: the card
// has no padding of its own, so this band already spans the full content box,
// and its border runs from one side border to the other. `--blue-grey-3` is the
// ink every line on this surface is drawn in (the card's outer border, the pit's
// rim, the frieze lips, the head's vertical rule) — a divider inside the card is
// the same line as the ones around it, at hairline weight.
.post-square__byline {
  display: flex;
  align-items: center;
  // Tighter than the foot's 8px rhythm: this band is a single statement of
  // provenance (who, then when/where), not a run of independent items, so
  // its parts sit close and the vertical rule does the dividing.
  gap: 6px;
  padding: 5px 9px;
  flex: 0 0 auto;
  min-width: 0;
  border-bottom: 1px solid var(--blue-grey-3, #b0bec5);
}

// The rule closing the AUTHOR section, full-bleed exactly like the head
// strip's `__head-rule` and by the same mechanism: `align-self: stretch`
// stops at the band's padding edge, so the negative vertical margin cancels
// that `5px` on both sides and the line touches the card's top border above
// and the byline's own hairline below. KEEP THAT MARGIN IN STEP with
// `.post-square__byline`'s padding, or the line stops short of one edge.
//
// The two rules and the hairline together are what make this band read as
// ruled rather than merely spaced: one horizontal line under the whole
// band, one vertical line inside it, both `--blue-grey-3` at 1px, both
// meeting the box's edges square.
.post-square__byline-rule {
  align-self: stretch;
  flex: 0 0 1px;
  width: 1px;
  margin: -5px 0;
  background: var(--blue-grey-3, #b0bec5);
}

// THE MOMENT CHIP — the post's when over its where (or its date).
//
// Two stacked lines on the identity block's own rhythm, so the band reads as
// two parallel two-line facts either side of the rule rather than a block
// beside a strip.
//
// It does NOT shrink (2026-07-25, third pass). It was the band's give-way
// part while the band held only the author beside it; once the TITLE joined
// them, two shrinkable items shared the slack and the place string landed at
// a different length on every card — "Mexico City," over "Mexico City,
// Mexico" over "Mexico City, Mexi" down the column, which reads as damage
// rather than as truncation. The title is the item built to absorb (one
// line, one ellipsis, no meaning lost by cutting it), so it absorbs alone and
// the left run of the band is identical on every card. The chip bounds
// ITSELF instead, in `ch` on its detail line — a cap it reaches only for
// place names far longer than the "City, Country" form produces.
.post-square__moment {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
  flex: 0 0 auto;
}

// The relative time — the line you actually scan a feed by, so it carries the
// weight here, the way the author's NAME does in the block opposite.
.post-square__moment-ago {
  font-size: 0.72em;
  font-weight: 700;
  color: rgba(var(--ink-rgb), 0.62);
  white-space: nowrap;
}

// Place or date, quieter and mono — the same relationship the handle has to
// the name across the rule. The icon rides the line's own baseline gap
// rather than a wrapper, which is what keeps the two lines the same height
// whichever branch renders.
.post-square__moment-detail {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.6em;
  color: rgba(var(--ink-rgb), 0.45);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  // The chip's OWN bound, now that flex pressure no longer trims it. It has
  // to clear the WIDER branch whole — the date, "Sat, 25 Jul 2026 · 11:26 PM"
  // at 27 characters, against a place's 19 — plus the icon and its gap, which
  // sit inside this same box and so count against the cap. `32ch` covers that
  // with room to spare and still stops a pathological place name from taking
  // the band. Measure after changing it: at `24ch` the date branch clipped on
  // 19 of 30 cards while the text still read whole in the DOM.
  max-width: 32ch;

  .q-icon { flex-shrink: 0; opacity: 0.75; }
}

// The title is the card's way into the full post viewer — the card itself
// stopped being a click target when the unfoldable detail panel went. It sits
// on its own PLATE (end of 2026-07-25): a rounded `--grey-1` box rimmed in
// `--blue-grey-3`, i.e. the same floor and the same line as the markdown pit
// below it and the label rail above it, so the card reads as one material.
// The ink is `--blue-grey-8`, the colorway's dark end.
//
// It CLOSES THE RUN OF FACTS in the band (2026-07-25, third pass — it had its
// own strip under the band until then). `flex: 1 1 auto` is the move that
// makes that work: the title takes every pixel the facts to its left leave, so
// the band is exactly as wide as the card whatever the title's length.
// `min-width: 0` is what lets it give way rather than push — a title is the
// widest min-content in the column and, unfloored, it reaches all the way up
// and widens the feed container itself.
//
// TWO LINES, CENTRED, IN A FIXED BOX (2026-07-25, fifth pass). Three things
// that only work together:
//
//   · The plate is a FLEX box centring its inner span on both axes. It is
//     stretched to the leftover width, so a short title aligned left sat
//     against a wide empty field; centred, the plate reads as a plate whatever
//     it holds.
//   · The inner `__name-text` is the CLAMP — two lines, then an ellipsis. A
//     title too long for one line now wraps instead of being cut at the first
//     line's end, which is a real gain at this width: two lines of a mono
//     uppercase title is most of a sentence, one line is a fragment.
//   · `min-height` sizes the box to TWO LINES ALWAYS. Without it the plate
//     would be one line tall on some cards and two on others — the same
//     card-to-card raggedness the moment chip was just fixed for, and more
//     visible here because the plate is a drawn box. Fixed, it also gives the
//     single-line case a middle to sit in. The figure is `2 × line-height`
//     plus the padding and border the border-box includes; keep all three in
//     step. It costs the band almost nothing: at this type size the two-line
//     plate measures 31px against the 28px avatar beside it, so the band went
//     41px → 42px and every card still reports the same height.
//
// DENSER in the same pass — `0.74em` → `0.7em`, letter-spacing `0.03` →
// `0.02em`, padding `2px 7px` → `2px 6px`: the plate is one of four items in
// a 41px band now, not the sole occupant of its own strip.
// A `<button>` since 2026-07-26 (it was a router-link to the post viewer):
// the title TRIGGERS the information flyout now, and a control that does not
// navigate must not be an anchor. Everything below already stated the type
// explicitly, so the only additions are the button reset — a UA button
// inherits neither font nor colour, and brings a default padding of its own
// that would fight the plate's `2px 6px`.
.post-square__name {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(2.6em + 6px);
  text-decoration: none;
  appearance: none;
  cursor: pointer;
  font-family: 'Space Mono', monospace;
  font-size: 0.7em;
  line-height: 1.3;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  text-align: center;
  color: var(--blue-grey-8, #455a64);
  background: var(--grey-1, #fafafa);
  border: 1px solid var(--blue-grey-3, #b0bec5);
  border-radius: var(--radius-sm, 0.5em);
  padding: 2px 6px;
  overflow: hidden;

  &:hover { color: #00829c; border-color: rgba(0, 130, 156, 0.45); }

  // The plate while its flyout is open — the accent held rather than hovered,
  // so the card and the box beside it read as one thing. It is the same ink
  // the hover uses; a second colour here would suggest a second state.
  &.is-open {
    color: #00829c;
    border-color: #00829c;
    background: rgba(0, 130, 156, 0.10);
  }
}

// The clamp itself. `-webkit-line-clamp` is the right tool HERE and the wrong
// one in the pit (see gotchas.md): it counts LINE BOXES inside one
// `-webkit-box`, which is exactly what this is — a single text node — where
// the pit holds a run of block elements it cannot measure.
//
// `overflow-wrap: anywhere` is the guard for titles that are one long
// unbroken token (a file path stands in as a title when a post has none):
// without it such a word cannot break, so it overflows the plate rather than
// wrapping into the second line.
.post-square__name-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
}

.post-square__go {
  display: inline-flex;
  align-items: center;
  color: rgba(var(--ink-rgb), 0.45);
  flex-shrink: 0;
  padding: 2px;
  border-radius: 4px;
  &:hover { color: #00829c; background: rgba(0, 130, 156, 0.08); }
}

// The carved pit — same inset shadow recipe as .label-square__pit so the
// feed reads as a sibling of the label explorer.
//
// It is the card's FLEXIBLE track (see .post-square): it takes what the head
// and foot leave, which is how the square ceiling trims the body instead of
// the origin row. The old fixed `-webkit-line-clamp: 4` is gone with the
// plain-text render — line clamping counts LINE BOXES inside one -webkit-box,
// and rendered markdown is a run of block elements (headings, lists, pre) that
// a box clamp cannot measure; the square is the limit now. `white-space:
// pre-wrap` is gone for the same reason: the source newlines are the markdown
// parser's job, and preserving them here would put a blank gap between every
// rendered block.
//
// It SCROLLS IN PLACE (2026-07-25) rather than clipping. That is what settles
// the tension between the two rules the card lives by: the box may be no
// taller than it is wide, and it holds the WHOLE post. Hidden overflow would
// make the square a truncation; a scroller makes it a window — the entire post
// is readable without leaving the feed, and the card still keeps its shape in
// the column.
//
// Type is `0.88em` (0.82 → 0.95 when the card became a reading surface, then
// back a step at the end of 2026-07-25): the body still sits near the app's
// base size rather than at chip scale, but a notch smaller fits more of a post
// inside the card's ceiling and gives justified prose more words per line to
// distribute — the narrower the measure, the uglier the gaps justification has
// to open. Every size in the compressed tier below is relative to this one, so
// the whole markdown scale moves with it. Leading went the other way
// (1.5 → 1.6): smaller type wants proportionally more air between lines, and
// the extra leading is half of what stops the block reading as a slab.
.post-square__pit {
  // ── The MEDIA BUDGET (2026-07-26) ──────────────────────────────────────
  // A post can quote a node, and when that node is a picture or a player
  // (`![[pathos:nodes/…]]` → a NodeMini in the pit) the preview IS the
  // content: it should be as large as this card can show WHOLE. So the pit
  // states the height a medium may take and the components size themselves
  // from it — NodeMini as a plain `max-height` on the picture, EmbedFrame
  // converted into the width cap its aspect-ratio box needs.
  //
  // It is derived from the card's own CEILING rather than written as a flat
  // `30vh`, because that ceiling is `min(width, 60vh)` — a narrow column
  // makes a short card, and a fixed viewport fraction would overflow it. The
  // constant is everything in the card that is NOT the medium, measured at
  // 1440×900 / 595px column: 130px of card chrome (byline 42 + rail strip 42
  // + foot 30 + margins 13 + borders 3), then inside the pit 16px of padding,
  // ~70px of the Mini's own header and foot, ~21px of embed caption and
  // ~20px of block margin. Budget + all of that = the ceiling, which is the
  // point: a card holding one medium comes out exactly full, with nothing to
  // scroll for.
  //
  // Keep it in step with the 60vh ceiling and with the Mini's chrome — grow
  // one without the other and you get either a player that needs a scroll or
  // a small player in a half-empty card. The 120px floor is for the narrowest
  // columns, where the subtraction would otherwise go negative.
  --media-max-h: max(120px, calc(min(var(--post-square-max, 100cqw), 60vh) - 264px));

  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  font-size: 0.88em;
  color: var(--ink, #2C3D4E);
  word-break: break-word;
  line-height: 1.6;
  // The top margin is the gap to whatever line precedes it — the rail strip's
  // hairline when the post carries labels, the byline band's when it does not.
  margin: 6px 7px 7px;
  padding: 8px 10px;
  border-radius: 7px;
  // The pit's own two tones (2026-07-25): a `--grey-1` floor with the frame's
  // INNER border drawn around it in `--blue-grey-3`. The floor was a 5% ink
  // tint of whatever the card was, which made the pit a slightly darker patch
  // OF the card; a flat near-white is a different material set INTO it — the
  // one tone on this surface deliberately outside the container's colorway,
  // because everything else here IS the container and the reading area is not.
  // The line is the opposite move: `--blue-grey-3` is the colorway's own
  // lip/hairline ink, the same one the frieze bars draw the container's side
  // borders with, so the card's inner edge and the box's outer edges are one
  // line. It is also what states that edge now the card casts no shadow.
  // EVEN on all four sides. It wore a heavier 2px top for one pass, matching
  // the rail's, and that reading does not carry down here: the rail is a
  // shallow tray and a lip suits it, while the pit is the READING area and
  // wants a plain frame — a weighted edge above the text reads as a rule the
  // prose hangs from. The heavy-top device stays the rail's alone.
  border: 1px solid var(--blue-grey-3, #b0bec5);
  background: var(--grey-1, #fafafa);
  // NO carve (end of 2026-07-25) — the surface is FLAT. The pit used to wear
  // the `.label-square__pit` recipe, an inset dark shadow at the top edge over
  // an inset white lip at the bottom, which read as a box pressed into the
  // card. That was the last shadow anywhere on the card (its own drop shadow
  // went earlier the same day), and depth from two directions at once — a
  // recessed pit inside a flat card on a flat bed — is what made the surface
  // look unresolved. Everything is stated by TONE and LINE now: the grey-1
  // floor against the blue-grey-1 card, and the blue-grey-3 border around it.
  // Same thin rail as the stream's own well, so a card reading past its square
  // does not introduce a second scrollbar language.
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--ink-rgb), 0.3) transparent;

  &::-webkit-scrollbar       { width: 5px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(var(--ink-rgb), 0.28); border-radius: 3px; }
}

// COMPRESSED MARKDOWN TIER — the card's own reading of the platform pipeline.
//
// The rule is: every construct keeps the meaning it has in the full renderer,
// and the type scale stays pulled in close to body size, but the vertical
// rhythm is only MODERATELY tightened. It used to be squeezed to one ~0.45em
// step, which saved space and cost legibility: at that setting a heading sat
// almost on the paragraph above it, so blocks ran together into one undivided
// slab and the reader had to parse structure that the spacing should have been
// showing. The step is `0.85em` now (end of 2026-07-25), with headings given a
// deliberately ASYMMETRIC margin — a big one above, a small one below — so each
// heading binds to the text it introduces and separates from the text it
// follows. That asymmetry is what makes the structure legible; an even margin
// would leave every heading floating between two blocks. Quasar's reset strips
// list markers and heading weights globally, so the ones that matter are
// restated here rather than assumed.
//
// Prose is JUSTIFIED (end of 2026-07-25) — `p` and `li` only, so the block's
// left AND right edges line up with the pit's border and the card reads as
// ordered rather than ragged. Headings, tables and fences stay flush-left:
// justifying a two-word mono heading would stretch it across the whole measure.
// `hyphens: auto` rides along and is NOT optional at this width — justification
// works by opening the word spaces until the line fills, so on a narrow measure
// without hyphenation a single long word pushes a line into rivers of white.
// Hyphenation lets the breaks fall inside words instead, which is what keeps
// the spacing even.
.post-square__md :deep(.markdown-body) {
  // No leading/trailing gap — the pit's own padding is the frame.
  > :first-child { margin-top: 0; }
  > :last-child  { margin-bottom: 0; }

  p, ul, ol, pre, blockquote, table, dl { margin: 0 0 0.85em; }

  p, li {
    text-align: justify;
    hyphens: auto;
    -webkit-hyphens: auto;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: 'Space Mono', monospace;
    font-weight: 700;
    line-height: 1.25;
    // Asymmetric on purpose — see the note above: the space above a heading is
    // what separates it from the previous block, the small one below is what
    // binds it to its own.
    margin: 1.15em 0 0.35em;
    color: var(--ink, #2C3D4E);
  }
  h1 { font-size: 1.14em; }
  h2 { font-size: 1.06em; }
  h3 { font-size: 1em; }
  h4, h5, h6 {
    font-size: 0.94em;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: rgba(var(--ink-rgb), 0.72);
  }

  ul, ol { padding-left: 1.4em; }
  ul { list-style: disc; }
  ol { list-style: decimal; }
  // Items were `0.08em` apart — visually zero, so a list read as one wrapped
  // paragraph with bullets in it rather than a set of distinct points.
  li { margin: 0.3em 0; }
  li > p { margin: 0; }
  li > ul, li > ol { margin: 0.3em 0 0; }

  strong { font-weight: 700; }
  em { font-style: italic; }
  del { opacity: 0.6; }

  a {
    color: #00829c;
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }

  // `hyphens: none` is a CORRECTION, not a preference: the property inherits,
  // so the justified `p`/`li` above hand it to every inline code span inside
  // them, and an auto-hyphenated identifier gets a REAL-looking hyphen that is
  // not in the source — `entity_type` broke across two lines as `entity_-` /
  // `type`, which a reader cannot distinguish from a token that contains one.
  // Prose can be hyphenated; a name that must be typed back exactly cannot.
  code, pre, kbd, samp { hyphens: none; -webkit-hyphens: none; }

  code {
    font-family: 'Space Mono', monospace;
    font-size: 0.9em;
    padding: 0 4px;
    border-radius: 4px;
    background: rgba(var(--ink-rgb), 0.09);
  }

  // Fences keep their own scroller so a long line cannot widen the card —
  // which, at a percentage-sized container, would widen the feed box itself.
  pre {
    font-size: 0.9em;
    line-height: 1.35;
    padding: 6px 8px;
    border-radius: 6px;
    background: rgba(var(--ink-rgb), 0.08);
    overflow-x: auto;
    code { padding: 0; background: none; }
  }

  blockquote {
    padding-left: 8px;
    border-left: 2px solid rgba(var(--ink-rgb), 0.25);
    color: rgba(var(--ink-rgb), 0.72);
    font-style: italic;
  }

  hr {
    border: 0;
    border-top: 1px solid rgba(var(--ink-rgb), 0.16);
    margin: 1em 0;
  }

  img { display: block; max-width: 100%; height: auto; border-radius: 6px; }

  // A table wider than the card scrolls in place, same reasoning as `pre`.
  table {
    display: block;
    width: max-content;
    max-width: 100%;
    overflow-x: auto;
    border-collapse: collapse;
    font-size: 0.92em;
  }
  th, td { border: 1px solid rgba(var(--ink-rgb), 0.14); padding: 2px 6px; text-align: left; }
  th { background: rgba(var(--ink-rgb), 0.06); font-weight: 700; }

  input[type="checkbox"] { margin: 0 4px 0 0; vertical-align: middle; }

  // A `![[pathos:…]]` BLOCK EMBED renders a full Mini panel (MarkdownBody
  // teleports one in whatever the surface's inline chip tier is). Its own
  // 480px cap is a page-column measure; in a card the COLUMN is the
  // measure, so the panel takes the pit's whole width — otherwise an
  // embedded video sits in a 480px box with dead card beside it.
  .element-mini { max-width: 100%; }

}

// The CLASSIFICATION rail — one chip per label path the post holds, root to
// leaf. It sat below the body (`.post-square__labels`, a wrapping run with no
// box of its own) until 2026-07-25's fourth pass and now fills the strip the
// title vacated, between the byline band and the pit.
//
// It is a ROUNDED RECTANGLE THAT SCROLLS SIDEWAYS, and the two go together:
//
//   · The BOX is the card's third panel, rimmed 1px `--blue-grey-3` like the
//     pit below it and the title plate above, but floored in `--blue-grey-2`
//     rather than their near-white `--grey-1`. That is the difference between
//     a surface you READ and a surface you SCAN: the pit is the reading area
//     and is set apart from the card as its own material, while the rail is a
//     tray of chips and takes the colorway's own bed tone — the same step the
//     stream's well uses under the cards.
//   · `nowrap` + `overflow-x: auto` is what keeps it ONE line. Wrapping was
//     the old behaviour and it made the rail's height a function of how many
//     labels a post carries: four paths became three rows and pushed the body
//     down by ~40px, on a card whose whole height is capped. A scroller
//     states the same set in a fixed band, and the chips keep their natural
//     width (`flex: 0 0 auto` on the chip) so they slide instead of
//     compressing to unreadable stubs.
//
// Rigid (`flex: 0 0 auto`), like the foot: the square ceiling trims the body,
// never a card's classification.
// The STRIP the rail sits in — a full-width band whose only jobs are the
// rail's insets and the EDGE-TO-EDGE HAIRLINE that divides classification
// from content. The line has to live here rather than on the rail: the rail
// is inset by this padding, so a border on it would stop 7px short of each
// side. Same reasoning, and the same 1px `--blue-grey-3`, as the byline
// band's bottom border — the card is divided by full-bleed lines and
// panelled by inset boxes, and those are two different devices.
.post-square__rail-strip {
  flex: 0 0 auto;
  min-width: 0;
  padding: 6px 7px;
  border-bottom: 1px solid var(--blue-grey-3, #b0bec5);
}

.post-square__rail {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 4px;
  min-width: 0;
  padding: 4px 6px;
  // A HEAVIER TOP EDGE (1px box, 2px top), the mirror of the card's own
  // uneven border (1px box, 2px foot). The tray reads as something the band
  // above sits down onto rather than a box floating in the gap.
  border: 1px solid var(--blue-grey-3, #b0bec5);
  border-top-width: 2px;
  border-radius: 7px;
  // The bed tone, not the pit's near-white — see the note above.
  background: var(--blue-grey-2, #cfd8dc);
  overflow-x: auto;
  overflow-y: hidden;
  // The same thin rail the pit and the well use, so a third scrolling surface
  // on the card does not introduce a third scrollbar language. Horizontal, so
  // it is the HEIGHT that has to be set here.
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--ink-rgb), 0.25) transparent;

  &::-webkit-scrollbar       { height: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(var(--ink-rgb), 0.25); border-radius: 3px; }
}

// A path, not a name: every step of the chain is drawn, the leaf carrying the
// weight. The steps are separated by a drawn '›' rather than by punctuation in
// the text, so the whole chip stays one link and one tab stop.
.post-square__label {
  display: inline-flex;
  align-items: center;
  // Natural width, never squeezed (2026-07-25): inside a horizontal scroller
  // a shrinkable chip would compress to fit the visible box and there would
  // be nothing to scroll — the point is that the chips run PAST the rail's
  // right edge. `max-width: 100%` went with the wrapping rail for the same
  // reason: a long path is meant to extend the scroll, not truncate.
  flex: 0 0 auto;
  font-size: 0.62em;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  text-decoration: none;
  color: rgba(var(--ink-rgb), 0.5);
  border: 1px solid rgba(var(--ink-rgb), 0.14);
  // A HEAVIER FOOT (1px box, 2px bottom) — the card's own uneven border read
  // at chip scale, and the opposite edge to the rail's and the pit's heavier
  // TOP: a panel is seated by the edge it meets what came before, a chip
  // rests on the tray beneath it.
  border-bottom-width: 2px;
  border-radius: 7px;
  padding: 1px 6px;
  overflow: hidden;
  // The card's own coat, lying in the `--blue-grey-2` tray (the chips were
  // transparent, so they took the tray's tone and the rail read as one field
  // with outlines drawn on it). -1 chip on a -2 bed is the same figure/ground
  // step as a -1 card on the stream's -2 well, one level down.
  background: var(--blue-grey-1, #eceff1);

  &:hover {
    color: #00829c;
    border-color: rgba(0, 130, 156, 0.45);
    background: rgba(0, 130, 156, 0.06);
  }
}

.post-square__label-step {
  white-space: nowrap;

  & + &::before {
    content: '›';
    margin: 0 4px;
    opacity: 0.55;
  }

  &.is-leaf {
    font-weight: 700;
    color: rgba(var(--ink-rgb), 0.78);
  }
}

.post-square__label:hover .post-square__label-step.is-leaf { color: #00829c; }

// The ORIGIN row — author, post hash, tallies. Rigid: it is the last thing a
// square may give up, so it never enters the flex give-and-take above.
.post-square__foot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 9px 7px;
  min-width: 0;
  flex: 0 0 auto;
}

// The foot chip as a TRIGGER (2026-07-26). It is a span now (`linked: false`),
// so `.micro-chip.is-link`'s cursor and hover no longer reach it — both are
// restated here, since the chip is still very much clickable, just not a link.
.post-square__chip {
  cursor: pointer;

  &:hover {
    background: rgba(0, 130, 156, 0.10);
    border-color: rgba(0, 130, 156, 0.4);
    color: #00829c;
  }

  &.is-open {
    background: rgba(0, 130, 156, 0.12);
    border-color: #00829c;
    color: #00829c;
  }
}

// THE IDENTITY BLOCK (2026-07-25) — photo left, name over handle.
//
// One unit, not three items: the avatar and the two text lines are a single
// link to the author's profile, and the block as a whole is what the eye
// picks up. Stacking the handle under the name is what lets both be shown at
// all — side by side they read as one long string and the card has no width
// to spare.
//
// It refuses to shrink below its own content (`flex: 0 0 auto`) and caps each
// line instead: left to the flex floor, both lines ellipsize to three letters
// even on a wide card. The `55%` cap it carried in the foot is GONE with the
// move to its own band — it was there because the post's hash chip shared that
// row and truncates adaptively, so a long display name would have eaten the
// whole run. Here the only thing beside the block is the org badge, which the
// two `18ch` line caps already leave room for.
// Deliberately NO `min-width: 0` here — see gotchas.md. It is inert while the
// block is `flex: 0 0 auto`, but it is the exact property that collapsed this
// block to `cla…` / `@cla…` once, and leaving it written invites the next edit
// to make it bite again.
.post-square__identity {
  display: inline-flex;
  align-items: center;
  // DENSER (2026-07-25, second byline pass): 7px → 5px between the face and
  // its two lines, and the face itself 34px → 28px. The block is a
  // provenance stamp, not a profile header — it only has to be recognisable
  // at a glance, and pulling it in gives the band's own height back to the
  // pit, which is the card's one flexible track.
  gap: 5px;
  flex: 0 0 auto;
  text-decoration: none;
  color: inherit;
  border-radius: var(--radius-sm, 0.5em);
  padding: 1px 3px 1px 1px;
  transition: background 0.12s;

  &:hover { background: rgba(0, 130, 156, 0.08); }
  &:hover .post-square__identity-name { color: #00829c; }
}

// The org badge belongs to the identity beside it, not to the band — pulled
// in against the band's 8px rhythm so the pair reads as one unit ("this
// person, publishing there") instead of as a second item in the strip. The
// class sits on OrgLogoChip's ROOT element, which carries this component's
// scope attribute, so no :deep() is needed.
.post-square__byline .org-logo-chip {
  margin-left: -3px;
}

.post-square__identity-text {
  display: flex;
  flex-direction: column;
  // 1.15 rather than the app's default — two stacked lines at this size sit
  // as one block, and any more leading breaks them apart into two facts. The
  // moment chip across the rule states the same figure for the same reason.
  line-height: 1.15;
  min-width: 0;
}

// Both lines came in a step in the dense pass (0.78 → 0.74, 0.66 → 0.62) and
// their `18ch` cap with them: at 16ch the two lines are near enough the same
// length that the block reads as one stamp, and a name long enough to be cut
// there was already being cut at 18.
.post-square__identity-name {
  font-size: 0.74em;
  font-weight: 700;
  color: #4f3e98;
  max-width: 16ch;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// The handle is the address you can type back — mono, quieter, and never
// wider than the name it sits under.
.post-square__identity-handle {
  font-size: 0.62em;
  color: rgba(var(--ink-rgb), 0.5);
  max-width: 16ch;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.post-square__stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'Space Mono', monospace;
  font-size: 0.7em;
  color: rgba(var(--ink-rgb), 0.55);
  flex-shrink: 0;
}
</style>
