<!--
  FEED STREAM — the feed container's content column (2026-07-25).

  The post stream that was parked in FeedPageLegacy.vue, refitted for the
  narrow indigo Feed Container on FeedPage. Two things change with the
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
  <div class="feed-stream-pane" :style="{ '--fhead-h': headH + 'px' }">
    <!-- THE HEAD BOX (2026-08-06) — what used to be `.feed-stream__head`, a
         sticky band inside the well. It is a DRAGGABLE PLATE now, grabbed by
         its own inner header and slid up and down between the frieze bars,
         with its four corners filleted into them; the cards still pass
         BEHIND it, which was the sticky's whole purpose, but they do it
         because the box is placed over the scroller rather than inside it.
         `FeedHeadBox.vue` owns the geometry, the chrome and its own first
         half (seat + chat box); the stream keeps its lenses and hands them
         down through the `controls` slot, unchanged. Its position is
         persisted through the StateHolder, so the box is where you left it
         when you come back from a post. -->
    <FeedHeadBox
      :offset="headY"
      :seat="seat"
      :thinking="thinking"
      :live="live"
      :line="line"
      @update:offset="setHeadY"
      @update:height="(h) => (headH = h)"
      @ask="onAsk"
      @open-chat="openLensChat"
      @sweep="sweepLane"
    >
      <template #controls>
        <div class="feed-stream__controls">
          <!-- THE TRUST LENS (Thread J, 2026-07-29) — filter the stream by
               invite-chain distance: "all" is the open feed, "≤N" keeps only
               posts whose OWNER sits within N hops of you on the web of trust
               the invite chain already is (rides `GET /feed?maxHops=`).
               Session-local on purpose: a lens is something you look through,
               not a setting that silently follows you to tomorrow. -->
          <div class="feed-stream__lens" title="Trust lens — only authors within N invite-chain hops of you">
            <button
              v-for="opt in LENS_OPTS" :key="String(opt.v)"
              type="button"
              class="feed-stream__lens-btn"
              :class="{ 'is-on': maxHops === opt.v }"
              @click="setLens(opt.v)"
            >{{ opt.label }}</button>
          </div>
          <!-- SORT BY (2026-08-06; ALIVE 2026-08-07) — the placeholder got
               its server parameter with the Talavero lens engine:
               `GET /feed?order=newest|oldest|heat`. Heat needs weighted
               labels to score against, so that entry stays disabled until a
               lens carries some — exactly the honesty the placeholder had,
               one item narrower. -->
          <button
            type="button"
            class="feed-stream__lens-btn feed-stream__label-open feed-stream__sort"
            :class="{ 'is-on': !!sortOrder }"
            :title="'Sort by — ' + (sortOrder || 'newest')"
            aria-label="Sort the feed"
          >
            <q-icon name="sort" size="13px" />
            <q-menu auto-close anchor="bottom right" self="top right">
              <q-list dense class="feed-stream__sort-menu">
                <q-item
                  v-for="opt in SORT_OPTS" :key="String(opt.v)"
                  clickable
                  :disable="opt.v === 'heat' && !hasWeightedLabels"
                  :class="{ 'is-current': sortOrder === opt.v }"
                  @click="setOrder(opt.v)"
                >
                  <q-item-section>{{ opt.label }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </button>
          <!-- THE LABEL LENS (open-source dev flow, 2026-08-01) — filter the
               stream by one label AND its whole subtree (rides
               `GET /feed?label=`, resolved server-side like the trust lens so
               the count stays honest). Unlike the trust lens it IS in the URL
               (`/#/feed?label=<id>`): "everything labeled DEVELOPMENT" is a
               place you send someone, where a trust radius is a way you look.
               The FUNNEL stays here (picking is a control); the active
               filter's chip moved to the head box's label lane below. -->
          <button
            type="button"
            class="feed-stream__lens-btn feed-stream__label-open"
            :class="{ 'is-on': !!labelFilter }"
            title="Filter the feed by a label"
          >
            <q-icon name="filter_alt" size="13px" />
            <q-menu v-model="labelMenuOpen" anchor="bottom right" self="top right">
              <div class="feed-stream__label-menu">
                <LabelPicker compact @picked="onLabelPicked" />
              </div>
            </q-menu>
          </button>
          <!-- The count, in the colorway (user ask: "paint the post counter
               indigo"). It was `<q-badge color="primary" outline>` — the last
               teal thing left in this box, from before the surface had one. -->
          <span v-if="total > 0" class="feed-stream__count">{{ total }}</span>
        </div>
      </template>

      <!-- The lane's contents. Two regimes share it: the OLD single-label
           lens chip (`?label=`, shareable URL) when no spoken lens is live,
           and the SPOKEN LENS's clause chips when one is — one chip per
           lane label plus one per synthesized clause (yesterday / from
           allegue / pictures / "coffee"), each with a close that removes
           JUST that clause client-side (no model round-trip), and a
           trailing × that clears the whole lens. -->
      <template #labels>
        <template v-if="lensSpec">
          <button
            v-for="chip in lensChips" :key="chip.key"
            type="button"
            class="feed-stream__label-chip mono"
            :title="chip.title || (chip.text + ' — click to remove this clause')"
            @click="chip.close()"
          >
            <q-icon :name="chip.icon" size="11px" />
            <span class="feed-stream__label-chip-name">{{ chip.text }}</span>
            <q-icon name="close" size="11px" />
          </button>
          <button
            type="button"
            class="feed-stream__label-chip feed-stream__label-chip--clear mono"
            title="Clear the whole lens"
            @click="clearLens"
          >
            <q-icon name="close" size="11px" />
          </button>
        </template>
        <button
          v-else-if="labelFilter"
          type="button"
          class="feed-stream__label-chip mono"
          :title="'Filtering by ' + labelFilter.name + ' — click to trash it'"
          @click="dropUrlLabel"
        >
          <q-icon name="filter_alt" size="11px" />
          <span class="feed-stream__label-chip-name">{{ labelFilter.name }}</span>
          <q-icon name="close" size="11px" />
        </button>
      </template>

      <!-- THE TRASH (2026-08-07, user ask) — labels the user discarded, in
           a disabled aesthetic. Each is a STANDING VETO: a later verdict
           never re-applies it (applySpec strips trashed ids first). Click
           to re-apply; the broom empties the whole section. -->
      <template #trash>
        <button
          v-for="t in trashedLabels" :key="'trash:' + t.id"
          type="button"
          class="feed-stream__label-chip feed-stream__label-chip--trashed mono"
          :title="t.name + ' — trashed: new asks won\'t re-apply it. Click to re-apply now.'"
          @click="restoreLabel(t.id)"
        >
          <q-icon name="label_off" size="11px" />
          <span class="feed-stream__label-chip-name">{{ t.name }}</span>
          <q-icon name="restart_alt" size="11px" />
        </button>
      </template>
    </FeedHeadBox>

    <div ref="wellEl" class="feed-stream__well">
      <div v-if="loading" class="text-center q-py-lg">
        <q-spinner color="primary" size="32px" />
      </div>

      <div v-else-if="items.length === 0" class="feed-stream__empty">
        <q-icon name="route" size="48px" style="opacity:0.18;" />
        <div class="q-mt-sm">Nothing posted yet.</div>
      </div>

      <div ref="streamEl" class="feed-stream">
        <template v-for="item in items" :key="item.skeleton_id">
          <!-- One square per post — bordered indigo-1 card, mono head strip,
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

              <!-- TRUST CHIP (Thread J) — the author's invite-chain distance
                   from YOU, stated as recorded fact: "2 hops", tooltip
                   carrying the whole vouch path ("you › allegue › garage").
                   Part of the author unit, so it sits with the identity
                   block before the section's closing rule. Your own posts
                   read "you"; no chip when the API had no viewer to measure
                   from. -->
              <span
                v-if="item.author?.trust"
                class="post-square__trust mono"
                :title="trustTitle(item.author.trust)"
              >{{ trustLabel(item.author.trust) }}</span>

              <!-- HEAT CHIP (2026-08-07) — under `order=heat` every card
                   states its own score, so the ordering can be READ as the
                   heat map it is: Σ of the lens's label weights, each
                   selection counted once. Only in heat order — in any other
                   the number would claim an ordering the stream isn't in. -->
              <span
                v-if="sortOrder === 'heat' && item.heat != null"
                class="post-square__heat mono"
                :title="'Heat ' + item.heat + ' — the sum of this lens\'s label weights this post matches'"
              >
                <q-icon name="local_fire_department" size="10px" />{{ item.heat }}
              </span>

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
                   floor, `--indigo-3` rim — which is what marks it as the
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
                 rimmed in `--indigo-3` like the pit and the title plate but
                 floored in `--indigo-2` — the bed tone, one step off the
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
                <!-- Each chip is the LINK to the label's page; the funnel
                     beside it (hover-revealed — the head band's picker covers
                     touch) is the second way into the label lens: filter the
                     stream by this chip without leaving the feed. -->
                <template v-for="lp in labelPaths(item)" :key="lp.id">
                  <router-link
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
                  <button
                    type="button"
                    class="post-square__label-filter"
                    :title="'Filter the feed by ' + lp.names[lp.names.length - 1]"
                    @click.stop.prevent="setLabelFilter({ id: lp.id, name: lp.names[lp.names.length - 1] })"
                  >
                    <q-icon name="filter_alt" size="11px" />
                  </button>
                </template>
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
            <!-- `auto` ref tier (2026-07-31): a bare node ref that resolves
                 to an embeddable URL (YouTube, Wikipedia, …) or a media
                 file blooms into its teal NodeMini panel right on the card;
                 every other ref stays the micro chip. Authors overrule per
                 ref: ![[…]] forces the panel, -[[…]] forces the chip. -->
            <div v-if="postBody(item)" class="post-square__pit" @click.stop>
              <MarkdownBody
                class="post-square__md"
                :text="postBody(item)"
                :breaks="false"
                ref-display="auto"
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
import { defineComponent, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { feedService } from 'src/services/feed.service'
import { labelService } from 'src/services/label.service'
import { chatService } from 'src/services/chat.service'
import { useEventsStore } from 'src/stores/events'
import { useChatStore } from 'src/stores/chat'
import LabelPicker from 'src/components/maker/LabelPicker.vue'
import FeedHeadBox from 'src/components/posts/FeedHeadBox.vue'
import { useStateHolder } from 'src/composables/useStateHolder'
import { timeAgo, absoluteTime } from 'src/utils/time'
import EntityAvatar from 'src/components/entities/EntityAvatar.vue'
import OrgLogoChip from 'src/components/organizations/OrgLogoChip.vue'
import PostMicro from 'src/components/posts/PostMicro.vue'
import MarkdownBody from 'src/components/shared/MarkdownBody.vue'

// FilterSpec symbols → a concrete window, in the VIEWER's OWN timezone —
// the deterministic half of "yesterday" the model never touches (P4: LLM
// calendar arithmetic is exactly the blind spot the seam cuts off). The
// server keeps a UTC twin for `?request=` replays; THIS one runs at
// execution, here, because "yesterday" means the viewer's yesterday.
const resolveWhenLocal = (when) => {
  if (!when || typeof when !== 'object') return null
  const now = new Date()
  const day = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
  const parseDay = (s) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim())
    if (m) return new Date(+m[1], +m[2] - 1, +m[3])
    const d = new Date(s)
    return Number.isNaN(d.getTime()) ? null : d
  }
  const today = day(now)
  if (when.preset === 'today') return { from: today, to: addDays(today, 1) }
  if (when.preset === 'yesterday') return { from: addDays(today, -1), to: today }
  if (when.preset === 'this_morning') return { from: today, to: new Date(today.getTime() + 12 * 3600000) }
  if (when.preset === 'this_week') {
    const monday = addDays(today, -((today.getDay() + 6) % 7))
    return { from: monday, to: addDays(monday, 7) }
  }
  const lastDays = parseInt(when.last_days)
  if (lastDays > 0) return { from: addDays(today, -(lastDays - 1)), to: addDays(today, 1) }
  if (typeof when.month === 'string' && /^\d{4}-\d{2}$/.test(when.month)) {
    const [y, mo] = when.month.split('-').map(Number)
    return { from: new Date(y, mo - 1, 1), to: new Date(y, mo, 1) }
  }
  const from = when.from ? parseDay(when.from) : null
  const to = when.to ? parseDay(when.to) : null
  return (from || to) ? { from, to } : null
}

// The clause chips' one-line reading of a `when` object.
const whenText = (w) => {
  if (!w) return ''
  if (w.preset) return w.preset.replace(/_/g, ' ')
  if (w.last_days) return `last ${w.last_days} days`
  if (w.month) return w.month
  if (w.from && w.to) return `${w.from} → ${w.to}`
  if (w.from) return `since ${w.from}`
  if (w.to) return `before ${w.to}`
  return ''
}

const KIND_ICONS = {
  image: 'image',
  file: 'attach_file',
  video: 'smart_display',
  link: 'link',
  embed: 'public'
}

export default defineComponent({
  name: 'FeedStream',
  components: { EntityAvatar, OrgLogoChip, PostMicro, MarkdownBody, LabelPicker, FeedHeadBox },
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

    // THE HEAD BOX's position (2026-08-06) — px from the container's top
    // edge, `null` until someone drags it (the box resolves that to its own
    // resting offset, so the geometry stays in one file). It rides the
    // StateHolder rather than a plain ref because moving the head is an
    // ARRANGEMENT of this surface, not a lens you look through: coming back
    // from a post to find the box back at the top would read as the drag
    // having been undone. The box reports on RELEASE, not per frame, so this
    // writes one nav_state row per gesture.
    const headY = computed(() => (typeof holder.state.headY === 'number' ? holder.state.headY : null))
    const setHeadY = (v) => { holder.state.headY = v }

    // …and its measured height, published back down as `--fhead-h`: the well
    // reserves the box's HOME slot so the first card is not born underneath
    // it (what the band's own place in the flow used to buy). Lifted out of
    // that slot, the box floats and the slot stays — the reveal at the top of
    // the stream is where the head came from.
    const headH = ref(0)

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
    onBeforeUnmount(() => {
      if (ro) ro.disconnect()
      ro = null
      clearTimeout(thinkTimer)
      clearTimeout(lineTimer)
    })

    // THE TRUST LENS state — null is the open feed. Options are few and
    // fixed because hop counts on this platform are small integers: 1 is
    // "people I (or my inviter) directly vouched for", 3 reaches the org
    // masks two rings out.
    const LENS_OPTS = [
      { v: null, label: 'all' },
      { v: 1, label: '≤1' },
      { v: 2, label: '≤2' },
      { v: 3, label: '≤3' }
    ]
    const maxHops = ref(null)
    const setLens = (v) => {
      if (maxHops.value === v) return
      maxHops.value = v
      load()
    }

    // THE LABEL LENS state — `{ id, name }` or null. Shareable on purpose:
    // the id rides `/#/feed?label=` so a filtered feed is a link you can
    // hand someone (the name is re-resolved from the id on arrival).
    const route = useRoute()
    const router = useRouter()
    const labelFilter = ref(null)
    const labelMenuOpen = ref(false)

    const syncLabelQuery = () => {
      const q = { ...route.query }
      if (labelFilter.value) q.label = String(labelFilter.value.id)
      else delete q.label
      router.replace({ query: q }).catch(() => {})
    }

    const setLabelFilter = (l) => {
      if ((labelFilter.value?.id || null) === (l?.id || null)) return
      labelFilter.value = l
      syncLabelQuery()
      load()
    }

    const onLabelPicked = (leaf) => {
      labelMenuOpen.value = false
      setLabelFilter(leaf ? { id: leaf.id, name: leaf.name } : null)
    }

    // Arriving on `?label=` while the stream is ALREADY mounted (hash-router
    // gotos reuse the component — the flyout param learned this first): the
    // query is the source of truth, so follow it both ways.
    watch(() => route.query.label, async (v) => {
      const qid = parseInt(v)
      if (!qid) {
        if (labelFilter.value) { labelFilter.value = null; load() }
        return
      }
      if (labelFilter.value?.id === qid) return
      try {
        const r = await labelService.get(qid)
        if (r.success && r.label) {
          labelFilter.value = { id: r.label.id, name: r.label.name }
          load()
        }
      } catch (_) { /* dead id — stay on the open feed */ }
    })

    // ── THE SPOKEN LENS (2026-08-07, the Talavero seat) ───────────────
    // The head box's field talks to a per-user pair chat with the seat;
    // the answer comes back as a SILENT `feed.lens` event carrying the
    // validated FilterSpec, and THIS component executes it — with the
    // viewer's own JWT, through the same `GET /feed` as everything else
    // (seat-strict: a lens computed under anyone else's footprint would
    // lie). Session-local like the trust lens: reload = clean feed, the
    // history lives in the chat.
    const eventsStore = useEventsStore()
    const chatStore = useChatStore()
    const seat = ref(null) // lens-context seat card (null = stub install)
    const digestNames = ref(new Map()) // label id → name (lane chip text)
    const lensChatId = ref(null)
    const lensSpec = ref(null) // the validated spec, or null
    const laneLabels = ref([]) // [{ id, name, weight, subtree }]
    // THE TRASH (2026-08-07, user ask) — labels the user discarded, held
    // (not deleted) in the lane's 30% section: visible in a disabled
    // aesthetic, re-appliable by click, and STANDING VETOES until then —
    // applySpec strips them from every later verdict. Session-local like
    // the rest of the lens; only the broom empties it.
    const trashedLabels = ref([]) // [{ id, name, weight, subtree }]
    const sortOrder = ref(null) // null = newest (the server default)
    const thinking = ref(false)
    const live = ref(false)
    const line = ref(null) // { kind: 'say'|'song'|'fail', text }
    const pendingReceipt = ref(null)
    let thinkTimer = null
    let lineTimer = null

    const SORT_OPTS = [
      { v: null, label: 'newest' },
      { v: 'oldest', label: 'oldest' },
      { v: 'heat', label: 'heat' }
    ]
    const hasWeightedLabels = computed(() => !!lensSpec.value?.labels?.length)

    const showLine = (kind, text, ms = 6000) => {
      line.value = { kind, text }
      clearTimeout(lineTimer)
      if (ms) lineTimer = setTimeout(() => { line.value = null }, ms)
    }

    const digestName = (id) => digestNames.value.get(id) || `label #${id}`

    // The ask: find-or-create the pair chat, send, and wait for the event.
    // The consent-gate refusals are CAUGHT and read back as lines — 40311
    // is "your opener is still waiting", 40312 "you declined the chat".
    const onAsk = async (text) => {
      if (!seat.value?.id) return
      try {
        if (!lensChatId.value) {
          const r = await chatService.open([seat.value.id])
          lensChatId.value = r.chat.id
        }
        await chatService.send(lensChatId.value, text)
        thinking.value = true
        clearTimeout(thinkTimer)
        thinkTimer = setTimeout(() => {
          thinking.value = false
          live.value = false
          showLine('fail', 'Talavero is resting — see the chat', 9000)
        }, 30000)
      } catch (e) {
        const code = e?.response?.data?.error?.code
        if (code === 40311) showLine('fail', "your first ask is still waiting for Talavero — it's in the chat", 9000)
        else if (code === 40312) showLine('fail', "you declined Talavero's chat — accept it in ChatDock to ask again", 9000)
        else showLine('fail', 'could not reach the seat — try again', 8000)
      }
    }

    const openLensChat = () => {
      if (lensChatId.value) chatStore.setActive(lensChatId.value)
      chatStore.open()
    }

    // The stream is the SECOND events reactor (ChatDock was the first):
    // feed.lens arrives silent (no badge — the chat message badges), and
    // the targeted ack is belt-and-braces beside that.
    watch(() => eventsStore.lastEvent, (ev) => {
      if (!ev || ev.kind !== 'feed.lens') return
      const meta = ev.meta || {}
      if (lensChatId.value && meta.chat_id && meta.chat_id !== lensChatId.value) return
      if (!lensChatId.value && meta.chat_id) lensChatId.value = meta.chat_id
      thinking.value = false
      clearTimeout(thinkTimer)
      live.value = true
      eventsStore.ack([ev.id])
      if (meta.mode === 'filtered') {
        const stripped = applySpec(meta.spec || {}, meta.lane_labels || [], meta.receipt)
        // The say line stays honest when the trash vetoed part of the
        // verdict — the seat's words promised a label the lane won't wear.
        if (meta.say) showLine('say', meta.say + (stripped ? ' · trash kept out' : ''))
      } else if (meta.mode === 'song') {
        showLine('song', '♪ ' + String(meta.verse || '').replace(/\n/g, ' · '), 9000)
      } else {
        showLine('fail', meta.say || "Talavero couldn't hear that one — try again.", 8000)
      }
    })

    // Returns whether the TRASH vetoed anything — the caller folds that
    // into the say line, so the seat's words and the lane never disagree
    // silently.
    const applySpec = (spec, lane, receipt) => {
      // THE TRASH IS A STANDING VETO (2026-08-07, user ask): a label the
      // user discarded is stripped from every LATER verdict before it
      // applies — restored only by hand (its chip) or by the broom. The
      // strip runs FIRST so every branch below (reset, ?label= handover,
      // the lens itself) sees the vetoed spec.
      let stripped = false
      if (trashedLabels.value.length && Array.isArray(spec.labels) && spec.labels.length) {
        const veto = new Set(trashedLabels.value.map((t) => t.id))
        const kept = spec.labels.filter((l) => !veto.has(l.id))
        if (kept.length !== spec.labels.length) {
          stripped = true
          if (kept.length) spec.labels = kept
          else {
            delete spec.labels
            if (spec.order === 'heat') spec.order = 'newest'
          }
          lane = (lane || []).filter((id) => !veto.has(id))
        }
      }
      const clauseKeys = Object.keys(spec || {}).filter((k) => k !== 'v')
      if (!clauseKeys.length) {
        // `{}` = reset — "show everything" clears EVERY lens, the old
        // single-label one included. The trash SURVIVES a spoken reset:
        // only its own broom empties it.
        clearLens({ reload: false })
        if (labelFilter.value) { labelFilter.value = null; syncLabelQuery() }
        load()
        return stripped
      }
      // `?label=` interop: a lens that is EXACTLY one unweighted subtree
      // label is the old lens — hand it over, so the URL stays shareable.
      const only = spec.labels || []
      if (clauseKeys.every((k) => k === 'labels' || k === 'order') &&
          only.length === 1 && only[0].weight === 1 && only[0].subtree) {
        clearLens({ reload: false })
        labelFilter.value = { id: only[0].id, name: digestName(only[0].id) }
        syncLabelQuery()
        load()
        return stripped
      }
      if (labelFilter.value) { labelFilter.value = null; syncLabelQuery() }
      lensSpec.value = spec
      sortOrder.value = spec.order && spec.order !== 'newest' ? spec.order : null
      pendingReceipt.value = receipt?.id || null
      laneLabels.value = (spec.labels || []).map((l) => ({
        id: l.id, name: digestName(l.id), weight: l.weight, subtree: l.subtree
      }))
      load()
      return stripped
    }

    const clearLens = ({ reload = true } = {}) => {
      lensSpec.value = null
      laneLabels.value = []
      sortOrder.value = null
      pendingReceipt.value = null
      if (reload) load()
    }

    // ── clause removal, client-side (no model round-trip) ─────────────
    // The validated spec carries per-source resolution maps exactly so a
    // chip-close can recompute the executable unions here.
    const recomputeAuthorIds = (a) => {
      const ids = new Set([
        ...Object.values(a.resolved || {}).flat(),
        ...(a.org ? (a.org_ids || []) : []),
        ...(a.me ? (a.me_ids || []) : [])
      ])
      a.ids = [...ids]
      const ex = new Set(Object.values(a.exclude_resolved || {}).flat())
      if (ex.size) a.exclude_ids = [...ex]
      else delete a.exclude_ids
    }

    const afterMutation = () => {
      const s = lensSpec.value
      if (s.authors && !s.authors.names?.length && !s.authors.exclude_names?.length && !s.authors.org && !s.authors.me) delete s.authors
      if (s.labels && !s.labels.length) {
        delete s.labels
        if (s.order === 'heat') { s.order = 'newest'; sortOrder.value = null }
      }
      if (s.kinds && !s.kinds.length) { delete s.kinds; delete s.embed_rule }
      laneLabels.value = (s.labels || []).map((l) => ({
        id: l.id, name: digestName(l.id), weight: l.weight, subtree: l.subtree
      }))
      if (!Object.keys(s).filter((k) => k !== 'v').length) clearLens()
      else load()
    }

    const dropClause = (key) => { delete lensSpec.value[key]; afterMutation() }
    // Removing an active label DOESN'T delete it (user ask): it moves to
    // the trash, where it stands vetoed until restored or swept.
    const _trash = (l) => {
      if (!trashedLabels.value.some((t) => t.id === l.id)) {
        trashedLabels.value.push({
          id: l.id,
          name: l.name || digestName(l.id),
          weight: l.weight || 1,
          subtree: !!l.subtree
        })
      }
    }
    const dropLabel = (id) => {
      const l = (lensSpec.value.labels || []).find((x) => x.id === id)
      if (l) _trash(l)
      lensSpec.value.labels = (lensSpec.value.labels || []).filter((x) => x.id !== id)
      afterMutation()
    }
    // The `?label=` chip is an active label filter too — closing it takes
    // the same door to the trash.
    const dropUrlLabel = () => {
      if (labelFilter.value) _trash({ id: labelFilter.value.id, name: labelFilter.value.name, weight: 1, subtree: true })
      setLabelFilter(null)
    }
    // A trashed chip clicked = re-applied NOW (the veto lifts). With no
    // live lens it starts one; a live `?label=` filter folds in as a spec
    // label first, so both keep filtering side by side.
    const restoreLabel = (id) => {
      const i = trashedLabels.value.findIndex((t) => t.id === id)
      if (i < 0) return
      const [l] = trashedLabels.value.splice(i, 1)
      if (!lensSpec.value) {
        const base = []
        if (labelFilter.value) {
          base.push({ id: labelFilter.value.id, weight: 1, subtree: true })
          labelFilter.value = null
          syncLabelQuery()
        }
        lensSpec.value = { v: 1, labels: base }
      }
      lensSpec.value.labels = [...(lensSpec.value.labels || []), { id: l.id, weight: l.weight, subtree: l.subtree }]
      afterMutation()
    }
    // THE BROOM — one press, both sections: active labels leave the live
    // filter (reloading the feed), the trash empties (nothing suppressed
    // afterward). Other clause chips (when/authors/kinds/…) are not its
    // business.
    const sweepLane = () => {
      trashedLabels.value = []
      if (lensSpec.value?.labels?.length) {
        lensSpec.value.labels = []
        afterMutation()
      } else if (labelFilter.value) {
        setLabelFilter(null)
      }
    }
    const dropKind = (k) => {
      lensSpec.value.kinds = (lensSpec.value.kinds || []).filter((x) => x !== k)
      afterMutation()
    }
    const dropAuthorName = (listKey, mapKey, name) => {
      const a = lensSpec.value.authors
      a[listKey] = (a[listKey] || []).filter((n) => n !== name)
      if (a[mapKey]) delete a[mapKey][name]
      if (!a[listKey].length) { delete a[listKey]; delete a[mapKey] }
      recomputeAuthorIds(a)
      afterMutation()
    }
    const dropAuthorKey = (key, idsKey) => {
      const a = lensSpec.value.authors
      delete a[key]
      delete a[idsKey]
      recomputeAuthorIds(a)
      afterMutation()
    }

    const lensChips = computed(() => {
      const s = lensSpec.value
      if (!s) return []
      const chips = []
      for (const l of laneLabels.value) {
        chips.push({
          key: 'label:' + l.id,
          icon: 'label',
          text: l.name + (l.weight > 1 ? ' ×' + l.weight : ''),
          title: `${l.name}${l.subtree ? ' (and everything under it)' : ''} · weight ${l.weight} — click to remove`,
          close: () => dropLabel(l.id)
        })
      }
      if (s.when) chips.push({ key: 'when', icon: 'schedule', text: whenText(s.when), close: () => dropClause('when') })
      const a = s.authors || {}
      for (const n of a.names || []) chips.push({ key: 'a:' + n, icon: 'person', text: 'from ' + n, close: () => dropAuthorName('names', 'resolved', n) })
      for (const n of a.exclude_names || []) chips.push({ key: 'x:' + n, icon: 'person_off', text: 'not ' + n, close: () => dropAuthorName('exclude_names', 'exclude_resolved', n) })
      if (a.org) chips.push({ key: 'org', icon: 'group', text: a.org, close: () => dropAuthorKey('org', 'org_ids') })
      if (a.me) chips.push({ key: 'me', icon: 'person', text: 'mine', close: () => dropAuthorKey('me', 'me_ids') })
      for (const k of s.kinds || []) {
        chips.push({
          key: 'k:' + k,
          icon: KIND_ICONS[k] || 'category',
          text: k + (k === 'embed' && s.embed_rule ? ' · ' + s.embed_rule : ''),
          close: () => dropKind(k)
        })
      }
      if (s.text) chips.push({ key: 'q', icon: 'search', text: '"' + s.text + '"', close: () => dropClause('text') })
      if (s.geo?.place) chips.push({ key: 'place', icon: 'place', text: s.geo.place, close: () => dropClause('geo') })
      if (s.limit) chips.push({ key: 'limit', icon: 'tag', text: 'first ' + s.limit, close: () => dropClause('limit') })
      return chips
    })

    const setOrder = (v) => {
      if (sortOrder.value === v) return
      if (v === 'heat' && !hasWeightedLabels.value) return
      sortOrder.value = v
      if (lensSpec.value) lensSpec.value.order = v || 'newest'
      load()
    }

    // The spec → `GET /feed` params — symbols resolved HERE, in the
    // viewer's timezone, at execution.
    const lensParams = (spec) => {
      const p = {}
      const win = resolveWhenLocal(spec.when)
      if (win?.from) p.from = win.from.toISOString()
      if (win?.to) p.to = win.to.toISOString()
      if (spec.authors?.ids?.length) p.authors = spec.authors.ids.join(',')
      if (spec.authors?.exclude_ids?.length) p.excludeAuthors = spec.authors.exclude_ids.join(',')
      if (spec.labels?.length) {
        p.labels = spec.labels.map((l) => `${l.id}:${l.weight || 1}${l.subtree ? 's' : ''}`).join(',')
      }
      if (spec.text) p.q = spec.text
      if (spec.kinds?.length) p.kinds = spec.kinds.join(',')
      if (spec.embed_rule) p.embedRule = spec.embed_rule
      if (spec.geo?.place) p.place = spec.geo.place
      if (spec.limit) p.limit = spec.limit
      return p
    }

    const load = async () => {
      loading.value = true
      try {
        // `body: 'full'` — the cards ARE the posts here, so each item carries
        // its whole markdown body instead of the 280-char preview slice.
        const params = { limit: 30, body: 'full' }
        if (maxHops.value != null) params.maxHops = maxHops.value
        if (lensSpec.value) {
          Object.assign(params, lensParams(lensSpec.value))
          // First execution binds the receipt's RESULT snapshot — once.
          if (pendingReceipt.value) {
            params.receipt = pendingReceipt.value
            pendingReceipt.value = null
          }
        } else if (labelFilter.value) {
          params.label = labelFilter.value.id
        }
        if (sortOrder.value) params.order = sortOrder.value
        const r = await feedService.getPublic(params)
        if (r.success) {
          items.value = r.items
          total.value = r.total
        }
      } catch (_) { items.value = [] }
      loading.value = false
      await holder.restore()
    }

    onMounted(async () => {
      // Arriving on `/#/feed?label=<id>` — resolve the name for the chip
      // before the first load; a dead id just falls back to the open feed.
      const qid = parseInt(route.query.label)
      if (qid) {
        try {
          const r = await labelService.get(qid)
          if (r.success && r.label) labelFilter.value = { id: r.label.id, name: r.label.name }
        } catch (_) { /* open feed */ }
      }
      await load()
      // The seat + the digest (lane chip names), one read. A failure just
      // leaves the box on its stub — the feed owes nothing to the lens.
      try {
        const ctx = await feedService.getLensContext()
        seat.value = ctx.seat || null
        digestNames.value = new Map((ctx.labels || []).map((l) => [l.id, l.name]))
      } catch (_) { /* stub box */ }
    })

    // The trust chip's two lines. Label states the DISTANCE; the tooltip
    // walks the PATH — every vouch between you and the author, in order.
    const trustLabel = (trust) =>
      trust.hops === 0 ? 'you' : `${trust.hops} hop${trust.hops === 1 ? '' : 's'}`

    const trustTitle = (trust) => {
      if (trust.hops === 0) return 'This is you'
      const names = (trust.path || []).map((p) => p.name)
      if (names.length) names[0] = 'you'
      return `Invite chain: ${names.join(' › ')}`
    }

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
      headY,
      setHeadY,
      headH,
      authorName,
      authorHandle,
      momentDetail,
      momentTitle,
      isOpen,
      cardName,
      labelPaths,
      postBody,
      LENS_OPTS,
      maxHops,
      setLens,
      labelFilter,
      labelMenuOpen,
      setLabelFilter,
      onLabelPicked,
      trustLabel,
      trustTitle,
      // the spoken lens (the Talavero seat, 2026-08-07)
      seat,
      lensSpec,
      lensChips,
      clearLens,
      thinking,
      live,
      line,
      onAsk,
      openLensChat,
      SORT_OPTS,
      sortOrder,
      setOrder,
      hasWeightedLabels,
      trashedLabels,
      restoreLabel,
      dropUrlLabel,
      sweepLane,
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
  // THE HEAD BOX'S CONTAINING BLOCK (2026-08-06). The box is absolute against
  // this element, which is exactly the field between the two frieze bars, so
  // "inside the frieze bars" needs no measuring: `left/right: 0` spans it and
  // the pane's own height is the box's travel. No z-index — the pane must not
  // become a stacking context, or the flyout's 3002 would start ranking
  // against this pane as a unit (the same trap `.feed-page` documents).
  position: relative;
}

// ── THE HEAD, AFTER IT BECAME A BOX (2026-08-06) ────────────────────
// `.feed-stream__head` is GONE and with it every rule that made it a band:
// `position: sticky; top: 0` (the cards travelled behind it because it was
// pinned inside the scroller), the `margin: 0 -3px 10px` that cancelled the
// well's side padding to keep it full-bleed lip to lip, the `--grey-4` coat
// it wore because it WAS the container showing through the stream, and the
// `2px --indigo-3` edge that stated where it ended. All four were answers to
// "a plate that lives at the top of a padded scroller", and the head does not
// live there any more: `FeedHeadBox.vue` places it over the well instead, out
// of the flow entirely, so it spans the field by construction, hides the
// cards by being opaque rather than by being pinned, and draws its own two
// edges because it is an object on the plate and no longer the plate itself.
//
// The sticky trap that block documented is still worth carrying: a sticky
// element is constrained by its MARGIN box, so a negative `margin-top` there
// is undone by `top: 0` and simply pushes the element down. It cost a pass to
// find and it is in [gotchas.md](../../../specs/gotchas.md) — nothing here
// depends on it any more, but the next sticky band on this surface will.
//
// What the stream kept is the CONTENTS of the band's right end: the sub-line
// and the lens cluster, handed to the box through its `controls` slot and
// still styled here, since they are the stream's controls and not the box's
// chrome. They stack now instead of running in one row — the slot is half a
// box wide, not a whole band.
// `.feed-stream__sub` — "Every POST instance, newest first." — is GONE
// (2026-08-06, user ask), and with it the last of the head's prose. It was
// the band's caption, and it survived the heading by one pass; what retired
// it is the one-line rule: the box is three thin bands now, and a caption is
// the kind of thing that only fits when there is a second row to put it on.
// (It also had a shelf life. With a SORT BY control on the same line,
// "newest first" is a claim the box would have to keep in step.)
//
// The controls no longer wrap either: they are one row inside half a box, so
// a wrap here would silently make the whole head taller. What they do instead
// when the half runs out is SCROLL — the lane's answer and the media tabs',
// hidden scrollbar included. Every child is `flex: 0 0 auto`, so the row
// overflows rather than crushing a lens button into illegibility, and the
// box's height is a constant whatever the window does to its width. (They
// fit at 390px today: 138px of controls in a 150px half.)
.feed-stream__controls {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }

  // CENTRED (user ask) — by AUTO MARGINS on the two ends, not by
  // `justify-content: center`. On a scroll container the justify properties
  // put overflowing content past BOTH edges, and the start of it can never be
  // scrolled back to (`scrollLeft` cannot go negative) — measured here at
  // 390px, where the count sat 15px outside the box and out of reach. Auto
  // margins centre exactly the same way while there is room and collapse to 0
  // the moment the row is full, so it degrades into a plain scroller. Same
  // call `MediaTabsBar` makes for its right-pinned tab row; see gotchas.
  > :first-child { margin-left: auto; }
  > :last-child { margin-right: auto; }
}

// THE TRUST LENS (Thread J) — a small segmented control in the head band,
// drawn entirely in the surface's own colorway: `--grey-1` plates rimmed
// `--indigo-3` (the title plate's exact recipe), and the ON state is the
// colorway's dark end as a FLOOR — `--indigo-8` under white ink, the one
// inversion the band allows itself so the active lens reads at a glance.
// ONE INK FOR THE WHOLE BOX (2026-08-06, user ask): every rim and every mark
// on these controls is `--fhead-ink` / `--fhead-rule`, the dials the head box
// publishes — `--indigo-9`, the same step its two inner frieze posts are
// plated in. The fallbacks are what these rules said before (`--indigo-3`
// rims, `--indigo-8` ink), so the cluster still draws correctly if it is ever
// slotted anywhere but into the head.
.feed-stream__lens {
  display: flex;
  flex: 0 0 auto;
  border: 1px solid var(--fhead-rule, var(--indigo-3, #9fa8da));
  border-radius: var(--radius-sm, 7px);
  overflow: hidden;
  background: var(--grey-1, #fafafa);
}

.feed-stream__lens-btn {
  border: 0;
  border-right: 1px solid var(--fhead-rule, var(--indigo-3, #9fa8da));
  background: transparent;
  color: var(--fhead-ink, var(--indigo-8, #303f9f));
  font-family: inherit;
  font-size: 0.66em;
  font-weight: 700;
  letter-spacing: 0.03em;
  padding: 3px 8px;
  cursor: pointer;
  &:last-child { border-right: 0; }
  &:hover { background: var(--indigo-1, #e8eaf6); }
  // The ON plaque takes the box's ink as its FILL — one indigo in the box,
  // whether a control is drawing a line, a word or a field.
  &.is-on {
    background: var(--fhead-ink, var(--indigo-8, #303f9f));
    color: #fff;
  }
}

// THE LABEL LENS (2026-08-01) — the funnel borrows the lens box's language
// (same rim, radius, floor). It used to have TWO faces, the second being the
// active filter drawn as a dark chip in its place; since 2026-08-06 the chip
// lives in the head box's label lane and the funnel stays put, taking the
// lens buttons' own `is-on` plaque so the control still says the stream is
// filtered without having to also say what by. SORT BY shares the rule and
// adds only the disabled state — it is a placeholder (see the template).
.feed-stream__label-open {
  border: 1px solid var(--fhead-rule, var(--indigo-3, #9fa8da));
  border-radius: var(--radius-sm, 7px);
  background: var(--grey-1, #fafafa);
  flex: 0 0 auto;
  padding: 3px 7px;
  display: flex;
  align-items: center;
  &.is-on {
    background: var(--fhead-ink, var(--indigo-8, #303f9f));
    border-color: var(--fhead-ink, var(--indigo-8, #303f9f));
    color: #fff;
  }
}

.feed-stream__sort:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

// THE ACTIVE FILTER, in the lane (2026-08-06). Same dark `--indigo-8` plaque
// it always was — "the stream you are reading is filtered" — one step smaller
// to sit in a 19px strip, and it no longer ELLIPSES: the lane scrolls, so a
// long label name is reachable rather than trimmed. `flex: 0 0 auto` is what
// lets it overflow the lane instead of being squeezed into it.
.feed-stream__label-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 0 0 auto;
  border: 1px solid var(--fhead-ink, var(--indigo-8, #303f9f));
  border-radius: var(--radius-sm, 7px);
  background: var(--fhead-ink, var(--indigo-8, #303f9f));
  color: #fff;
  font-size: 0.6em;
  font-weight: 700;
  letter-spacing: 0.03em;
  padding: 1px 7px;
  cursor: pointer;
  &:hover { background: var(--indigo-8, #303f9f); } // one step off the box's ink
}

.feed-stream__label-chip-name {
  white-space: nowrap;
}

// The lens's trailing CLEAR chip — the same plaque, hollowed: an outline
// with the ×, so "remove one clause" and "drop the whole lens" read as the
// same family at two weights.
.feed-stream__label-chip--clear {
  background: transparent;
  color: var(--fhead-ink, var(--indigo-8, #303f9f));
  &:hover { background: var(--grey-3, #eeeeee); }
}

// A TRASHED label (2026-08-07, user ask) — the same chip in its disabled
// aesthetic: hollow, dashed, faded. Still a button, because the trash is a
// holding place, not a grave — clicking re-applies the label; hover
// firms it up to say so.
.feed-stream__label-chip--trashed {
  background: transparent;
  border-style: dashed;
  color: var(--fhead-ink, var(--indigo-8, #303f9f));
  opacity: 0.5;
  &:hover { opacity: 0.9; background: var(--grey-3, #eeeeee); }
}

// The SORT BY menu — dense rows in the box's own ink; the current order
// carries a filled left edge rather than a check glyph (one more icon in a
// 3-row menu is noise).
.feed-stream__sort-menu {
  min-width: 92px;
  .q-item { font-size: 0.72em; color: var(--indigo-9, #283593); min-height: 26px; }
  .q-item.is-current { box-shadow: inset 3px 0 0 var(--indigo-7, #3949ab); font-weight: 700; }
}

// THE COUNT (2026-08-06, user ask: "paint the post counter indigo"). It was
// `<q-badge color="primary" outline>` — the platform teal, and the last thing
// in this box still wearing it after the surface took a colorway of its own.
// Drawn as the lens buttons at REST rather than as one locked on: the total
// is a fact the box states, not a filter you can be inside of.
.feed-stream__count {
  flex: 0 0 auto;
  border: 1px solid var(--fhead-rule, var(--indigo-4, #7986cb));
  border-radius: var(--radius-sm, 7px);
  background: var(--grey-1, #fafafa);
  color: var(--fhead-ink, var(--indigo-8, #303f9f));
  font-size: 0.64em;
  font-weight: 700;
  letter-spacing: 0.03em;
  padding: 2px 7px;
}

// The picker floats in a q-menu — a small light plaque, wide enough for
// the leaf names the dropdown states as `[PARENT] > NAME`.
.feed-stream__label-menu {
  width: 260px;
  padding: 8px;
  background: var(--grey-1, #fafafa);
}

// `.feed-stream__heading` — the band's "Public Feed" in `--indigo-8` (end of
// 2026-07-25, replacing the platform-wide `text-accent` teal: on the
// container's own coat the accent read as a foreign colour dropped onto it) —
// is GONE with the band (2026-08-06). The name is the head BOX's bar title
// now (`.feed-head__title`), one step deeper at `--indigo-10`, which is the
// tone the parked-media tabs took for writing laid on a neutral face; the
// box's chrome follows the tabs it borrows its corners from, not the cards.
// The SUB-LINE stayed exactly as it was — the generic dim ink, since it is a
// caption and one ink for both would flatten the pair into a block.

.feed-stream__well {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  overflow-y: auto;
  overflow-x: hidden;
  // The SCROLL BED (2026-07-25) — `--indigo-2`, one step down from the
  // `--indigo-1` the container and the cards wear. It walked in from the
  // deep end the same day (-4, then -3, then here), and this is the setting
  // where the surface resolves: the bed only has to be far enough from the
  // card to separate it, and with the card now OUTLINED in -4 the separation
  // is the border's job — a dark field underneath as well was doing it twice.
  // -2 was also the one step NOT in the frieze bars' tone mapping of the day
  // (1/3/4), so the bed read as its own quiet layer rather than echoing an
  // edge — an argument that has since expired twice: the bars keep no indigo
  // but their waves, and those settled at -4/-6 on 2026-08-05.
  //
  // It went FLUSH WITH THE CONTAINER on 2026-08-05 (user ask) — `--grey-4`,
  // the same plaque the box and its two frieze edges wear. The bed is the only
  // part of the field a reader ever actually SEES (it covers the container
  // edge to edge), so leaving it indigo while the box went neutral would have
  // made the change true in the stylesheet and invisible on screen. The step
  // it used to hold under the cards is not lost, it changed sign: the cards
  // are `--indigo-1` on a neutral now, so they separate by HUE and by their
  // own outline rather than by sitting a shade above their bed —
  // which is the same move the node panel made when its reading panes went
  // teal on a grey box (see `$teal-1` in _tokens.scss).
  //
  // BACK ON THE PLAQUE, and this time the whole BOX is: 2026-08-06 walked this
  // floor `--grey-5` (a sunk tray), then `--grey-3` (a lit page), then back to
  // `--grey-4` on the ask that also removed the side padding and took the
  // frieze lips to the same tone. Those three go together and are one idea:
  // bars, container, head band and bed are a single material with no edge
  // anywhere between them, so the box is one continuous plate from lip to lip.
  //
  // The step did not disappear, it MOVED — the last ask of the day put the
  // CARD at `--grey-3`, one above this. Which is the better arrangement of the
  // same two tones: the bed is the box (and the box is one material with its
  // frieze edges, the rule that has held since 2026-07-25), and the pale thing
  // is the object lying on it. Nothing here separates by hue any more; a card
  // is stated by one step of lightness and its own `--grey-6` outline.
  background: var(--grey-4, #e0e0e0);
  // The bed's REVEAL around the cards. The sides walked the whole way down and
  // a little back up on 2026-08-06: `10px` (from the day the well took padding
  // back) → `5px` → `0` ("remove completely") → **`3px`** ("just a little
  // little"). Three pixels is not a gap you read as space — it is the smallest
  // reveal that keeps the card's own border from LANDING ON the frieze bar, and
  // that is the whole job. At `0` the card ran flush into the bar and its edge
  // and the bar's became one line at the seam; the bar's lip is `--grey-4` (it
  // draws nothing) precisely because of that pass, and it stays that way — the
  // sliver is doing the separating now, not a lip.
  //
  // The vertical rhythm is untouched at 10px (the gap under the head, the
  // stream's flex `gap` between the rest), so the reveal is
  // deliberately UNEVEN: wide between cards, a hairline at the lips. The head
  // band's negative side margins used to be exactly `-1 x` this number so the
  // band stayed full-bleed lip to lip while the cards kept the sliver
  // (`-10px`, `-5px`, `0`, `-3px`, in step with it); the head is a BOX outside
  // this scroller since 2026-08-06 and spans the field on its own, so that
  // pairing is retired and this padding is the cards' alone.
  //
  // The TOP padding came back with the same change, and it is the box's HOME
  // SLOT: `--fhead-h` is the box's measured height (published down from
  // `setup()` — a px value, for the same reason `--post-square-max` is one),
  // `12px` is the box's resting offset (`HOME` in FeedHeadBox — it clears the
  // corner sweeps, so it moved with them when the edge was thickened) and
  // another `10px` the gap to the first card, so at rest the stream begins
  // where it began under the band.
  // It does NOT follow the box down: the slot is the head's place, and a
  // stream that reflowed while you dragged would make the drag a resize. Drag
  // the head away and the reveal it leaves behind is where it came from.
  // (The band-era `0` is in the history for the sticky trap that forced it —
  // see the retired `.feed-stream__head` note above.)
  // The bottom padding is the exception and has a job of its own: clearing the
  // frieze footer band the container hovers over.
  // NOTE the side padding narrows `.feed-stream`, which is the element the
  // square ceiling is measured from — the ResizeObserver picks the new width
  // up on its own, so `--post-square-max` follows automatically.
  padding: calc(var(--fhead-h, 120px) + 22px) 3px calc(var(--frieze-h) + 12px);
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
// rather than the platform's white — which since 2026-08-06 means the
// container's NEUTRAL. One step, one job, as of that day: `--grey-4` coats the
// card (as it coats the container, the rule that has never moved), `--grey-3`
// is the scroll bed under it, and `--indigo-4` draws EVERY line — the card's
// 2px outer border, its byline hairline and vertical rule, the title plate's
// rim, the label rail, the trust chip, the pit's 1px inner one, and the frieze
// lips — so only the weight distinguishes them. The colorway's earlier reading
// was `--indigo-1` card, `--indigo-2` bed, `--indigo-3` lines, with -4 left to
// the frieze waves; each of those three moved on its own ask, and the SHAPE of
// the rule survived all of them: coat, bed, one line ink.
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
  // ONE INK, `--indigo-4`, on all seven inner lines AND all four outer edges —
  // the card's oldest rule, that its lines share an ink and differ only in
  // WEIGHT, held after all. It very nearly did not: the last passes of
  // 2026-08-06 split the box into a bevel (bottom + left in the colorway, top +
  // right neutral, reading as a light source at the top right) before the user
  // brought the other two edges across as well. The bevel is worth remembering
  // as a REAL option — the card lost its drop shadow at the end of 2026-07-25
  // and two coloured edges restate that lift as line, at no cost — but the
  // reunited box is the simpler statement, and simpler is what this surface has
  // been converging on all along.
  //
  // The full walk that day: `--indigo-3` (from 2026-07-25) → `--indigo-4` →
  // `--grey-5` → `--grey-6` → the split (asked at `--indigo-6`, tried at -5,
  // settled at -4) → back to one ink here. The trip out to the greys and all
  // the way back is worth keeping for what it settled. The -3 → -4 step was
  // about the surfaces going neutral underneath: a line's job on a grey plate
  // is not the job it had on an indigo one, and with a `--grey-3` card on a
  // `--grey-4` bed the line is the only thing stating the card's shape. The
  // greys then proved how much DEPTH that edge needs — `--grey-5` read as a
  // soft suggestion of a card at the frieze seam, `--grey-6` held — before the
  // hue came back to carry it at the same depth. And -4 is the level the rest
  // of this screen already draws lines in: the media tabs strip's edges, and
  // the bars' lip whenever it has a job (it does not now — `--grey-4`).
  //
  // So: grep `.post-square` for the tone before touching ANY of these eight
  // lines, and move them together.
  //
  // EVEN on all four edges since 2026-08-06 (user ask). The weight was UNEVEN
  // from the end of 2026-07-25 — 1px on top and the sides, a 2px
  // `border-bottom-width` under them, a hairline box on a heavier FOOT that
  // seated the card on its bed (all four were 2px before that and the box read
  // heavy). What retired the foot is that the bed stopped being something to
  // sit ON: it is `--grey-3` now, a step LIGHTER than the card, so a weighted
  // base under a box resting on nothing darker read as a shadow with nothing
  // casting it.
  border: 1px solid var(--indigo-4, #7986cb);
  // LESS ROUNDED, twice on 2026-08-06 (two user asks) — `--radius-md` (0.85em)
  // to `--radius-sm` (0.5em, the step the card's own inner boxes turn) and then
  // to a flat `4px`. Flat px and not a token on purpose: there is no platform
  // step below -sm, and minting `--radius-xs` for one box would state a
  // platform-wide rhythm that does not exist. It read as a rounded tile at -md
  // and as a sheet with the corners taken off at -sm; at 4px the corner says
  // only that the box is not a raw rectangle — the right register for a card
  // whose LINES do the separating and whose bed is a step lighter than it.
  border-radius: 4px;
  // `--grey-3` — ONE STEP ABOVE the bed it lies on (2026-08-06, the last of
  // that day's asks). The card left the colorway earlier the same day
  // (`--indigo-1` → `--grey-4`, the container's own coat, since a post square
  // is a piece of the container and never wore the platform's generic white
  // `--paper-card`), and this moves it off the plaque by one step in the
  // LIGHT direction. So the tonal step under a card is back, and pointing up:
  // a card is a pale sheet on a grey plate.
  //
  // That step and the bed's are the same dial read twice — the bed spent the
  // afternoon at `--grey-5`, then `--grey-3`, before going back to the plaque
  // so the CARD could take the lighter tone instead. The difference is which
  // one moves: a lighter BED makes the box a page with darker sheets on it, a
  // lighter CARD makes the box a plate with pale sheets lying on it, and only
  // the second keeps the container reading as one material with its edges.
  background: var(--grey-3, #eeeeee);
  // NO drop shadow (2026-07-25). The card used to cast `0 1px 3px` to lift
  // itself off the page; it has nothing to lift off — the tonal step against
  // the bed already separates card from field (the bed was the darker of the
  // two until 2026-08-06 and is the lighter now; either way it is a step), and
  // a cast edge on top of it only muddied the 10px gap between two adjacent
  // cards. Flat plaque on a bed one step off it.
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
// and its border runs from one side border to the other. `--indigo-4` is the
// ink every line on this surface is drawn in (the card's outer border, the pit's
// rim, the head's vertical rule — and the frieze lips again since 2026-08-06,
// when both this card's lines and the bars' lip landed on that level) — a
// divider inside the card is the same line as the ones around it, at hairline
// weight.
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
  border-bottom: 1px solid var(--indigo-4, #7986cb);
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
// band, one vertical line inside it, both `--indigo-4` at 1px (the card's one
// line ink — see `.post-square`), both meeting the box's edges square.
.post-square__byline-rule {
  align-self: stretch;
  flex: 0 0 1px;
  width: 1px;
  margin: -5px 0;
  background: var(--indigo-4, #7986cb);
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
// `--indigo-3`, i.e. the same floor and the same line as the markdown pit
// below it and the label rail above it, so the card reads as one material.
// The ink is `--indigo-8`, the colorway's dark end.
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
  color: var(--indigo-8, #303f9f);
  background: var(--grey-1, #fafafa);
  border: 1px solid var(--indigo-4, #7986cb);
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
  // INNER border drawn around it in `--indigo-3`. The floor was a 5% ink
  // tint of whatever the card was, which made the pit a slightly darker patch
  // OF the card; a flat near-white is a different material set INTO it — the
  // one tone on this surface deliberately outside the container's colorway,
  // because everything else here IS the container and the reading area is not.
  // The line is the opposite move: it is the card's ONE line ink, the same the
  // OUTER border is drawn in, because every line on this card is one ink and
  // only the weight tells them apart — a rule that survived 2026-08-06 by a
  // hair, the box having spent part of that day split into a two-tone bevel.
  // The tone walked `--indigo-3` → `--indigo-4` → `--grey-5` → `--grey-6` →
  // back to `--indigo-4` across the same day; see `.post-square` for what each
  // step settled, and move all eight lines together or none of them. The frieze bars drew
  // the container's side borders in that same -3 until 2026-08-05, so card edge
  // and box edge were literally one line; the bars' lip has since gone neutral
  // to the point of invisibility (`--grey-4`, the plaque), so the card's edges
  // are now the only lines on this surface at all. The floor stays near-white
  // through all of it: it is the READING area, and the one tone here that was
  // never the container's.
  // EVEN on all four sides. It wore a heavier 2px top for one pass, matching
  // the rail's, and that reading does not carry down here: the rail is a
  // shallow tray and a lip suits it, while the pit is the READING area and
  // wants a plain frame — a weighted edge above the text reads as a rule the
  // prose hangs from. The heavy-top device stays the rail's alone.
  border: 1px solid var(--indigo-4, #7986cb);
  background: var(--grey-1, #fafafa);
  // NO carve (end of 2026-07-25) — the surface is FLAT. The pit used to wear
  // the `.label-square__pit` recipe, an inset dark shadow at the top edge over
  // an inset white lip at the bottom, which read as a box pressed into the
  // card. That was the last shadow anywhere on the card (its own drop shadow
  // went earlier the same day), and depth from two directions at once — a
  // recessed pit inside a flat card on a flat bed — is what made the surface
  // look unresolved. Everything is stated by TONE and LINE now: the grey-1
  // floor against the card's own coat, and the colorway line around it.
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
//   · The BOX is the card's third panel, rimmed 1px `--indigo-3` like the
//     pit below it and the title plate above, but floored in `--indigo-2`
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
// side. Same reasoning, and the same 1px `--indigo-3`, as the byline
// band's bottom border — the card is divided by full-bleed lines and
// panelled by inset boxes, and those are two different devices.
.post-square__rail-strip {
  flex: 0 0 auto;
  min-width: 0;
  padding: 6px 7px;
  border-bottom: 1px solid var(--indigo-4, #7986cb);
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
  border: 1px solid var(--indigo-4, #7986cb);
  border-top-width: 2px;
  border-radius: 7px;
  // The bed tone, not the pit's near-white — see the note above.
  background: var(--indigo-2, #c5cae9);
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
  // The card's own coat, lying in the `--indigo-2` tray (the chips were
  // transparent, so they took the tray's tone and the rail read as one field
  // with outlines drawn on it). -1 chip on a -2 bed is the same figure/ground
  // step as a -1 card on the stream's -2 well, one level down.
  background: var(--indigo-1, #e8eaf6);

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

// The chip's FUNNEL (2026-08-01) — the second door into the label lens:
// filter the stream by this chip without leaving the feed. Hover-revealed
// (the rail is a hover surface already; touch has the head band's picker),
// and pulled against its chip's gap so the pair reads as one unit.
.post-square__label-filter {
  flex: 0 0 auto;
  border: 0;
  background: transparent;
  color: rgba(var(--ink-rgb), 0.45);
  padding: 0 2px;
  margin-left: -4px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.12s;

  .post-square__rail:hover & { opacity: 0.6; }
  &:hover { opacity: 1 !important; color: #00829c; }
}

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

// TRUST CHIP (Thread J) — invite-chain distance, part of the author unit
// like the badge above it (same pulled-in margin, same "belongs to the
// identity" argument). Drawn as a tiny plate in the card's own recipe:
// `--grey-1` floor, `--indigo-3` rim, the colorway's dark ink. Zero
// hops ("you") stays quiet; the tooltip walks the whole vouch path.
.post-square__trust {
  margin-left: -3px;
  flex: 0 0 auto;
  font-size: 0.58em;
  font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;
  color: var(--indigo-8, #303f9f);
  background: var(--grey-1, #fafafa);
  border: 1px solid var(--indigo-4, #7986cb);
  border-radius: 9px;
  padding: 1px 6px;
}

// HEAT CHIP (2026-08-07) — the trust chip's recipe with the tones flipped
// warm: under `order=heat` the card states its own score, so the ordering
// reads as the heat map it is.
.post-square__heat {
  margin-left: -3px;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 0.58em;
  font-weight: 700;
  white-space: nowrap;
  color: var(--deep-orange-9, #bf360c);
  background: var(--grey-1, #fafafa);
  border: 1px solid var(--deep-orange-4, #ff8a65);
  border-radius: 9px;
  padding: 1px 6px;
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
