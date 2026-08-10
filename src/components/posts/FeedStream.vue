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
          <!-- ⚠ THE LABEL BAR COMES FIRST (2026-08-08, user ask: swap the
               section's two rows). Reading order, not just paint: the field
               you TYPE a filter into sits above the bundle of ready-made
               lenses, which is the order the section is used in — you either
               name the label you want or reach for one of the three. Moved in
               the MARKUP rather than with `column-reverse` or `order`, so the
               tab order follows the eye. ⚠ Which means the PHONE flips too
               (there the section is one row, so "first" is left): label field
               left, bundle right, where it was bundle-left before. That is the
               same decision read sideways, and the alternative — an `order`
               override in the media query — would have put DOM and visual
               order back out of step on the one layout where a caret and a
               thumb are working together.

               ⚠ AND THE VERB IS BACK INSIDE THE BAR (a later ask the same
               day), where it began. It spent a few asks OUTSIDE, standing on
               the section's `--indigo-9` beside the bubble the way the lane's
               two keys stand beside their trays — and what that cost is why it
               came back: out there its `--indigo-9` plate was drawn on an
               `--indigo-9` floor and vanished, leaving a bare funnel glyph. In
               here the plate lands on the bar's own `--brown-1` and reads as
               what it is, the one PRESSABLE thing in a bar you otherwise type
               into. The `.feed-stream__label-line` wrapper went with it: with
               the button back inside, the bar is the row again. -->
          <!-- THE LABEL LENS (open-source dev flow, 2026-08-01) — filter the
               stream by one label AND its whole subtree (rides
               `GET /feed?label=`, resolved server-side like the trust lens so
               the count stays honest). Unlike the trust lens it IS in the URL
               (`/#/feed?label=<id>`): "everything labeled DEVELOPMENT" is a
               place you send someone, where a trust radius is a way you look.
               The active filter's chip lives in the head box's label lane.

               ITS OWN ROW SINCE 2026-08-07 (user ask) — and no longer a
               funnel in the bundle. The other four lenses each state their
               whole answer in a glyph and a mark; this one names a LABEL out
               of a tree of hundreds, which a 21px plate can only do by
               opening a picker over the feed. So it stops pretending to be
               the same kind of control: a NAMED FIELD on a line of its own,
               `label` glyph at the left saying what the line is for, the
               `filter_alt` button at the right performing the filtering — the
               same funnel, moved from "the control" to "the verb".

               It types against the label list the box ALREADY has: the head's
               `GET /feed/lens-context` returns every label with its chain, so
               the match runs in memory with no request per keystroke, and the
               menu is a plain list of what the query hits. `no-focus` on it is
               load-bearing — a `q-menu` takes focus when it opens, and a
               type-ahead whose menu steals the caret after one character is a
               field you cannot type a second character into. -->
          <!-- THE VERB STANDS OUTSIDE THE FIELD (2026-08-08, user ask), the
               way the lane's two keys stand outside their trays: this LINE is
               the flex row, the `--brown-1` bubble is the thing you type in,
               and the funnel is a sibling beside it. It was the bubble's last
               child, ruled off by a border — which made the button part of the
               field's own box, and on a rounded warm panel a dark tile jammed
               into the right end read as a chip stuck to the input rather than
               as the thing that acts on it. -->
          <div class="feed-stream__label-row">
            <q-icon name="label" size="13px" class="feed-stream__label-row-mark" aria-hidden="true" />
            <input
              v-model="labelQuery"
              type="text"
              class="feed-stream__label-input"
              placeholder="Label…"
              :title="labelFilter ? 'Filtering by ' + labelFilter.name : 'Type a label name, then filter'"
              aria-label="Filter the feed by a label"
              @input="labelMenuOpen = true"
              @keydown.enter.prevent="applyLabelQuery"
              @keydown.esc="labelMenuOpen = false"
            >
            <q-menu
              v-model="labelMenuOpen"
              no-focus
              no-parent-event
              fit
              anchor="bottom left"
              self="top left"
            >
              <q-list v-if="labelMatches.length" dense class="feed-stream__sort-menu feed-stream__label-hits">
                <q-item
                  v-for="l in labelMatches" :key="'lq:' + l.id"
                  clickable
                  :class="{ 'is-current': labelFilter && labelFilter.id === l.id }"
                  @click="pickLabelHit(l)"
                >
                  <q-item-section>
                    <span class="feed-stream__label-hit-name">{{ l.name }}</span>
                    <span v-if="l.chain" class="feed-stream__label-hit-chain">{{ l.chain }}</span>
                  </q-item-section>
                </q-item>
              </q-list>
              <div v-else class="feed-stream__label-hit-empty">no label by that name</div>
            </q-menu>
            <button
              type="button"
              class="feed-stream__label-go"
              :class="{ 'is-on': !!labelFilter }"
              :title="labelFilter ? 'Filtering by ' + labelFilter.name + ' — press to clear' : 'Filter the feed by this label'"
              aria-label="Apply the label filter"
              @click="applyLabelQuery"
            >
              <q-icon name="filter_alt" size="13px" />
            </button>
          </div>
          <!-- THE LENSES ARE ONE BUNDLE since 2026-08-07 (user ask: "bundle
               them using a quasar button bundle component") — `QBtnGroup`,
               the platform's own, wrapping four `QBtn`s. They were four
               separate plates with four rims and four radii, reading as four
               objects that happened to be near each other; they are one
               object with four keys now, which is what a row of lenses over
               ONE stream actually is.

               `flat` on the group AND on every child, deliberately: Quasar's
               `--outline` variant carries `background: transparent !important`
               (QBtn.sass), and the `is-on` plaque is a FILL — the one state
               this cluster has to be able to draw. So the group keeps
               Quasar's geometry (radius inherited, the corners squared off on
               everything but the two ends) and this file keeps the paint.
               See the stylesheet for the rim and the dividers. -->
          <q-btn-group flat class="feed-stream__lens-group">
          <!-- THE TRUST LENS (Thread J, 2026-07-29) — filter the stream by
               invite-chain distance: "all" is the open feed, "≤N" keeps only
               posts whose OWNER sits within N hops of you on the web of trust
               the invite chain already is (rides `GET /feed?maxHops=`).
               Session-local on purpose: a lens is something you look through,
               not a setting that silently follows you to tomorrow.

               A DROPDOWN since 2026-08-07 (user ask). It was a four-plate
               segmented control — all/≤1/≤2/≤3 — which spent ~100px of a
               ~150px half saying three things you are NOT looking through to
               say the one you are. Folded into one tiny plate it states the
               radius and nothing else: the `connect_without_contact` glyph
               (two figures reaching across a gap — the invite chain in one
               mark) and THE NUMBER beside it, `∞` when the feed is open,
               because "no limit" is a radius too and the button should never
               go blank. The four options moved into the menu, where they read
               as words ("≤2 hops") instead of as symbols in a strip. -->
          <q-btn
            flat
            dense
            no-caps
            class="feed-stream__lens-btn feed-stream__hops"
            :class="{ 'is-on': maxHops != null }"
            :title="hopsTitle"
            aria-label="Trust lens — filter by invite-chain distance"
          >
            <q-icon name="connect_without_contact" size="13px" />
            <span class="feed-stream__lens-n nasalization">{{ hopsMark }}</span>
            <q-menu auto-close anchor="bottom right" self="top right">
              <q-list dense class="feed-stream__sort-menu">
                <q-item
                  v-for="opt in LENS_OPTS" :key="String(opt.v)"
                  clickable
                  :class="{ 'is-current': maxHops === opt.v }"
                  @click="setLens(opt.v)"
                >
                  <q-item-section>{{ opt.label }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
          <!-- THE DATE LENS (2026-08-07 as the "time lens"; SPLIT IN TWO on
               2026-08-08, user ask) — WHICH DAYS the stream is read through:
               six presets and a CUSTOM range of two dates. It rides
               `GET /feed?from=&to=`, the same pair the spoken lens's `when`
               clause does, and builds the very same `when` object, so one
               resolver (`resolveWhenLocal`) turns both into a concrete window
               IN THE VIEWER'S OWN TIMEZONE — "today" means the reader's today,
               here, at execution.

               It USED to own the clock as well: its custom range took a date
               AND a time at each end, which made one control answer two
               questions and neither of them fully — you could say "since
               Tuesday 09:00" but never "mornings". The clock moved next door
               (see the TIME lens) and this drawer went to plain `date` fields.
               ⚠ What that trades away is an instant-precise window from THIS
               drawer; `?from=`/`?to=` still take full ISO datetimes and the
               spoken lens still resolves them, so the capability is in the
               platform, just not in this two-field tray.

               One window at a time: picking here drops a spoken `when` (and
               its lane chip), and an arriving spoken `when` clears this — two
               controls fighting over one pair of parameters would leave the
               box stating a filter the stream is not under. -->
          <q-btn
            flat
            dense
            no-caps
            class="feed-stream__lens-btn feed-stream__when"
            :class="{ 'is-on': !!dateWin }"
            :title="dateTitle"
            aria-label="Date lens — filter the feed by which days"
          >
            <q-icon name="calendar_month" size="13px" />
            <span v-if="dateMark" class="feed-stream__lens-n nasalization">{{ dateMark }}</span>
            <q-menu v-model="dateMenuOpen" anchor="bottom right" self="top right">
              <div class="feed-stream__when-menu">
                <q-list dense class="feed-stream__sort-menu">
                  <q-item
                    v-for="opt in DATE_OPTS" :key="opt.key"
                    clickable
                    :class="{ 'is-current': dateKey === opt.key }"
                    @click="setDateWin(opt.v)"
                  >
                    <q-item-section>{{ opt.label }}</q-item-section>
                  </q-item>
                </q-list>
                <!-- THE CUSTOM RANGE. Native `date` fields (they were
                     `datetime-local` until the split — the clock half of them
                     is the next button's job now), with the platform's own
                     calendar behind them, coated here in the box's light
                     plaque so they read as this surface's fields
                     (`color-scheme: light` is what keeps the browser's own
                     picker chrome from arriving in the app's dark). Either end
                     may be left empty — one end alone is an open-ended window
                     ("since Tuesday", "before the 14th"). -->
                <div class="feed-stream__when-custom">
                  <label class="feed-stream__when-row">
                    <span class="feed-stream__when-tag nasalization">from</span>
                    <input v-model="customFrom" type="date" class="feed-stream__when-field">
                  </label>
                  <label class="feed-stream__when-row">
                    <span class="feed-stream__when-tag nasalization">to</span>
                    <input v-model="customTo" type="date" class="feed-stream__when-field">
                  </label>
                  <button
                    type="button"
                    class="feed-stream__when-apply nasalization"
                    :disabled="!customFrom && !customTo"
                    @click="applyCustom"
                  >apply</button>
                </div>
              </div>
            </q-menu>
          </q-btn>
          <!-- THE TIME LENS (2026-08-08, user ask: split the old date+time
               control into two) — WHAT HOURS, on whatever days the calendar
               beside it admits. It is the question a window cannot ask: a
               window is two instants on the line, and "mornings" is a pair of
               clock hands that repeats on every day inside it. The two compose
               — last week's calendar plus 06:00→12:00 here is "last week's
               mornings" — and neither can express the other, which is the
               whole reason the split was worth making.

               It rides `GET /feed?timeFrom=&timeTo=&tzOffset=`, new with this
               ask. `tzOffset` is `getTimezoneOffset()` verbatim, so the server
               shifts UTC into the READER'S clock before comparing: morning
               means the reader's morning, the same promise `resolveWhenLocal`
               makes for "today". ⚠ ONE offset for the whole query, so posts
               from the other side of a DST change read an hour off — the API
               note says why that is the honest approximation.

               A WRAPPING range is normal here and not an error: 22:00 → 06:00
               is "nights", and the server writes it as two ranges because a
               single BETWEEN would match nothing. -->
          <q-btn
            flat
            dense
            no-caps
            class="feed-stream__lens-btn feed-stream__clock"
            :class="{ 'is-on': !!todWin }"
            :title="todTitle"
            aria-label="Time lens — filter the feed by time of day"
          >
            <q-icon name="schedule" size="13px" />
            <span v-if="todMark" class="feed-stream__lens-n nasalization">{{ todMark }}</span>
            <q-menu v-model="todMenuOpen" anchor="bottom right" self="top right">
              <div class="feed-stream__when-menu">
                <q-list dense class="feed-stream__sort-menu">
                  <q-item
                    v-for="opt in TOD_OPTS" :key="opt.key"
                    clickable
                    :class="{ 'is-current': todKey === opt.key }"
                    @click="setTodWin(opt.v)"
                  >
                    <q-item-section>{{ opt.label }}</q-item-section>
                  </q-item>
                </q-list>
                <!-- The custom pair — plain `time` fields, the clock half of
                     what the calendar's drawer used to hold. Either end alone
                     is open-ended ("after 18:00", "before noon"), and from >
                     to is a night that crosses midnight rather than a
                     mistake. -->
                <div class="feed-stream__when-custom">
                  <label class="feed-stream__when-row">
                    <span class="feed-stream__when-tag nasalization">from</span>
                    <input v-model="todFrom" type="time" class="feed-stream__when-field">
                  </label>
                  <label class="feed-stream__when-row">
                    <span class="feed-stream__when-tag nasalization">to</span>
                    <input v-model="todTo" type="time" class="feed-stream__when-field">
                  </label>
                  <button
                    type="button"
                    class="feed-stream__when-apply nasalization"
                    :disabled="!todFrom && !todTo"
                    @click="applyTodCustom"
                  >apply</button>
                </div>
              </div>
            </q-menu>
          </q-btn>
          <!-- THE IDENTITY LENS (2026-08-07, user ask) — search for a person
               and read only what they posted. Rides `GET /feed?authors=<csv>`,
               the same parameter the spoken lens's "from allegue" resolves
               to, and it takes MORE THAN ONE: picked identities union, so
               "these three" is one lens rather than three passes.

               An EXACT-SEAT filter, by doctrine (2026-08-04): you pick the
               entity you picked, not the person behind it — a root and its
               masks are separate identities on this platform, and a control
               that quietly swept in someone's alter-egos would be filtering
               by an identity nobody chose. (The SPOKEN lens does expand
               footprints — it resolves a NAME, which is a different question
               from a seat.) -->
          <q-btn
            flat
            dense
            no-caps
            class="feed-stream__lens-btn feed-stream__who"
            :class="{ 'is-on': !!pickedEntities.length }"
            :title="whoTitle"
            aria-label="Identity lens — filter the feed by author"
          >
            <q-icon name="person_search" size="13px" />
            <span v-if="pickedEntities.length" class="feed-stream__lens-n nasalization">{{ pickedEntities.length }}</span>
            <q-menu v-model="whoMenuOpen" anchor="bottom right" self="top right" @show="focusWho">
              <div class="feed-stream__who-menu">
                <input
                  ref="whoInput"
                  v-model="whoQuery"
                  type="text"
                  class="feed-stream__who-input"
                  placeholder="Search an identity…"
                  aria-label="Search an identity to filter by"
                  @input="searchEntities"
                >
                <!-- What the lens is currently under, removable one by one. -->
                <div v-if="pickedEntities.length" class="feed-stream__who-picked">
                  <button
                    v-for="e in pickedEntities" :key="'who:' + e.id"
                    type="button"
                    class="feed-stream__who-chip nasalization"
                    :title="'Stop filtering by ' + e.name"
                    @click="dropEntity(e.id)"
                  >
                    <EntityAvatar :entity="e.card" :size="14" />
                    <span class="feed-stream__who-chip-name">{{ e.name }}</span>
                    <q-icon name="close" size="10px" />
                  </button>
                </div>
                <ul class="feed-stream__who-list">
                  <li v-for="r in whoResults" :key="'r:' + r.id">
                    <button type="button" class="feed-stream__who-row" @click="pickEntity(r)">
                      <EntityAvatar :entity="entityCard(r)" :size="18" />
                      <span class="feed-stream__who-name">{{ r.primary }}</span>
                      <span v-if="r.secondary" class="feed-stream__who-handle nasalization">{{ r.secondary }}</span>
                    </button>
                  </li>
                  <li v-if="whoQuery && !whoResults.length" class="feed-stream__who-empty">
                    nobody by that name
                  </li>
                </ul>
              </div>
            </q-menu>
          </q-btn>
          </q-btn-group>

        </div>
      </template>

      <!-- SORT BY, IN THE BOARD'S HEADER (2026-08-06; ALIVE 2026-08-07;
           MOVED HERE 2026-08-07, user ask: "put the 'order by' one at the top,
           before the post count"). It rides `GET /feed?order=newest|oldest|
           heat`; heat needs weighted labels to score against, so that entry
           stays disabled until a lens carries some — exactly the honesty the
           placeholder had, one item narrower.

           It left the lens bundle because it is not a lens: the other four
           narrow WHICH posts the board shows, and the count states how many
           are left. This one orders what is left, so it belongs beside that
           number rather than inside a row of filters.

           `sym_o_flex_direction` (user ask) — Material SYMBOLS, not the
           classic set: the name is not in the material-icons font at all and
           renders there as the 336px literal word (measured). The `sym_o_`
           prefix is what routes it to `material-symbols-outlined`, which
           `quasar.config.js` already loads.

           ⚠ `@pointerdown.stop` — this button sits on the head box's DRAG
           BAR. Without it a press here starts a drag, and the menu opens
           under a box that is following the pointer. -->
      <template #sort>
        <button
          type="button"
          class="feed-stream__sort"
          :class="{ 'is-on': !!sortOrder }"
          :title="'Sort by — ' + (sortOrder || 'newest')"
          aria-label="Sort the feed"
          @pointerdown.stop
        >
          <q-icon name="sym_o_flex_direction" size="13px" />
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
      </template>

      <!-- THE COUNT, IN THE BOARD'S HEADER (2026-08-07, user ask: "move the
           number of filtered posts to the board header, on the right"). It
           spent a day at the end of the lens row, which is where it was born
           as a `<q-badge>`; it never belonged there. `total` is what the
           stream is CURRENTLY UNDER — every lens the box states is already in
           the query behind it — so it is the one number describing the whole
           board rather than another control in a row of controls, and the
           header is the board's own line. The box owns the slot and its
           placement; the stream owns the number. -->
      <template #count>
        <span v-if="total > 0" class="feed-stream__count">{{ total }}</span>
      </template>

      <!-- The lane's contents. Two regimes share it: the OLD single-label
           lens chip (`?label=`, shareable URL) when no spoken lens is live,
           and the SPOKEN LENS's clause chips when one is — one chip per
           lane label plus one per synthesized clause (yesterday / from
           allegue / pictures / "coffee"), each with a close that removes
           JUST that clause client-side (no model round-trip), and a
           trailing × that clears the whole lens. -->
      <template #labels>
        <!-- The LOCAL hash lens (the card's expand lead) joins the spoken
             one here (2026-08-09): its chip rides the same loop, so the
             lane states it like any clause — the whole-lens × stays the
             SPOKEN lens's own control (clearLens does not reach the local
             expand; its chip and the lit lead are its two doors out). -->
        <template v-if="lensSpec || hashFilter">
          <button
            v-for="chip in lensChips" :key="chip.key"
            type="button"
            class="feed-stream__label-chip nasalization"
            :title="chip.title || (chip.text + ' — click to remove this clause')"
            @click="chip.close()"
          >
            <q-icon :name="chip.icon" size="11px" />
            <span class="feed-stream__label-chip-name">{{ chip.text }}</span>
            <q-icon name="close" size="11px" />
          </button>
          <button
            v-if="lensSpec"
            type="button"
            class="feed-stream__label-chip feed-stream__label-chip--clear nasalization"
            title="Clear the whole lens"
            @click="clearLens"
          >
            <q-icon name="close" size="11px" />
          </button>
        </template>
        <button
          v-else-if="labelFilter"
          type="button"
          class="feed-stream__label-chip nasalization"
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
          class="feed-stream__label-chip feed-stream__label-chip--trashed nasalization"
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
          <article class="post-square" :class="{ 'is-open': isOpen(item), 'is-expanded': isExpanded(item) }">
            <!-- THE CAP (2026-08-07, user ask) — a thin header ABOVE the
                 byline band, and now the card's first strip. It answers the
                 one question the card could not: WHAT IS THIS POST, and
                 WHAT DID IT COME OUT OF.

                 Split 70/30 by a vertical rule, the same device the byline
                 uses. The wide side reads left to right:

                   [icons] Comment on <chip> :: <title or post #id>

                 · The ICONS state the post's KIND — `post` for an original,
                   `comment` for a comment, and for a fork BOTH (a fork is a
                   post that came out of a post, so it wears the two marks
                   together). Material Symbols throughout, so the three sit
                   in one family.
                 · The ORIGIN CLAUSE is drawn only when the post HAS an
                   origin, and it carries the parent as a MICRO CHIP rather
                   than as a "#41" — the parent is an element with an
                   address, and the chip is how this platform states one
                   (it also links straight into the parent's viewer). Both
                   pointers are answered, so a post that is somehow comment
                   AND fork names both parents in the order they are read.
                 · The NAME closes the run: the post's own title, or
                   `post #<id>` when it has none. A titleless post is not
                   nameless — it has an id, and an id is a name you can say.

                 The other side is the card's CONTROL lane, divided from the
                 facts by a hairline (the same 1px the byline divides its own
                 sections with) — the things you do TO a post rather than
                 read off it, which is why they sit on the other side of a
                 rule instead of joining the run. Since 2026-08-09 (user ask)
                 that rule runs BETWEEN the controls too — pin │ skeleton │
                 flyout — and a matching EXPAND cell opens the strip at the
                 far LEFT edge, so the cap reads control │ facts │ controls
                 with a hairline at every seam.

                 The whole strip is set in `--font-display` (Nasalization) —
                 the platform's display face, which until now the card did
                 not wear anywhere. -->
            <div class="post-square__cap">
              <!-- THE EXPAND LEAD (2026-08-09, user ask) — a third cell, at
                   the card's LEFT edge, holding one control: `expand`. It IS
                   the hash lens: pressing it filters the feed by this post's
                   own chain address — the same `?hash=` clause Talavero
                   issues when an ask contains an address — so the stream
                   answers with this ONE card, drawn full-height between the
                   board's home slot and the container's floor. The board
                   slides back to its top berth on the same press (an
                   expanded card is read under it, not around it), and a
                   second press releases the lens. A hairline divides the
                   cell from the facts, the cap's own device: this is a
                   thing you PRESS, and everything past the rule is a thing
                   you READ. -->
              <div class="post-square__cap-lead">
                <button
                  type="button"
                  class="post-square__cap-act"
                  :class="{ 'is-on': isExpanded(item) }"
                  :title="isExpanded(item) ? 'Release this post — back to the stream' : 'Expand this post — the feed shows it alone'"
                  @click.stop="toggleExpand(item)"
                >
                  <q-icon name="expand" size="14px" />
                </button>
              </div>
              <span class="post-square__cap-rule" aria-hidden="true" />

              <div class="post-square__cap-main">
                <span class="post-square__cap-icons" :title="capKindTitle(item)">
                  <q-icon
                    v-for="ic in capIcons(item)"
                    :key="ic"
                    :name="ic"
                    size="13px"
                  />
                </span>

                <!-- The origin clause(s): "Comment on <chip> ::"

                     The chip NAMES the parent (2026-08-07, second ask). It
                     printed a hash slice, which made the one line that says
                     which post is being answered the one line a reader had to
                     parse an address to follow — while the card's own name,
                     one span to the right, was in plain words. It now wears
                     the parent's title under exactly the cap's own naming
                     rule (`capTitle` → `originName`: the title, else `post
                     #<id>`), and the post GLYPH the card wears for itself, so
                     a post referring to a post shows the same mark twice and
                     the relation reads at a glance. The address it used to
                     print is still one hover away, on the chip's tooltip. -->
                <span
                  v-for="clause in originClauses(item)"
                  :key="clause.word"
                  class="post-square__cap-origin"
                >
                  <span class="post-square__cap-word">{{ clause.word }}</span>
                  <MicroChip
                    class="post-square__cap-chip"
                    :class="{ 'is-named': !!originName(clause.target) }"
                    :kind="clause.target.kind"
                    :id="clause.target.id"
                    :path="clause.target.path"
                    :icon="originIcon(clause.target)"
                    :display="originName(clause.target)"
                    :show-type="false"
                    icon-size="9px"
                    @click.stop
                  />
                  <span class="post-square__cap-sep">::</span>
                </span>

                <span class="post-square__cap-title" :title="capTitle(item)">{{ capTitle(item) }}</span>
              </div>
              <span class="post-square__cap-rule" aria-hidden="true" />

              <!-- THE CONTROL LANE. Every control here acts on the POST
                   ITSELF, so each addresses it as the skeleton it is:
                     · the PIN goes into the same PINS skeleton the pins
                       widget reads (`pinService`, target type `skeleton`) —
                       there is one pin section on this platform and this is
                       it. `pins-changed` bubbles up to MainLayout's
                       `pinsRefreshKey` exactly as the media viewer's tack
                       and the nav bar's do, so the widget reloads on the
                       same press.
                     · the ORTHOPEDICS glyph opens `/skeletons/:id` — the
                       post read as its SKELETON (slots, spine, surround)
                       instead of as a post. It is a link, not a button: it
                       navigates, and it should offer what every link does.
                     · `open_in_new` is that SAME destination WITHOUT the
                       navigation (2026-08-07, user ask): it points the
                       right-hand flyout — the box literally named the
                       skeleton viewer — at this post's skeleton, so the
                       slots open BESIDE the feed and the reader keeps their
                       place in the column. A button, not a link, for the
                       same reason the title plate is one: it opens a panel
                       on this page rather than going anywhere, and it
                       TOGGLES (a second press closes what it opened).
                       FeedPage owns that state, hence the emit + the
                       `flyoutId` prop coming back down for the lit mark. -->
              <div class="post-square__cap-side">
                <button
                  type="button"
                  class="post-square__cap-act"
                  :class="{ 'is-on': pinnedIds.has(item.skeleton_id) }"
                  :title="pinnedIds.has(item.skeleton_id) ? 'Unpin this post' : 'Pin this post'"
                  @click.stop="togglePin(item)"
                >
                  <q-icon name="push_pin" size="13px" />
                </button>
                <!-- Hairlines between the lane's three controls (2026-08-09,
                     user ask) — the cap's rule run all the way in: each
                     control stands in a ruled cell of its own, the way the
                     facts and the lane already stood apart. -->
                <span class="post-square__cap-rule" aria-hidden="true" />
                <router-link
                  class="post-square__cap-act"
                  :to="'/skeletons/' + item.skeleton_id"
                  title="Open the skeleton viewer — this post as its slots and spine"
                  @click.stop
                >
                  <q-icon name="sym_o_orthopedics" size="14px" />
                </router-link>
                <span class="post-square__cap-rule" aria-hidden="true" />
                <button
                  type="button"
                  class="post-square__cap-act"
                  :class="{ 'is-on': isSkeletonOpen(item) }"
                  title="Open the skeleton viewer beside the feed"
                  @click.stop="$emit('open-skeleton', item)"
                >
                  <q-icon name="open_in_new" size="13px" />
                </button>
              </div>
            </div>

            <!-- THE CAP'S CLOSING EDGE — THE FRIEZE BAND (2026-08-10, user
                 ask). This seam has been walked all week: a plain grey
                 hairline, then a `vflip`ped frieze half, then an
                 `RgbHairline` (2026-08-07), which went down to open the foot
                 and came back flipped on 08-09 to BRACKET the reading area
                 against the foot's band. What stands here now is the card's
                 one frieze, MOVED UP from the byline↔label seam it held
                 since 08-07 — the card carries a single motif band and this
                 is where it goes: the top seam is the one a reader crosses
                 first, and a motif states "a new kind of thing begins" more
                 plainly than a third copy of the same rule could.

                 With the move the `--cap` FLIP is gone too, and so is the
                 bracket argument that needed it: the card's three remaining
                 sandwiches all run cyan-down, one grammar, and the figure at
                 the top is a different device rather than the same one
                 mirrored. -->
            <FriezeBar slim class="post-square__frieze" />

            <!-- BYLINE band — the author's IDENTITY BLOCK, at the card's top
                 edge (2026-07-25; TWO RULED SIDES since 2026-08-09's last
                 byline ask). A post is read "who, then what", so the person
                 comes before everything and the foot stays a pure activity
                 row.

                 The band held four ruled sections for a day —
                 [author] │ [when/where] │ [title] │ [open] — and the last
                 two are GONE: the title already names the card in the CAP
                 one strip up (stating it twice was the old two-strips
                 problem the 07-25 merge fixed, reborn sideways), and the
                 open-post door lives on in the flyout's own links. What
                 remains is provenance, two dense sides of one band (the
                 one-line desktop fold lived a few hours between the
                 arrangements):

                   [face] name @handle [badge] [trust] [heat] │ [⌚ Sun, 9 Aug 2026 · 7:07 AM]
                          3h ago                              │    [⌖ Mexico City, Mexico]

                 LEFT: the author line with the bare relative age tucked
                 under it — the "xxx ago" legend extracted from the moment
                 run, no icon, the light second line of the identity stamp.
                 RIGHT: the moment as TWO DENSE MICRO CHIPS stacked at the
                 band's end — the detailed date on top, the city under it
                 (only when the author shared one) — each a real MicroChip
                 addressing moments/<id>, because that is how this platform
                 states an element you can visit.

                 EVERY FACT HERE IS A DOOR (same day): the face and the
                 name/handle link to the author's profile, the badge to the
                 organization (its own link, as ever — a link inside a link
                 is invalid, and they go to different places), and BOTH
                 MOMENT CHIPS to the MOMENT VIEWER, where the tiny world
                 map lives. A full-band seam rule divides the two sections,
                 riding the chips' left edge. -->
            <div class="post-square__byline">
              <router-link
                v-if="item.author"
                :to="'/entities/' + item.author.id"
                class="post-square__face"
                :title="authorName(item.author) + ' — open profile'"
                @click.stop
              >
                <EntityAvatar :entity="item.author" :size="24" />
              </router-link>

              <div class="post-square__byline-lines">
                <span class="post-square__byline-who">
                  <router-link
                    v-if="item.author"
                    :to="'/entities/' + item.author.id"
                    class="post-square__identity"
                    :title="authorName(item.author) + ' — open profile'"
                    @click.stop
                  >
                    <span class="post-square__identity-name">{{ authorName(item.author) }}</span>
                    <!-- No `mono` here (2026-08-09, Nasalization ask): the
                         whole band letters in the display face, and a class
                         on the span would beat the inheritance. -->
                    <span class="post-square__identity-handle">{{ authorHandle(item.author) }}</span>
                  </router-link>
                  <!-- The badge — its own link to the organization. Drawn
                       only for a MASK: an org publishing as itself already
                       has its name in the block (`org.self`). -->
                  <OrgLogoChip
                    v-if="item.author?.org && !item.author.org.self"
                    :org="item.author.org"
                    :size="14"
                  />
                  <!-- The TRUST CHIP stood here, third in the qualifier run,
                       from Thread J until 2026-08-10 — see the ago line
                       below, which is where it went and why. -->
                  <!-- HEAT CHIP (2026-08-07) — only under `order=heat`,
                       where the number IS the ordering being read. -->
                  <span
                    v-if="sortOrder === 'heat' && item.heat != null"
                    class="post-square__heat"
                    :title="'Heat ' + item.heat + ' — the sum of this lens\'s label weights this post matches'"
                  >
                    <q-icon name="local_fire_department" size="10px" />{{ item.heat }}
                  </span>
                </span>

                <!-- The AGO line — the identity stamp's quiet second line
                     (2026-08-09), the fact you scan the stream by sitting
                     right under who did it. The precise datetime lives in
                     the chip across the rule.

                     THE HOP CHIP LEADS IT since 2026-08-10 (user ask):

                       [1 hop] · 3h ago

                     It rode the WHO line as the author's third qualifier
                     (badge, trust, heat) and it was the widest of the three
                     — a bordered plate with a word in it, standing between
                     the name and the card's right edge on the one line the
                     name has to fit on. Down here it costs the name nothing,
                     and the pairing is honest besides: how FAR the author is
                     and how LONG ago they published are both distances, and
                     this line is where the card states them. The DOT is the
                     platform's own separator for facts of one kind on one
                     line, drawn only when there is a chip to separate. -->
                <span class="post-square__byline-ago">
                  <span
                    v-if="item.author?.trust"
                    class="post-square__trust"
                    :title="trustTitle(item.author.trust)"
                  >{{ trustLabel(item.author.trust) }}</span>
                  <span
                    v-if="item.author?.trust"
                    class="post-square__ago-dot"
                    aria-hidden="true"
                  >·</span>
                  <span class="post-square__ago-text">{{ timeAgo(item.created_at, item.moment) }}</span>
                </span>
              </div>

              <!-- The SEAM RULE — the full-band vertical hairline between
                   the author side and the moment side, riding the chips'
                   left edge (it carries the `auto` margin that packs them
                   right). Stretch + negative margins against the band's
                   4px padding — keep in step. -->
              <span class="post-square__byline-rule" aria-hidden="true" />

              <!-- THE MOMENT, as TWO DENSE MICRO CHIPS (2026-08-09, the
                   arrangement's ask) — the detailed date on top, the city
                   under it when the author shared one. Real MicroChips,
                   not styled spans: a moment is an element with an address
                   and a viewer (the tiny world map lives there), and the
                   chip is how this platform states one — both route to
                   moments/<id>, and a moment-less legacy item degrades to
                   MicroChip's own span face (no id, no route). `display`
                   puts the resolved strings on them; the address tooltip
                   is overridden with the human one, since the feed's
                   moment card carries no hash to show. -->
              <div class="post-square__byline-when">
                <MicroChip
                  class="post-square__moment-chip"
                  kind="moments"
                  :id="item.moment?.id"
                  icon="event"
                  icon-size="9px"
                  :show-type="false"
                  :display="momentWhen(item)"
                  :full-address="momentTitle(item) + (item.moment?.id ? ' — open moment' : '')"
                  @click.stop
                />
                <MicroChip
                  v-if="item.moment?.place"
                  class="post-square__moment-chip"
                  kind="moments"
                  :id="item.moment.id"
                  icon="place"
                  icon-size="9px"
                  :show-type="false"
                  :display="item.moment.place"
                  :full-address="momentTitle(item) + ' — open moment'"
                  @click.stop
                />
              </div>
            </div>

            <!-- THE CARD'S FRIEZE PAIR (2026-08-07, user ask) — the platform's
                 crown motif at the size the floating media viewer runs it
                 (`slim`), trimmed a further fifth, standing where the card's two
                 inner hairlines used to: one under the byline, one under the
                 label rail, the second `vflip`ped so the two are a REFLECTION
                 about the label lane rather than the same band drawn twice.

                 They REPLACE those hairlines, they do not join them (both
                 `border-bottom`s are gone — see the style block): the band's
                 plaque is dialled one step under the card's line ink, so each
                 bar reads as that line given height and a motif carved into it.

                 The wave is the one thing here that is not the card's own
                 material — a `--teal-11` → `--indigo-11` gradient running down
                 the band, reversed on the mirrored one so indigo faces the lane
                 from both sides and mint faces the card. -->
            <!-- THE BYLINE'S CLOSING EDGE — an `RgbHairline` since
                 2026-08-10 (user ask), and the ONLY thing on this seam since
                 later the same day, when the frieze band that had stood here
                 since 08-07 went up to close the cap instead. The two lived
                 here together for one pass (motif over rule); what settled
                 it is that the card has one frieze and the seam that earns
                 it is the top one.

                 It is the LABEL BRACKET's upper half (`--rail`, same day's
                 last ask): the two bands around the label strip are dialled
                 as a pair — thinner bread than the foot's, and their
                 fillings facing each other. This one keeps the base
                 orientation, cyan down toward the labels. -->
            <RgbHairline class="post-square__hairline post-square__hairline--rail" />

            <!-- LABEL RAIL — the element's OWN classification, as the label
                 paths it holds, root to leaf. It sat BELOW the body until
                 2026-07-25 (fourth pass) and now occupies the strip the title
                 vacated, directly under the byline: a post's classification
                 belongs with the rest of what identifies it, not appended
                 after the reading.

                 The rail is a ROUNDED RECTANGLE that scrolls HORIZONTALLY,
                 rimmed in the card's line ink like the pit and the title plate
                 but floored in the BED TONE — one step off the card, where the
                 pit is the near-white reading surface.
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
                <!-- BUNDLED BY ROOT since 2026-08-10 (user ask). The rail used
                     to hold one plate per label PATH, each spelling its whole
                     chain — so a post classified twice under the same tree
                     printed that tree's root twice, and on plumbing posts the
                     rail read `PATHCHAIN › … PATHCHAIN › …`. It now holds one
                     plate per ROOT, and inside it:

                       [ 🪐 │ INSTANTIATION │ POST › ORIGINAL ]

                     The root is stated ONCE, at the plate's left edge, as its
                     mark when it has one and as its name when it does not.
                     Every label of that tree stands to the right of it in its
                     own ruled cell, spelling only the TAIL of its path — the
                     part the bundle has not already said.

                     The plate is the chip that used to hold one path (same
                     cream coat, `--indigo-1` rim, 4px corners); what moved is
                     which element wears that chrome. And the members are
                     PLATES OF THEIR OWN — `--grey-2` on a `--grey-4` rim
                     (2026-08-10, the follow-on ask) — so the rail is now two
                     tiers: a warm sheet per tree, cool tokens lying on it.
                     That is why there are no hairlines between the cells the
                     way the CAP and the FOOT divide theirs: a rule and a rim
                     in the same three pixels would be the same seam drawn
                     twice. -->
                <div
                  v-for="b in labelBundles(item)"
                  :key="b.root"
                  class="post-square__bundle"
                >
                  <!-- THE ROOT CELL. A masked SHAPE, not an `<img>`
                       (2026-08-10, the hover ask): the mark is painted as a
                       background colour clipped to the artwork's alpha, so
                       ONE dial — `background-color` — carries both its
                       resting grey and its hover tone. An `<img>` cannot do
                       that: its bitmap draws above any background, so a tint
                       would sit under the original rather than replace it.
                       The registry's `src` arrives as a custom property
                       because the mask lives in CSS and the address lives in
                       `utils/labelRoots.js`; it is a repo-controlled
                       constant, never user data. A markless root spells its
                       name here instead, and the bundle is otherwise
                       identical — the registry is additive. -->
                  <span class="post-square__bundle-root" :title="b.root">
                    <span
                      v-if="b.mark"
                      class="post-square__label-mark"
                      role="img"
                      :aria-label="b.root"
                      :style="{ '--label-mark-src': 'url(' + b.mark.src + ')' }"
                    />
                    <span v-else class="mono">{{ b.root }}</span>
                  </span>

                  <!-- The seam between the tree and its labels (2026-08-10,
                       user ask) — `::`, the card's own separator: the CAP
                       divides its origin clause with it and the FOOT's
                       address chip reads `post :: skeleton :: <hash>` in it.
                       So the bundle says the same thing the rest of the card
                       says when one term qualifies the next, and the rail
                       stops being the only strip that states that relation
                       with nothing at all. Decorative — the tree is already
                       named by the root cell's `title` and the mark's
                       `aria-label`, and a screen reader has no use for the
                       punctuation. -->
                  <span class="post-square__bundle-sep mono" aria-hidden="true">::</span>

                  <!-- One ruled cell per label of the tree. Each is still the
                       LINK to that label's page, and the funnel beside it
                       (hover-revealed — the head band's picker covers touch)
                       is still the second way into the label lens: filter the
                       stream by this label without leaving the feed. Both
                       kept their per-LABEL identity through the bundling;
                       what the bundle groups is the drawing, not the data. -->
                  <template v-for="lp in b.items" :key="lp.id">
                    <span class="post-square__bundle-item">
                      <!-- ⚠ `mono` STAYS ON THIS RUN. It came off for one pass
                           on 2026-08-10 (Nasalization ask) and went straight
                           back on the next (same user, "I didn't like
                           nasalization on them") — the class is what beats
                           the rule's inherited face, so the two halves of
                           that swap live here and in `.post-square__label`
                           together. The card is in its display face
                           everywhere else; the label rail is the one
                           deliberate exception, and the reason is in the
                           rule. -->
                      <router-link
                        :to="'/labels/' + lp.id"
                        class="post-square__label mono"
                        :title="lp.path"
                        @click.stop
                      >
                        <!-- The path's TAIL, step by step, the leaf carrying
                             the weight. The root is not among them — the
                             bundle said it — but `lp.path` still carries the
                             whole chain on the tooltip, so the full
                             classification is one hover away as it always
                             was. -->
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
                    </span>
                  </template>
                </div>
              </div>
            </div>

            <!-- THE RAIL IS CLOSED BY A BAND AGAIN (2026-08-10, user ask).
                 It was closed by an `RgbHairline` on 2026-08-07 (and, for a
                 few hours before that, by the frieze pair's `vflip`ped
                 half); that rule moved UP to the cap the same day and for
                 three days nothing replaced it — the strip's own padding and
                 the pit's 6px top margin were the whole lane between
                 classification and content. This is that divider restored,
                 and the padding it replaces went with the same ask (see
                 `.post-square__rail-strip`): a lane made of AIR became a
                 lane made of a LINE, which is the trade, not an addition.

                 CONDITIONAL, unlike its sibling above the rail: it closes
                 the RAIL, so it is drawn on the same `v-if` the rail is. An
                 unlabelled card would otherwise stack two sandwiches with
                 nothing between them.

                 FLIPPED (`--flip`, 2026-08-10's last ask) — indigo at the
                 top, cyan at the bottom, so it and the band above the rail
                 turn opposite ways and the label strip is BRACKETED: the two
                 indigo ends face each other across the chips, the two cyan
                 ends face out into the card. Same reflection argument the
                 frieze pair was born with and the cap/foot pair carried
                 after it — one figure with the labels inside it, not the
                 same rule drawn twice. -->
            <RgbHairline
              v-if="labelPaths(item).length"
              class="post-square__hairline post-square__hairline--rail post-square__hairline--flip"
            />

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

            <!-- THE FOOT'S OPENING EDGE — the `RgbHairline` (2026-08-09,
                 user ask; it closed the CAP from 2026-08-07 until this
                 pass, and the label rail for hours before that). The cap's
                 divider is a plain hairline now — its own border-bottom,
                 the card's one line ink — and the three-row band moved DOWN
                 to divide the reading area from the foot: the card opens on
                 quiet rules and closes on its one drawn motif. Same
                 unconditional standing as before — every card has a foot,
                 so its rule is on every card. -->
            <RgbHairline class="post-square__hairline" />

            <!-- Foot — the post's own chip and its activity tallies. The
                 author left this row for the byline band at the card's top
                 edge (2026-07-25): the foot is now purely what the post has
                 DONE (address, votes, comments, forks), and who made it is
                 stated once, before the title.

                 The CHIP is a DOOR again (2026-08-10, user ask). It was the
                 card's second information trigger from 2026-07-26 — a span
                 (`linked: false`) reading `icon hash`, whose click popped
                 the post's flyout — and it is a router-link to the POST
                 VIEWER now, which is what a chip carrying an address does
                 everywhere else on this platform. The flyout doors did not
                 go anywhere: the cap's own lane, one strip up, still holds
                 `sym_o_orthopedics` (route to the skeleton) and
                 `open_in_new` (the same skeleton BESIDE the feed), so the
                 press this chip used to answer is still on the card, twice.

                 It also SAYS what it addresses now, in the cap's dialect —
                 and says it in the cap's MARKS (2026-08-10, third ask):

                   [sym_o_post] :: [sym_o_orthopedics] :: <hash>

                 · the leading GLYPH is `sym_o_post`, the mark the cap states
                   a post with (MicroChip's own default for the kind is
                   `edit_note`, a different drawing) — the card's two strips
                   wear one face for one thing.
                 · the TYPE slot is `skeleton` — not `post`: what a post's
                   address is a handle on is its skeleton, and that is the
                   reading every control around it opens — but it is the
                   cap's `sym_o_orthopedics` DRAWN rather than the word
                   spelt (`typeIcon`, added to MicroChip for this). The
                   chip's neighbours in this strip are all glyphs, and the
                   one spelt-out word in a run of marks was the odd thing
                   out; the reading it names is one hover away on the tooltip
                   and one press away in the cap's own lane.
                 · `::` is the cap's separator, passed down, so the foot
                   closes the card in the punctuation the top opened it with.
                 Nasalization for the whole chip follows from the same
                 argument (see `.post-square__chip`).

                 THE STRIP IS RULED IN FOUR CELLS (2026-08-10, second ask) —
                 the CAP's own device brought down to the card's other end,
                 so both strips are read the same way: a hairline at every
                 seam, and each cell holding one kind of thing.

                   [refs] │ [chip  copy] │ [comments forks] │ [⌃n]
                                                              [⌄n]

                 · REFS, at the far left edge, is the flyout press the chip
                   gave up two paragraphs ago, re-homed and NAMED. What that
                   box shows for a post is every element the post is made of
                   as a chip — content node, moment, author, thread
                   provenance — which is what a reader means by the post's
                   references, so it wears `developer_guide` and emits the
                   same `select` the chip used to. The card's `.is-open`
                   marking follows it.
                 · The ADDRESS cell is the only one that GIVES: the chip's
                   hash ellipsizes so the three rigid cells around it never
                   get squeezed off the card (the cap's `min-width: 0`
                   argument, restated). Its `content_copy` puts the
                   PATHCHAIN ADDRESS on the clipboard — `skeletons/<hash>`,
                   the string the chip is showing a slice of, not a browser
                   URL (the chip beside it is the browser door). Same
                   glyph-flips-to-`check` feedback the media viewer's copy
                   uses.
                 · COMMENTS and FORKS keep their glyphs and their counts.
                 · The VOTES cell closes the strip at the far right edge, a
                   COLUMN rather than a row: `keyboard_arrow_up` over
                   `keyboard_arrow_down`, each with its own tally — the
                   TAILLESS pair at 9px (2026-08-10, third ask; the tailed
                   `arrow_upward`/`arrow_downward` at 11px read as two
                   instructions where this strip wanted two marks). The
                   single
                   `thumb_up` it replaces showed `votes.up` alone — half of
                   what the feed has always answered with — so the shape
                   that states both is also the one that stops hiding the
                   other half. Tallies, not controls: nothing in this strip
                   has ever been a vote button, and the card is a reading
                   surface. -->
            <div class="post-square__foot">
              <div class="post-square__foot-lead">
                <button
                  type="button"
                  class="post-square__foot-act"
                  :class="{ 'is-on': isOpen(item) }"
                  title="References — every element this post is made of"
                  @click.stop="$emit('select', item)"
                >
                  <!-- `sym_o_` prefixed, i.e. Material SYMBOLS, not Material
                       Icons: `developer_guide` is a Symbols-only name, and
                       bare it resolves against the default set, comes back
                       with no glyph for the ligature and draws an empty
                       14px box (which is exactly what it did for one pass
                       here). The cap's marks are all Symbols anyway. -->
                  <q-icon name="sym_o_developer_guide" size="14px" />
                </button>
              </div>
              <span class="post-square__foot-rule" aria-hidden="true" />

              <div class="post-square__foot-main">
                <PostMicro
                  class="post-square__chip"
                  :id="item.skeleton_id"
                  :path="item.skeleton_path"
                  icon="sym_o_post"
                  type-icon="sym_o_orthopedics"
                  sep="::"
                />
                <button
                  type="button"
                  class="post-square__foot-act"
                  :class="{ 'is-on': copiedId === item.skeleton_id }"
                  :title="copiedId === item.skeleton_id ? 'Address copied' : 'Copy the pathchain address'"
                  @click.stop="copyAddress(item)"
                >
                  <q-icon :name="copiedId === item.skeleton_id ? 'check' : 'content_copy'" size="12px" />
                </button>
              </div>
              <span class="post-square__foot-rule" aria-hidden="true" />

              <div class="post-square__foot-side">
                <span class="post-square__stat" title="comments">
                  <q-icon name="chat_bubble_outline" size="11px" />{{ item.comment_count || 0 }}
                </span>
                <span class="post-square__stat" title="forks">
                  <q-icon name="alt_route" size="11px" />{{ item.fork_count || 0 }}
                </span>
              </div>
              <span class="post-square__foot-rule" aria-hidden="true" />

              <div class="post-square__votes">
                <span class="post-square__stat" title="up-votes">
                  <q-icon name="keyboard_arrow_up" size="9px" />{{ item.votes?.up || 0 }}
                </span>
                <span class="post-square__stat" title="down-votes">
                  <q-icon name="keyboard_arrow_down" size="9px" />{{ item.votes?.down || 0 }}
                </span>
              </div>
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
import { useNavStore } from 'src/stores/navigation'
import { pinService } from 'src/services/pin.service'
import { refService } from 'src/services/ref.service'
import FeedHeadBox from 'src/components/posts/FeedHeadBox.vue'
import { useStateHolder } from 'src/composables/useStateHolder'
import { timeAgo, absoluteTime } from 'src/utils/time'
import EntityAvatar from 'src/components/entities/EntityAvatar.vue'
import OrgLogoChip from 'src/components/organizations/OrgLogoChip.vue'
import PostMicro from 'src/components/posts/PostMicro.vue'
// The cap chips a post's PARENT, which may be a post, a node or some other
// element — so it reaches for the generic chip rather than PostMicro.
import MicroChip from 'src/components/shared/MicroChip.vue'
import MarkdownBody from 'src/components/shared/MarkdownBody.vue'
import FriezeBar from 'src/components/layout/FriezeBar.vue'
import RgbHairline from 'src/components/layout/RgbHairline.vue'
// A label tree whose ROOT has a mark draws it instead of spelling the root's
// name — see the module for the registry and for why it is a front-end one.
import { rootMark } from 'src/utils/labelRoots'

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
  components: { EntityAvatar, OrgLogoChip, PostMicro, MicroChip, MarkdownBody, FeedHeadBox, FriezeBar, RgbHairline },
  props: {
    // The post whose information flyout is open, if any. The stream does not
    // own that state: the flyout is placed OUTSIDE the feed container (it
    // floats in the free right half of the window slot), so FeedPage holds
    // the selection and hands the id back down for the cards' open marking.
    selectedId: { type: [Number, String], default: null },
    // The skeleton the flyout is reading out AS A SKELETON, if any — the
    // cap's `open_in_new` half of the same arrangement (2026-08-07). Held by
    // FeedPage for the reason above, and handed back only so the button can
    // light up: the stream never decides what the flyout shows.
    flyoutId: { type: [Number, String], default: null }
  },
  emits: ['select', 'open-skeleton', 'pins-changed'],
  setup (props, { emit }) {
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

    // The cap's pin tack records its press like every other pin on the
    // platform (see `togglePin` below).
    const navStore = useNavStore()

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
    // The well's HEIGHT, published the same way for the same reason
    // (2026-08-09): the EXPANDED card fills the visible well, and
    // `--feed-well-h` is the one term of that height CSS cannot state as a
    // live value on its own (the container is a percentage of a track that
    // is itself viewport-cropped). The card subtracts the well's own
    // paddings from it — see `.post-square.is-expanded`, and keep the two
    // in step. clientHeight, so the horizontal scrollbar (if any) is out.
    const publishWellH = (el) => {
      if (el) el.style.setProperty('--feed-well-h', `${el.clientHeight}px`)
    }
    onMounted(() => {
      if (!streamEl.value || typeof ResizeObserver === 'undefined') return
      ro = new ResizeObserver(() => {
        publishCeiling(streamEl.value)
        publishWellH(wellEl.value)
      })
      ro.observe(streamEl.value)
      if (wellEl.value) ro.observe(wellEl.value)
      publishCeiling(streamEl.value)
      publishWellH(wellEl.value)
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
    // masks two rings out. `mark` is what the folded button prints beside
    // its glyph; the labels are the menu's words.
    const LENS_OPTS = [
      { v: null, label: 'all authors', mark: '∞' },
      { v: 1, label: '≤1 hop', mark: '1' },
      { v: 2, label: '≤2 hops', mark: '2' },
      { v: 3, label: '≤3 hops', mark: '3' }
    ]
    const maxHops = ref(null)
    const setLens = (v) => {
      if (maxHops.value === v) return
      maxHops.value = v
      load()
    }
    const hopsMark = computed(() =>
      LENS_OPTS.find((o) => o.v === maxHops.value)?.mark || '∞')
    const hopsTitle = computed(() => maxHops.value == null
      ? 'Trust lens — every author (no distance limit)'
      : `Trust lens — only authors within ${maxHops.value} invite-chain hop${maxHops.value === 1 ? '' : 's'} of you`)

    // ── THE TIME LENS (2026-08-07) ────────────────────────────────────
    // A hand-picked `when` object — the SAME shape the spoken lens's clause
    // uses, so `resolveWhenLocal` / `whenText` serve both and there is one
    // definition of "yesterday" on this surface. null = no window.
    const DATE_OPTS = [
      { key: 'any', v: null, label: 'any time', mark: '' },
      { key: 'today', v: { preset: 'today' }, label: 'today', mark: 'today' },
      { key: 'yesterday', v: { preset: 'yesterday' }, label: 'yesterday', mark: 'yest' },
      { key: 'this_morning', v: { preset: 'this_morning' }, label: 'this morning', mark: 'a.m.' },
      { key: 'this_week', v: { preset: 'this_week' }, label: 'this week', mark: 'week' },
      { key: 'd7', v: { last_days: 7 }, label: 'last 7 days', mark: '7d' },
      { key: 'd30', v: { last_days: 30 }, label: 'last 30 days', mark: '30d' }
    ]
    const dateWin = ref(null)
    const dateMenuOpen = ref(false)
    const customFrom = ref('')
    const customTo = ref('')

    // Which row the menu ticks — presets by name, anything hand-typed as
    // the one 'custom' identity.
    const winKey = (w) => {
      if (!w) return 'any'
      if (w.preset) return w.preset
      if (w.last_days) return 'd' + w.last_days
      return 'custom'
    }
    const dateKey = computed(() => winKey(dateWin.value))
    const dateMark = computed(() => {
      const w = dateWin.value
      if (!w) return ''
      const opt = DATE_OPTS.find((o) => o.key === dateKey.value)
      if (opt) return opt.mark
      if (w.from && w.to) return 'range'
      return w.from ? 'since' : 'until'
    })
    // The tooltip prints the RESOLVED window: a lens that says "this week"
    // should also be able to say which days that is. A hand-typed range is
    // ALREADY its own two datetimes, so it prints the resolved reading
    // alone — `whenText` would only say the same thing again in ISO.
    const dateTitle = computed(() => {
      const w = dateWin.value
      if (!w) return 'Time lens — every moment (no window)'
      const win = resolveWhenLocal(w)
      const fmt = (d) => d
        ? d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '…'
      const range = win ? `${fmt(win.from)} → ${fmt(win.to)}` : ''
      if (dateKey.value === 'custom') return `Time lens — ${range || 'a window'}`
      return `Time lens — ${whenText(w)}${range ? ' (' + range + ')' : ''}`
    })

    const setDateWin = (w) => {
      dateMenuOpen.value = false
      dateWin.value = w
      // A spoken `when` and a picked window are the same filter said twice.
      // The pick wins and the stale clause leaves the lane with it —
      // `afterMutation` reloads (and may retire an emptied spec).
      if (lensSpec.value?.when) { delete lensSpec.value.when; afterMutation() } else load()
    }

    // `datetime-local` gives `YYYY-MM-DDTHH:mm` — local wall time, which is
    // exactly what `resolveWhenLocal`'s parser reads back as local.
    const applyCustom = () => {
      const w = {}
      if (customFrom.value) w.from = customFrom.value
      if (customTo.value) w.to = customTo.value
      if (!Object.keys(w).length) return
      setDateWin(w)
    }

    // ── THE TIME-OF-DAY LENS (2026-08-08) ─────────────────────────────
    // `{ from: 'HH:MM'|null, to: 'HH:MM'|null }` — a pair of CLOCK HANDS, not
    // a window. The date lens above picks which days; this picks which hours
    // of them, and the two ride different parameters (`from`/`to` vs
    // `timeFrom`/`timeTo`) precisely because neither can say the other.
    //
    // ⚠ NOT PART OF THE SPOKEN SPEC. Talavero's `FilterSpec` has a `when`
    // clause and no clock, so nothing arrives here from a lens reply and
    // nothing here needs to yield to one — which is why this lens has no twin
    // to drop, unlike the date and identity buttons. If the seat is ever
    // taught to speak hours, THIS is the state it would write and the
    // yield-and-drop dance in `applySpec`/`setDateWin` is the pattern.
    const TOD_OPTS = [
      { key: 'any', v: null, label: 'any hour', mark: '' },
      { key: 'morning', v: { from: '06:00', to: '12:00' }, label: 'morning', mark: 'a.m.' },
      { key: 'afternoon', v: { from: '12:00', to: '18:00' }, label: 'afternoon', mark: 'p.m.' },
      { key: 'evening', v: { from: '18:00', to: '23:59' }, label: 'evening', mark: 'eve' },
      { key: 'night', v: { from: '22:00', to: '06:00' }, label: 'night', mark: 'night' },
      { key: 'work', v: { from: '09:00', to: '17:00' }, label: 'working hours', mark: '9–5' }
    ]
    const todWin = ref(null)
    const todMenuOpen = ref(false)
    const todFrom = ref('')
    const todTo = ref('')

    // Presets are matched by VALUE, not by identity: a hand-typed 06:00→12:00
    // is the morning preset and the menu should tick it, exactly as the date
    // lens ticks a preset it can recognise.
    const todKey = computed(() => {
      const w = todWin.value
      if (!w) return 'any'
      const hit = TOD_OPTS.find((o) => o.v && o.v.from === w.from && o.v.to === w.to)
      return hit ? hit.key : 'custom'
    })
    const todMark = computed(() => {
      const w = todWin.value
      if (!w) return ''
      const opt = TOD_OPTS.find((o) => o.key === todKey.value)
      if (opt) return opt.mark
      // A hand-typed pair prints ITSELF — the hours are already the shortest
      // true thing that can be said about them, where a date range has to be
      // abbreviated to fit.
      if (w.from && w.to) return `${w.from}–${w.to}`
      return w.from ? `${w.from}→` : `→${w.to}`
    })
    const todTitle = computed(() => {
      const w = todWin.value
      if (!w) return 'Time lens — every hour (no time-of-day window)'
      const wraps = w.from && w.to && w.from > w.to
      const span = w.from && w.to ? `${w.from} → ${w.to}` : w.from ? `from ${w.from}` : `before ${w.to}`
      return `Time lens — ${span}${wraps ? ' (across midnight)' : ''}, in your own clock`
    })

    const setTodWin = (w) => {
      todMenuOpen.value = false
      todWin.value = w
      // Nothing to drop: no spoken clause writes these parameters (see above).
      load()
    }

    const applyTodCustom = () => {
      const w = {}
      if (todFrom.value) w.from = todFrom.value
      if (todTo.value) w.to = todTo.value
      if (!Object.keys(w).length) return
      setTodWin(w)
    }

    // ── THE IDENTITY LENS (2026-08-07) ────────────────────────────────
    // Picked seats → `?authors=<csv>`. `card` is the shape EntityAvatar
    // wants, kept beside the name so the chips wear faces without a
    // second lookup.
    const pickedEntities = ref([]) // [{ id, name, handle, card }]
    const whoMenuOpen = ref(false)
    const whoQuery = ref('')
    const whoResults = ref([])
    const whoInput = ref(null)
    let whoTimer = null

    const entityCard = (r) => ({
      id: r.id,
      display_name: r.primary,
      username: (r.secondary || '').replace(/^@/, '') || null,
      photo: r.photo ?? null
    })

    const searchEntities = () => {
      clearTimeout(whoTimer)
      whoTimer = setTimeout(async () => {
        const q = whoQuery.value.trim()
        if (!q) { whoResults.value = []; return }
        try {
          const r = await refService.search('entities', q, 8)
          whoResults.value = r.results || []
        } catch (_) { whoResults.value = [] }
      }, 250)
    }

    const focusWho = () => {
      requestAnimationFrame(() => whoInput.value?.focus())
    }

    // Picking supersedes a spoken `authors` clause for the same reason the
    // window does — one set of ids, one place it comes from.
    const afterPick = () => {
      if (lensSpec.value?.authors) { delete lensSpec.value.authors; afterMutation() } else load()
    }

    const pickEntity = (r) => {
      if (pickedEntities.value.some((e) => e.id === r.id)) return
      pickedEntities.value.push({
        id: r.id,
        name: r.primary,
        handle: r.secondary || null,
        card: entityCard(r)
      })
      whoQuery.value = ''
      whoResults.value = []
      afterPick()
    }

    const dropEntity = (id) => {
      pickedEntities.value = pickedEntities.value.filter((e) => e.id !== id)
      afterPick()
    }

    const whoTitle = computed(() => pickedEntities.value.length
      ? 'Identity lens — only posts by ' + pickedEntities.value.map((e) => e.name).join(', ')
      : 'Identity lens — search someone and read only their posts')

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

    // ── THE LABEL FIELD (2026-08-07, user ask) ──────────────────────────
    // A type-ahead over `allLabels` — the whole label list, chain and all,
    // which `GET /feed/lens-context` already hands the box for the lane's
    // chip names. Matching in memory is the point: there is no request per
    // keystroke, and the list is the same one the seat filters against, so
    // the field can never offer a label the lens engine does not know.
    //
    // The CHAIN is searched as well as the name, which is what makes
    // "PATHCHAIN > NODE > FILE" reachable by typing "file" OR "node" — label
    // names on this platform are leaves of a tree and only the path
    // disambiguates two leaves with the same word in them.
    const labelQuery = ref('')
    const allLabels = ref([])

    const labelMatches = computed(() => {
      const q = labelQuery.value.trim().toLowerCase()
      if (!q) return []
      const hit = (l) => l.name.toLowerCase().includes(q) || (l.chain || '').toLowerCase().includes(q)
      // Name matches first — a leaf you typed the name of beats one that only
      // matched through an ancestor's word.
      const named = []
      const chained = []
      for (const l of allLabels.value) {
        if (!hit(l)) continue
        ;(l.name.toLowerCase().includes(q) ? named : chained).push(l)
      }
      return named.concat(chained).slice(0, 8)
    })

    const pickLabelHit = (l) => {
      labelQuery.value = l.name
      labelMenuOpen.value = false
      setLabelFilter({ id: l.id, name: l.name })
    }

    // THE VERB. Empty field = clear the lens (a filter you have deleted the
    // name of is not one you are still under), a live filter re-pressed with
    // its own name still in the field = clear it too, otherwise take the best
    // match. Enter and the button are the same call.
    const applyLabelQuery = () => {
      const q = labelQuery.value.trim()
      labelMenuOpen.value = false
      if (!q) { setLabelFilter(null); return }
      if (labelFilter.value && labelFilter.value.name === q) {
        labelQuery.value = ''
        setLabelFilter(null)
        return
      }
      const m = labelMatches.value[0]
      if (m) pickLabelHit(m)
    }

    // Arriving on `?label=` while the stream is ALREADY mounted (hash-router
    // gotos reuse the component — the flyout param learned this first): the
    // query is the source of truth, so follow it both ways.
    // The field mirrors the live filter whatever set it — a `?label=` link, a
    // spoken lens, the broom. A box that states a filter it is not under is
    // the one thing this surface refuses to do.
    watch(labelFilter, (l) => { labelQuery.value = l ? l.name : '' })

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
        // single-label one included and the card's local hash expand with
        // it. The trash SURVIVES a spoken reset: only its own broom
        // empties it.
        clearLens({ reload: false })
        if (labelFilter.value) { labelFilter.value = null; syncLabelQuery() }
        hashFilter.value = null
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
      // THE HAND-PICKED TWINS YIELD (2026-08-07). A spoken `when` /
      // `authors` writes the same `GET /feed` parameters the time and
      // identity buttons do, so the spoken clause takes the seat and the
      // button goes quiet — the lane's chip is then the only thing
      // claiming that filter, and it is the one running.
      if (spec.when) dateWin.value = null
      if (spec.authors) pickedEntities.value = []
      // A spoken lens is the newest intent — the card's local expand yields
      // to it (its twin rule: the spoken hash IS the expand, via activeHash).
      hashFilter.value = null
      lensSpec.value = spec
      // A spoken address means "show me THIS one": the board takes its top
      // berth so the expanded card gets the whole space under it, exactly
      // as the card's own expand lead does it.
      if (spec.hash) setHeadY(0)
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
      const chips = []
      // The LOCAL hash lens wears a chip too (2026-08-09): the lit expand
      // lead on the card is one door out, this is the other — the lane
      // should never run a filter it does not state.
      if (hashFilter.value) {
        chips.push({
          key: 'hash:local',
          icon: 'expand',
          text: 'post ' + hashFilter.value.hash.slice(0, 10) + '…',
          title: 'One post, expanded, by its address — click to release',
          close: () => { hashFilter.value = null; load() }
        })
      }
      const s = lensSpec.value
      if (!s) return chips
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
      if (s.hash) {
        chips.push({
          key: 'hash',
          icon: 'expand',
          text: 'post ' + s.hash.slice(0, 10) + '…',
          title: 'One post, expanded, by its address — click to release',
          close: () => dropClause('hash')
        })
      }
      if (s.title) chips.push({ key: 'title', icon: 'title', text: 'titled "' + s.title + '"', close: () => dropClause('title') })
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
      if (spec.hash) p.hash = spec.hash
      if (spec.title) p.title = spec.title
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
        // The LOCAL hash lens (the card's expand lead) — written after the
        // spoken params on the same last-write-wins belt as the hand-picked
        // lenses below: pressing expand on a card composes with whatever
        // else is running (every filter that admitted the card still admits
        // it; the address then narrows to exactly it).
        if (hashFilter.value) params.hash = hashFilter.value.hash
        // THE HAND-PICKED LENSES, written AFTER the spoken one's params —
        // the two never hold the same clause at once (each control drops
        // the spoken twin when it is used), and last-write-wins is the
        // belt that keeps that promise true even if one ever slipped
        // through: what the box SAYS it is filtering by is what runs.
        const win = resolveWhenLocal(dateWin.value)
        if (win?.from) params.from = win.from.toISOString()
        if (win?.to) params.to = win.to.toISOString()
        // The clock hands ride beside the window, never instead of it. The
        // OFFSET goes with them or the server compares against UTC hours and
        // "morning" stops meaning the reader's morning.
        if (todWin.value?.from) params.timeFrom = todWin.value.from
        if (todWin.value?.to) params.timeTo = todWin.value.to
        if (todWin.value) params.tzOffset = new Date().getTimezoneOffset()
        if (pickedEntities.value.length) {
          params.authors = pickedEntities.value.map((e) => e.id).join(',')
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
      // Which of these posts are already pinned — one read for the page.
      loadPinned()
      // The seat + the digest (lane chip names), one read. A failure just
      // leaves the box on its stub — the feed owes nothing to the lens.
      try {
        const ctx = await feedService.getLensContext()
        seat.value = ctx.seat || null
        allLabels.value = ctx.labels || []
        digestNames.value = new Map(allLabels.value.map((l) => [l.id, l.name]))
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

    // THE MOMENT LINE's time segment. The WHEN is on every card since
    // 2026-08-09 (user ask) — a placed post used to swap its date out for
    // the city ("space wins when there is any"), and the two are separate
    // segments of the line now, so this helper answers TIME ONLY and the
    // place is read straight off `item.moment.place` beside it (a place
    // still only exists when the author chose to share one — location is
    // opt-in, city-rounded).
    //
    // Both come RESOLVED from the API (`moment.place`, `moment.datetime`):
    // "City, Country" is `geo.resolvePlace`'s single seam, and the date is
    // `momentService.formatHumanDatetime` — formatted from `time_utc` in UTC
    // server-side precisely so every chip and viewer states a moment
    // identically. Only an item with no moment at all formats locally.
    const momentWhen = (item) => {
      if (item.moment?.datetime) return item.moment.datetime
      const ms = new Date(item.created_at).getTime()
      if (!Number.isFinite(ms)) return ''
      return new Date(ms).toLocaleString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    }

    // The tooltip still carries both halves in full — the line's spans
    // ellipsize under pressure, and hover is where the whole strings live.
    const momentTitle = (item) => {
      const when = item.moment?.datetime || absoluteTime(item.created_at, item.moment)
      return item.moment?.place ? `${when} · ${item.moment.place}` : when
    }

    // Is this the card the flyout is currently reading out? Compared loosely
    // on purpose — the id arrives from the parent, which may be holding it as
    // a route-ish string while the feed item carries a number.
    const isOpen = (item) =>
      props.selectedId != null && String(props.selectedId) === String(item.skeleton_id)

    // Its sibling for the cap's `open_in_new`: is the flyout currently
    // showing THIS post as a skeleton? Compared the same loose way, and for
    // the same reason — FeedPage holds the ref as a string.
    const isSkeletonOpen = (item) =>
      props.flyoutId != null && String(props.flyoutId) === String(item.skeleton_id)

    // ── THE FOOT'S COPY (2026-08-10, user ask) ──────────────────────────
    // The PATHCHAIN ADDRESS — `skeletons/<hash>`, the string the chip beside
    // this button is showing a truncated slice of, and the one this post
    // answers to everywhere on the platform. Deliberately not the browser
    // URL: the chip IS that door, and a copy button next to an address chip
    // copies the address (the media viewer's foot draws the same distinction
    // with two separate buttons).
    //
    // ONE id rather than a boolean, because the stream draws thirty of these
    // and a shared flag would flip every card's glyph to `check` at once.
    const copiedId = ref(null)
    const copyAddress = async (item) => {
      const addr = item.skeleton_path
      if (!addr) return
      try {
        await navigator.clipboard.writeText(addr)
        copiedId.value = item.skeleton_id
        setTimeout(() => {
          // Guard the reset: a second card copied inside the window owns the
          // mark now, and clearing it blind would blank the wrong glyph.
          if (copiedId.value === item.skeleton_id) copiedId.value = null
        }, 1600)
      } catch (e) { /* clipboard denied — the glyph simply never flips */ }
    }

    // ── THE HASH LENS (2026-08-09, user ask) — expand = filter by address ──
    // A post's chain address is its one unique reference, so "expand this
    // card" and "filter the feed to this post" are the same operation read
    // from two ends. The cap's expand lead applies it locally; Talavero
    // applies the same clause when an ask contains an address (`spec.hash`).
    // Either way the ACTIVE hash is what the expanded rendering keys off —
    // the card that matches it draws full-height (see `.is-expanded`),
    // whoever set the filter.
    const hashFilter = ref(null) // { hash, id } | null — the local lens
    const postHash = (item) => String(item.skeleton_path || '').split('/').pop()
    const activeHash = computed(() => hashFilter.value?.hash || lensSpec.value?.hash || null)
    // Prefix match, both ways the platform abbreviates an address: the local
    // lens always holds the full hash, but a Talavero-relayed one may be the
    // chip's ≥8-char slice — the server filters by the same prefix rule.
    const isExpanded = (item) => {
      const h = activeHash.value
      return !!h && postHash(item).startsWith(h)
    }
    const toggleExpand = (item) => {
      if (isExpanded(item)) {
        hashFilter.value = null
        // A Talavero-issued hash releases through the clause machinery, so
        // the lane chip and the rest of the spec settle exactly as a
        // chip-close would settle them.
        if (lensSpec.value?.hash) { dropClause('hash'); return }
        load()
        return
      }
      hashFilter.value = { hash: postHash(item), id: item.skeleton_id }
      // The board returns to its top berth: an expanded card fills the space
      // UNDER the home slot, and a board parked mid-container would stand on
      // top of the one thing being read. 0 clamps to HOME inside the box.
      setHeadY(0)
      load()
    }

    // `cardName` — the title plate's naming rule (title, else `comment on
    // #<id>`, else `(untitled)`) — left with the plate on 2026-08-09; the
    // card's one name is the cap's (`capTitle`, below).

    // ── THE CAP (2026-08-07) ────────────────────────────────────────────
    // What the card's top strip says about the post: its kind, what it came
    // out of, and what it is called.
    //
    // All three read the `origin` card the feed now answers with — a post's
    // PARENT (a comment's target: a post OR a node) and its `forked_from`
    // (a fork's source), each RESOLVED into `{ kind, id, path }` so the cap
    // can chip it. The old `parent_skeleton_id` could only name a parent;
    // the chip needs an address, and half the parents on this platform are
    // not skeletons at all.

    // The KIND MARKS. A post wears `post`, a comment wears `comment`, and a
    // fork wears BOTH — it is a post that came out of a post, and the two
    // glyphs together say that in the space one of them would take. A post
    // that is somehow comment AND fork stacks all three, in the order the
    // clauses below name them.
    const capIcons = (item) => {
      const rel = item.origin?.relation || ''
      const icons = []
      if (rel.includes('comment')) icons.push('sym_o_comment')
      if (rel.includes('fork')) icons.push('sym_o_post', 'sym_o_alt_route')
      if (!icons.length) icons.push('sym_o_post')
      return icons
    }

    const capKindTitle = (item) => {
      const rel = item.origin?.relation || ''
      if (rel === 'comment') return 'A comment on another element'
      if (rel === 'fork') return 'A fork of another post'
      if (rel) return 'A comment and a fork'
      return 'An original post'
    }

    // The ORIGIN CLAUSES — one per pointer the post carries, each a word and
    // the element it points at. Comment before fork, which is the order the
    // relation itself is built in. An original post has none and the cap
    // opens straight onto its name.
    const originClauses = (item) => {
      const o = item.origin
      if (!o) return []
      const out = []
      if (o.parent) out.push({ word: 'Comment on', target: o.parent })
      if (o.forked_from) out.push({ word: 'Fork of', target: o.forked_from })
      return out
    }

    // WHAT THE ORIGIN CHIP SAYS (2026-08-07, second ask). A post referred to
    // by another post is named by the SAME rule the referring card names
    // itself — `capTitle`, restated over the origin card because it reads
    // someone else's title and id. So both ends of the clause are stated the
    // same way and neither is a hash.
    //
    // A chip pointing at anything that is NOT a post gets nothing back and
    // falls through to MicroChip's own hash face: a NODE has no title, and
    // inventing one would say less than its address does.
    const originName = (target) => {
      if (!target || target.kind !== 'posts') return ''
      return target.title || `post #${target.id}`
    }

    // And the MARK it wears: the card's own post glyph, so the clause and
    // the kind icons at the head of the same line are one family. MicroChip
    // defaults to `KINDS.posts.icon` (`edit_note`), which is the platform's
    // POST-AS-DOCUMENT glyph and a different drawing from the one this cap
    // has been stating a post with two spans to the left. Everything else
    // keeps the kind's own icon — a node chip should look like a node.
    const originIcon = (target) => (target?.kind === 'posts' ? 'sym_o_post' : null)

    // ── THE CAP'S PIN (2026-08-07) ──────────────────────────────────────
    // Which of this page's posts are already in the caller's PINS skeleton.
    // ONE `/pins` read per stream load rather than a `pins/check` per card:
    // the pins widget makes the same call, the list is short by
    // construction, and a per-card probe would be thirty requests to draw
    // thirty tacks. Skeleton-targeted pins only — a pin on a node or a label
    // can never be one of these cards.
    const pinnedIds = ref(new Set())

    const loadPinned = async () => {
      try {
        const r = await pinService.list()
        if (!r?.success) return
        pinnedIds.value = new Set(
          (r.pins || [])
            .filter(p => p.target_type === 'skeleton' && p.target_id)
            .map(p => Number(p.target_id))
        )
      } catch (e) { /* unauthenticated or offline — nothing reads as pinned */ }
    }

    // Optimistic on the SET (the tack flips on the press) and authoritative
    // on the server (a refused call reloads the truth back over it). The
    // event is what keeps the pins widget in step — it lives in MainLayout,
    // so this rides up through FeedPage the way the media host's does.
    const togglePin = async (item) => {
      const id = item.skeleton_id
      const was = pinnedIds.value.has(id)
      const next = new Set(pinnedIds.value)
      if (was) next.delete(id); else next.add(id)
      pinnedIds.value = next
      try {
        if (was) await pinService.unpin('skeleton', id)
        else await pinService.pin('skeleton', id)
        navStore.recordAction(was ? 'UNPIN' : 'PIN', {
          targetType: 'skeleton',
          targetId: id,
          targetRoute: '/posts/' + id,
          targetLabel: item.title || 'Post #' + id,
          targetPath: item.skeleton_path || null
        })
        emit('pins-changed')
      } catch (e) {
        await loadPinned()
      }
    }

    // The post's own name in the cap — THE card's one name since the title
    // plate left the byline (2026-08-09; its `cardName` rule fell back
    // through the parent because that band had no room to state a
    // relation). This one falls back to the ADDRESS: the relation is
    // already stated to its left, so what is missing here is only the name,
    // and a post with no title still has an id.
    const capTitle = (item) => item.title || `post #${item.skeleton_id}`

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

    // ── BUNDLED BY ROOT (2026-08-10, user ask) ──────────────────────────
    // The rail draws one plate per label TREE, not per label path. A post
    // classified twice under the same root printed that root twice — on a
    // plumbing post the rail read `PATHCHAIN › … PATHCHAIN › …`, the same
    // word standing at the head of every plate — and the root is the least
    // informative step in a path besides.
    //
    // Grouping only, never filtering: every label that reached `labelPaths`
    // reaches a bundle, keeps its own id, its own link and its own funnel.
    // What changes is that each member spells the TAIL of its chain, because
    // the bundle has already said the head. `path` rides along unsliced, so
    // the tooltip is still the whole classification.
    //
    // Order is `labelPaths`' order, held by the Map's insertion order — user
    // classification ahead of the PATHCHAIN plumbing families, alphabetical
    // within that. Grouping cannot reorder what it groups.
    //
    // A bare-ROOT label (a chain of one) has no tail to spell, so it states
    // its own name in the member cell rather than rendering an empty one.
    const labelBundles = (item) => {
      const groups = new Map()
      for (const lp of labelPaths(item)) {
        const root = lp.names[0]
        if (!groups.has(root)) groups.set(root, { root, mark: rootMark(root), items: [] })
        groups.get(root).items.push({
          id: lp.id,
          path: lp.path,
          names: lp.names.length > 1 ? lp.names.slice(1) : lp.names
        })
      }
      return [...groups.values()]
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
      momentWhen,
      momentTitle,
      isOpen,
      isSkeletonOpen,
      copiedId,
      copyAddress,
      isExpanded,
      toggleExpand,
      hashFilter,
      rootMark,
      capIcons,
      capKindTitle,
      originClauses,
      originName,
      originIcon,
      capTitle,
      pinnedIds,
      togglePin,
      labelPaths,
      labelBundles,
      postBody,
      LENS_OPTS,
      maxHops,
      setLens,
      hopsMark,
      hopsTitle,
      // the time lens (2026-08-07)
      DATE_OPTS,
      dateWin,
      TOD_OPTS,
      todWin,
      todKey,
      todMark,
      todTitle,
      todMenuOpen,
      todFrom,
      todTo,
      setTodWin,
      applyTodCustom,
      dateKey,
      dateMark,
      dateTitle,
      dateMenuOpen,
      setDateWin,
      customFrom,
      customTo,
      applyCustom,
      // the identity lens (2026-08-07)
      pickedEntities,
      whoMenuOpen,
      whoQuery,
      whoResults,
      whoInput,
      whoTitle,
      searchEntities,
      focusWho,
      pickEntity,
      dropEntity,
      entityCard,
      labelFilter,
      labelMenuOpen,
      setLabelFilter,
      labelQuery,
      labelMatches,
      pickLabelHit,
      applyLabelQuery,
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
// THE WHOLE FILTERING SECTION IS SET IN THE DISPLAY FACE (2026-08-07, user
// ask: "for the filtering section with the actual filters … use nasalization
// onto everything"). Stated HERE, on the row, and once on each menu root
// below, rather than as a class on twenty elements: almost every control in
// this cluster already reads `font-family: inherit`, so the row is the one
// place that decides — and a scoped rule with `inherit` in it BEATS the
// `.nasalization` utility on specificity, which is why the class alone would
// have missed exactly the elements that look like they carry it.
//
// The MONO utility is gone from every mark in the section — the lens marks,
// the range tags and its apply, the picked-seat chips, the handles, and the
// lane's chips (active, clear and trashed alike). Those wore `mono` from the
// days the head band was a mono-headed strip; the face they are in now is the
// one the box's own title is set in, so the filters read as part of the board
// rather than as data printed on it. Each rule keeps its OWN letter-spacing —
// the utility's `0.05em` is meant for headings with room, and these are 10px
// marks in a 20px plate (the same call the post card's head strip documents).
// TWO ROWS since 2026-08-07 (user ask): the lens BUNDLE on top, the label
// FIELD under it. The section stopped being one row when the label lens
// stopped being a plate — a field needs a line of its own, and stacking is
// what buys it one without taking width from the composer beside it. The
// column is `stretch`, so the field runs the bundle's full width and the two
// rows read as one block rather than two controls that happen to be near
// each other.
//
// The scroller is GONE with the row: a column cannot scroll sideways, and the
// half hugs this block now, so there was nothing left for `overflow-x` or the
// auto-margin centring to do. (The gotcha they were written for — justify
// properties putting overflowing content past a scroll container's start,
// unreachable because `scrollLeft` cannot go negative — is still in
// specs/gotchas.md, and still true for `MediaTabsBar`.)
.feed-stream__controls {
  // ── THE SECTION'S OWN LINE (2026-08-07, user ask: "make the borders and
  // hairlines of both the button bundle and the label filter bubble slightly
  // thicker and paint them indigo-8") ─────────────────────────────────────
  // FOUR lines read this pair: the bundle's rim, the dividers between its
  // three lenses, the bubble's rim, and the rule the verb button stands
  // behind. They were the box's own `--fhead-rule` at 1px — which made the
  // controls draw in the same ink and the same weight as the WALLS the box is
  // divided by, so at a glance the section had six equal lines in it and no
  // way to tell a control's edge from a room's.
  //
  // The TONE walked `--indigo-8` → -7 → -6 → **`--indigo-9`** across four asks.
  // It is now the SECTION'S OWN FLOOR and the lens buttons' own plate, which
  // is the point of the last setting: the block is one dark material, and a
  // line drawn on it in its own tone only appears where that material meets
  // something else.
  //
  // ⚠ SO THE LENS DIVIDERS STOP DRAWING. They sit between two `--indigo-9`
  // button plates and are `--indigo-9` themselves, so three lenses in a row
  // read as ONE dark bar carrying three glyphs rather than three plates with
  // rules between them. That is what "all indigo-9" means here, and it is
  // worth knowing before hunting for a missing border: if the divisions should
  // come back, the dial to turn is the PLATE or this rule — not both.
  //
  // Where it still draws: against the `--grey-3` faces — the label field's rim
  // and the rule the verb stands behind — because there it has something to be
  // different from.
  //
  // ⚠ This dial and `--fhead-chat-rim` in `FeedHeadBox.vue` were ONE decision
  // in two files for four asks running; this one moved the section alone, so
  // the composer's rim is still `--indigo-8` and they are now two levels
  // apart. Check the other before assuming they still travel together.
  --lens-rim: var(--indigo-9, #283593);
  --lens-rim-w: 2px;
  // THE SECTION IS PAINTED `--indigo-9` (2026-08-08, user ask), in the same
  // pass that took the half's padding to zero. The two go together: with no
  // padding the bars run wall to wall, so the only place this floor shows is
  // the SEAM between them — a 3px dark line the two control bars sit either
  // side of, which is what the gap was always doing and now says so.
  //
  // It is the deepest step the box uses, the one its two inner posts and its
  // five lane-and-room keys are plated in — so the seam reads as more of the
  // box's structure showing between two objects lying on it, rather than as a
  // third colour introduced to fill a space.
  background: var(--indigo-9, #283593);
  font-family: var(--font-display);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  // CENTRED in the height the half hands it, so whatever the two bars do not
  // use splits evenly above and below them instead of pooling at one end —
  // the dark field then reads as a thin border around the pair rather than as
  // a gap under them.
  justify-content: center;
  // NO GAP (2026-08-08, user ask) — the two bars touch. It was 3px, set
  // against the half's padding back when the half had some; the padding went
  // to zero an ask earlier and this is the same decision finishing. The
  // `--indigo-9` floor now shows only where `justify-content` leaves it, above
  // and below the pair.
  //
  // ⚠ Touching bars DOUBLE their rims — 2px meeting 2px is a 4px line between
  // them, heavier than the 2px anywhere else on the block. So the second bar
  // drops the edge that meets the first (see `.feed-stream__label-row`: no
  // `border-top` stacked, no `border-left` in the phone's single row). That is
  // a consequence of closing the gap, not a separate design choice — undo both
  // together if the seam ever comes back.
  gap: 0;
  min-width: 0;

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
// (The `.feed-stream__lens` box that held the four segmented plates went with
// the 2026-08-07 fold, and `.feed-stream__label-open` — the light plate every
// folded lens then wore — went with the BUNDLE later that day: the group
// draws the rim and the floor once for all three. The button rule below
// stayed, because it is the TYPE, and every lens in the cluster still sets
// its lettering from it. ⚠ Its `--fhead-*` fallbacks are now the only thing
// this cluster still takes from the box's dials: the section's LINES read
// `--lens-rim` instead, so a control's edge and a room's wall can be told
// apart.)
// THE BUNDLE (2026-08-07, user ask) — `QBtnGroup` draws the GEOMETRY (radius
// inherited by the children, squared off on everything but the two ends) and
// this rule draws the PAINT: one rim, one radius, one floor for the four
// lenses, with the dividers between them stated on the buttons.
//
// `overflow: hidden` is what makes the `is-on` FILL respect the bundle's
// corners — without it the first or last lens paints a square plaque into a
// rounded end.
//
// FULL WIDTH OF ITS CONTAINER since 2026-08-07 (user ask). Two changes make
// that real, and only together: `display: flex` (QBtnGroup ships
// `inline-flex`, which shrink-wraps whatever width it is given) and
// `flex: 1 1 0` on the buttons below, so the three lenses SHARE the width
// instead of the group holding a stretch of empty floor at its right end.
// The `align-self: center` that used to hold it at its natural width is gone
// with it — the column is `stretch`, so the group now spans exactly what the
// label row under it spans, and the two rows read as one block.
//
// Note what still sets the section's WIDTH: the label field's natural size.
// A percentage width is indefinite during intrinsic sizing, so the group
// stretches to the column rather than driving it.
.feed-stream__lens-group {
  display: flex;
  width: 100%;
  border: var(--lens-rim-w) solid var(--lens-rim);
  // SQUARE (2026-08-08, user ask), from `--radius-sm`. It follows the pass
  // that took this section's padding to zero and painted it `--indigo-9`: the
  // bars run wall to wall now, and a rounded box against a straight wall shows
  // the floor in four little corners. Square, the pair reads as two bands
  // filling the room with one dark seam between them.
  //
  // The children's `border-radius: 0` below is now trivially in agreement
  // rather than load-bearing — but it stays, because it is the rule that keeps
  // the corners matched at ANY radius, and this one has been changed four
  // times.
  border-radius: 0;
  background: var(--grey-3, #eeeeee);
  overflow: hidden;
}

// DENSE, AND THE OUTER PADDING CUT HARD (user ask: "make the bundle dense and
// reducing the outer padding a lot"). `dense` on the QBtn is not enough on its
// own — Quasar's dense still writes `padding: 4px 8px` and a `min-height` from
// its size scale — so the box is restated here: 2px/5px and no floor. The
// glyph is 13px, which makes the plate 17px tall against the 21px it was.
//
// `:deep(.q-btn__content)` — the icon and the lens mark live inside QBtn's own
// content wrapper, which the scope attribute never reaches. Its `gap` is what
// used to be the flex row's on the plain button.
.feed-stream__lens-btn {
  // EQUAL THIRDS of the bundle (2026-08-07, user ask — the group spans its
  // container now, and a bundle with a gap at one end is not a bundle). A
  // ZERO basis, not `auto`: with `auto` the three would divide the SLACK in
  // proportion to their content, and the trust lens is wider than the other
  // two by the mark it prints, so the row would come out visibly uneven.
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  border-right: var(--lens-rim-w) solid var(--lens-rim);
  background: var(--indigo-9, #283593);
  color: var(--brown-1, #efebe9);
  font-family: inherit;
  font-size: 0.66em;
  font-weight: 700;
  letter-spacing: 0.03em;
  padding: 2px 5px;
  // PLATED (2026-08-08, user ask) — `--indigo-9` under a `--brown-1` mark,
  // after one ask at -8. It is now EXACTLY the lane keys' recipe rather than
  // a step off it: the broom, the bin, these three lenses and the label row's
  // verb are one object drawn five times, so every pressable thing in this box
  // that is not a field reads the same way — a deep plaque with a warm mark on
  // it. The lenses were light plates with dark glyphs, which made them look
  // like the FIELDS they sit beside; they are buttons, and now they say so.
  &:last-child { border-right: 0; }
  &:hover { background: var(--indigo-8, #303f9f); }
  // ── THE CORNERS MATCH BY CONSTRUCTION (2026-08-08, user ask: "the corners
  // look mismatched") ────────────────────────────────────────────────────
  // They were, and this is why. Quasar gives every `.q-btn-item` in a group
  // `border-radius: inherit` — the GROUP's radius, `--radius-sm`. But the
  // group carries a 2px border, and an `overflow: hidden` box clips its
  // content to the PADDING-box curve, which is `radius − border-width`. So the
  // button was drawing a 7px corner inside a 5px clip: two curves of different
  // radii on the same corner, with the group's floor showing in the sliver
  // between them.
  //
  // Zeroing the button's own radius hands the rounding entirely to the clip,
  // which is the only way the two CANNOT disagree — the visible corner IS the
  // group's inner curve, whatever the rim's width or the radius is set to
  // later. It also fixes the `is-on` FILL for free: a plaque that used to be
  // rounded-then-clipped is now simply clipped.
  border-radius: 0;
  // THE ON STATE IS AN INVERSION since the plates went dark (2026-08-08). It
  // used to be the dark fill on a light button; with the button itself `-8`
  // under `--brown-1`, "on" swaps the two — the bundle's own `--grey-3` floor
  // as the plate, the plate's tone as the mark. Nothing new enters the
  // palette, and the lens you ARE looking through is the one plate in the
  // bundle reading light-on-dark's opposite.
  &.is-on {
    background: var(--grey-3, #eeeeee);
    color: var(--indigo-9, #283593);
  }
  :deep(.q-btn__content) {
    gap: 3px;
    flex-wrap: nowrap;
  }
}

// ── THE LABEL ROW ───────────────────────────────────────────────────
// Glyph · field · verb, in one plate the width of the bundle above it. The
// plate is the bundle's own recipe (same rim, radius and floor) so the two
// rows are one block; what tells them apart is that this one has a FIELD in
// it, which is the whole reason the label lens left the bundle.
// IT MATCHES THE BUNDLE EXACTLY (2026-08-07, user ask). It spent one ask
// centred and inset 6px a side, on the argument that a hierarchy reads better
// than two bars of identical length; the ask after settled it the other way,
// and the other way is right — these are two halves of ONE control block, not
// a field nested inside a toolbar, and at this size a 12px inset reads as a
// misalignment rather than as a nesting. So no `align-self` and no width of
// its own: the column is `stretch`, and both rows take the section's measure.
// ⚠ NO `.feed-stream__label-line` ANY MORE. The funnel spent a few asks
// OUTSIDE this bar — a wrapper held the two side by side, the verb standing on
// the section's `--indigo-9` the way the lane's keys stand beside their trays
// — and it came back IN on the next ask (user). The reason is worth keeping:
// out there the verb's `--indigo-9` plate was drawn on an `--indigo-9` floor
// and drew nothing, so the control was a bare glyph floating beside the field;
// in here the same plate lands on this bar's `--brown-1` and states itself.
// The wrapper had nothing left to wrap and went with the move.
.feed-stream__label-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  // ── THE ROOM RIM (2026-08-08, user ask: thin `--indigo-7` borders on the
  // board's brown-1 rounded containers) ────────────────────────────────────
  // 1px `--indigo-7`, off the 2px `--lens-rim` (-9) this bar shared with the
  // bundle above it. It is the head box's `--fhead-room-rim` by another route
  // — the same ink the talk room and the two lane trays took in the same ask,
  // and the ink the BOX'S OWN FRAME is drawn in — so the four warm containers
  // are outlined as one family across the two files. A -9 rim would have made
  // each of them read as another wall.
  border: 1px solid var(--indigo-7, #3949ab);
  // ROUNDED — `--radius-sm`, with the head box's talk room and its two lane
  // trays, one curve across both files (2026-08-08, the SECOND attempt; the
  // first was reverted on sight because those three were curving against the
  // box's pale `--grey-4` face and each corner opened a notch). This bar is
  // the one that always could: its backdrop is `.feed-stream__controls`,
  // painted `--indigo-9` by the SOLID BLOCK pass, so the curve opens onto the
  // board's structural ink — the same rule the other three now follow.
  //
  // ⚠ Its TOP corners curve away from the bundle above it, which draws none of
  // its own (the bundle is square and this bar carries `border-top: 0` so the
  // touching rims do not double). What shows in that seam is `--indigo-9`,
  // between two `--indigo-9` rims — invisible, and only invisible because the
  // section, both rims and the plates are one ink. If the section's floor ever
  // lightens, this radius is the first thing to check.
  // A LITTLE ROUNDER (2026-08-08, user ask) — 10px, off `--radius-sm`'s 7. It
  // lands on the head box's `--fhead-talk-r`, and the tie is worth stating:
  // the two containers on the board you TYPE INTO are the two with the bigger
  // corner, and the two that hold CHIPS (the lane's trays) keep the small one.
  // Not a shared dial, since they are in different files — grep both if the
  // board's corner is ever re-scaled.
  border-radius: 10px;
  // ⚠ ITS TOP EDGE IS BACK (2026-08-08, with the rim above). It was 0 because
  // two touching 2px rims in ONE ink double to a 4px line and the bundle owned
  // that edge — true while this bar was the second half of a flush block in
  // the same rim. It is not that any more: it is a rounded, outlined warm
  // panel in a different ink at half the weight, so an open top read as a box
  // missing an edge, with the curve running up to nothing at both corners.
  // What stacks at the seam now is the bundle's 2px -9 over this 1px -7 — a
  // lighter hairline under a dark rule, which reads as the panel's own edge.
  // `--brown-1` SINCE 2026-08-08 (user ask), off the `--grey-3` it shared with
  // the bundle above it. The field joins the board's WARM family — the talk
  // room's floor, the header's writing, the lane's two chip trays, all painted
  // in this one tone in the same sitting — which is a fair reading of what
  // this bar is: the other place on the board you TYPE, the label lens's
  // answer to Talavero's composer across the wall.
  //
  // ⚠ IT NO LONGER MATCHES THE BUNDLE ABOVE IT — but measured, that is a
  // change of LEAN and not of tone: `--grey-3` is 238 neutral and this is
  // rgb(239,235,233), 1.02:1, the same lightness warmed. So the "two bars, ONE
  // block" argument survives on every count that built it (one rim, one width,
  // one seam, one shape, one value) and what the warmth adds is which half you
  // can write in. Bring the bundle's `--grey-3` here if they should ever be
  // one surface again — and expect the difference to be barely visible either
  // way, which is the point.
  background: var(--brown-1, #efebe9);
  padding: 0 0 0 5px;
  overflow: hidden;
}

// The glyph NAMES the line — it is not a button and never was. `label` is the
// same mark the platform's label chips wear.
.feed-stream__label-row-mark {
  flex: 0 0 auto;
  color: var(--fhead-ink, var(--indigo-8, #303f9f));
  opacity: 0.75;
}

.feed-stream__label-input {
  flex: 1 1 auto;
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--fhead-ink, var(--indigo-8, #303f9f));
  font-family: inherit;
  font-size: 0.64em;
  font-weight: 700;
  letter-spacing: 0.03em;
  padding: 3px 0;
  &:focus { outline: none; }
  &::placeholder { font-weight: 400; opacity: 0.5; }
}

// THE VERB — the funnel, the bar's last child again and the one PRESSABLE
// thing in a bar you otherwise type into. It left the lens bundle for the end
// of this line in 2026-08-07, spent a few asks OUTSIDE the bar in 2026-08-08,
// and is back inside (user ask, the same day).
//
// ⚠ AND ITS PLATE DRAWS AGAIN, which is the whole point of the return: an
// `--indigo-9` tile on this bar's `--brown-1` floor is the box's deepest mark
// on its warmest one. Outside, that same plate sat on the section's own -9 and
// vanished, leaving a bare `--brown-1` funnel — correct for the lane's keys,
// which ARE bare glyphs on a dark band, and wrong for the one control standing
// in a light field. Hover steps to -7 and `is-on` inverts to a `--grey-3`
// tile.
.feed-stream__label-go {
  flex: 0 0 auto;
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  // ⚠ NO BORDER AT ALL. The button carried a `border-left` in `--lens-rim` as
  // the wall between the field and the verb, from when the two stood on one
  // floor and needed a line to be told apart. They do not: the button is an
  // `--indigo-9` tile on a `--brown-1` bar, so its own EDGE is the division —
  // and a -9 line on a -9 plate is a border that cannot be seen anyway.
  border: 0;
  // THE SAME PLATE AS THE BUNDLE'S BUTTONS (2026-08-08, user ask) — it was a
  // transparent glyph on the field's own floor, which read as part of the
  // input rather than as the thing that acts on it. Plated, the row states
  // its two halves plainly: a light field you type into, a dark button you
  // press. Its ON state inverts exactly as the lenses' does.
  background: var(--indigo-9, #283593);
  color: var(--brown-1, #efebe9);
  cursor: pointer;
  &:hover { background: var(--indigo-7, #3949ab); }
  &.is-on {
    background: var(--grey-3, #eeeeee);
    color: var(--indigo-9, #283593);
  }
}

// The hits: name over its chain, the chain quieter and smaller — the same
// two-line reading the label chips use, since a leaf name only means
// something with its path under it.
.feed-stream__label-hits {
  max-height: 210px;
  overflow-y: auto;
}

.feed-stream__label-hit-name {
  font-weight: 700;
}

.feed-stream__label-hit-chain {
  font-size: 0.82em;
  opacity: 0.6;
}

.feed-stream__label-hit-empty {
  font-family: var(--font-display);
  font-size: 0.72em;
  color: var(--indigo-8, #303f9f);
  opacity: 0.6;
  padding: 6px 10px;
  background: var(--grey-1, #fafafa);
}

// SORT BY, ON THE BOARD'S HEADER PLATE (2026-08-07, user ask). It wore
// `.feed-stream__label-open` — the lens plates' light recipe — until it left
// the row; on an `--indigo-8` band that plate is a white tile stuck to a dark
// bar. So it is drawn as the COUNT beside it is: hollow, in the header's own
// `--grey-3` writing, rim at 55% of it. The two are the header's pair — a
// control and a reading, one language.
//
// It reads `--fhead-bar-ink` through the slot (it is inside the header, so the
// dial resolves) and keeps a `--grey-3` fallback for anywhere else. That dial
// went `--brown-1` on an `--indigo-9` plate (2026-08-08, user ask — after one
// pass at -2 on -10) and this button followed it for free, being drawn in it
// end to end: the glyph now wears the same warm tone as the lens buttons'
// marks two rows below it, which is the whole board's mark ink.
//
// NO OUTLINE since 2026-08-08 (user ask) — the rim at 55% is gone, which
// finishes the walk the count started when it lost its own an ask earlier. The
// pair at the bar's right end is now two BARE marks in the header's writing:
// a number and a glyph, told apart by what they are rather than by a box drawn
// round one of them. What still says the glyph is pressable is that it ANSWERS
// — the hover wash and the `is-on` inversion below, both kept.
//
// ⚠ The `is-on` plaque is now the ONLY box this control ever draws, which
// makes it read as a state rather than as a rim that happens to fill. If the
// button ever needs a resting edge again, take it from the WRITING at 55% as
// before — not from the plate: at `--indigo-9` the band is the same tone as
// every wall in the box, so a plate-derived edge would draw nothing here and
// would be a fourth thing claiming that one ink everywhere else.
.feed-stream__sort {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 15px;
  border: 0;
  border-radius: var(--radius-sm, 7px);
  background: transparent;
  color: var(--fhead-bar-ink, var(--grey-3, #eeeeee));
  cursor: pointer;
  &:hover { background: rgba(255, 255, 255, 0.14); }
  // ON = an ORDER that is not the default. Filled with the writing's own tone
  // and knocked back to the plate, the one inversion available on a band this
  // dark — the light-plate `is-on` (dark fill, white mark) would be invisible.
  &.is-on {
    background: var(--fhead-bar-ink, var(--grey-3, #eeeeee));
    color: var(--fhead-bar-face, var(--indigo-8, #303f9f));
  }
}

// THE MARK a folded lens prints beside its glyph (2026-08-07) — the hop
// radius, the window's short word, the count of picked identities. It is
// the STATE, not a label, so it is set tighter and smaller than the button's
// own lettering and takes whatever ink the plate is wearing (dark on the
// light plate, white once the lens is on). `line-height: 1` keeps it on the
// glyph's centreline: a 13px icon beside text with normal leading is the
// classic way a 20px control silently becomes 22px and moves the row.
.feed-stream__lens-n {
  font-size: 0.62em;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1;
  color: inherit;
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
// 3-row menu is noise). The TRUST and TIME menus wear the same rule: three
// dropdowns in one cluster, one list face.
//
// NOTE the raw `--indigo-*` tokens here and in every menu below. A `q-menu`
// TELEPORTS its content to `<body>`, so it stands outside the head box and
// never sees the `--fhead-ink` / `--fhead-rule` dials the box publishes on
// its own element — a menu written in those would fall back silently and
// drift the day the fallbacks change.
.feed-stream__sort-menu {
  // The display face has to be restated on every menu ROOT for the same reason
  // the tokens are: a teleported menu inherits from `<body>`, not from the row
  // that opened it, so `.feed-stream__controls`' setting never reaches here.
  font-family: var(--font-display);
  min-width: 92px;
  .q-item { font-size: 0.72em; color: var(--indigo-9, #283593); min-height: 26px; }
  .q-item.is-current { box-shadow: inset 3px 0 0 var(--indigo-7, #3949ab); font-weight: 700; }
}

// THE TIME MENU (2026-08-07) — the preset list over a custom range panel,
// divided by a hairline. The panel is the only place in this cluster with
// FIELDS in it, so it is the only one with a floor of its own: `--grey-2`
// under the list's `--grey-1`, which reads as a drawer at the bottom of the
// plaque rather than as two menus stacked.
.feed-stream__when-menu {
  font-family: var(--font-display);
  min-width: 168px;
  background: var(--grey-1, #fafafa);
}

.feed-stream__when-custom {
  border-top: 1px solid var(--indigo-3, #9fa8da);
  background: var(--grey-2, #f5f5f5);
  padding: 6px 8px 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.feed-stream__when-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.feed-stream__when-tag {
  flex: 0 0 30px;
  font-size: 0.62em;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--indigo-8, #303f9f);
}

// `color-scheme: light` is load-bearing, not cosmetic: the app runs in
// Quasar's dark mode, and a native datetime field inherits the page's scheme
// for its OWN chrome — the spinner, the calendar popup, the AM/PM caret.
// Left unstated, a dark browser picker drops out of a light plaque.
.feed-stream__when-field {
  color-scheme: light;
  flex: 1 1 auto;
  min-width: 0;
  border: 1px solid var(--indigo-3, #9fa8da);
  border-radius: var(--radius-sm, 7px);
  background: var(--grey-1, #fafafa);
  color: var(--indigo-9, #283593);
  font-family: inherit;
  font-size: 0.68em;
  padding: 2px 5px;
  &:focus { outline: none; border-color: var(--indigo-6, #3f51b5); }
}

// APPLY — the one dark plaque in the drawer, because it is the one thing
// here that changes what the stream is showing. Disabled while both ends
// are empty: an empty range is not a window, it is the absence of one, and
// that is what the list's "any time" row is for.
.feed-stream__when-apply {
  align-self: flex-end;
  border: 1px solid var(--indigo-8, #303f9f);
  border-radius: var(--radius-sm, 7px);
  background: var(--indigo-8, #303f9f);
  color: #fff;
  font-family: inherit;
  font-size: 0.62em;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 2px 10px;
  cursor: pointer;
  &:hover { background: var(--indigo-7, #3949ab); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}

// THE IDENTITY MENU (2026-08-07) — a search field over the picked seats
// over the results. In that order on purpose: you type, you see what the
// lens already holds, and the results land under both instead of pushing
// the picks around as they stream in.
.feed-stream__who-menu {
  font-family: var(--font-display);
  width: 232px;
  padding: 8px;
  background: var(--grey-1, #fafafa);
}

.feed-stream__who-input {
  width: 100%;
  border: 1px solid var(--indigo-3, #9fa8da);
  border-radius: var(--radius-sm, 7px);
  background: #fff;
  color: var(--indigo-9, #283593);
  font-family: inherit;
  font-size: 0.72em;
  padding: 3px 7px;
  &::placeholder { color: var(--indigo-4, #7986cb); }
  &:focus { outline: none; border-color: var(--indigo-6, #3f51b5); }
}

.feed-stream__who-picked {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

// A picked seat = the lane chip's plaque at menu scale, wearing the FACE:
// this platform states an identity with its picture, and a filter naming a
// person should look like the person.
.feed-stream__who-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--indigo-8, #303f9f);
  border-radius: var(--radius-sm, 7px);
  background: var(--indigo-8, #303f9f);
  color: #fff;
  font-size: 0.6em;
  font-weight: 700;
  padding: 1px 5px 1px 2px;
  cursor: pointer;
  max-width: 100%;
  &:hover { background: var(--indigo-7, #3949ab); }
}

.feed-stream__who-chip-name {
  max-width: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feed-stream__who-list {
  list-style: none;
  margin: 6px 0 0;
  padding: 0;
  max-height: 190px;
  overflow-y: auto;
}

.feed-stream__who-row {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  border: 0;
  background: transparent;
  color: var(--indigo-9, #283593);
  font-family: inherit;
  font-size: 0.72em;
  text-align: left;
  padding: 3px 4px;
  border-radius: var(--radius-sm, 7px);
  cursor: pointer;
  &:hover { background: var(--indigo-1, #e8eaf6); }
}

.feed-stream__who-name {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 700;
}

.feed-stream__who-handle {
  flex: 0 0 auto;
  font-size: 0.86em;
  opacity: 0.65;
}

.feed-stream__who-empty {
  color: var(--indigo-8, #303f9f);
  opacity: 0.6;
  font-size: 0.7em;
  padding: 5px 4px;
}

// THE COUNT (2026-08-06, user ask: "paint the post counter indigo"). It was
// `<q-badge color="primary" outline>` — the platform teal, and the last thing
// in this box still wearing it after the surface took a colorway of its own.
// Drawn as the lens buttons at REST rather than as one locked on: the total
// is a fact the box states, not a filter you can be inside of.
//
// IT MOVED TO THE HEADER (2026-08-07, user ask) — out of the lens row, into
// the box's plated bar through the `count` slot — and it had to change coat
// with the wall: the light `--grey-1` plate under `--fhead-ink` it wore on the
// body line is invisible logic on an `--indigo-8` band. It is HOLLOW now,
// drawn in the bar's own `--grey-3` writing at 55% on the rim, which keeps it
// a reading on the plate rather than a second plaque laid on one. The dials it
// reads are the BAR's (`--fhead-bar-ink`), not the box's — it lives inside the
// header, so they resolve; a fallback is kept for anywhere else it is slotted.
//
// It is set in the DISPLAY FACE like the title beside it: on this line it is
// one of the bar's two words, not one of the row's controls.
//
// NO RIM since 2026-08-08 (user ask), and that is the same argument finished:
// the hollow chip was already saying "a reading, not a plaque", and a rim is
// the one thing left on it that a control would wear. Bare, the cluster at the
// bar's right end reads correctly at a glance — a NUMBER beside a rimmed
// BUTTON, the only one of the two you can press.
.feed-stream__count {
  flex: 0 0 auto;
  border: 0;
  background: transparent;
  color: var(--fhead-bar-ink, var(--grey-3, #eeeeee));
  font-family: var(--font-display);
  font-size: 0.6em;
  font-weight: 700;
  letter-spacing: 0.03em;
  line-height: 1;
  padding: 2px 6px;
}

// The picker floats in a q-menu — a small light plaque, wide enough for
// the leaf names the dropdown states as `[PARENT] > NAME`.
.feed-stream__label-menu {
  font-family: var(--font-display);
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
  // `--grey-2` since 2026-08-07 (user ask, one setting after `--grey-5`: "make
  // the background color of the feed container grey-2"). The ask names the
  // CONTAINER and this is the bed, and they move together for a reason that is
  // easy to forget and has bitten this surface before: **the bed covers the
  // container edge to edge**, so the container's own coat is not visible
  // anywhere at all — measured, both boxes are `95,5,571,900`, and the only
  // part of the container outside that is behind the two opaque frieze bars.
  // Setting the container alone is a change that is true in the stylesheet and
  // invisible on screen. (The same trap cost a pass on 2026-08-05, when the box
  // went neutral and the bed was left behind.)
  //
  // ⚠ THE FIGURE/GROUND WAS INVERTED AT `--grey-2` (2026-08-07) and this ask
  // TURNS IT BACK. That tone (rgb 245,245,245) is LIGHTER than the veiled card
  // (rgb 242,239,234), so the card was the darker, warmer object on a
  // near-white field — a PAGE with darker sheets on it. `--grey-4`
  // (rgb 224,224,224) puts the card back ABOVE its bed, which is the reading
  // the card's whole tone stack was built for: a pale sheet lying on a grey
  // plate. Both are legitimate registers; they are different objects, and only
  // one of them is the one everything else here was tuned against.
  //
  // AND IT WIDENS THE STEP FROM THREE LEVELS TO THIRTEEN. At grey-2 the pair
  // ran the thinnest margin it ever has — the card was barely tonally stated
  // and leaned on its `--grey-6` outline and `--grey-1` hairline to be seen at
  // all. The bed's walk is the whole argument in one line: `--grey-4` →
  // `--grey-5` (53 levels BELOW the card) → `--grey-2` (3 above) → back here.
  // **The FIELD is the dial**; every step it moves down gives the card's wash
  // somewhere to be. What survives all of it: **card and bed need a step, and
  // its DIRECTION is a choice — its absence never is.**
  //
  // ⚠ AND THIS LINE IS HALF OF ONE CHANGE. `.feed-container` in FeedPage.vue is
  // the other half and must carry the same tone: this bed covers the container
  // edge to edge (both measured `95,5,571,900`), so a coat set on only one of
  // them is either invisible or a seam. The trap has cost three passes now.
  background: var(--grey-4, #e0e0e0);
  // The bed's REVEAL around the cards. The sides walked the whole way down and
  // then back up: `10px` (from the day the well took padding back) → `5px` →
  // `0` ("remove completely") → `3px` ("just a little little", all four on
  // 2026-08-06) → **`8px`** (2026-08-07, "a little more padding on the sides
  // from the frieze bars").
  //
  // The 3px setting was a SLIVER, not a gap: the smallest reveal that keeps the
  // card's own border from LANDING ON the frieze bar, which was the whole job
  // while the bar was `--grey-4` and the card's edge was the only line at the
  // seam. What changed the job is the same day's other ask — the bars went
  // `--indigo-8`, a deep plate against a pale card, and two objects that far
  // apart in tone need SPACE between them rather than a hairline of daylight:
  // at 3px the pale card looked stuck to the dark bar. At 8px the grey bed runs
  // between them and each reads as its own object standing on it.
  //
  // The vertical rhythm is 10px (the gap under the head, the stream's flex
  // `gap` between the rest), so the reveal is now NEARLY EVEN where it used to
  // be deliberately uneven — 8 against 10, close enough that the eye reads one
  // margin. Going the last 2px to a true 10 is not obviously better: the sides
  // are read against a hard vertical edge and the top/bottom against another
  // card, and equal numbers do not look equal across that difference.
  // The head band's negative side margins used to be exactly `-1 x` this number
  // so the band stayed full-bleed lip to lip while the cards kept the sliver
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
  padding: calc(var(--fhead-h, 120px) + 22px) 8px calc(var(--frieze-h) + 12px);

  // ── THE BED'S SIDE BORDERS (2026-08-07, user ask) — 1px `--indigo-6` down
  // each side, nothing on the ends. This box IS what holds the post cards, and
  // it covers the container edge to edge, so its two side edges are the line
  // the cards actually run against.
  //
  // It completes a GRADED FRAME the same day built from the outside in, each
  // step a different job and a different level of one family:
  //
  //   --indigo-4   the container's outer rim, on the near-black canvas
  //   --indigo-9   the two frieze plates (and their own plaque-toned edges,
  //                which reserve a margin rather than draw a line)
  //   --indigo-6   THIS — the inner edge, between the plates and the cards
  //
  // -6 is the family's Material 500, its pure hue: read against a `--grey-2`
  // bed and the cards' cream it is unmistakably a line, where the -4 outside
  // is read against black and can afford to be lighter. The two never meet —
  // the plates stand between them — so the frame reads as three marks, not as
  // a gradient someone tried to draw.
  //
  // On a SCROLLER the border is part of the border box, so it stays put while
  // the cards pass under it — the edge is the box's, not the content's. It
  // comes out of the width (`border-box`), which narrows `.feed-stream` by
  // 2px; the ResizeObserver picks that up and `--post-square-max` follows, as
  // the padding note above says.
  border-left: 1px solid var(--indigo-6, #3f51b5);
  border-right: 1px solid var(--indigo-6, #3f51b5);

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
// for the body — but drawn entirely in the FEED CONTAINER's own material
// rather than the platform's white.
//
// **FULLY NEUTRAL SINCE 2026-08-07** (user ask: the cards "from indigo to
// grey"). The coat went neutral on 2026-08-06 and the LINES followed a day
// later, so there is no indigo left anywhere on a post card. The mapping is
// the colorway's own, read across into the greys:
//
//   coat        --light-cream  #FCF3E0, a token minted for it (2026-08-07, two
//                          asks after the lines went grey: "just the
//                          background", then a family of its own). A WARM sheet
//                          on a cool plate — still one step above its bed, now
//                          separating by hue too. It was --brown-1 for the hour
//                          between those asks, --grey-3 for a day, --indigo-1
//                          before that.
//   bed         --grey-4   (unchanged — the container's plaque)
//   ONE INK     --grey-6   every line: the card's outer border, the byline
//                          hairline and vertical rule, the title plate's rim,
//                          the label rail and its strip hairline, the trust
//                          chip, the pit's inner one. Eight lines, one tone,
//                          differing only in WEIGHT — the card's oldest rule,
//                          carried over intact.
//   dark ink    --grey-9   the title plate's and trust chip's lettering
//                          (was --indigo-8, the colorway's dark end)
//   tray floor  --grey-4   the label rail (was --indigo-2, "the bed tone" —
//                          which is still exactly what it is)
//   chip coat   --grey-3   the labels in that tray (was --indigo-1, "the
//                          card's own coat" — likewise)
//
// Every one of those roles is the rule it always was; only the family moved.
// `--grey-6` is not a fresh guess either: it is the level that HELD when these
// same eight lines went grey for part of 2026-08-06 (-5 was tried first and
// read as a soft suggestion of a card). The earlier readings, for the record:
// `--indigo-1` card / `--indigo-2` bed / `--indigo-3` lines at the start, then
// -4 lines, then the neutral coat. The SHAPE of the rule survived all of it:
// coat, bed, one line ink.
//
// What this leaves indigo on the surface is exactly the CHROME around the
// cards — the head box's cluster and the four frieze plaques — so the feed now
// reads as neutral objects inside an indigo frame, where it used to be one
// blended field. The accent (#00829c hover / open) is untouched: it was never
// part of the colorway.
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
  // THE CARD IS THREE LAYERS SINCE 2026-08-07 (user ask) — see the `::before`
  // note below the block for what the middle one is. These two lines are what
  // make the sandwich possible and nothing else:
  //   · `relative` so the veil has this box to fill. Safe to add: the card has
  //     no absolutely positioned descendants to newly contain (its four direct
  //     children are the byline, the rail strip, the pit and the foot, all in
  //     flow), so nothing moves.
  //   · `isolate` so the layering STAYS INSIDE the card. Without a stacking
  //     context here the veil's `z-index: 0` and the children's `1` would
  //     compete in the feed's own context alongside the container (3001), the
  //     head box and the flyout — harmless today, since cards never overlap,
  //     but it would make a card's foot a participant in page-level paint
  //     order for no reason. A card's inside is the card's business.
  position: relative;
  isolation: isolate;
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
  // ONE INK, `--grey-6`, on all seven inner lines AND all four outer edges —
  // the card's oldest rule. The edge spent an hour of 2026-08-07 out of it
  // (`--grey-7`, then `--grey-8`) and came back on the third ask; see the
  // `border` declaration below for the walk and what it settled. The rest of it stands: the
  // card's oldest rule, that its lines share an ink and differ only in
  // WEIGHT. It very nearly went: the last passes of 2026-08-06 split the box
  // into a bevel (bottom + left in the colorway, top + right neutral, reading
  // as a light source at the top right) before the user brought the other two
  // edges across as well. The bevel is worth remembering as a REAL option —
  // the card lost its drop shadow at the end of 2026-07-25 and two coloured
  // edges restate that lift as line, at no cost — but the reunited box is the
  // simpler statement, and simpler is what this surface has converged on.
  //
  // The full walk: `--indigo-3` (from 2026-07-25) → `--indigo-4` → `--grey-5`
  // → `--grey-6` → the split (asked at `--indigo-6`, tried at -5, settled at
  // -4) → back to one ink at `--indigo-4`, ALL ON 2026-08-06 → and out of the
  // colorway for good on 2026-08-07 (user ask: the cards go grey), which
  // returned the lines to the `--grey-6` this walk had already tested.
  //
  // What each step settled, since the destination was reached twice: -3 → -4
  // was about the surfaces going neutral underneath — a line's job on a grey
  // plate is not the job it had on an indigo one, and with a `--grey-3` card on
  // a `--grey-4` bed the line is the only thing stating the card's shape. The
  // greys then proved how much DEPTH that edge needs: `--grey-5` read as a soft
  // suggestion of a card at the frieze seam, `--grey-6` held. That is why the
  // second trip out could land immediately — the level was already known, and
  // what had kept the hue was an argument about the FRAME (indigo lines tying
  // the card to indigo bars) that the frame itself has since answered by going
  // deep indigo, where a pale card has nothing to tie itself to.
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
  //
  // 1.5px SINCE 2026-08-07 — still even on all four edges, and the HALF STEP
  // is the point. It went 1px → 2px that day ("slightly
  // thicker": a hairline outline round a box divided by 12px plates read as the
  // thinnest line on its own surface) and back down a half on the next ask
  // ("a little thinner"), which is a real position and not a compromise: the
  // card's INNER lines (pit rim, rail tray, title plate, the hairline's own
  // bread) are 1px, so the outline has to outweigh them to read as the card's
  // edge, and 2px against 1px was the whole card's heaviest line by double
  // once the dividers inside it thinned. A fractional border is fine here —
  // it is one flat colour on all four edges, so a device-pixel rounding
  // difference between two sides cannot show up as a mismatch of tone.
  //
  // WHAT A HALF PIXEL ACTUALLY RENDERS AS, measured: on a **2× display** (the
  // desktop this is designed on) it is exact — 3 device pixels, a true half
  // step between the card's 1px inner lines and the 2px it wore for an hour. At
  // **1×** the browser floors it to 1px (verified in the headless driver, which
  // runs at DPR 1 and reports `borderTopWidth: 1px`), so the ask degrades to
  // the full step down rather than to something wrong — thinner either way, and
  // identical on all four edges either way. The pit's `--media-max-h` counts 3
  // total px of card border, which is 1px optimistic at 1× and immaterial
  // against a ~270px constant.
  //
  // THE INK CAME BACK ON 2026-08-07, after three asks that walked it out and
  // home again: `--grey-6` → `--grey-7` (following the two dividers there) →
  // `--grey-8` (a "one tone down" read as DARKER) → `--grey-6`, the ask being
  // "clearer". So the card's oldest rule — one ink, only the weight tells its
  // lines apart — is intact on every LINE the card draws, and what the day
  // actually added is a second, darker group that is not lines at all: the two
  // DIVIDERS' plates (`--grey-7` the rgb hairline's rules, `--grey-8` the
  // frieze band's plaque). The card is drawn in one ink and divided by two
  // plates, which is a cleaner statement than the three-greys frame this line
  // spent an hour inside — an edge a step or two under its own inner lines was
  // reading as a box around a box. Grep `.post-square` and move the LINES
  // together; the plates move on their own.
  // **1px SINCE 2026-08-07** (user ask, "a little thinner"), after the walk
  // above ran 1px → 2px → 1.5px. The half-step existed to keep the outline
  // OUTWEIGHING the card's 1px inner lines, so it would read as the box's edge
  // rather than as another rule inside it — and the ask that thins it is the
  // same ask that rounds the corners, in the same pass as the contact shadow
  // below. That is what makes it safe now: the card stopped being a flat plaque
  // told apart by line weight and became a SHEET, and a sheet is stated by its
  // cast and its silhouette. The outline is one of three devices now instead of
  // the only one, so it can sit level with the inner lines without the box
  // losing its edge. If the shadow is ever removed, this wants 1.5px back.
  border: 1px solid var(--grey-6, #9e9e9e);
  // ROUNDER, twice on 2026-08-07 (two user asks: "a little more roundness",
  // then "a little bit more round") — `4px` → `6px` → **`8px`**, reversing both
  // of the 2026-08-06 steps that had taken it down. That walk was `--radius-md`
  // (0.85em) → `--radius-sm` (0.5em, the step the card's own inner boxes turn)
  // → a flat `4px`, on the reading that a card whose LINES do the separating
  // wants a corner saying only "not a raw rectangle". The card is a sheet with
  // a cast now, not a plaque held by its outline, and a sheet's corner can
  // afford to be a corner.
  //
  // **`7px` IS THE ONE VALUE TO SKIP**, which is why this went 6 → 8 rather
  // than 6 → 7: the pit, the title plate and the label rail all turn at exactly
  // `--radius-sm` (7px), and a container that turns at the same radius as the
  // boxes INSIDE it reads as a tray moulded around them rather than as a sheet
  // they are laid on. At 6 the outer corner was a pixel tighter than its
  // contents, at 8 a pixel looser — and LOOSER is the better of the two
  // readings, because a box holding other boxes should turn more than they do,
  // not less. So this step both answers the ask and lands on the right side of
  // that line.
  //
  // Flat px stays right for the same reason it was before: there is no platform
  // step here, and minting one for a single box would state a rhythm the
  // platform does not have.
  border-radius: 8px;
  // `--light-cream` (#FCF3E0) since 2026-08-07 — THE COAT ALONE LEAVES THE
  // NEUTRALS, hours after the card's lines went grey, and it took two asks to
  // land: `--brown-1` first ("just the background"), then a TOKEN MINTED FOR IT
  // ("add this color to a new color family"). It is still a pale sheet one step
  // above its bed, the relation that has held since 2026-08-06; what changes is
  // that the sheet is now WARM against a cool-neutral plate, so the card
  // separates by HUE as well as by lightness — the device the cards used before
  // the whole surface went grey (an `--indigo-1` card on a `--grey-4` bed),
  // read the other way round: the field keeps the neutral and the OBJECT
  // carries the hue.
  //
  // Why a new token rather than the brown that already fit: `--brown-1` is the
  // CROWN STRIP's plaque tone and stands on this very surface as the head box's
  // inner frieze posts' motif, so a card wearing it read as that plaque
  // BORROWED rather than as a card with a coat of its own. `--light-cream` is
  // yellower and lighter — a paper cream where brown-1 is a greyed one — and it
  // opens a family (`--<modifier>-cream`, named not indexed; see _tokens.scss)
  // that belongs to no other surface. So the feed is now four materials, one
  // job each: the grey plate (container, bed), the indigo plaques (four frieze
  // edges, the head box's cluster), the near-white pit floor, and this sheet.
  //
  // The coat's walk: `--indigo-1` (2026-07-25) → `--grey-4` (08-06, the
  // container's own coat, since a post square is a piece of the container and
  // never wore the platform's generic white `--paper-card`) → `--grey-3` (one
  // step above the bed, that day's last ask) → `--brown-1` → here. That step
  // and the bed's are the same dial read twice — the bed spent 08-06's
  // afternoon at `--grey-5`, then `--grey-3`, before going back to the plaque so
  // the CARD could take the lighter tone instead. The difference is which one
  // moves: a lighter BED makes the box a page with darker sheets on it, a
  // lighter CARD makes the box a plate with pale sheets lying on it.
  //
  // JUST THE BACKGROUND, as asked: the eight lines stay `--grey-6`, the
  // inks stay `--grey-9`, the pit keeps its near-white `--grey-1` floor and the
  // label chips keep `--grey-3`. That last one is worth flagging, because the
  // chips' rule reads "the card's own coat" and they are no longer wearing it —
  // they are a neutral chip in a neutral tray lying on a warm sheet, which is a
  // defensible reading (the tray is a piece of the BED set into the card) but
  // is a rule stated in one place and broken in another until someone decides.
  // THIS IS THE BOTTOM LAYER as of 2026-08-07's last ask — a `--grey-3` veil is
  // washed over it and the content sits above both. See the `::before` note.
  background: var(--light-cream, #FCF3E0);
  // ── A CONTACT SHADOW, VERY QUIET (2026-08-07, user ask) ──────────────────
  // The card cast NOTHING from 2026-07-25 until now, and the argument for that
  // is still on the record and still half true: it has nothing to lift off, the
  // tonal step against the bed already separates card from field, and a cast
  // edge muddied the 10px gap between two adjacent cards. What changed is the
  // step's DIRECTION. The bed went back to `--grey-4` in the ask before this
  // one, so the card is the LIGHTER object again — a pale sheet lying on a grey
  // plate — and a sheet on a plate is exactly the object that has a contact
  // shadow. Casting nothing was right while the card was the darker thing.
  //
  // TWO LAYERS, and both are doing one job rather than two:
  //   · `0 1px 2px / .045` — the CONTACT. Barely offset, barely blurred: this
  //     is the dark line where sheet meets plate, and it is what makes the edge
  //     read as an edge of something rather than a border drawn on the bed.
  //   · `0 2px 5px -2px / .05` — the AMBIENT. The negative spread is what keeps
  //     it a contact shadow instead of a float: reach is blur/2 − spread + y =
  //     2.5 − 2 + 2 = 2.5px down and 0.5px sideways, so it dies well inside the
  //     10px gap to the next card and the 8px bed reveal at the sides. That
  //     bound is the whole reason the old shadow muddied the stack and this one
  //     does not — the constraint was never "no shadow", it was "nothing that
  //     reaches the neighbour".
  //
  // The alphas are chosen against the FIELD, not in the abstract: on `--grey-4`
  // (rgb 224) a .045 black bottoms out around rgb 214, ten levels — visible as
  // weight, unreadable as a shade. On a near-white bed it would vanish; if the
  // field is ever taken lighter again, this wants raising or removing, and the
  // honest answer at `--grey-2` was removing.
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.045),
    0 2px 5px -2px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: border-color 0.12s, box-shadow 0.12s;

  // THE POINTER'S ANSWER IS A GLOW NOW (2026-08-09, user ask) — border and
  // halo together in `--indigo-11` (#8c9eff), replacing the teal pair that
  // stood here since 2026-07-26. The A100 is the hue the card's own frieze
  // motif already runs to, so a lit card answers in this surface's family
  // instead of the platform accent. Two steps survive from the old pair
  // (hover at half strength, open at full), and the halo rides ON TOP of the
  // contact shadow rather than replacing it — the lit sheet keeps its cast,
  // it does not start floating. The halo's reach (blur/2 + spread, ~5.5px
  // hovered / ~8.5px open) dies inside the 10px gap to the next card, the
  // same law the ambient obeys: a glow that touches the neighbour reads as
  // two lit cards.
  &:hover {
    border-color: rgba(140, 158, 255, 0.55);
    box-shadow:
      0 0 0 1px rgba(140, 158, 255, 0.3),
      0 0 9px 1px rgba(140, 158, 255, 0.4),
      0 1px 2px rgba(0, 0, 0, 0.045),
      0 2px 5px -2px rgba(0, 0, 0, 0.05);
  }

  // The card the flyout is currently reading out (2026-07-26) — and, since
  // 2026-08-09, the EXPANDED card too: both are the surface's "this one"
  // states, and one glow saying it keeps the vocabulary at a single mark.
  // The box floats clear of the container, so nothing but this says which
  // card it belongs to: the glow goes to full strength — one step past the
  // hover — and it must not add weight anywhere else, since the card is
  // height-capped and anything taller would come out of the pit (the halo
  // is free where a heavier border was not: a box-shadow paints outside
  // the box).
  &.is-open,
  &.is-expanded {
    border-color: var(--indigo-11, #8c9eff);
    box-shadow:
      0 0 0 1px rgba(140, 158, 255, 0.45),
      0 0 13px 2px rgba(140, 158, 255, 0.55),
      0 1px 2px rgba(0, 0, 0, 0.045),
      0 2px 5px -2px rgba(0, 0, 0, 0.05);
  }

  // ── THE EXPANDED CARD (2026-08-09, user ask) — the hash lens's face ────
  // When the active filter is one post's ADDRESS the stream holds exactly
  // one card, and that card stops being a window onto the post and becomes
  // the reading surface itself: full height, from the board's home slot
  // down to the container's floor. The height is stated rather than grown —
  // `--feed-well-h` is the well's measured visible height (published by the
  // same ResizeObserver that measures the width, for the same reason: a px
  // value cannot fail) minus the well's OWN paddings, which is what leaves
  // the little daylight above and below the card the well already reserves
  // for every card. ⚠ KEEP THE SUBTRACTION IN STEP with the well's
  // `padding` line: top = --fhead-h + 22px, bottom = --frieze-h + 12px.
  // The square ceiling lifts (`max-height: none`) and the PIT — the one
  // flexible track — takes every pixel the rigid strips leave, scrolling in
  // place exactly as it does at card scale.
  &.is-expanded {
    height: calc(var(--feed-well-h, 100vh) - var(--fhead-h, 120px) - 22px - var(--frieze-h) - 12px);
    max-height: none;
  }
}

// The expanded pit re-derives the MEDIA BUDGET from the expanded height
// (2026-08-09): the resting formula is written against the SQUARE ceiling,
// and a medium sized for a ≤60vh card standing in a full-height one would
// leave the pit half empty. Same shape as the resting formula below — the
// card's height term swapped for the expanded height, the well's paddings
// (22 + 12 = 34px, plus its 1× --frieze-h) folded in beside the card's own
// 276px chrome and 0.55× band. Keep all three lines in step: the well's
// `padding`, `.is-expanded`'s height, and this. (276 + 34 = 310; the pair was
// 300 + 34 = 334 until 2026-08-10, whose rail-padding asks took 8px out of
// the card's chrome and whose frieze move traded a 6px band for a band
// already counted in the variable term — move the resting constant and move
// this one with it. ⚠ THIS LINE LAGGED THE RESTING ONE by one edit that day:
// the frieze's two grey-6 rules went into the resting 280 → 282 and not into
// this, which is exactly the drift the sentence above warns about. Both terms
// are current as of the pit's margin ask, 282 → 276 here and there.)
.post-square.is-expanded .post-square__pit {
  --media-max-h: max(120px, calc(var(--feed-well-h, 60vh) - var(--fhead-h, 120px) - 310px - var(--frieze-h) * 1.55));
}

// ── THE VEIL (2026-08-07, user ask) — the card's MIDDLE LAYER ──
//
// The card is now a sandwich, bottom to top:
//
//   1. the `--light-cream` coat + the `--grey-6` border, on `.post-square`
//   2. THIS — a `--grey-3` wash at 70% with a very subtle blur
//   3. the content, lifted over it by the `> *` rule below
//
// It fills the PADDING box (`inset: 0` on an absolutely positioned child
// resolves there), so it stops exactly inside the border and the card's outer
// line keeps its own tone undimmed — which is what "with the outer border
// colors it already has" asks for. The card's `overflow: hidden` clips it to
// the 4px radius for free, so the veil has no corners of its own to state.
//
// WHAT IT ACTUALLY CHANGES: 0.7 × `--grey-3` (#eeeeee) over #FCF3E0 measures
// **rgb(242,239,234)** — the coat paler and cooler, the warmth pulled back
// without the card leaving the cream. It walked eight settings in one sitting,
// and the two dials are worth keeping apart because they do different jobs:
//   · OPACITY — 30% (a wash you had to know about to see) → 50% → **70%**,
//     where the cream is a clear TINT of the neutral field rather than its own
//     material. Linear, and the far end is known: at 100% the card is simply
//     the wash tone and the cream is gone. 70% is most of the way there, which
//     is why the card reads as a neutral with warmth IN it rather than as a
//     cream sheet: the coat is doing hue and the veil is doing value.
//   · THE WASH TONE — `--grey-3` (#eeeeee) ⇄ `--grey-2` ⇄ `--grey-4`, five
//     times over, ending **here**. At 70% this choice outweighs the other one,
//     because most of what you see IS the wash.
//
// THE ONE THING THAT WALK SETTLED, and it survives whichever tone is current:
// **a wash is only as good as the BED it is read against, so the rule is the
// relation and never the token.** `--grey-4` was tried, rejected and taken back
// on the same day without changing value — the first time the bed was
// `--grey-4` too and the card's coat converged on the field it lies on
// (rgb(232,229,224) against rgb(224,224,224): eight levels of red, NONE of
// blue), the step vanished, and the card's shape fell entirely to its outline;
// the second time the FIELD had moved to `--grey-2` and the identical wash read
// thirteen levels darker — a clear object again. Neither reading was about -4.
//
// That `--grey-2` pairing lasted one ask and was the quietest the surface has
// been: the card sat rgb(242,239,234) against rgb(245,245,245), only THREE
// levels and the card the DARKER of the two, stated by its outline and hairline
// rather than by tone. The field came back to `--grey-4` and the card is the
// pale sheet on a grey plate again — which is what that note's closing line
// predicted, and it is worth keeping as the rule: **if the card should carry
// itself, the dial is the FIELD**, because every step the bed moves down gives
// this wash somewhere to be.
//
// ── THE WASH ITSELF: `--grey-3` at 60% → `--grey-2` AT 65% ────────────────
// Four settings on 2026-08-07, and the walk is the documentation, because
// SWAPPING THE TONE CHANGED WHAT THE ALPHA DIAL DOES. Measured card, each time:
//
//   grey-3 @ 70%   rgb(242,239,234)   luma 240   R−B  8
//   grey-3 @ 60%   rgb(243,239,232)   luma 239   R−B 11   ("15% less strong")
//   grey-2 @ 80%   rgb(245,244,240)   luma 244   R−B  5
//   grey-2 @ 65%   rgb(246,243,236)   luma 243   R−B 10   ← here
//
// Read the last two rows: fifteen points of alpha moved luma by ONE level and
// DOUBLED the warmth. That is not a coincidence, it is arithmetic — `--grey-2`
// (#f5f5f5, luma 245) and `--light-cream` (#FCF3E0, luma 243) are the same
// brightness within two levels, so mixing them can only change HUE. Under
// `--grey-3` (luma 238, five levels below the cream) the same dial moved both
// at once, which is why the 70 → 60 step read as a tone change and this one
// reads as a temperature change.
//
// So the honest statement of this layer, and the thing to know before turning
// either knob: **the TONE decides what the alpha is a dial FOR.** At the
// current pairing the alpha is very nearly a pure WARMTH control — take the
// wash back to `--grey-3` (or lower) if the card should get darker rather than
// cooler. The FIELD is the third dial and belongs to neither: it sets how far
// the card stands off its bed (see the `--grey-4` note above), and at this
// setting that step is a comfortable ~19 levels on the 224 bed.
//
// (Predictions from the alpha alone run about a level over the measured value,
// because `backdrop-filter: blur(2px)` pulls the bed's own pixels into the
// composite at the edges. Sample the MIDDLE of a card if this is re-measured —
// and note that a sample taken just ABOVE a card lands inside the contact
// shadow, which reads ~7 levels dark and is easy to misread as the bed.)
//
// So the two dials on this pair are cleanly separated, and neither substitutes
// for the other: the FIELD sets how far the card stands off its bed, and THIS
// sets how much of the coat's own hue survives. Reach for the right one.
// The veil only covers the card's OWN coat,
// every inner panel is content and sits above it: the pit keeps its flat
// `--grey-1`, the title plate its `--grey-1`, the rail its `--grey-4` tray.
// So the veil reads in the margins and gutters between those panels, which is
// exactly where a card's coat is visible at all.
//
// ON THE BLUR, honestly: `backdrop-filter` blurs what is painted BEHIND an
// element, and behind this one is a flat fill, so there is nothing to smear.
// The one place it does show is the perimeter, where the sample pulls the
// border's `--grey-6` a pixel or two inward and leaves a faint haze inside the
// line. That is a real effect and a small one — appropriate to "very subtle",
// and it is the whole of it at 2px. Two things worth knowing before re-tuning:
// raising the radius will NOT make the middle of the card hazier (a flat
// backdrop stays flat however hard it is blurred), it only widens that
// perimeter haze; and the property becomes properly load-bearing the moment
// anything textured sits behind the veil — an image coat, a gradient, or the
// content itself if the `> *` lift below is ever dropped so the veil frosts
// the card's own text. `filter: blur()` here would be the WRONG tool: it blurs
// the veil's own pixels, and a flat rectangle's only pixels worth blurring are
// its edges, which `overflow: hidden` is already cutting square.
//
// `pointer-events: none` because a sheet over the whole card would otherwise
// eat every click in it — the title button, the label chips, the foot's links.
.post-square::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  background: rgba(245, 245, 245, 0.65); // --grey-2 at 65% (see the tone note above)
  // THE VEIL'S OWN BORDER — a 1px `--grey-1` line at 80% (2026-08-07, fourth
  // setting: it arrived as a 6px `--light-cream` band at 50%, "thick
  // transparent borders", was taken "waay thinner" to 1px `--grey-2` at 80%,
  // and ended one step paler still). What it draws is not a frame but a
  // HIGHLIGHT: a near-white hairline lying just inside the card's dark
  // `--grey-6` edge, so the card's outline reads as two lines — a dark one and
  // a lit one — where the 6px version read as a margin of un-veiled coat.
  //
  // It still composites the way the thick version did, and that is still the
  // only reason a semi-transparent border shows anything at all here:
  // `background-clip` is `border-box`, so the grey wash paints UNDER this
  // border and the border tone lands on top of its own washed self.
  //
  // MEASURED off the rendered card, left edge inward: **x=1 rgb(158,158,158)**
  // the card's own `--grey-6` line, **x=2 rgb(248,247,246)** this hairline,
  // **x=3 onward rgb(242,239,234)** the veiled field. Six levels of red and
  // twelve of blue against that field, in one pixel — where the 6px cream
  // version could only manage ten levels of red across six of them. It also
  // sits three levels ABOVE the bed outside the card (rgb 245,245,245), so on
  // the present pairing this hairline is the brightest thing on the surface:
  // with card and field only three levels apart, it is carrying more of the
  // card's edge than a 1px line normally would.
  //
  // That contrast is the lesson to keep, and it is a tone lesson, not a width
  // one: a border in the COAT's own tone is capped by how far the wash has
  // moved the coat (it can only give some of it back), while a border off the
  // card's axis states whatever value it likes. Six pixels of a capped tone
  // said less than one pixel of a free one.
  //
  // The two lines stack deliberately — dark outside, light inside — which is a
  // bevel. It was carrying the card's whole shape during the `--grey-4` pass,
  // when the coat sat eight levels off the bed; back on `--grey-3` the tonal
  // step does that job again and this line is the finish on top of it rather
  // than the structure.
  //
  // The tone change is what makes this setting a different DEVICE and not just
  // a narrower one. `--light-cream` was the coat's own tone, so the band could
  // only ever be "some of the coat coming back" and its ceiling was however far
  // the wash had moved the coat (single digits). `--grey-1` is off the card's
  // axis entirely and the palest step on the platform, so at 80% it states its
  // own value instead of recovering someone else's, and one pixel is enough.
  // (It is also the PIT's floor and the title plate's — so the brightest thing
  // on the card is now one tone doing two jobs: the reading surfaces, and the
  // line that lights the card's own edge.)
  //
  // `border-box` sizing (Quasar's reset) keeps the box pinned to `inset: 0` and
  // eats the width inward, so the card's own `--grey-6` line is untouched — it
  // sits outside this element entirely, and the two lines stack rather than
  // fight.
  // 2px AND FULL STRENGTH since 2026-08-07 (two user asks, back to back:
  // "make the borders of the veil grey-1", then "a little thicker"). The
  // width had gone 6px → 1px earlier the same day ("waay thinner") and this
  // is the step back up — one pixel of a free tone had proved the DEVICE, and
  // at two it reads as a lit inner edge rather than as an artefact of the
  // card's outline. It stays well under the 6px it started at, which was a
  // margin of un-veiled coat rather than a line.
  //
  // On the tone: it was `rgba(250, 250, 250, 0.8)` — the token, hand-composited —
  // and is the token now. The 80% was inherited from the 6px cream band, where
  // transparency was the whole device (a wide band of the coat's own tone
  // giving some of the coat back); off the card's axis and one pixel wide there
  // is nothing left for it to do but dim the line by two levels. Measured, the
  // line goes rgb(248,247,246) → rgb(250,250,250), so it now states the
  // palest step on the platform exactly, and the note above about a
  // semi-transparent border compositing over its own washed self is HISTORY
  // rather than mechanism.
  border: 2px solid var(--grey-1, #fafafa);
  // ── THE VEIL TURNS ITS OWN CORNER (2026-08-07) ──────────────────────────
  // `7px` = the card's `8px` outer radius MINUS its `1px` border, which is the
  // radius of the padding box this element is pinned to (`inset: 0`). It was
  // `5px` for the hour the card sat at 6.
  //
  // It had none until now and got away with it: the card's `overflow: hidden`
  // clips to that same padding box, so the veil's SQUARE corners were being cut
  // to the card's round ones for free. What the clip cannot do is bend the
  // veil's own 2px light BORDER — a square corner clipped by an arc leaves the
  // line thickening into the bend instead of following it. At the old 4px that
  // was a pixel nobody could see; the corner is half again as deep now, so the
  // veil has to turn the corner itself.
  //
  // KEEP THE THREE NUMBERS IN STEP: card radius − card border = this. Both of
  // the card's move together in the same ask more often than not.
  border-radius: 7px;
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  pointer-events: none;
}

// THE CONTENT, ABOVE BOTH LAYERS. Stated on the direct children as a set rather
// than on each panel, because the rule is about the card's LAYERING and not
// about any one panel: whatever the card grows next is above the veil too.
//
// It is needed at all because of paint order — an absolutely positioned
// `::before` with `z-index: auto` paints ABOVE in-flow siblings' backgrounds
// AND their text, so without this the veil would be a film over the whole
// card, byline included. `z-index: 1` puts the four panels back on top. (The
// card's `isolation: isolate` is what keeps this pair of z-indexes from meaning
// anything outside the card — see `.post-square`.)
.post-square > * {
  position: relative;
  z-index: 1;
}

// ── THE CAP (2026-08-07, user ask) ────────────────────────────────────────
// The card's FIRST strip now, standing over the byline: what the post is,
// what it came out of, what it is called.
//
// It is set in `--font-display` (NASALIZATION) — the first thing on this card
// to wear it. The face is the platform's display voice (the crown, the media
// windows' titles, the media tabs), and putting it on the strip that NAMES a
// post is what separates the name from the run of facts below it, where every
// line is either the body face or `mono`. It is a WIDE face, so everything
// here is dialled tight for it: `0.62em` with only `0.02em` of tracking (the
// `.nasalization` utility's own `0.05em` is meant for headings with room),
// and the strip stays one line at any width.
//
// GEOMETRY: the FACTS take everything the CONTROLS do not (2026-08-07, user
// ask). It was a 70/30 split, and 30% of a feed card is far more than three
// 20px glyphs need — the lane held its share whatever was in it, which was
// the point of stating it as a proportion, and the cost was a third of the
// strip standing empty beside a title that was ellipsizing. So the lane is
// `flex: 0 0 auto` (it measures its own buttons, and grows by exactly one
// button the day it gains one) and the fact cell is `flex: 1 1 auto` (it
// takes the remainder). The rule between them now stands where the controls
// begin rather than at a fixed fraction, which is the honest place for it:
// it divides what you READ from what you PRESS, and that boundary is wherever
// the pressing starts.
//
// `min-width: 0` stays on the fact cell — without it the long title inside
// would refuse to let the cell shrink and push the lane off the card (the
// flex-basis is a REQUEST, and content is what overrules it — see gotchas.md
// on the same failure in the byline).
//
// Rigid (`flex: 0 0 auto`), like every other strip on this card: the square
// ceiling takes its slack out of the pit alone.
.post-square__cap {
  display: flex;
  align-items: stretch;
  flex: 0 0 auto;
  min-width: 0;
  font-family: var(--font-display);
  font-size: 0.62em;
  letter-spacing: 0.02em;
  // The card's deepest ink, the same the trust chip is lettered in — this
  // strip is the post's NAME and belongs at that weight, not at the
  // byline's.
  color: var(--grey-9, #424242);
  // The cap draws NO closing line of its own — its edge is the flipped
  // `RgbHairline` element after it (2026-08-09, last ask of the divider
  // walk; a plain `--grey-6` border-bottom held the seam for the hours
  // between the band leaving for the foot and coming back mirrored).
}

.post-square__cap-main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  overflow: hidden;
  white-space: nowrap;
}

// The CONTROL lane, sized to exactly what it holds — its buttons' width plus
// its own padding, and not a pixel of the card beyond that. `0 0 auto` on
// both counts: it may not grow into the title's room, and it may not be
// squeezed by a long one either (the fact cell is the one that gives, which
// is why it carries the `min-width: 0` and this does not).
.post-square__cap-side {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 9px;

  // The lane's INNER rules (2026-08-09, user ask) — each control in a ruled
  // cell of its own. Same trick as `__byline-rule`: the lane centres its
  // children, so a rule must stretch and then win back the lane's own 2px
  // vertical padding to meet the strip's edges square. Keep the margin in
  // step with that padding.
  > .post-square__cap-rule {
    align-self: stretch;
    margin: -2px 0;
  }
}

// THE EXPAND LEAD (2026-08-09, user ask) — the cell at the card's far LEFT
// edge, holding the one control that acts on the STREAM around the card:
// the hash lens toggle (filter to this post's address, draw it full-height).
// The lane's own sizing rule and padding, mirrored at the other end: rigid
// both ways, one button wide, and the fact cell between the two stays the
// only thing that gives.
.post-square__cap-lead {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  padding: 2px 9px;
}

// The two controls. Chromeless by default — a glyph at the icons' own tone,
// with the box appearing only under the cursor: this strip is read far more
// often than it is pressed, and two outlined buttons at the top of every card
// would out-weigh the name beside them. The PIN adds a third state, `is-on`,
// which is the platform's own accent (the same one the media viewer's tack
// takes when a node is pinned) — a pin either is or is not, and that is worth
// a colour rather than a fill.
.post-square__cap-act {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--grey-8, #424242);
  cursor: pointer;
  text-decoration: none;
  transition: background 0.12s, color 0.12s;

  &:hover {
    background: rgba(var(--ink-rgb), 0.08);
    color: var(--grey-9, #424242);
  }

  &.is-on {
    color: var(--accent, #c79a00);
  }
}

// The split, drawn exactly like the byline's section rules — 1px of the
// card's one line ink, meeting the strip's edges square. No negative margin
// is needed (unlike `__byline-rule`) for the CAP-LEVEL rules: the cells carry
// the padding here, not the flex parent, so `align-self: stretch` already
// reaches both edges. The copies INSIDE the control lane (2026-08-09) are the
// exception — they live in a padded cell and take the stretch + negative
// margin override in `__cap-side` above.
.post-square__cap-rule {
  flex: 0 0 1px;
  width: 1px;
  background: var(--grey-6, #9e9e9e);
}

// The kind marks. One step under the ink — they classify, they do not name.
.post-square__cap-icons {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 1px;
  color: var(--grey-8, #424242);
}

// The origin clause — "Comment on <chip> ::". It shrinks BEFORE the title
// does (`flex: 0 1 auto` against the title's `1 1`), because a squeezed chip
// still states an address while a squeezed title stops being readable.
//
// ITS CEILING IS THE CHIP'S ROOM (2026-08-07). The chip states a NAME now,
// and a name is as long as someone made it, so the cap that used to sit on
// the chip in CHARACTERS sits on the clause as a FRACTION of the strip: the
// parent may take up to half of it, the card's own name keeps the rest, and
// which half wins never depends on how wide the card happens to be. (Two
// clauses would ask for 100% between them — flex shrink settles that, and in
// practice exactly one ever arrives: a comment carries no `forked_from_id`
// and a fork carries no PARENT.)
.post-square__cap-origin {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 50%;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
}

.post-square__cap-word {
  flex: 0 0 auto;
  opacity: 0.72;
}

// The chip sits at the strip's own scale rather than at MicroChip's default
// (which is sized against body text): `em` all the way down, so it tracks the
// cap's `0.62em` and not the card's.
//
// THE `max-width` WAS LOAD-BEARING WHILE THE CHIP PRINTED A HASH. MicroChip
// is built to be container-adaptive: given room it grows to the WHOLE hash,
// which is right in a foot with one chip in it and was wrong here — 64 mono
// characters swallowed the lane and left the post's own name as "post #…".
// So the cap held it to a 13ch slice.
//
// The chip states a NAME now (`is-named`, 2026-08-07), and that whole
// argument was about an ADDRESS: a truncated hash is still an address, and a
// truncated title is a truncated title. So the named chip is uncapped HERE
// and bounded one level up instead, by the clause's 50% (above) — it spreads
// to whatever the title needs and ellipsizes only when the strip runs out,
// which is the "let the chip spread" the ask names. The unnamed chip — a
// NODE parent, which has no title to show — keeps the slice it always had.
.post-square__cap-chip {
  flex: 0 1 auto;
  min-width: 7ch;
  max-width: 13ch;
  font-size: 0.92em;

  &.is-named {
    max-width: 100%;
    // A NAME, so it wears the strip's face and not the address one. The
    // `mono` on MicroChip's text span is right for a string read character
    // by character and wrong for the one word the clause is now saying —
    // and reaching in is safe here: this selector carries two classes and
    // the scope attribute against the component's own single class, so it
    // wins on specificity without `!important` (see NodeMini's chip block
    // for the case where that is not true).
    font-family: var(--font-display);
    letter-spacing: 0.02em;

    :deep(.micro-chip__hash) {
      font-family: var(--font-display);
      // Free to shrink past MicroChip's 6-character floor, which exists to
      // keep a hash slice legible. A title ellipsizes instead.
      min-width: 0;
      font-weight: 500;
    }
  }
}

.post-square__cap-sep {
  flex: 0 0 auto;
  opacity: 0.45;
}

// The post's name, taking all the slack and ellipsizing alone.
// ⚠ IT STEPS UP ON DESKTOP — see the media query directly below this rule.
.post-square__cap-title {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// ── THE NAME IS BIGGER ON DESKTOP (2026-08-10, user ask) ──────────────────
// The cap is a `0.62em` strip of chrome — a lane of icons, a provenance
// clause, three buttons — and the post's NAME has been reading at that size
// with everything else, which is right for chrome and wrong for the one thing
// in the strip a reader is actually looking for. `1.16em` OF THE CAP (≈0.72em
// of the card) lifts it a little over its neighbours without leaving the
// strip's register: still small, still uppercase-adjacent display type, just
// no longer one of the labels. It is the same move the byline's fold made when
// it had width to spend — the type steps up, the strip does not.
//
// DESKTOP ONLY, and `min-width: 1024px` is not a number of this component's
// own: it is FeedPage's desktop gate, the same one the byline reads, so the
// card keeps following the PAGE's word for desktop rather than inventing a
// second breakpoint. Under it the name stays flush with the rest of the lane,
// where the strip is tight enough that a bigger name would just ellipsize
// sooner — the cap's other two cells are rigid, so every point this takes
// comes out of the title's own `flex: 1 1 auto` slack.
//
// ⚠ It sits BELOW the base rule ON PURPOSE (see specs/gotchas.md): a media
// query adds no specificity, so written above it this block would lose to
// source order and do nothing at all. And it changes TYPE, not the strip: the
// cap's height is set by its 14px icon buttons and its padding, so the
// measured `CAP 24` in the media budget above holds at both widths (verified).
@media (min-width: 1024px) {
  .post-square__cap-title {
    font-size: 1.16em;
  }
}

// THE BYLINE BAND — the card's first strip, holding the author (2026-07-25).
//
// Rigid like the head and the foot: who published a post is not something the
// square ceiling may trim, so it stays out of the flex give-and-take and only
// the pit gives way.
//
// ITS BOTTOM BORDER IS A FRIEZE BAND NOW (2026-08-07, user ask). Until then it
// was an EDGE-TO-EDGE 1px hairline in `--grey-6`, the ink every line on this
// CARD is drawn in (its outer border, the pit's rim, the head's vertical rule)
// — a divider inside the card being the same line as the ones around it, at
// hairline weight. The band that replaced it is dialled to that exact tone, so
// nothing about that rule changed: the line simply gained height and a motif
// carved into it (see `.post-square__frieze`). Two `border-bottom`s went with
// the move, this one and the rail strip's, and the card's remaining lines are
// unaffected. The frieze lips shared the `--grey-6` level for one
// day in 2026-08-06's indigo; they are the plaque's own tone now and the card's
// lines are grey, so the two systems no longer meet anywhere.
// TWO RULED SIDES SINCE 2026-08-09's last byline ask — the band walked
// four arrangements in one day (ruled columns with title+open → two
// stacked dense lines → a one-line desktop fold → here) and settled as a
// SPLIT STAMP: the face and a two-line author block on the left (who over
// the bare relative age), a full-band seam rule, and the moment as two
// stacked MICRO CHIPS at the right end (date over city). The title plate
// and open-post control never came back (the CAP names the card; the
// flyout's links are the viewer door).
.post-square__byline {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 9px;
  flex: 0 0 auto;
  min-width: 0;
  // NASALIZATION across the whole section (2026-08-09, user ask) — the
  // cap's own face and tracking, one strip down: the band inherits it to
  // the name, the ago line, the trust/heat plates and (through the deep
  // rule on the chips) the moment strings. The `mono` utility came OFF the
  // handle and the two little plates in the template for exactly this —
  // a class on the element would beat inheritance.
  font-family: var(--font-display);
  letter-spacing: 0.02em;
}

// The face, hanging beside both lines — its own link to the profile (the
// name beside it is the other; same destination, two honest targets).
.post-square__face {
  flex: 0 0 auto;
  display: inline-flex;
  border-radius: var(--radius-sm, 0.5em);

  &:hover { outline: 1px solid rgba(0, 130, 156, 0.45); }
}

// The author block's two-line column. 1.15 leading and a 1px gap: at these
// sizes the pair has to read as ONE stamp — any more air and it breaks
// into two facts. `0 1 auto` and NOT a grower (2026-08-09, last
// arrangement): the seam rule to its right carries the `auto` margin that
// packs the chips at the band's end, and a flex-grow here would eat the
// free space before an auto margin sees any of it.
.post-square__byline-lines {
  flex: 0 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
  line-height: 1.15;
}

// The relative age under the author line — the stream's scan fact,
// extracted from the moment run with its icon left behind (the arrangement
// ask): under the name it reads as the stamp's quiet second line, and the
// PRECISE datetime is the chip across the rule.
//
// A ROW since 2026-08-10 (user ask), because the HOP CHIP now leads it:
// `[1 hop] · 3h ago`. The 0.62em deliberately does NOT live on this line but
// on its TEXT children: the hop chip is dialled in `em` against the BAND
// (0.58em, tuned there and unchanged by the move), and a size on the row
// would have compounded the two into 0.36em — the plate would have arrived
// at the new line two thirds of the size it left the old one.
.post-square__byline-ago {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  white-space: nowrap;
}

// The separator. One step quieter than the facts it stands between — it is
// punctuation, and it should be the last thing on this line the eye lands on.
.post-square__ago-dot {
  flex: 0 0 auto;
  font-size: 0.62em;
  font-weight: 700;
  color: rgba(var(--ink-rgb), 0.55);
  opacity: 0.5;
}

// The age itself gives before the chip does: a squeezed `3h ago` is still
// legible cut, where a hop plate cut in half states nothing at all.
.post-square__ago-text {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.62em;
  font-weight: 700;
  color: rgba(var(--ink-rgb), 0.55);
}

// Line one: the author and everything that qualifies them (badge, trust,
// heat). A flex row of rigid chips after one shrinkable link.
.post-square__byline-who {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
}

// ── THE CARD'S FRIEZE BAND (2026-08-07, user ask) ─────────────────────────
// The crown motif at the scale the floating media viewer runs it (`slim`,
// `--frieze-h / 2` ≈ 9.5px). It was born as a PAIR standing where the
// byline's and the rail strip's hairlines used to — one under the byline, one
// under the rail, the second `vflip`ped so the two reflected about the label
// lane instead of repeating — and the mirrored half went the same day (an
// `RgbHairline` took the rail's seam; the reflection argument moved with it).
//
// THE SURVIVOR MOVED UP on 2026-08-10 (user ask): it closes the CAP now, the
// card's first seam, where a flipped `RgbHairline` had been bracketing the
// foot's band. One motif on the card, on the seam a reader crosses first;
// every seam under it is a sandwich, all the same way up. `vflip` has no user
// on this surface any more.
//
// THE PLAQUE WALKED DOWN THE GREYS, one user ask a step: `--grey-6` (the card's
// line ink, which is what let the byline's hairline simply go — the band was
// that same line with height and a carve), then `--grey-7` ("one tone of grey
// darker"), then `--grey-8` here. Each step buys the same thing, and it is the
// carve rather than the tone: the waves are two very light accents, and a
// groove only reads as a groove when the plate is well under what is cut into
// it — 1.7:1 on -6, 2.2:1 on -7, 3.5:1 here.
//
// What the walk cost is the "the band IS the card's line, thickened" reading
// that justified deleting the hairline; two steps under that ink the band is
// its own object, a dark plate laid across the card. That is a fair trade at
// this size and it is why the plate reads as CHROME now — the same relation
// the feed container has with its own `--indigo-8` frieze edges, one family
// over. The card's own lines did not follow it down: they are `--grey-6`
// `--grey-6`, inner lines and outer edge alike — this plate is two steps under
// the card's own line ink and belongs to a different group (see
// `.post-square`).
//
// THE WAVE IS THE ONE THING HERE THAT IS NOT THE CARD'S OWN MATERIAL — a
// gradient down the motif between `--indigo-11` and `--teal-11`, the two
// families' A100 accents, through the `--frieze-bar-wave-two-paint` dial the bar
// grew the same day. Four notes on it:
//
//  · It is a PAINT, not a plaque: the mask means the ramp reaches the meander
//    and nothing else, so the plate stays flat `--grey-6` under it (which was
//    the ask — gradient on the pattern, background untouched).
//  · It spans the BAND, not the tile. Gradients have no intrinsic size, so one
//    ramp fills the whole strip however many times the 231px mask repeats
//    across it. Give the layer a `background-size` and you get one ramp per
//    tile, which reads as banding rather than as a run of colour.
//  · IT RUNS INDIGO-DOWN-TO-CYAN since 2026-08-10 (user ask, the same sitting
//    that gave the band its two rules) — the reverse of the way it was born,
//    and the reverse of the three rgb hairlines below it, which are cyan-down
//    to a one-band. That is not a break in grammar, it is the reason the flip
//    reads: the band and the hairlines are DIFFERENT DEVICES (a motif with
//    height vs three flat lines), and running the frieze against them makes
//    the pair of them read as a cyan LOW POINT at the card's reading area with
//    cold indigo closing it top and bottom. The card's one mirrored copy of
//    this band is long gone, so nothing has to be flipped in step.
//  · The mirrored bar used to REVERSE it, so indigo faced the lane from both
//    sides and mint faced out — the argument that made the pair read as one
//    figure with the rail inside it. That twin went on 2026-08-07 and this
//    band now carries the indigo-first end on its own.
//
// Accents at 1.5–2:1 on this plaque, deliberately: at `slim` size a wave the
// full contrast of a written line reads as a stripe, and these are decoration
// bracketing a tray of chips, not another rule the eye has to account for.
// `flex: 0 0 auto` is load-bearing (the bar states a height, but in this flex
// column an item that may shrink WILL — the pit is the only part that gives).
.post-square__frieze {
  flex: 0 0 auto;
  --frieze-bar-base: var(--grey-8, #616161);
  // TWO RULES, ONE ABOVE AND ONE BELOW (2026-08-10, user ask) — and they are
  // the CARD'S OWN LINE INK, `--grey-6`, not the plate's. That is the point of
  // them: the walk down the greys turned this band into its own dark object
  // laid across the card (see the note above), and an object wants an edge in
  // the same ink as every other line on the square — the outer border, the
  // byline hairline, the pit's frame. With them the plate is BOUND to the card
  // rather than floating on it, and the `--grey-8` plaque now reads as inset
  // between two of the card's lines instead of as a stripe that starts and
  // stops in mid-air. Same ink, lightest weight: 1px, where the card's edges
  // run 1.5px — this is a seam, not a boundary.
  //
  // ⚠ THE HEIGHT DIAL PAYS FOR THEM. Everything here is `border-box`, so a
  // border eats the plate rather than sitting outside it, and 2px off a ~10.4px
  // band is a motif row at ~0.65px — under the ~0.7px floor the note below
  // spends three paragraphs establishing. The `+ 2px` gives the rules their own
  // space and leaves the motif at exactly the height four user asks converged
  // on. Any future move of the `0.55` factor keeps that term.
  border-top: 1px solid var(--grey-6, #9e9e9e);
  border-bottom: 1px solid var(--grey-6, #9e9e9e);
  // `× 0.55` — ~10.4px at a 900px viewport, a shade over `slim`'s half.
  //
  // THIS DIAL WAS WALKED FOUR TIMES IN ONE DAY and the walk is the
  // documentation: `slim` (0.5) → `0.4` ("slightly thinner") → "too thin, I
  // cannot see the friezes well" → `0.65` → "thinner, but not so thin the
  // friezes get deformed" → here. The number that decides it is not the band's
  // height but the height of ONE MOTIF ROW: the masks are a 13-row grid, so
  // `0.4` put a row at ~0.54px, `slim` at ~0.67px, `0.65` at ~0.87px and this
  // at ~0.80px. Under ~0.7px the meander stops being a pattern and becomes a
  // texture — that is what "deformed" means in numbers, and it is the floor any
  // future ask on this line has to clear. The mask follows the box for free
  // (its fit is a percentage of it); the carve does not, its offsets being
  // absolute px, so trimming coarsens the groove relative to the strokes.
  //
  // `slim` stays on at this height: it is what drops layer one, and two
  // interlocking waves in 10px would go straight back to texture. KEEP THE
  // PIT'S MEDIA BUDGET IN STEP — it subtracts this band as
  // `0.55 × --frieze-h + 2px`, the `+ 2px` being the rules above.
  --frieze-bar-h: calc(var(--frieze-h) * 0.55 + 2px);
  // The flat tone under the paint — never seen while the gradient is drawn, and
  // stated anyway so a fallback lands in the same family rather than on the
  // component's default brown. It follows the ramp's TOP end, so it walked to
  // indigo with the 2026-08-10 flip.
  --frieze-bar-wave-two: var(--indigo-11, #8c9eff);
  --frieze-bar-wave-two-paint: linear-gradient(
    to bottom,
    var(--indigo-11, #8c9eff) 0%,
    var(--teal-11, #a7ffeb) 100%
  );
}

// ── THE CARD'S RGB PAIR (2026-08-09, last ask of the divider walk) ────────
// The band's history is the documentation. It started as the frieze pair's
// `vflip`ped half closing the label RAIL — same motif, gradient reversed,
// the two bands reflecting about the label lane. It became an `RgbHairline`
// in the same spot hours later: a `--grey-7` rule, a cyan→indigo band, a
// `--grey-7` rule — the same plate tone the frieze band stands on, so the
// card's two very different dividers are at least made of one grey. What
// that swap settled is that the card's full-bleed dividers stopped being
// the same device twice: a frieze band is a MOTIF and needs height to read
// (~0.8px a row is the floor, see the note above), while three flat lines
// read at any size. THEN it closed the new CAP (2026-08-07), went DOWN to
// open the FOOT (2026-08-09, a plain border holding the cap for hours), and
// the same day's last ask put a band at BOTH ends, the cap's FILLING FLIPPED
// so the pair read as a BRACKET rather than a repeat.
//
// THERE ARE THREE OF THEM NOW (2026-08-10, four asks across the day). Two
// were copied in — one under the byline, one under the label rail — and the
// old cap/foot bracket went when the FRIEZE took the cap's seam, taking the
// flipped `--cap` modifier with it: a mirror needs something to mirror, and
// the top of the card is a different device now. So the card reads
// cap │ FRIEZE │ byline │ rgb │ labels │ rgb │ pit │ rgb │ foot.
//
// THE BRACKET CAME BACK ONE SEAM LOWER, around the LABELS (the day's last
// ask). The two bands touching the label strip are a PAIR, `--rail`, and
// they are dialled together:
//
//   · `--flip` on the LOWER one reverses its filling — indigo up, cyan down —
//     so the two indigo ends face each other across the chips and the two
//     cyan ends face out. CSS cannot read a gradient backwards, which is why
//     a mirrored pair is two gradients and not one flag (the component says
//     so at length). The FOOT's band is the odd one out and stays base-
//     oriented: it closes the reading area, it is not half of anything.
//   · 1px BREAD on both, against the foot's 2px. The label strip is the
//     card's shortest band (21px) and it is now held between two rules; at
//     the component's default weight the three grey lines around 21px of
//     chips read heavier than the chips. Thinner bread also drops each band
//     6px → 4px, and the FILLING is untouched at 2px — the hue is the
//     bracket, and the component's own note puts 2px at the floor of where
//     a ramp still reads as a ramp rather than as a flat mix.
//
// KEEP THE PIT'S MEDIA BUDGET IN STEP: 4 + 4 + 6 = 14px of bands, the
// byline's and the foot's unconditional and the rail's travelling with the
// strip.
.post-square__hairline {
  min-width: 0;
}

.post-square__hairline--rail {
  --rgb-hairline-edge-h: 1px;
}

.post-square__hairline--flip {
  --rgb-hairline-fill: linear-gradient(
    to bottom,
    var(--indigo-11, #8c9eff),
    var(--cyan-11, #84ffff)
  );
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
// THE MOMENT'S CHIP STACK (2026-08-09, the last byline arrangement) — the
// band's right side: the detailed date on top, the city under it when the
// author shared one, each a real `MicroChip` addressing `moments/<id>`.
// Right-aligned (`flex-end`) so the two chips share the band's end edge
// and each hugs its own words; `flex: 0 0 auto` — the LEFT side is the one
// that gives, its 16ch caps doing the yielding.
.post-square__byline-when {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  min-width: 0;
}

// The chips at BAND density. MicroChip is sized against body text; these
// sit in a 40px band stating one resolved string each, so they compress:
// the cap's named-chip treatment (same two-class + scope specificity — no
// `!important`), one register smaller. `min-width: 0` on the hash span
// frees MicroChip's 6-character hash floor (these show STRINGS, not
// addresses — a date ellipsizing is a date, where a hash slice under 6 is
// noise); the caps clear the wider branch whole (27-char date / 19-char
// place) and stop a pathological place name from taking the band.
.post-square__moment-chip {
  font-size: 0.58em;
  max-width: 30ch;

  // These show resolved STRINGS, not addresses, so they letter in the
  // band's display face (2026-08-09, Nasalization ask) — the deep rule's
  // two classes + scope attribute beat the hash span's own `.mono`, the
  // cap's named-chip precedent exactly.
  :deep(.micro-chip__hash) {
    min-width: 0;
    font-weight: 500;
    font-family: var(--font-display);
    letter-spacing: 0.02em;
  }
}

// The byline's DESKTOP FOLD lives at the bottom of the byline family —
// after `.post-square__identity-handle` — because a media query adds no
// specificity: an override written ABOVE the base it overrides loses to
// source order, silently (measured: the identity bumps stayed 0.72em from
// this spot).

// THE TITLE PLATE AND THE OPEN-POST CONTROL ARE GONE (2026-08-09, user ask
// — `.post-square__name`, `__name-text`, `__go`, and the min-height ⇄
// line-clamp law the fsck static witness kept for the plate, retired with
// it in the same task). The title states itself in the CAP; the flyout's
// links are the viewer door; the flyout TOGGLE is the foot's chip.

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
  // 1440×900: 146px of card chrome (the CAP 24 — measured; a
  // one-line strip by construction, so a constant like the rest — + byline
  // 41 — measured on the SPLIT-STAMP arrangement, 2026-08-09's last: author
  // over ago │ two stacked moment chips; the day walked it 42 → 33 → 32 →
  // here, and 2026-08-10's hop-chip move traded a plate off the who line for
  // one on the ago line, leaving the worst case where it was — + rail strip
  // 24 — it was 42, went to 21 across 2026-08-10's run of rail asks (the
  // strip's vertical padding −12, the band's own vertical padding −8 once
  // the chips' rims became the only lane, the band's rim −3) and came part
  // way back: +3 when the chips became per-TREE bundles holding member
  // plates, +4 when the band's vertical padding returned at a thin 2px —
  // + foot 28 — was 30 until the same day's four-cell refit —
  // + margins 7 — the pit's own, halved from 13 on 2026-08-10 when the card
  // closed in on it (user ask); see the `margin` line below —
  // + borders 4 — 3 of the card's own 1.5px pair since
  // 2026-08-07, 1 of the pit's — + THREE rgb bands at 14: the byline's and
  // the rail's at FOUR each (1px bread, the label bracket) and the foot's at
  // six. The cap's band is not among them — the frieze closes that seam
  // since 2026-08-10, and a frieze is the variable term below, not a px one.
  // ⚠ 143 is MEASURED as `card − pit-outer − frieze` + the pit's own margin
  // (13px then, 7px since 2026-08-10), not summed from the parts: at 1.5px
  // borders and sub-pixel band heights the sum lands ~2px high), then
  // inside the pit 16px of padding,
  // ~70px of the Mini's own header and foot, ~21px of embed caption and
  // ~20px of block margin. Budget + all of that = the ceiling, which is the
  // point: a card holding one medium comes out exactly full, with nothing to
  // scroll for.
  //
  // THE FRIEZE BAND IS THE ONE PART OF THAT CHROME NOT IN THE CONSTANT
  // (2026-08-07): it stands at `0.55 × --frieze-h` (see `.post-square__frieze`),
  // a viewport-relative value, which cannot be folded into a px total and is
  // subtracted as itself — move that dial and move this factor with it. Its
  // TWO GREY-6 RULES (2026-08-10) are px, though, so THEY went into the
  // constant instead (280 → 282): only the variable term lives outside it.
  // The band's former mirrored twin is an `RgbHairline` now, at a flat 6px
  // (2px + 2px + 2px), and since 2026-08-10 there are THREE of those — 18px
  // in the constant. Two are unconditional (under the byline, over the foot);
  // the third closes the RAIL and rides its `v-if`. Worst case on purpose,
  // and the two conditionals travel together: a card with no labels draws
  // neither the strip nor its band and is that much to the good. The band
  // that used to close the cap is gone — THIS frieze took that seam.
  //
  // Keep it in step with the 60vh ceiling and with the Mini's chrome — grow
  // one without the other and you get either a player that needs a scroll or
  // a small player in a half-empty card. The 120px floor is for the narrowest
  // columns, where the subtraction would otherwise go negative.
  --media-max-h: max(120px, calc(min(var(--post-square-max, 100cqw), 60vh) - 276px - var(--frieze-h) * 0.55));

  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  font-size: 0.88em;
  color: var(--ink, #2C3D4E);
  word-break: break-word;
  line-height: 1.6;
  // The top margin is the gap to whatever line precedes it — since 2026-08-07
  // a FRIEZE BAND either way: the mirrored one closing the rail when the post
  // carries labels, the byline's own when it does not.
  //
  // THE CARD CLOSED IN ON THE PIT on 2026-08-10 (user ask, "reduce the padding
  // from the card around it"): `6px 7px 7px` → `3px 4px 4px`, roughly half on
  // every side. The margin is the card's own gap, not the pit's — the reading
  // area's breathing room is the `padding` on the next line and did NOT move,
  // which is the distinction that makes this cheap: what shrinks is the frame,
  // what the prose sits in is untouched. It reads as a bigger reading area on
  // an unchanged card, and it is the same move the well made when its side
  // padding went to a sliver — this surface keeps deciding that a card's job
  // is to BOUND the content, not to stand back from it. ⚠ 6px of vertical
  // margin left the card, so the media budget's constant follows: 282 → 276.
  margin: 3px 4px 4px;
  padding: 8px 10px;
  // LESS ROUNDED since 2026-08-10 (same ask): `7px` → `3px`. Seven was
  // `--radius-sm`, the platform's panel radius, which is right for a panel
  // FLOATING on a surface and wrong for a frame set INTO one — at the new
  // margin the pit sits nearly flush with the card's own corners, and a soft
  // radius that close to a crisp one reads as a mistake in the smaller box
  // rather than as a style. Three is the tightest step still visibly a curve
  // (it is the radius the scrollbar thumbs already run), so the pit reads as
  // cut into the card rather than laid on it — the same argument as its flat,
  // carve-free surface below.
  border-radius: 3px;
  // The pit's own two tones (2026-07-25): a `--grey-1` floor with the frame's
  // INNER border drawn around it in the card's line ink. The floor was a 5% ink
  // tint of whatever the card was, which made the pit a slightly darker patch
  // OF the card; a flat near-white is a different material set INTO it — the
  // one tone on this surface deliberately outside the container's colorway,
  // because everything else here IS the container and the reading area is not.
  // The line is the opposite move: it is the card's ONE line ink, the same the
  // OUTER border is drawn in, because every line on this card is one ink and
  // only the weight tells them apart — a rule that survived 2026-08-06 by a
  // hair, the box having spent part of that day split into a two-tone bevel.
  // The tone walked `--indigo-3` → `--indigo-4` → `--grey-5` → `--grey-6` →
  // back to `--indigo-4` across that day, and out of the colorway to `--grey-6`
  // for good on 2026-08-07; see `.post-square` for what each step settled, and
  // move all eight lines together or none of them (the outer edge left this ink
  // for an hour on 2026-08-07 and came back; the card's two DIVIDER PLATES,
  // -7 and -8, are a separate group and move on their own). The frieze bars drew
  // the container's side borders in that same -3 until 2026-08-05, so card edge
  // and box edge were literally one line; the bars' lip went neutral to the
  // point of invisibility the next day and now simply wears the plaque
  // (`--indigo-8`), so the card's edges are the only LINES on this surface at
  // all — what states the container's own edge is the bars' dark plate, not a
  // line. The floor stays near-white through all of it: it is the READING area,
  // and the one tone here that was never the container's.
  // EVEN on all four sides. It wore a heavier 2px top for one pass, matching
  // the rail's, and that reading does not carry down here: the rail is a
  // shallow tray and a lip suits it, while the pit is the READING area and
  // wants a plain frame — a weighted edge above the text reads as a rule the
  // prose hangs from. The heavy-top device stays the rail's alone.
  border: 1px solid var(--grey-6, #9e9e9e);
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
//   · The BOX is the card's third panel, rimmed 1px in the card's line ink
//     (`--grey-6`) like the pit below it and the title plate above, but floored
//     in the BED TONE (`--grey-4`, `--indigo-2` before 2026-08-07)
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
// The STRIP the rail sits in — a full-width band whose only job is the rail's
// insets since 2026-08-07. Its EDGE-TO-EDGE HAIRLINE became a divider drawn
// after it that day (a mirrored frieze band for a few hours, then an
// `RgbHairline`), that rule moved up to the cap by the end of it, and on
// 2026-08-10 a band came back below the strip — see the template. The rule
// that put the line AFTER the strip rather than on the rail is the one to
// keep: the rail is inset by this padding, so an edge drawn ON it would stop
// 7px short of each side, and a divider has to run lip to lip. The card is
// divided by full-bleed lines and panelled by inset boxes, and those are two
// different devices.
//
// PADDING ON ONE AXIS ONLY (2026-08-10, three asks). The SIDE `7px` is gone
// for good, and that was a real change of kind rather than a trade: the rail
// is not a panel set into the card any more, it is a STRIP spanning it, lip
// to lip like the cap and the foot — which is why the band's corners are
// square too (see `.post-square__rail`), a radius stating an inset there is
// no inset left to state.
//
// The VERTICAL `6px` is gone too, and did not come back HERE. It went when
// the `RgbHairline` pair arrived — 6px of air above and below was the whole
// lane while nothing was drawn in it, and two sandwiches took that lane's
// job. When the air was later asked for again it went INSIDE the grey band
// instead (`.post-square__rail`'s own padding), which is the difference this
// element exists to hold: padding HERE would put card between the rules and
// the band, so the band would float in a gap; padding THERE puts the band
// against the rules and gives the chips their room inside it. The strip is
// the card's row, the rail is the object standing in it.
//
// The strip element stays even with nothing left to declare: it is the
// full-bleed row the inset rail used to need, and the day a divider or a
// background comes back to this row, it belongs here and not on the
// scroller (the argument above).
.post-square__rail-strip {
  flex: 0 0 auto;
  min-width: 0;
}

.post-square__rail {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 4px;
  min-width: 0;
  // A HAIR OF VERTICAL PADDING (2026-08-10, and it took three asks to land).
  // It was `4px`, went to `0` on the ask that turned this tray into a band —
  // the chips are bordered plates with their own padding, so the lane
  // between a label and the band's edge was the plate's rim rather than
  // nothing, and the row did not read as crushed. Then the air was asked for
  // back, and twice more precisely: not on the strip around this element
  // (that would float the band in a gap between the rules — see
  // `.post-square__rail-strip`) and "waay thinner" than the 4px it started
  // at. `2px` is the answer to both: the plates clear the band's edges
  // without the band reopening as a tray.
  //
  // The 6px SIDE padding never moved — it is the run-in before the first
  // plate and the run-out after the last, and a scroller with no side lead
  // reads as content already cut off at rest.
  padding: 2px 6px;
  // NO BORDER AT ALL (2026-08-10, last of the rail asks). It carried an
  // uneven rim — 1px box, 2px top — the mirror of the card's own uneven
  // border, drawn so the tray read as something the band above sat down onto
  // rather than as a box floating in a gap. That reading is finished: there
  // is no gap left (the strip's padding went), the corners are square, and
  // the row is bounded on both sides by an `RgbHairline`. The rim was
  // outlining a panel that no longer exists, and beside two 6px sandwiches it
  // was a fourth and fifth line in three pixels of each other.
  //
  // What states the band now is its FLOOR, `--grey-7` (user ask, corrected
  // from -6 in the same breath): one step off the card's line ink and onto
  // the DIVIDER PLATE tone, the level the RgbHairline's bread and the frieze
  // band's plaque already stand on. The strip stopped being a panel and
  // became a full-bleed band — this is that reclassification stated in the
  // palette, and it puts all of the card's full-width figures on one plate.
  //
  // SQUARE, from the same run of asks — the radius was `7px`, what every
  // inset box on this card wears (pit, chips). A rounded corner on a
  // full-bleed row rounds against the card's own edge and reads as a mistake.
  border: 0;
  border-radius: 0;
  // THE FLOOR IS THE BAND (2026-08-10) — with no rim left it is the only
  // thing stating this strip at all, and it walked the greys across that
  // day's asks: `--grey-4`, the BED tone it had worn since 2026-08-07 (and
  // `--indigo-2` before that under the indigo bed) — "a tray recessed into
  // the card" — then -6, then -7 while it still had a rim, back to -6 when
  // the rim went, down to -8, and **back to -6, where it rests**.
  //
  // The walk tried all three levels a full-bleed figure could stand on and
  // came back to the shallowest. -7 is the DIVIDER PLATE (the RgbHairline's
  // bread) and -8 the FRIEZE BAND's plaque — both read as CHROME, which is
  // right for a plate the card is BUILT from and wrong for one it CLASSIFIES
  // itself on: at those depths the strip stopped being part of the card and
  // became a fourth divider with chips lying on it. `--grey-6` was the card's
  // own LINE ink, so the band read as that rule given height and filled.
  //
  // ⚠ AND IT WENT ONE STEP SHALLOWER STILL, TO `--grey-4` (2026-08-10, user
  // ask) — which is not a new level on this row but the one it STARTED on,
  // the BED tone it wore from 2026-08-07 until that day's walk pushed it
  // down. So the walk closed a full circle: -4 → -6 → -7 → -6 → -8 → -6 →
  // -4. What the round trip settled is that every argument the walk made was
  // about DEPTH, and depth was the wrong axis: -6/-7/-8 differ only in how
  // much like chrome the band reads, and this row is the one thing on the
  // card that is neither chrome nor content but CLASSIFICATION. At -4 it is
  // the shallowest full-bleed figure on the square — lighter than the card's
  // own line ink rather than equal to it — so the strip stops competing with
  // the rules that bracket it and reads as a shelf the chips stand on.
  //
  // ⚠ IT IS ALSO THE FEED BED'S OWN TONE, the plate the whole field of cards
  // sits on (see `--grey-4` in `_tokens.scss`). That is the one thing to
  // weigh if this moves again: the band is now a window through the card to
  // the surface underneath it, which is a real reading and the reason the row
  // wore this level first — but it does mean card and field share a tone at
  // exactly one place, and that place is between two rgb rules.
  //
  // The chips carry the contrast either way: each is a near-white plate with
  // its own rim, well up from the band at any of these levels, so the
  // classification stands OUT of the strip instead of sitting in it — and
  // their gradient foot is the only hue in it.
  background: var(--grey-4, #e0e0e0);
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
// ── THE BUNDLE (2026-08-10, user ask) — one plate per label TREE ───────
// The rail used to hold one plate per label PATH, each spelling its whole
// chain, so a post classified twice under one root printed that root twice.
// The plate is per-ROOT now: the tree is stated once at its left edge and
// every label of that tree lies to the right of it, spelling only the tail.
//
// THE CHROME DID NOT CHANGE, IT MOVED. Everything below — the cream coat,
// the `--indigo-1` half-pixel rim, the 4px corners, the `overflow: hidden`
// that makes those corners clip — was `.post-square__label`'s until this
// pass, and the walk that arrived at each dial is worth keeping:
//
//   · THE COAT is `--light-cream`, the tone the post square ITSELF wears. It
//     reached here through `--grey-3` (its level since the card went neutral
//     on 2026-08-07) → `--deep-purple-1` → `--indigo-1` in one afternoon.
//     The old rule was CHIP-ON-TRAY RESTATING CARD-ON-BED one level down,
//     and it broke when the tray became a `--grey-6` band — the step widened
//     from one level to three and "one level down" stopped describing
//     anything. What replaces it is stronger: the plate is not a step off
//     its tray, it is the CARD'S OWN MATERIAL lying in a band cut through
//     the card. Coat and card are one sheet; the strip is the hole. Warmth
//     is what makes that read — the band, the card's lines, the pit and the
//     foot are all neutral, so these are the rail's one warm object and they
//     are warm BECAUSE the card is. (Each tint it passed through made the
//     rail the one band with a hue of its OWN, which is exactly what made
//     them read as tags rather than as paper.)
//   · THE RIM is `--indigo-1` at `0.5px`, the end of a walk that ran the
//     greys all the way up (-7 → -6 → -5 → -4 → -3 → -2) and then stepped
//     off them. At -6 it was exactly the tone of the band underneath and did
//     nothing at all; by -2 it had stopped being an outline and become a
//     HIGHLIGHT — a lit lip catching the plate's edge against the mid-grey
//     strip, the opposite device from where the walk began. Indigo-50 keeps
//     that register and adds what no neutral could: a COOL edge on a warm
//     sheet, so the outline is stated by hue as well as by lightness.
//     Sub-pixel because 1px is not the thinnest register available and the
//     platform already writes in that one (the cap title's
//     `-webkit-text-stroke: 0.35px`); a non-zero border width is always
//     painted, so it cannot vanish.
//   · 4px CORNERS, down from 7 — this is one of the last inset boxes on a
//     card whose bands all went square, and at 7px on a 17px plate the
//     corners curved more than the shape has height for.
//   · NO SHADOW. One rode here for a few minutes (`0 1px 1px` at 22%) and
//     came off on the next ask. ⚠ The constraint is worth keeping if one is
//     ever wanted again, because it is geometry and not taste: the rail has
//     no vertical padding and `overflow-y: hidden` (a horizontal scroller
//     cannot leave the other axis visible), so the plate has ~2px of
//     centring clearance and anything painted past it is CLIPPED FLAT, which
//     reads as a smudge and not as depth.
//
// ⚠ AND A LESSON FROM A DIAL THAT IS GONE (gotchas.md has it): the plate's
// foot was briefly an `--indigo-11` → `--deep-purple-11` gradient, and a
// gradient cannot be painted on ONE border edge as a `bottom / 100% Npx`
// strip — `border-radius` clips the rectangle and the colour dies before the
// corners. The way that works is a full border-box background layer with the
// COAT clipped to `padding-box`, so what shows of the gradient is the border
// RING and it follows the radius the way a real border does.
//
// No padding of its own beyond a hair: the members carry their own, and the
// plate is a holder.
.post-square__bundle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  // Natural width, never squeezed (2026-07-25): inside a horizontal scroller
  // a shrinkable plate would compress to fit the visible box and there would
  // be nothing to scroll — the point is that the rail runs PAST its own
  // right edge.
  flex: 0 0 auto;
  padding: 1.5px 4px;
  // `1px` (2026-08-10, two "thicker" asks: 0.5 → 0.75 → here). The point of
  // the change is the DIFFERENCE, not the weight — the members' rims stayed
  // at `0.5px`, so the plate's edge is now twice its members' and the two
  // tiers stop reading as one line drawn twice.
  //
  // ⚠ It leaves the sub-pixel register the rest of this rail is drawn in,
  // and that is the trade to know: at 0.5 a rim is a HIGHLIGHT (a lit lip
  // catching an edge, which is why the walk up the greys ended on a tone
  // one step off white); at a full pixel it is closer to an OUTLINE, and it
  // is the tone's paleness that keeps it from stating itself as a drawn
  // line. Go heavier than this and the tone has to come up with it, or the
  // plate gains a border it never wanted.
  //
  // ONE STEP DEEPER, `--indigo-2` (2026-08-10, user ask) — and the step is
  // exactly what the note above says a heavier rim needs. The `1px` weight
  // landed two asks before this one and pushed the line out of the highlight
  // register; at indigo-50 it was pale enough to get away with, which is
  // what that ⚠ was about, but it was the palest thing the level could do
  // rather than a tone chosen for the weight. At -2 the lip has enough
  // colour to read AS a lip at a full pixel — still one of the two palest
  // steps the family has, still no contest with the member tokens' ink, and
  // now the one COOL edge on a plate whose coat and band are both neutral.
  // It also opens the gap to the grey ring outside it (below): a highlight
  // and an outline want to be told apart, and at -1 the pair were close to
  // one line drawn twice in two greys.
  border: 1px solid var(--indigo-2, #c5cae9);
  // ── A SECOND EDGE, OUTSIDE THE FIRST (2026-08-10, user ask) ─────────────
  // The plate wears TWO rims now: the `--indigo-1` highlight above, and a
  // `0.5px --grey-7` ring hugging it. They do different jobs, which is the
  // only reason two lines on one small object is not a mistake. The indigo
  // is a HIGHLIGHT — one step off white, lit, stating the plate's lip against
  // its own coat — and it has never been able to state the plate against the
  // BAND, because the band is grey and the lip is nearly white: at `--grey-6`
  // that read as contrast enough, and now that the rail floor has gone up to
  // `--grey-4` (see `.post-square__rail`) the pale rim has even less to push
  // against. The grey ring is the OUTLINE the highlight cannot be: -7 is the
  // divider-plate tone, well under both the band and the plate's own -3 coat,
  // so it draws the plate's actual boundary while the indigo keeps lighting
  // its edge. Read outward the stack is coat → lit lip → drawn edge → band.
  //
  // It is a `box-shadow` RING and not a second border or an `outline`, for
  // three reasons: it costs no layout (a border would grow the plate and the
  // rail's measured 24px with it), it follows the `4px` radius exactly the
  // way a real border does, and — unlike `outline` — it is not the focus
  // ring, which this component may still want for a keyboard user.
  // ⚠ `overflow: hidden` below does NOT clip it: an element's own overflow
  // clips its CONTENT, never a shadow painted outside its border box.
  box-shadow: 0 0 0 0.5px var(--grey-7, #757575);
  border-radius: 4px;
  overflow: hidden;
  // ⚠ NEUTRAL AGAIN (2026-08-10) — `--grey-3`, off the `--light-cream` it
  // wore for the length of the bundling pass. The cream's argument was that
  // the plate IS the card's own material lying in a band cut through the
  // card, which made it the rail's one warm object; what that cost is
  // legibility of the TIERS, because the members are greys and a warm sheet
  // under cool tokens states hue where the arrangement wants to state depth.
  // At -3 the plate is one step off its members' -2 and three off the band's
  // -6, so the rail reads as three tones of one material — band, sheet,
  // token — which is what a two-tier stack is for. The card's warmth stays
  // the CARD's, which is arguably where it belonged.
  background: var(--grey-3, #eeeeee);

  // ── THE PLATE'S HOVER ──────────────────────────────────────────────
  // Two dials, and the ask that set them is precise about what NOT to do:
  // the coat goes `--grey-2`, not the `--deep-purple-1` it took while this
  // chrome belonged to a single chip. A plate that turns lilac under the
  // pointer states a SELECTION, and this one is a container — what it should
  // say is "you are in here", which is a step of tone, not a change of hue.
  // The rim keeps the accent, so the colour on the state is on the EDGE.
  //
  // ⚠ At `--grey-2` the coat meets its own members' tone (they are -2 as
  // well), so on hover the plate and the tokens on it flatten into one field
  // and the `--grey-4` rims are what still tell them apart. That is the
  // ask's arithmetic, not an oversight — it reads as the sheet lifting to
  // meet what lies on it.
  &:hover {
    background: var(--grey-2, #f5f5f5);
    border-color: var(--deep-purple-11, #b388ff);

    // THE ROOT'S SIDE ANSWERS TOGETHER — the mark and the `::` seam, both to
    // `--indigo-8` (2026-08-10). They are one utterance ("this tree, then:")
    // and they share a tone at rest (`--grey-8`), so they share one under
    // the pointer too; splitting them would make the seam read as part of
    // the member list instead. The tone walked `--indigo-11` → `--indigo-2`
    // → here across three asks, and the shape of that walk is the mark's own
    // resting walk repeated: pale accents looked like a wash on a drawing
    // whose mass is STROKE, and it wanted ink. -8 rather than the label
    // ink's -9 for the same reason the filter glyph takes -8 — a mark at
    // this size wants the step the text does not need.
    .post-square__label-mark { background-color: var(--indigo-8, #303f9f); }
    .post-square__bundle-sep { color: var(--indigo-8, #303f9f); }
  }
}

// THE SEAM between the tree and its labels — `::`, the card's own separator
// for "this term qualifies the next" (the CAP's origin clause and the FOOT's
// `post :: skeleton :: <hash>` chip both use it). It takes the MARK's tone
// rather than the labels' ink, because it belongs to the root's side of the
// plate: mark and seam are one utterance, and the members answer it.
.post-square__bundle-sep {
  flex: 0 0 auto;
  font-size: 0.62em;
  letter-spacing: 0.03em;
  // PULLED IN ON BOTH SIDES (2026-08-10, user ask). The plate's 4px flex gap
  // is right between the MARK and a member plate, and too much around two
  // colons: punctuation is not an object in the row, it is the joint between
  // two, and a joint set at the row's own rhythm reads as a third item. -2px
  // a side halves the gap to 2px and the seam closes up against what it
  // joins. (It is also why the tracking below is left alone — `0.03em`
  // spaces the two colons from each OTHER, which is the rail's letterform
  // rhythm and belongs.)
  margin: 0 -2px;
  // BOLD, and `--grey-9` with the mark (2026-08-10, same ask). Two colons
  // are four dots of ink; at 8.7em-scaled mono in a normal weight they were
  // the faintest thing on a plate that had just gone neutral, and the seam
  // has to hold its own against a 26px drawing on one side and a bordered
  // plate on the other. Weight is the cheap dial for that — it costs no
  // space, where a size bump would push both neighbours apart.
  font-weight: 700;
  color: var(--grey-9, #424242);
}

// THE ROOT CELL — the tree, stated once, at the plate's left edge: its mark
// when the registry has one, its name when it does not.
.post-square__bundle-root {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  // TRIMMED AT THE LEFT, THEN GIVEN A LITTLE BACK (2026-08-10, two asks).
  // The mark already returns its own transparent margin (see
  // `.post-square__label-mark`), so what stood on this side was the plate's
  // full 4px of padding against a drawing that begins at its box edge — a
  // mark is not TEXT and does not want a text's lead-in. `-3px` cut it to
  // one, which read as the planet falling off the plate's left rim; `-1px`
  // is the settled value, a 3px lead that is clearly deliberate air rather
  // than leftover padding. The members keep the full 4px — they are plates
  // in their own right and do want the inset.
  margin-left: -1px;
  font-size: 0.62em;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: rgba(var(--ink-rgb), 0.62);
}

// A MEMBER — one label of the tree, as a plate of its own (2026-08-10, the
// follow-on ask). Which makes the rail two TIERS, and that is the whole
// point of bundling: a warm sheet per tree, cool tokens lying on it. It is
// also why the members carry no hairline between them the way the CAP's and
// the FOOT's cells do — a rule and a rim inside the same three pixels would
// be one seam drawn twice.
//
// `--grey-2` on a `--grey-5` rim, after a three-ask walk (-2 on -4, then -4
// on -1, then here) that tried the pairing both ways up and settled on the
// conventional one: a PALE coat closed by a DARKER rim. The inverted setting
// — a mid coat with a lit lip, echoing the plate's own `--indigo-1`
// highlight one tier up — is a real device and it is why the walk happened,
// but it made every member as heavy as the sheet holding it, and this tier
// is meant to be the light one. At -2 on -5 the member is paler than the
// cream plate and its rim is the only drawn line in the pair, so the rail
// reads as tokens ON a sheet rather than as two competing surfaces.
//
// The rim keeps the plate's 0.5px sub-pixel register, and the padding is
// down to 3px on the same "denser" ask that unplaced the funnel.
.post-square__bundle-item {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  padding: 0 3px;
  border: 0.5px solid var(--grey-5, #bdbdbd);
  // AN INNER RING (2026-08-10, user ask) — the member's answer to the ring the
  // PLATE around it grew in the ask before, and the pair is what finally tells
  // the rail's two tiers apart. Every edge on this row had been a grey, so
  // depth was carrying a job it could not do at six steps and 0.5px; now there
  // is one COLOUR PER TIER — `--indigo-2` states the plate, `--deep-purple-2`
  // states its members — and a glance says which of the two nested boxes any
  // edge belongs to. Reading outward from here: ring → member border -5 →
  // plate coat -3 → plate border indigo-2 → plate ring -7 → band -4.
  //
  // ⚠ INSET, where the plate's ring is OUTSET, and that is not a style choice:
  // members sit flush against each other inside the plate, so a ring painted
  // outward would land on the next token's and read as one doubled line down
  // the row. Inside its own border it stays the member's own edge.
  //
  // `--deep-purple-2` did not exist before this ask — it is minted in
  // `_tokens.scss` beside the family's two hover tones, and it is the first
  // RESTING role deep purple has on this rail.
  box-shadow: inset 0 0 0 0.5px var(--deep-purple-2, #d1c4e9);
  border-radius: 3px;
  background: var(--grey-2, #f5f5f5);
}

// The label itself — a bare run of text inside its member plate. It held the
// chip chrome until the bundling pass; what is left here is the TYPE.
.post-square__label {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  // ⚠ THE MONO FACE IS DELIBERATE, AND IT WAS TESTED. The card letters in
  // `--font-display` everywhere else — cap, byline, foot, address chip — and
  // on 2026-08-10 this was taken there too (the `mono` utility off in the
  // template, `--font-display` here). It came back on the very next ask: "I
  // didn't like nasalization on them." Worth the lines, because the argument
  // FOR the swap is a good one and someone will make it again — the rail was
  // the one strip on a one-face card reading in another voice. The argument
  // against is what the eye found: a label PATH is a chain of IDENTIFIERS,
  // the exact thing a mono face exists for, and uppercase display type at
  // 8.7px turns that chain into a row of signage. The face is carried by the
  // `mono` CLASS in the template, not stated here — a class beats
  // inheritance, so moving this again means moving both places.
  font-size: 0.62em;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  text-decoration: none;
  // ONE TONE DARKER (2026-08-10, user ask): 0.5 → 0.62 on the ANCESTOR steps,
  // and the leaf follows 0.78 → 0.9 below so the pair keeps the ~0.28 spread
  // that is what makes a path read as "context › THING" rather than as one
  // grey run. Both are ink ALPHAS, not palette steps — this text has always
  // been dialled that way.
  color: rgba(var(--ink-rgb), 0.62);

  // The LABEL answers for itself, where the plate around it answers for the
  // tree: ink only, no coat of its own. `--indigo-9` is the same ink the
  // member took while it was a chip in its own right.
  &:hover { color: var(--indigo-9, #283593); }
}

.post-square__label-step {
  white-space: nowrap;
  // `inline-flex` since a step may hold a MARK instead of a word
  // (2026-08-10): an `<img>` is a replaced element and would sit on the
  // text baseline with a descender's worth of air under it. The `::before`
  // separator below is a flex child of this box either way, so it is
  // unaffected — it draws before whatever the step holds.
  display: inline-flex;
  align-items: center;

  & + &::before {
    content: '›';
    margin: 0 4px;
    opacity: 0.55;
  }

  &.is-leaf {
    font-weight: 700;
    // Moved with the ancestors' 0.5 → 0.62 (2026-08-10) — see the chip rule
    // for why the two travel together.
    color: rgba(var(--ink-rgb), 0.9);
  }
}

// THE ROOT MARK (2026-08-10, user ask) — a label tree's own icon, standing
// where its root's name would be spelt. Today that is one tree, PATHCHAIN,
// wearing the pathos mark the browser tab wears (`utils/labelRoots.js`).
//
// SIZED PAST ITS OWN SLOT (2026-08-10, four "bigger" asks: 11 → 15 → 20 → 24
// → 28). It began at 11px, matched to the chip's content box, and read small
// for two reasons that compound: an icon matched to a cap height always reads
// smaller than the letters beside it (a letterform's mass is its stroke, a
// mark's is its whole square), and this artwork was drawn for a browser tab,
// so it carries a wide transparent margin of its own — at 11px the PLANET
// itself was about 5px of that.
//
// So the image is drawn at 28px and pulled back to an 11px LAYOUT box with
// `margin: -8.5px 0`. Nothing around it moves at any step: the plate stays
// 20.03px and the rail 24px, so the pit's `--media-max-h` constant is
// untouched by this dial.
//
// ⚠ THE CEILING IS ~38px, AND IT IS ARITHMETIC — recompute it if the plate's
// height ever changes. The image overhangs the bundle's padding box (19.03px;
// what `overflow: hidden` clips to) by (S−19.03)/2 each way, and that cut is
// free only while it lands in the favicon's transparent margin. MEASURED off
// the artwork's alpha channel (48×48 canvas, ink box x 6→41 / y 14→35): the
// planet's pixels start 29.2% of the way down and end 25% up from the bottom,
// so the binding condition is (S−19.03)/2 ≤ 0.25·S, i.e. S ≤ ~38. At 28 there
// are 2.5px of slack on the tighter edge. (The ceiling was 32 while this sat
// in a 16px chip — it moved because the BOX moved, which is the point of
// writing the condition down rather than the number.) The planet is also only
// 46% of its canvas TALL, which is why a mark this size still reads as a
// small object: reason about the ink box, never the canvas.
//
// ITS COLOUR IS A MASK (2026-08-10, hover ask): the element paints a flat
// `background-color` clipped to the artwork's ALPHA, so the mark is whatever
// tone the state wants and the drawing is unchanged. That replaced a
// `filter: grayscale(1) brightness(0.55)` over an `<img>`, which got to the
// same grey by a longer road and could not be recoloured at all — a bitmap
// draws above its own background, so a tint sits under the original instead
// of replacing it.
//
// ⚠ THIS ONLY WORKS BECAUSE THE ALPHA IS THE DRAWING. Measured on the
// artwork: inside its ink box just 14% of pixels are fully opaque, 41% are
// partial and 45% clear — the planet is a LINE DRAWING whose strokes live in
// the alpha channel, so the silhouette is the picture and its soft edges
// survive. A mark drawn as a solid block with its detail in COLOUR would
// mask down to a filled blob; check the alpha before adding one to the
// registry.
//
// `--grey-8` at rest, after a two-ask walk -7 → -5 → here. -7 is where the
// old `grayscale(1) brightness(0.55)` filter chain had landed the artwork
// (cream → ≈#dcdcdc → ×0.55 ≈ #797979); -5 was the reasoning that a mark at
// 28px states itself by AREA and can afford to go quiet; -8 is the answer to
// what that actually looked like — at -5 the planet went thin and grey on a
// cream plate, and the drawing is a LINE work, so its mass is stroke and it
// needs ink the way the letters beside it do. It shares the tone with the
// `::` seam (same ask), which is the pairing that matters: mark and seam are
// the root's side of the plate speaking, and both now sit a step DEEPER than
// the members' `rgba(ink, .62)` — the tree is stated more firmly than the
// labels it holds, which is the reverse of the earlier reasoning and the one
// the eye preferred. It stays a NEUTRAL either way: the rail's one hue is
// the cream plate, never a badge repeated on every plumbing bundle.
.post-square__label-mark {
  display: block;
  width: 26px;
  height: 26px;
  // ⚠ THE HORIZONTAL PULL IS THE ARTWORK'S OWN MARGIN, GIVEN BACK
  // (2026-08-10, "there's too much padding between the planet and the ::").
  // The gap that reads on screen is never just the flex gap: this favicon's
  // ink box is x 6→41 of a 48px canvas, so 12.5% of every edge is empty
  // artwork — 3.5px a side at 28px — and it stacks on top of the 4px the
  // plate puts between its cells, making the seam sit ~7.5px from a planet
  // that looks like it ends 4px earlier. `-3.5px` on each side shrinks the
  // LAYOUT box to the ink box (28 − 7 = 21px, which is the measured ink
  // width of 0.75 × 28), so the plate's gap is measured from the drawing
  // rather than from its packaging. Keep the two numbers in step: this is
  // `size × 0.125`, and it changes whenever the size does.
  margin: -7.5px -3.25px;
  background-color: var(--grey-9, #424242);
  // `--label-mark-src` comes down from the registry, per root, inline.
  -webkit-mask: var(--label-mark-src) center / contain no-repeat;
  mask: var(--label-mark-src) center / contain no-repeat;
}

// Its HOVER tone lives with the plate (`.post-square__bundle:hover`) — the
// mark states the TREE, so it answers when the pointer is anywhere in the
// tree's plate, not only when it is over one of the labels.

// The leaf takes the hover ink too (2026-08-10) — it carries its own resting
// colour, so without this it would sit at `rgba(ink, .9)` while every
// ancestor step around it turned indigo, and the one word the chip is
// actually naming would be the one that did not answer.
.post-square__label:hover .post-square__label-step.is-leaf { color: var(--indigo-9, #283593); }

// The chip's FUNNEL (2026-08-01) — the second door into the label lens:
// filter the stream by this chip without leaving the feed. Hover-revealed
// (the rail is a hover surface already; touch has the head band's picker),
// and pulled against its chip's gap so the pair reads as one unit.
.post-square__label-filter {
  flex: 0 0 auto;
  border: 0;
  background: transparent;
  color: rgba(var(--ink-rgb), 0.45);
  padding: 0;
  // ⚠ `inline-flex` + `line-height: 1` ARE LOAD-BEARING, not tidiness. As a
  // default `inline-block` button the glyph sat on a text baseline and the
  // button measured ~22px for an 11px icon — which cost nothing while this
  // stood OUTSIDE the chip as a sibling in the rail, and drove the whole
  // strip's height the moment the 2026-08-10 bundling moved it INSIDE a
  // member plate (rail 21 → 28px, measured). Flex + a unit line-height makes
  // the box the icon.
  display: inline-flex;
  align-items: center;
  line-height: 1;
  // ⚠ IT TAKES NO WIDTH WHILE HIDDEN (2026-08-10, "remove the ghost padding
  // on their right side, we want them denser"). It was `opacity: 0` alone,
  // which hides a control without UNPLACING it — 11px of icon plus its gap
  // sat inside every member as dead space that looked like slack padding.
  // Collapsing the WIDTH is what removes it, and the reveal stays honest
  // because the trigger is unchanged: `.post-square__rail:hover` opens EVERY
  // funnel at once, so the strip shifts once as a whole rather than each
  // member twitching under its own pointer.
  width: 0;
  margin-left: 0;
  overflow: hidden;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.12s, width 0.12s, margin-left 0.12s;

  .post-square__rail:hover & {
    opacity: 0.6;
    width: 11px;
    margin-left: 2px;
  }
  // `--indigo-8` under the pointer (2026-08-10, user ask), not the
  // hard-coded `#00829c` teal it answered with for a year. That teal is the
  // platform's generic interactive tone and it was the last of it left in
  // this rail — the plate hovers `--deep-purple-11`, the label ink hovers
  // `--indigo-9`, the tree's mark hovers `--indigo-2`. A control that lit up
  // in a family nothing around it speaks read as borrowed from another
  // surface. -8 rather than the label's -9: this is a GLYPH at 11px, and a
  // mark that small wants the step the text does not need.
  &:hover { opacity: 1 !important; color: var(--indigo-8, #303f9f); }
}

// The ORIGIN row — author, post hash, tallies. Rigid: it is the last thing a
// square may give up, so it never enters the flex give-and-take above.
// NASALIZATION on the STRIP (2026-08-10, third ask), not only on the two
// things in it that letter today: the tallies carry it themselves and the
// chip overrides `mono` deeply, so this declaration changes nothing on screen
// right now — it is here so the next thing written into the foot inherits the
// card's face instead of the app's body font, which is how the strip drifted
// into Space Mono in the first place.
//
// RULED IN FOUR CELLS since 2026-08-10 (user ask) — the CAP's arrangement at
// the card's other end, so the square opens and closes in the same grammar:
// `align-items: stretch` and NO padding of its own, because a rule that is
// meant to meet both edges of the strip square cannot do it from inside a
// padded parent (the cap learned this; each CELL carries the padding here,
// which is also why these rules need no negative margin the way
// `__byline-rule` does). The old row — chip, `q-space`, three tallies, all in
// one 8px-gapped line with `padding: 5px 9px 7px` — is what those cells
// replace.
.post-square__foot {
  display: flex;
  align-items: stretch;
  min-width: 0;
  flex: 0 0 auto;
  font-family: var(--font-display);
  letter-spacing: 0.02em;
}

// The seam. Same 1px of the card's one line ink as `__cap-rule`, and
// deliberately a SEPARATE token: the two strips are dialled independently
// (the cap's cells are 2–4px tall inside, the foot's up to 7), and one class
// serving both would make every future tweak to either a shared decision.
.post-square__foot-rule {
  flex: 0 0 1px;
  width: 1px;
  background: var(--grey-6, #9e9e9e);
}

// THE REFERENCES CELL, at the far LEFT edge — one control, rigid, the mirror
// of the cap's expand lead at the other end of the card.
.post-square__foot-lead {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  padding: 4px 8px;
}

// THE ADDRESS CELL — the only one that gives. `min-width: 0` is what lets the
// chip's hash ellipsize instead of pushing the three rigid cells off the card
// (a flex-basis is a request; content overrules it — gotchas.md).
.post-square__foot-main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  overflow: hidden;
}

// THE TALLY CELL — comments and forks, measured by what it holds.
.post-square__foot-side {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 9px;
}

// THE VOTES CELL, closing the strip at the far RIGHT edge — a COLUMN, up over
// down. Its rows are tighter than the strip's other text (`line-height: 1.15`)
// so two of them stand in about the height one tally row did: the foot is a
// rigid strip on a square-ceilinged card, and every pixel it grows comes out
// of the pit's reading room.
.post-square__votes {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1px;
  padding: 3px 9px;

  .post-square__stat { line-height: 1.15; }
}

// The foot's own controls — the references button and the copy. Chromeless
// until hovered, exactly as the cap's `__cap-act`: this strip is read far
// more often than it is pressed. A SEPARATE class from the cap's for the
// reason `__foot-rule` is separate, and one register smaller (18px against
// 20px) — the foot's type is smaller than the cap's, and a button drawn to
// the cap's size stood taller than the chip it sits beside.
.post-square__foot-act {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  padding: 0;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--grey-8, #424242);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;

  &:hover {
    background: rgba(var(--ink-rgb), 0.08);
    color: var(--grey-9, #424242);
  }

  // Two different meanings, one dial. On REFERENCES it is a held state — the
  // flyout is open on this card — and takes the platform accent the cap's pin
  // takes. On COPY it is a 1.6s receipt beside a `check` glyph, and the same
  // colour reads as "that worked" rather than "this is on".
  &.is-on {
    color: var(--accent, #c79a00);
  }
}

// The foot chip as a DOOR (2026-08-10, user ask; it was a trigger-span from
// 2026-07-26 and its `.is-open` lit state went with the flyout press). As a
// router-link it gets `.micro-chip.is-link`'s cursor and hover for free — but
// that hover is ink-toned, and this chip has worn the platform's cyan since
// the day it was born. Nested under the foot so the restatement outranks it
// (`.post-square__foot[data-v] .post-square__chip:hover` = four selectors
// against the component's three) instead of racing it on bundle order.
//
// NASALIZATION, like the cap and the byline above it (the card is set in its
// display face top to bottom now, and the foot was the last strip still
// lettering in Space Mono). Both text spans carry the `mono` UTILITY class,
// which a font-family on the chip would lose to at equal specificity — so
// both are reached deeply, the move `.post-square__cap-chip.is-named` and
// `.post-square__moment-chip` each make one strip up. Those two switched
// face because they show STRINGS rather than addresses; this one shows an
// address and switches anyway, because the ask is the CARD's face, and a
// chip in two typefaces would state the seam between the word and the hash
// louder than the `::` already does.
.post-square__foot .post-square__chip {
  font-family: var(--font-display);
  letter-spacing: 0.02em;

  :deep(.micro-chip__type),
  :deep(.micro-chip__hash) { font-family: var(--font-display); }

  // `::` is punctuation the eye should pass over, but MicroChip's 0.35 was
  // dialled for a single `/`; a doubled glyph at that opacity reads as dirt.
  :deep(.micro-chip__sep) { opacity: 0.5; }

  &:hover {
    background: rgba(0, 130, 156, 0.10);
    border-color: rgba(0, 130, 156, 0.4);
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
// The name + handle, INLINE on the who-line since 2026-08-09 (they stacked
// as the block's own two lines while the band ran in columns; the STACK is
// the whole band now, and this pair is its first line). One link to the
// profile — the face beside it is the other, same destination.
//
// THE SQUEEZE ORDER IS THE HANDLE'S, NOT THE NAME'S (2026-08-10, user ask —
// "the main name must not get trimmed, trim the @handle instead"). Both spans
// carried a `16ch` cap and the default `flex-shrink: 1`, so a narrow card
// took the two down TOGETHER, in proportion to their widths — on a phone that
// produced `Dream Ope… @dreamo…`, the name unreadable to save an address
// nobody reads off a card. The pair now shrinks in a stated order (see the
// two rules below), and `overflow: hidden` here is what makes that order
// enforceable: the name's `flex-shrink: 0` means the link's content can
// exceed the link, and without a clip that overrun would push the badge and
// the heat chip off the card instead of stopping at the name.
.post-square__identity {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-decoration: none;
  color: inherit;

  // BOTH LINES LIGHT AS ONE (2026-08-09, user ask) — `--cyan-14`, the
  // cyan family's A700, on the name AND the handle together. They are one
  // link to one place, and lighting only the name (the old `#00829c` +
  // 70%-alpha pair) made the hover look like two targets in a row. The
  // resting name is `--cyan-9`, four steps deeper in the same family, so
  // this reads as a LIFT along one hue rather than a swap between two.
  &:hover .post-square__identity-name,
  &:hover .post-square__identity-handle { color: var(--cyan-14, #00b8d4); }
}

// The org badge belongs to the identity beside it, not to the band — pulled
// in against the band's 8px rhythm so the pair reads as one unit ("this
// person, publishing there") instead of as a second item in the strip. The
// class sits on OrgLogoChip's ROOT element, which carries this component's
// scope attribute, so no :deep() is needed.
.post-square__byline .org-logo-chip {
  margin-left: -3px;
}

// TRUST CHIP (Thread J) — invite-chain distance. Drawn as a tiny plate in
// the card's own recipe: `--grey-1` floor, the line ink as its rim, the
// card's darkest ink for the lettering — all three following the card into
// the greys on 2026-08-07. Zero hops ("you") stays quiet; the tooltip walks
// the whole vouch path.
//
// It sat on the WHO line beside the org badge until 2026-08-10, sharing that
// line's pulled-in `-3px` and its "belongs to the identity" argument. It
// LEADS THE AGO LINE now (user ask) — see the template — so the negative
// margin is gone with the run it was closing up: this chip is the first
// thing on its line, and there is nothing to its left to hug.
.post-square__trust {
  flex: 0 0 auto;
  font-size: 0.58em;
  font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;
  color: var(--grey-9, #424242);
  background: var(--grey-1, #fafafa);
  border: 1px solid var(--grey-6, #9e9e9e);
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

// THE NAME IS THE LAST THING TO GIVE (2026-08-10, user ask). `flex-shrink: 0`
// takes it out of the squeeze entirely — every pixel the line is short comes
// out of the handle beside it — and its old `16ch` cap is replaced by
// `max-width: 100%`, which is the line ITSELF: the name ellipsizes only once
// the handle has gone to nothing and the whole link is narrower than the name
// alone, which on a phone means a name of about twenty characters or more.
// (`16ch` was the cap that trimmed `Dream Operator` on a card wide enough to
// print it — a fixed cap cannot know how much room the line actually has.)
.post-square__identity-name {
  flex: 0 0 auto;
  font-size: 0.72em;
  font-weight: 700;
  // CYAN since 2026-08-09 (user ask) — `--cyan-9`, Material 800, minted
  // for this. It replaces a hard-coded `#4f3e98` purple that belonged to
  // no family on this platform, and it makes the byline the card's ONE
  // coloured voice: cap, rail, pit and foot are all neutral now, so the
  // author's name is the only thing on a post square stating a hue in
  // TEXT. Deep end of the family on purpose — the pointer takes it up to
  // `--cyan-14`, and a resting tone must be the one you can read.
  color: var(--cyan-9, #00838f);
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// The handle is the address you can type back — quieter, riding the
// name's baseline (in the band's display face since the Nasalization ask;
// its `mono` went with it).
//
// AND IT IS THE ONE THAT ABSORBS (2026-08-10, user ask): `min-width: 0` frees
// it to shrink all the way to `@…` and then out of sight, so the name above
// it never has to. It keeps a `16ch` ceiling for the opposite case — a wide
// card and a long handle, where the name is safe and the address is simply
// longer than the line wants to spend on it.
.post-square__identity-handle {
  flex: 0 1 auto;
  min-width: 0;
  font-size: 0.6em;
  color: rgba(var(--ink-rgb), 0.5);
  max-width: 16ch;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// ── ONE LINE ON DESKTOP (2026-08-09, user ask) ────────────────────────────
// The byline's two dense lines fold into a SINGLE row when the window is
// wide enough to hold them side by side: author at the left, the moment
// run at the right end of the same line, the face hanging beside one line
// instead of two. `min-width: 1024px` is FeedPage's own desktop gate (the
// full-height container ask) — the byline follows the page's word for
// desktop, not a number of its own; under it the stack stands.
//
// The type steps UP with the fold (name 0.72→0.8em, handle 0.6→0.66,
// ago 0.66→0.72, details 0.6→0.66): two lines' worth of facts on one line
// has width to spend, and the band it sits in got SHORTER — 33px stacked
// → 32px folded (the 24px face + the band's 8px padding is the height
// now; the media budget's byline term is measured on THIS branch, desktop
// being where the 1440×900 measurement lives).
//
// Squeeze order on the shared line, stated in shrink factors: the PLACE
// gives first (factor 4, floor 0), the WHEN may then ellipsize (factor 1
// — it was rigid in the stack, but on a shared line "never trims" would
// push the author off instead; an ellipsized time is still a time, and
// the tooltip carries it whole), and the author's own 16ch caps hold the
// left end.
//
// The SEAM RULE between the author side and the moment chips —
// unconditional since the split-stamp arrangement (2026-08-09, last byline
// ask; it was born hours earlier as a fold-only member). Full band height
// by the house device — stretch + negative margins cancelling the band's
// own 4px padding (keep in step) — and it CARRIES the `auto` left margin
// that packs the chip stack at the band's end, so the rule stands exactly
// at the seam it divides. (The one-line desktop fold and its
// `display: contents` machinery died with the arrangement; the band is
// one layout at every width now.)
.post-square__byline-rule {
  flex: 0 0 1px;
  width: 1px;
  align-self: stretch;
  margin: -4px 0 -4px auto;
  background: var(--grey-6, #9e9e9e);
}

// The foot's tallies. NASALIZATION since 2026-08-10 (user ask) — `'Space
// Mono', monospace` was the last typeface on this card that was not the
// display one, and these are COUNTS, not addresses: nothing about `0` needs a
// fixed advance width. With this the whole square letters in one face, cap to
// foot.
.post-square__stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-display);
  letter-spacing: 0.02em;
  font-size: 0.66em;
  color: rgba(var(--ink-rgb), 0.55);
  flex-shrink: 0;
}

// ── THE MOBILE FILTER SECTION (2026-08-07, user ask) ────────────────
// The two rows become ONE at the same 600px the head box stacks its body at:
// the BUNDLE on the left at its natural width, the LABEL FIELD taking every
// pixel to its right.
//
// Which is the opposite trade from the desktop layout, and correct for the
// same reason. Stacked in a half-width column, the field had the bundle's
// width and no more; stretched across a board that is now the whole screen,
// one row has room for both — and the vertical is what a phone is short of,
// so the section spends width instead of height. Two rows here would cost
// ~25px of a box that already stands over the stream.
@media (max-width: 600px) {
  .feed-stream__controls {
    flex-direction: row;
    // STRETCH, not `center` (2026-08-08, user ask: the bundle and the label
    // section should be the same height). Side by side they came out 21 and
    // 23 — the bundle is its buttons' 17px plus two rims, the field is its own
    // leading plus padding plus two rims, and nothing was making the two
    // agree. Stretching hands the height to the taller of them and the shorter
    // grows into it, which is the only version of "the same height" that stays
    // true when either one's contents change. (Quasar already gives every
    // `.q-btn-item` `align-self: stretch`, so the lenses fill the bundle when
    // the bundle grows.)
    align-items: stretch;
    gap: 0;
    // FILL THE HALF (2026-08-08, user ask: "there is a huge gap on the right
    // inside this section"). The section is a flex ITEM of the lens half, and
    // with no flex of its own it was sized by its content — bundle 86 + gap 5
    // + the label field's natural 176 = 267 in a 293px half, leaving 20px of
    // floor at the right end. `1 1 auto` makes the section take the half, and
    // the label row's own `1 1 auto` below hands that width straight to the
    // field, which is where it was wanted.
    //
    // Mobile only. Stacked, the half HUGS this section by design — that is
    // what makes the buttons take the width they need and the composer take
    // the rest — so growing it there would undo the layout it was built for.
    flex: 1 1 auto;
    width: auto;
  }

  // The single row puts them side by side, so the desktop arrangement inverts:
  // the bundle takes only what its three lenses need, and the field — which
  // spans the section when the two are stacked — takes everything left.
  .feed-stream__lens-group {
    flex: 0 0 auto;
    width: auto;
  }

  .feed-stream__lens-btn {
    flex: 0 0 auto;
  }

  // The BAR takes the width here (it is what stands beside the bundle), the
  // way it did before the verb's brief spell outside it.
  .feed-stream__label-row {
    flex: 1 1 auto;
    align-self: auto;
    width: auto;
    min-width: 0;
  }

  // ⚠ NOTHING TO UNDO HERE ANY MORE. This block used to restore the row's top
  // edge and drop its left one — the doubled-rim rule turned 90° for the
  // side-by-side layout — and both halves went when the bar took its own 1px
  // `--indigo-7` rim on all four edges (2026-08-08). The rule that made them
  // necessary was two touching 2px rims in ONE ink; the bar shares neither
  // with the bundle now.

  // ── THE BYLINE ON A PHONE (2026-08-10, user ask) ──────────────────────
  // "Make the font smaller if needed" — it is needed. The card is the whole
  // screen width here, but the WHO line still has to hold a name, a handle,
  // an org badge and (under a heat lens) a heat plate, and the ask is that
  // the NAME survives all of it whole. One register down on the pair buys
  // roughly three more characters before the handle starts giving, which is
  // usually the difference between `@dreamoperator` and `@dream…`.
  //
  // The shrink ORDER is not restated here — it is unconditional (the name is
  // `flex-shrink: 0` at every width, the handle absorbs at every width). This
  // block only makes the order need to fire later.
  .post-square__identity-name { font-size: 0.66em; }
  .post-square__identity-handle { font-size: 0.55em; }

  // The hop chip travels with them: it leads the ago line now, and a plate
  // dialled for the desktop band would out-weigh the name it sits under.
  .post-square__trust { font-size: 0.54em; padding: 1px 5px; }

  // AND THE MOMENT STACK GIVES FIRST (2026-08-10, same ask). The two rules
  // above were not enough on their own: the handle collapsing to nothing
  // still left the author 114px of a 322px card, because the date + place
  // chips are `flex: 0 0 auto` and were taking ~150 of it. Measured, with a
  // 28-character name: handle 0, name clipped at 114/160.
  //
  // Those chips are rigid BY ARGUMENT on desktop (2026-07-25, third pass:
  // two shrinkable items shared the slack and the place string landed at a
  // different length on every card — "Mexico City," over "Mexico City,
  // Mexico" down the column). That argument is about a COLUMN of cards read
  // side by side, and it loses to this one on a phone: the reader is looking
  // at one card, and a trimmed author is worse than a trimmed timestamp.
  //
  // `20` rather than `1` so the order is stated, not left to the proportions:
  // both sides may shrink, but the chips absorb twenty times as much, which
  // in practice means the author block does not move until they are at their
  // own floor. `min-width: 0` is what lets them reach it (the chips already
  // ellipsize — their hash span's floor was freed for the same reason).
  .post-square__byline-when {
    flex: 0 20 auto;
    min-width: 0;
  }

  .post-square__moment-chip { max-width: 100%; }
}
</style>
