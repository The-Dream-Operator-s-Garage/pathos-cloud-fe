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
  <div class="feed-stream-pane" :class="{ 'is-embed': !!embedItem }" :style="{ '--fhead-h': headH + 'px' }">
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
      v-if="!embedItem"
      :offset="headY"
      :seat="seat"
      :thinking="thinking"
      :live="live"
      :line="line"
      :manual="manualMode"
      :spoken="standingSay"
      :lens-live="lensLive"
      @update:offset="setHeadY"
      @update:height="(h) => (headH = h)"
      @update:manual="manualMode = $event"
      @ask="onAsk"
      @open-chat="openLensChat"
      @sweep="sweepLane"
    >
      <template #controls>
        <div class="feed-stream__controls">
          <!-- ⚠ THIS SECTION RENDERS IN THE MANUAL BAND NOW (2026-08-21,
               user ask) — the workbench the head box's talavera toggle
               opens, ONE ROW under Talavero's bubble — and only there: in
               full-talavero mode (the default) the slot's berth is `v-if`ed
               away and none of this mounts. The LABEL BAR still COMES FIRST
               (2026-08-08, user ask, then a swap of rows, now the row's left
               end): the field you TYPE a filter into before the bundle of
               ready-made lenses, which is the order the section is used in —
               you either name the label you want or reach for one of the
               four. Stated in the MARKUP rather than with `order`, so the
               tab order follows the eye. -->
          <!-- (History: the section was a two-row column beside the composer
               from 2026-08-07; the phone ran this single row from 2026-08-08
               and the manual band promoted it to every width.)

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

      <!-- The lens's chips — rendered by the BOX in one of two places
           (2026-08-21): inside Talavero's STANDING LINE in the bubble when
           the board is full-talavero (the labels embedded in his text), or
           in the manual band's active tray when the workbench is open. Two
           regimes share the slot: the OLD single-label lens chip (`?label=`,
           shareable URL) when no spoken lens is live, and the SPOKEN LENS's
           clause chips when one is — one chip per lane label plus one per
           synthesized clause (yesterday / from allegue / pictures /
           "coffee"), each with a close that removes JUST that clause
           client-side (no model round-trip), and a trailing × that clears
           the whole lens. -->
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

                 ⭐ FIVE CELLS OF ONE WIDTH since 2026-09-13 (user ask: "put
                 the pin one on the very right edge, and also make sure all
                 of them look the same width and are surrounded by either an
                 edge or a hairline"). The strip reads

                   [expand] │ facts… │ [skeleton] │ [flyout] │ [share] │ [pin]

                 — every control in its own `.post-square__cap-cell`, all of
                 them `--cap-cell` wide (32px, the foot's references cell),
                 each closed on both sides by a rule or the card's edge. The
                 old shape was a padded LANE holding four buttons with rules
                 slipped between them, which made the four cells 31 / 24 /
                 24 / 31 wide (the lane's 9px padding fell on the outer two
                 alone) beside a 38px expand cell — five boxes, four widths.
                 The lane and the lead are gone as elements; the cells that
                 replace them read one dial. The PIN closes the strip at the
                 card's right edge: it is the one control whose state
                 persists (a pin either is or is not), and the edge is where
                 a held state is found on every strip of this card — the
                 foot's own held control, references, stands at ITS edge.

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
                   container's ceiling and the board's home slot (⚠ those two
                   ends swapped on 2026-09-05 with the board itself). The
                   board slides back to its berth on the same press (an
                   expanded card is read AROUND the board, never under it),
                   and a second press releases the lens. A hairline divides the
                   cell from the facts, the cap's own device: this is a
                   thing you PRESS, and everything past the rule is a thing
                   you READ. ⭐ A `.post-square__cap-cell` since 2026-09-13,
                   the same box as the four at the other end. -->
              <div class="post-square__cap-cell">
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
                <!-- The KIND MARKS opened this cell from 2026-08-07 until
                     2026-09-13, when they moved INTO the name's pill (user
                     ask, "put the post icon from the header inside the chip
                     too") — see the title below. -->

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
                  <!-- THE STOCK PILL since 2026-09-21 PM (user ask: "the chip
                       on the header of the post card should look (BE) exactly
                       the same as the one used for a reference inside the
                       post content"): the kind's own glyph, the type word,
                       the name where the origin has one, the light and the
                       door — no icon or grammar of the cap's own. -->
                  <MicroChip
                    class="post-square__cap-chip"
                    :class="{ 'is-named': !!originName(clause.target) }"
                    :kind="clause.target.kind"
                    :id="clause.target.id"
                    :path="clause.target.path"
                    :display="originName(clause.target)"
                  />
                  <span class="post-square__cap-sep">::</span>
                </span>

                <!-- ⭐ THE NAME IS A CHIP since 2026-09-13 (user ask: "put
                     the title of the cards inside a clear-background chip
                     and make sure it is aligned on the center horizontally
                     … rounded borders and a thin border the same color as
                     the card's hairlines"). The outer span is still the
                     cell that takes the slack; the inner one is the pill —
                     centred in that slack, ellipsizing inside it. -->
                <span class="post-square__cap-title">
                  <span class="post-square__cap-title-chip" :title="capTitle(item)">
                    <!-- The kind marks lead the pill (2026-09-13, same
                         sitting): `post` for an original, `comment` for a
                         comment, both for a fork — one family of Material
                         Symbols, stating what the name names. -->
                    <span class="post-square__cap-icons" :title="capKindTitle(item)">
                      <q-icon
                        v-for="ic in capIcons(item)"
                        :key="ic"
                        :name="ic"
                        size="13px"
                      />
                    </span>
                    <span class="post-square__cap-title-text">{{ capTitle(item) }}</span>
                  </span>
                </span>
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
                       navigation (2026-08-07, user ask): it opens this post
                       in a FLYOUT VIEWER, so the reader keeps their place
                       in the column. Since 2026-08-17 (the fusion) that
                       viewer is a free floating WINDOW — the postcard
                       itself embedded, the skeleton one header press away,
                       spawned per element so a second post pops a SECOND
                       window — and the press is the very same `select` the
                       foot's references button emits. FeedPage spawns
                       through the flyoutViewers store; the `openIds` prop
                       comes back down for the lit mark.

                   ⭐ NO LANE SINCE 2026-09-13 — four `.post-square__cap-cell`s
                   at the cap's own level, a `__cap-rule` between each pair
                   (2026-08-09's "each control in a ruled cell of its own",
                   finally true to the pixel), reading skeleton │ flyout │
                   share │ PIN, the pin moved from the lane's head to the
                   card's right edge (user ask). -->
              <div class="post-square__cap-cell">
                <router-link
                  class="post-square__cap-act"
                  :to="'/skeletons/' + item.skeleton_id"
                  title="Open the skeleton viewer — this post as its slots and spine"
                  @click.stop
                >
                  <q-icon name="sym_o_orthopedics" size="14px" />
                </router-link>
              </div>
              <span class="post-square__cap-rule" aria-hidden="true" />
              <div class="post-square__cap-cell">
                <button
                  type="button"
                  class="post-square__cap-act"
                  :class="{ 'is-on': isOpen(item) }"
                  title="Open this post in the flyout viewer beside the feed"
                  @click.stop="$emit('select', item)"
                >
                  <q-icon name="open_in_new" size="13px" />
                </button>
              </div>
              <span class="post-square__cap-rule" aria-hidden="true" />
              <!-- Share to chat (dashboards phase 5, 2026-08-10): the
                   conversation picker prefills a draft with this post's
                   chip; ChatDock's send flow grants through the share
                   tree. Grants, never publishes. -->
              <div class="post-square__cap-cell">
                <button
                  type="button"
                  class="post-square__cap-act"
                  title="Share this post to a conversation"
                  @click.stop="openShare(item)"
                >
                  <q-icon name="ios_share" size="13px" />
                </button>
              </div>
              <span class="post-square__cap-rule" aria-hidden="true" />
              <div class="post-square__cap-cell">
                <button
                  type="button"
                  class="post-square__cap-act"
                  :class="{ 'is-on': pinnedIds.has(item.skeleton_id) }"
                  :title="pinnedIds.has(item.skeleton_id) ? 'Unpin this post' : 'Pin this post'"
                  @click.stop="togglePin(item)"
                >
                  <q-icon name="push_pin" size="13px" />
                </button>
              </div>
            </div>

            <!-- ⚠ THE CAP CLOSES ITSELF NOW (2026-08-22, user ask). For twelve
                 days its edge was an ELEMENT after it — the card's one frieze
                 band, and a flipped `RgbHairline` before that — and for one
                 pass that band stood INSIDE this box as its floor. The band
                 has left the card altogether: it is inlaid in the window's own
                 top rail now (`media/MediaTabsBar.vue`), one motif for the
                 whole screen instead of one per card. What holds the seam here
                 is the cap's own `border-bottom`, 2px of `--grey-6` — see the
                 style block for why it is neither the card's weight nor the
                 card's ink. -->

            <!-- BYLINE band — TWO NANO PILLS, LEFT-ALIGNED (2026-09-21, user
                 ask: "turn the author/moment section into a single section
                 to contain labels … the author into a nano chip that
                 contains the profile picture and the name in a cream color
                 with grey text … remove the '— x time ago' bit … another
                 pill for time that uses the same yellow-gold aesthetic as
                 the pills used to represent moments on the skeleton viewers
                 … the 'globe_clock' material icon … the date and the
                 location … both pills together aligned to the left"). Off
                 2026-09-13's one line, `face name — age │ 🕓 when · where`.

                 The band is ONE ROW OF CHIPS now — the same object the
                 card's foot and the skeleton cells wear (MicroChip's
                 material: cream `--plaque-coat` face, the 18% ink hairline,
                 0.72em Space Mono, the extended pill's 70% corner). The
                 AUTHOR pill (face + name, grey ink) is still the entity
                 DOOR: an `#/entities/<id>` anchor the capture-phase door
                 catches → the entity window. The MOMENT pill (globe-clock
                 glyph + `when · where`, the moments kind's gold off kinds.js)
                 is an `#/moments/<id>` anchor the moment door catches → the
                 moment window (utils/entityDoor.js, both). The org badge and
                 the heat plate keep their places beside the author. The
                 relative age and the seam rule are gone — the date says when.
                 Nothing is right-aligned: both pills pack left, and the
                 moment pill is the one that ellipsizes.
                 ⭐ 2026-09-22 — TWO ROWS: the author pill is twice as tall
                 and wears the person's org SEATS under the name; the moment
                 pill is thinner and takes its row; the LABEL RAIL is the row
                 under it. The band is the card's labeling section now — the
                 next two comments say how. The org badge beside the name is
                 gone (it is a seat inside the pill, `is-active`). -->
            <div class="post-square__byline">
              <!-- THE AUTHOR PILL — TWO ROWS TALL (2026-09-22, user ask: "make
                   the author chip twice as tall and keep the layout and
                   paddings very dense so we can fit some badges under the
                   user name … for each organization … a chip with the org's
                   profile pic and then, on the right, inside the org chip …
                   the given icons for the role badges assigned to the user
                   by the org … if we click on any of them … a flyout window
                   … the role or org information"). The TOP ROW is what the
                   pill was — the face and the name, the entity DOOR (a
                   `#/entities/<id>` router-link the capture-phase door in
                   `utils/entityDoor.js` catches → the entity window). The
                   BOTTOM ROW is the SEATS: one chip per organization the
                   PERSON holds a seat in — `author.affiliations` off the
                   feed, every membership of the root behind the author (a
                   mask resolves to its operator), NOT the identity window's
                   wardrobe, which is a per-viewer choice no other reader
                   can see. Each seat is the org's face (a `#/entities/<org
                   entity>` anchor — the same door, and the window draws an
                   org as one) followed by one BADGE BUTTON per role: its
                   glyph by the role (`utils/roleBadges.js`), the title on
                   hover, and its click resolves the membership row to its
                   ORG_MEMBER instance and opens THAT skeleton's window
                   (`openRoleBadge`; an outsider sees the locked face —
                   doctrine). The seat the post was PUBLISHED UNDER wears
                   `is-active`: the one fact the standalone OrgLogoChip
                   beside the name used to carry, folded into the pill.
                   ⚠ A `<div>`, not the anchor it was: interactive content
                   cannot nest inside an `<a>`, so the door is the top row's
                   OWN link (`.post-square__identity-door`) and the seats
                   are siblings, not children, of it. -->
              <div
                v-if="item.author"
                class="post-square__pill post-square__identity"
              >
                <router-link
                  :to="'/entities/' + item.author.id"
                  class="post-square__identity-door"
                  :title="authorName(item.author) + ' — open profile'"
                  @click.stop
                >
                  <!-- 30px since 2026-09-22 PM (user ask: "the author profile pic
                       occupy the whole chip height"): the pill's inner height less
                       the 1px inset a side — 2 × --row-h + --row-gap − 2 borders − 2
                       = 30 at 16/2. ⚠ A prop, not CSS (the avatar sizes itself
                       inline): move it with the two dials. -->
                  <EntityAvatar :entity="item.author" :size="30" class="post-square__pill-face" />
                  <span class="post-square__identity-name">{{ authorName(item.author) }}</span>
                </router-link>
                <span class="post-square__identity-seats">
                  <span
                    v-for="aff in (item.author.affiliations || [])"
                    :key="aff.org.id"
                    class="post-square__seat"
                    :class="{ 'is-active': aff.active }"
                  >
                    <a
                      :href="'#/entities/' + aff.org.entity_id"
                      class="post-square__seat-face"
                      :title="aff.org.name + (aff.active ? ' — published under this seat' : '') + ' — open organization'"
                      @click.stop
                    >
                      <OrgLogoChip :org="aff.org" :size="12" :link="false" />
                    </a>
                    <button
                      v-for="b in aff.badges"
                      :key="b.member_id"
                      type="button"
                      class="post-square__badge"
                      :title="roleBadgeTitle(aff.org, b)"
                      :aria-label="roleBadgeTitle(aff.org, b)"
                      @click.stop.prevent="openRoleBadge(aff.org, b)"
                    >
                      <q-icon :name="roleBadgeGlyph(b)" size="10px" />
                    </button>
                  </span>
                </span>
              </div>
              <!-- THE RIGHT COLUMN — two rows in the author pill's height
                   (2026-09-22, the same ask: "as the author chip is twice as
                   tall, we want to fit two rows instead of the single row
                   where the moment chip is … make the moment chip thinner
                   and extend its width to its container so it occupies all
                   available space … keep the moment chip on the first row on
                   top … adapt the second row below to contain the current
                   label slider"). ROW 1: the MOMENT pill — `--pill-h` 18,
                   thinner than the row unit's 20, `flex: 1 1 auto` so it
                   takes the column — and, when the heat lens is on, the heat
                   plate as the one rigid thing after it. ROW 2: the LABEL
                   RAIL, moved up from under the pit with its comment run
                   (below); the strip that held it there is gone. So the band
                   reads as a 2×2 — who │ when, seats │ labels — the "general
                   labeling section" the ask named. -->
              <div class="post-square__byline-col">
                <div class="post-square__byline-row">
                  <component
                    :is="item.moment?.id ? 'router-link' : 'span'"
                    :to="item.moment?.id ? '/moments/' + item.moment.id : undefined"
                    class="post-square__pill post-square__when"
                    :style="momentPillStyle"
                    :title="momentLine(item) + (item.moment?.id ? ' — open moment' : '')"
                    @click.stop
                  >
                    <q-icon :name="GLOBE_CLOCK" size="10px" class="post-square__pill-icon" />
                    <span class="post-square__when-text">{{ momentWhen(item) }}</span>
                    <!-- The WHERE, when there is one (2026-09-21, user ask: "put the
                         'globe_location_pin' next to the location if the location
                         is available"): the chip's `/` separator's cousin, a
                         middle dot, then the pin glyph (in the font — `sym_o_`) in
                         the same gold, then the place — the one run that yields. -->
                    <template v-if="item.moment?.place">
                      <span class="post-square__when-sep" aria-hidden="true">·</span>
                      <q-icon name="sym_o_globe_location_pin" size="10px" class="post-square__pill-icon post-square__pill-pin" />
                      <span class="post-square__when-place">{{ item.moment.place }}</span>
                    </template>
                  </component>
                  <span
                    v-if="sortOrder === 'heat' && item.heat != null"
                    class="post-square__heat"
                    :title="'Heat ' + item.heat + ' — the sum of this lens\'s label weights this post matches'"
                  >
                    <q-icon name="local_fire_department" size="10px" />{{ item.heat }}
                  </span>
                </div>
                <div class="post-square__byline-row post-square__rail-row">
                  <div class="post-square__rail" :class="{ 'is-empty': !labelBundles(item).length }">
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

                  <!-- THE ADD CONTROL (2026-08-10, user ask) — the strip's right
                       end, OUTSIDE the rail rather than inside it. That placement
                       is the whole design of this button: the rail is a horizontal
                       SCROLLER, so anything laid inside it is a plate that slides
                       away with the labels and is off-screen on exactly the cards
                       that carry the most classification. Out here it is a fixed
                       cell in the strip's row, always at the same place, and the
                       rail simply takes the space it leaves (`flex: 1 1 auto`).

                       It wears `.post-square__cap-act`, the card's own act-button
                       chrome — chromeless glyph at rest, box under the cursor —
                       so the card has ONE button language across its cap, its
                       foot and now this row, rather than a third one invented for
                       the rail.

                       ⚠ IT HAS NO ACTION YET, ON PURPOSE. Attaching a label to a
                       post is `POST /skeletons/:id/labels {labelId}` behind a
                       picker (`maker/LabelPicker.vue` — compact mode, `picked`
                       event, `excludeIds`), and it is owner-gated, which the feed
                       is not: most cards in a stream belong to someone else, and
                       what the button should do THERE (suggest? nothing? hide?)
                       is a product decision, not a styling one. Wiring it to the
                       owner path alone would put a control on every card that
                       403s on most of them. So the cell is placed and dressed and
                       the handler is the one thing left; `stop.prevent` is on it
                       already so it never falls through to the card. -->
                  <button
                    type="button"
                    class="post-square__cap-act post-square__rail-add"
                    title="Add a label"
                    aria-label="Add a label"
                    @click.stop.prevent
                  >
                    <!-- ⚠ `new_label`, not `add` (2026-08-10, user ask) — and it
                         is a BARE name, which on this platform means it must
                         exist as a Material Icons LIGATURE or it draws an empty
                         box rather than failing loudly (the `developer_guide`
                         trap, specs/gotchas.md). Verified rendering, not
                         assumed. -->
                    <q-icon name="new_label" size="14px" />
                  </button>
                </div>
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
            <!-- ⚠ NOTHING IS DRAWN ON THIS SEAM (2026-08-10, the day's last
                 rail ask). An `RgbHairline` stood here for one day — the
                 LABEL BRACKET's upper half (`--rail`), thin-breaded and
                 paired with a flipped twin below the strip so the two indigo
                 ends faced each other across the chips — and a frieze band
                 for the three days before that. Both are gone: the label
                 strip states its own bounds now, as a RIMMED BOX (see
                 `.post-square__rail`), and a box that draws its own edge does
                 not also need two full-bleed rules pressed against it. What
                 divides classification from the byline above is the air the
                 strip carries (`.post-square__rail-strip`'s padding), which
                 is the lane those bands used to occupy.

                 The foot keeps ITS band — it closes the reading area and is
                 half of nothing, so it never belonged to this bracket. -->

            <!-- ⭐ THE LABEL STRIP STOOD HERE UNTIL 2026-09-13 (user ask: "move
                 the label section to the bottom, between the content and the
                 cyan-indigo hairline"). It is under the pit now — see there.
                 What this seam holds is the byline's own rule and the pit's
                 top margin, on every card alike; the two comments above
                 describe a lane that no longer has a middle. -->

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

            <!-- ⭐ THE LABEL STRIP IS GONE FROM HERE (2026-09-22, user ask:
                 "adapt the second row below to contain the current label
                 slider that is on top of the footer"). The rail stood under
                 the pit since 2026-09-13 (and under the byline before that,
                 since 2026-07-25); it stands INSIDE the byline now — the
                 right column's second row, beside the author pill's seats —
                 with its markup and its comment run. There is no strip
                 element any more: the card reads cap │ byline │ pit │
                 hairline │ foot on every card, labelled or not. -->

            <!-- ⚠ AND NOTHING IS DRAWN ON THIS ONE EITHER — the bracket's
                 lower half went with its twin above the strip (same ask, and
                 a pair has to leave together or the survivor reads as a rule
                 that lost its mirror). It was the `--flip`ped band: indigo
                 up, cyan down, and conditional on the rail's own `v-if` so an
                 unlabelled card never stacked two sandwiches with nothing
                 between them. The strip's rim and its own air do that work
                 now, and they travel with the labels for free. -->
            <!-- THE FOOT'S OPENING EDGE — the `RgbHairline` (2026-08-09,
                 user ask; it closed the CAP from 2026-08-07 until this
                 pass, and the label rail for hours before that). The cap's
                 divider is a plain hairline now — its own border-bottom,
                 the card's one line ink — and the three-row band moved DOWN
                 to divide the reading area from the foot: the card opens on
                 quiet rules and closes on its one drawn motif. Same
                 unconditional standing as before — every card has a foot,
                 so its rule is on every card. -->
            <!-- ⭐ A PLAIN HAIRLINE SINCE 2026-09-13 (user ask: "remove that
                 hairline and turn it into a normal thin hairline"). The
                 sandwich is gone from this card — `RgbHairline` has no
                 consumer on this surface any more (import and registration
                 dropped; the component stays for its next host) — and what
                 closes the reading area is the same line every other seam on
                 the card is drawn in: 1px of `--grey-5`, the byline's rule
                 brought down to the foot. Own `<div>` rather than a
                 `border-top` on the foot, because the foot paints a
                 border-box background layer with `background-origin` tricks
                 (see its rules) and a border there would join that stack;
                 a 1px block in the flex column is the same rule the strip's
                 `border-bottom` was, with nothing to interact with. Same
                 unconditional standing as the band it replaces. -->
            <div class="post-square__hairline" aria-hidden="true" />

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
                   a post with (MicroChip's own default for the kind WAS
                   `edit_note`, a different drawing, until 2026-09-21 PM3
                   made `sym_o_post` the kind's glyph in kinds.js) — the
                   card's two strips wear one face for one thing.
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

                   [refs] │ [chip  copy] │ [comments forks] │ [⌃n ⌄n]

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
                 · The VOTES cell closes the strip at the far right edge:
                   `keyboard_arrow_up` then `keyboard_arrow_down`, each with
                   its own tally — the TAILLESS pair (2026-08-10, third ask;
                   the tailed `arrow_upward`/`arrow_downward` read as two
                   instructions where this strip wanted two marks). The
                   single
                   `thumb_up` it replaces showed `votes.up` alone — half of
                   what the feed has always answered with — so the shape
                   that states both is also the one that stops hiding the
                   other half. Tallies, not controls: nothing in this strip
                   has ever been a vote button, and the card is a reading
                   surface. ⭐ ONE ROW SINCE 2026-09-13 (user ask, "put the
                   vote up and vote down buttons on a single line"): the
                   pair stood as a COLUMN — up over down at 9px, rows
                   tightened to `line-height: 1.15` — from 2026-08-10, and
                   two stacked rows were what made this cell the strip's
                   tallest (28.22px against the other cells' 26). Laid
                   flat, the arrows take the tallies' own 11px: at 9px they
                   were sized to stack, and beside `chat_bubble_outline`
                   at 11px a smaller mark read as a lesser one.

                 ⭐ THE DENSITY PASS (2026-09-13, same ask — "homogenize the
                 size of the footer bar subsections and buttons and text,
                 reduce the padding on top and bottom"): every cell pads
                 `--foot-pad` (2px 8px; they ran 4/8, 4/8, 4/9 and 3/9),
                 every in-cell gap is `--foot-gap` (6px; they ran 4, 8 and
                 1), every control stands exactly `--foot-ctl` tall (16px —
                 both buttons, the chip, the tallies' line box; the buttons
                 were 18 and the chip 18.11), both button glyphs are 12px
                 (the references mark was 14 beside a 12 copy), and the chip
                 letters at the tallies' 0.66em with its hash CUT TO 10ch
                 (it showed all 64 hex digits on a desktop card — 417px of
                 address nobody reads off a card; the full path is on its
                 tooltip and one press away). Foot 28.22 → 20px measured,
                 carried into both `--media-max-h` constants (the pit's
                 note). -->
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
                  <q-icon name="sym_o_developer_guide" size="12px" />
                </button>
              </div>
              <span class="post-square__foot-rule" aria-hidden="true" />

              <div class="post-square__foot-main">
                <!-- THE STOCK PILL since 2026-09-21 PM (user ask: the card's
                     chip must BE the content's reference chip), in its
                     EXTENDED state since PM3 (user ask: "use the extended
                     version of the post pill on the post card footer"):
                     `● | [post] :: post :: hash ⤢` — the light leading, the
                     cap's own `sym_o_post` (the kind's glyph in kinds.js
                     now), the type word, the door at the end — a click
                     opens the post's window, the same window the cap's
                     open_in_new opens (the store dedupes by address). The
                     cap's `sym_o_orthopedics` and the chip's old `/` seps
                     are gone; the `::` seam is the chip's own grammar. -->
                <PostMicro
                  class="post-square__chip"
                  :id="item.skeleton_id"
                  :path="item.skeleton_path"
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
                  <q-icon name="keyboard_arrow_up" size="11px" />{{ item.votes?.up || 0 }}
                </span>
                <span class="post-square__stat" title="down-votes">
                  <q-icon name="keyboard_arrow_down" size="11px" />{{ item.votes?.down || 0 }}
                </span>
              </div>
            </div>
          </article>
        </template>
      </div>
    </div>

    <!-- Share-to-chat picker (phase 5) — one instance for the whole
         stream; the cap-lane button fills shareRef per card. -->
    <ConversationPicker v-model="shareOpen" :share-ref="shareRef" />
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
import { absoluteTime } from 'src/utils/time'
import EntityAvatar from 'src/components/entities/EntityAvatar.vue'
import { kindFor } from 'src/utils/kinds'
import { GLOBE_CLOCK } from 'src/utils/glyphs'
import OrgLogoChip from 'src/components/organizations/OrgLogoChip.vue'
// The author pill's seats (2026-09-22): the role badge's glyph + tooltip, the
// membership → ORG_MEMBER instance read, and the window it opens in.
import { roleBadgeGlyph, roleBadgeTitle } from 'src/utils/roleBadges'
import { orgService } from 'src/services/org.service'
import { useFlyoutViewersStore } from 'src/stores/flyoutViewers'
import PostMicro from 'src/components/posts/PostMicro.vue'
// The cap chips a post's PARENT, which may be a post, a node or some other
// element — so it reaches for the generic chip rather than PostMicro.
import MicroChip from 'src/components/shared/MicroChip.vue'
import MarkdownBody from 'src/components/shared/MarkdownBody.vue'
import ConversationPicker from 'src/components/chat/ConversationPicker.vue'
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
  components: { EntityAvatar, OrgLogoChip, PostMicro, MicroChip, MarkdownBody, FeedHeadBox, ConversationPicker },
  props: {
    // The posts whose flyout VIEWERS are open right now (2026-08-17, the
    // fusion — it was a single `selectedId` while the feed owned one box).
    // The stream does not own that state: the viewers are free windows in
    // MainLayout's host, so FeedPage reads the store's open list and hands
    // it down for the cards' lit marking.
    openIds: { type: Array, default: () => [] },
    // EMBED MODE (2026-08-17) — the element flyout's post face. Given one
    // `GET /feed` item, the stream renders exactly that card and NOTHING of
    // the surface around it: no head box, no lenses, no feed fetch, no
    // nav_state tracking (two holders both keyed 'feed' would fight over the
    // reader's saved scroll spot). The card is the whole point — "the current
    // postcard as it is on the feed" is this component's own markup and
    // scoped styles, so embedding the stream in single-card dress is what
    // keeps the two faces one face. Emits still fire; the host decides what
    // they mean in a box that already shows the post.
    embedItem: { type: Object, default: null }
  },
  emits: ['select', 'pins-changed'],
  setup (props, { emit }) {
    // Embed mode is born holding its card — no fetch, and no one-frame
    // flash of the empty state while `onMounted` gets around to load().
    const items = ref(props.embedItem ? [props.embedItem] : [])
    const total = ref(props.embedItem ? 1 : 0)
    const loading = ref(false)
    const wellEl = ref(null)
    const streamEl = ref(null)

    // StateHolder — remember where the well was scrolled, so hopping into a
    // post and coming back lands on the same reading spot. The page itself
    // never scrolls, so window tracking is off and the well is tracked
    // instead.
    const holder = useStateHolder({}, { trackScroll: false })
    // NEVER in embed mode: the flyout's copy of this stream scrolling its own
    // little well must not write over the FEED's saved reading spot — two
    // holders both keyed 'feed' would be two hands on one dial.
    if (!props.embedItem) holder.trackContainer(wellEl, 'feed')

    // The cap's pin tack records its press like every other pin on the
    // platform (see `togglePin` below).
    const navStore = useNavStore()

    // THE ROLE BADGE'S DOOR (2026-09-22, user ask: "if we click on any of
    // them, we want to have a flyout window be triggered to display the
    // role or org information (as an entity flyout or skeleton flyout)").
    // The org's face is an entity anchor — the document's entity door opens
    // it. The BADGE is a button whose door is a fetch: the membership row →
    // its ORG_MEMBER instance (`GET /organizations/:id/members/:mid/
    // skeleton`, metadata only) → that skeleton's window by ADDRESS, the
    // same `spawnRef` every chip uses (one window per element, whatever the
    // door). When the instance cannot be named (an org with no structure, a
    // seat with no mask), the org's entity window opens instead — the ask
    // allowed either, and a dead click is the one thing it did not.
    const flyouts = useFlyoutViewersStore()
    const openRoleBadge = async (org, badge) => {
      try {
        const r = await orgService.memberSkeleton(org.id, badge.member_id)
        if (r?.success && r.skeleton?.path) { flyouts.spawnRef(r.skeleton.path); return }
      } catch (_) { /* fall through to the org's window */ }
      if (org?.entity_id) flyouts.spawnEntity({ id: org.entity_id, display_name: org.name })
    }

    // THE HEAD BOX's position (2026-08-06) — px from the container's top
    // edge, `null` until someone drags it (the box resolves that to its own
    // resting offset, so the geometry stays in one file). It rides the
    // StateHolder rather than a plain ref because moving the head is an
    // ARRANGEMENT of this surface, not a lens you look through: coming back
    // from a post to find the box back at the top would read as the drag
    // having been undone. The box reports on RELEASE, not per frame, so this
    // writes one nav_state row per gesture.
    const headY = computed(() => (typeof holder.state.headY === 'number' ? holder.state.headY : null))
    // Embed mode never writes: there is no head box in the flyout, and the
    // expand lead's `setHeadY(null)` would otherwise slide the REAL feed's
    // board home from inside another window (same route, same nav_state).
    const setHeadY = (v) => { if (!props.embedItem) holder.state.headY = v }

    // …and its measured height, published back down as `--fhead-h`: the well
    // reserves the box's HOME slot so no card is born underneath it (what the
    // band's own place in the flow used to buy). Lifted out of that slot, the
    // box floats and the slot stays — the reveal it leaves is where the head
    // came from. ⚠ THAT SLOT IS THE WELL'S BOTTOM PADDING SINCE 2026-09-05
    // (it was the top's for the box's whole first era): the height published
    // here is the same number doing the same job at the other end.
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
    // ── THE TWO ARRANGEMENTS (2026-08-21, user ask) ───────────────────
    // false = FULL TALAVERO, the default: the board is the header and the
    // seat's bubble, the lens lives in Talavero's standing text, nothing
    // hand-operated shows. true = the MANUAL band is open under the bubble
    // (label search, lens bundle, active tray, broom, trash). Session-local
    // like every lens: a reload comes back to Talavero.
    const manualMode = ref(false)
    // Talavero's STANDING sentence — the last `say`, held for as long as it
    // stays honest: any HAND edit of the lens (a chip closed, a restore, the
    // broom, the URL chip dropped) nulls it, and the chips alone stand in
    // the bubble. A fresh verdict writes it again.
    const standingSay = ref(null)
    // The standing line's gate: any of the three filter regimes is live —
    // the spoken spec, the `?label=` URL filter, or the card's local hash
    // expand. Only this component sees all three, so the box takes it as a
    // prop rather than deriving a partial answer from its slots.
    const lensLive = computed(() => !!(lensSpec.value || labelFilter.value || hashFilter.value))
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
        // The same words STAND (2026-08-21): `standingSay` is what the
        // full-talavero bubble keeps showing after the transient's ~6s —
        // Talavero's text, with the lens chips embedded after it. Written
        // AFTER applySpec on purpose: its branches null the standing line
        // (clearLens, afterMutation) and the fresh verdict outranks them.
        standingSay.value = meta.say ? meta.say + (stripped ? ' · trash kept out' : '') : null
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
      // A spoken address means "show me THIS one": the board goes back to its
      // berth so the expanded card gets the whole space beside it, exactly as
      // the card's own expand lead does it. ⚠ `null`, not `0`, since
      // 2026-09-05 — the berth is the FLOOR now and `0` clamps to the other
      // end. THIS is the copy the sweep found: the door has TWO callers and
      // only the lead is obvious, so grep `setHeadY(` before changing what
      // "home" means.
      if (spec.hash) setHeadY(null)
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
      // No lens, no sentence — and on the applySpec paths that call this
      // before applying a verdict, the watcher rewrites it right after.
      standingSay.value = null
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
      // A hand edit makes Talavero's sentence stale — his words may promise
      // the clause that was just dropped (or not know the one restored) — so
      // the standing line falls back to CHIPS ONLY. The next verdict speaks
      // a fresh one.
      standingSay.value = null
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
      standingSay.value = null
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
      standingSay.value = null
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
      // EMBED MODE: the one item was handed in — there is no feed behind
      // this stream, so every path that would reload one (lens changes, the
      // expand lead, verdict applies) lands here and finds the card pinned.
      if (props.embedItem) {
        items.value = [props.embedItem]
        total.value = 1
        return
      }
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
      // EMBED MODE mounts the card and the pin truth, nothing else — the
      // label chip, the lens context and the seat all belong to the feed
      // surface this instance deliberately is not.
      if (props.embedItem) {
        await load()
        loadPinned()
        return
      }
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

    // (`trustLabel` / `trustTitle` — the byline's hop chip and its tooltip —
    // left with the chip on 2026-09-13; the entity window's constellation
    // states the distance now, `entities/OriginSky.vue`, same two lines.)

    // The two lines of the identity block. `display_name` is what the
    // author's USER_PROFILE says to call them, `username` is the login
    // handle underneath it — a name can change, a handle is the address you
    // type. Either may be missing on a bare entity, so each falls back to
    // the other and finally to the id.
    const authorName = (author) =>
      author?.display_name || author?.username || `entity #${author?.id}`

    // (`authorHandle` left with the byline's handle span, 2026-09-13.)

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
    // The byline's one-line moment run (2026-09-13): `when · where`, built
    // from `momentWhen` so a legacy item without a moment row shows the same
    // locale date the chip used to, not `absoluteTime`'s form.
    // The byline's moment pill wears the moments kind's two colours off
    // kinds.js — the ONE colour source — by MicroChip's own dial names, so the
    // pill and the skeleton viewers' moment chips are one tone by construction
    // (2026-09-21). The author pill sets neither and falls to grey-8.
    const momentKind = kindFor('moments')
    const momentPillStyle = { '--kind-accent': momentKind.color, '--kind-ink': momentKind.ink }

    const momentLine = (item) =>
      item.moment?.place ? `${momentWhen(item)} · ${item.moment.place}` : momentWhen(item)

    // Does this card hold an OPEN flyout viewer? Compared loosely on
    // purpose — the ids arrive from the store as strings while the feed
    // item carries a number. Both the foot's references button and the
    // cap's `open_in_new` light off this one answer since 2026-08-17 —
    // the viewer shows the ELEMENT, so there is no second "as a skeleton"
    // state to mark (`isSkeletonOpen` died with the fusion, and the
    // single `selectedId` became the store's open LIST when one box
    // became N windows).
    const isOpen = (item) =>
      props.openIds.some((id) => String(id) === String(item.skeleton_id))

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
    // ── share to chat (dashboards phase 5, 2026-08-10) ──────────────
    // The picker owns the whole flow (draft prefill → ChatDock's share
    // tree); the card only says WHICH post.
    const shareOpen = ref(false)
    const shareRef = ref('')
    const openShare = (item) => {
      if (!item.skeleton_path) return
      shareRef.value = item.skeleton_path
      shareOpen.value = true
    }

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
      // The board returns to its berth: an expanded card fills the space the
      // home slot leaves, and a board parked mid-container would stand on top
      // of the one thing being read. ⚠ `null`, NOT `0`, since 2026-09-05 —
      // home is the FLOOR now and 0 clamps to the opposite end. `null` is the
      // box's own word for "nobody has placed me", and it resolves the berth
      // inside FeedHeadBox, which is the one file that should know where it
      // is. (`0` was correct for exactly as long as home was the top.)
      setHeadY(null)
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
    // the kind icons at the head of the same line are one family. (MicroChip
    // defaulted to `edit_note` — the POST-AS-DOCUMENT drawing — until
    // 2026-09-21 PM3 made this cap's `sym_o_post` the kind's own glyph in
    // kinds.js; the chip reads it there now.) Everything else keeps the
    // kind's own icon — a node chip should look like a node.

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
      manualMode,
      standingSay,
      lensLive,
      authorName,
      momentWhen,
      momentTitle,
      momentLine,
      momentPillStyle,
      GLOBE_CLOCK,
      openRoleBadge,
      roleBadgeGlyph,
      roleBadgeTitle,
      isOpen,
      copiedId,
      copyAddress,
      shareOpen,
      shareRef,
      openShare,
      isExpanded,
      toggleExpand,
      hashFilter,
      rootMark,
      capIcons,
      capKindTitle,
      originClauses,
      originName,
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
      sweepLane
      // `absoluteTime` is no longer exposed — the head strip's time-ago chip
      // it fed is gone, and `momentTitle` calls it directly for the one
      // tooltip that still needs an absolute form.
      // `timeAgo` left with the byline's "— age" on 2026-09-21 — the moment
      // pill's date says when.
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
  // ── ONE ROW SINCE 2026-08-21 (user ask: the manual section "on a single
  // row … under talavero's bubble") ────────────────────────────────────────
  // The section spent 2026-08-07/08 as a two-row COLUMN beside the composer;
  // it renders inside the head box's MANUAL BAND now — the workbench the
  // talavera toggle opens — and the band is one row for everything, so the
  // column is a row of two bars: the label bar first (markup order, the
  // reading order the 08-08 swap argued — you type before you reach for
  // presets), the bundle after it. This is the arrangement the PHONE always
  // had, promoted; the old desktop-only column went with the lens half.
  flex-direction: row;
  // STRETCH — the mobile board's 2026-08-08 lesson, now the base: two bars
  // left to size themselves land at 21 and 23 and nothing makes them agree.
  // The manual band states the height; both bars fill it.
  align-items: stretch;
  // 3px of the section's own `--indigo-9` between the two bars — the seam
  // the stacked block showed vertically, turned 90° with the layout. A gap,
  // not touching rims, so nothing doubles and the label bar keeps all four
  // of its 1px edges.
  gap: 3px;
  // Fill whatever berth the manual band hands this section. On the desktop
  // band the berth shrink-wraps (`0 1 auto`), so this is invisible there; on
  // the phone the berth is a full wrapped row, and this is what makes the
  // label field span it.
  flex: 1 1 auto;
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
  // NATURAL WIDTH since the single-row pass (2026-08-21) — the phone's
  // arrangement promoted to the base: side by side with the label bar, the
  // bundle takes what its four lenses need and the bar takes the slack. The
  // `width: 100%` era belonged to the stacked column, where both rows took
  // the section's measure.
  flex: 0 0 auto;
  width: auto;
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
  // NATURAL WIDTH (2026-08-21, with the single row — it was equal thirds of
  // a spanning bundle from 2026-08-07): the group hugs its lenses now, so
  // each button is its glyph and its mark, the phone's rule promoted. The
  // zero-basis note stays worth knowing for any return to a spanning
  // bundle: with `auto` in that layout the three divided the SLACK unevenly
  // by content, and `1 1 0` was what made the row even.
  flex: 0 0 auto;
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
  // THE BAR TAKES THE ROW'S SLACK (2026-08-21, the single-row pass) — beside
  // a natural-width bundle, the field is the one thing here that can spend
  // extra room; under pressure it is also the first to give (the input's own
  // stated width below is the resting size, its `min-width` the floor).
  flex: 1 1 auto;
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
  // A STATED RESTING WIDTH (2026-08-21): an `<input>`'s intrinsic basis is
  // the UA's ~170px, which on the shared manual row would hand the label bar
  // a third of the band before a letter is typed. 88px is the word "Label…"
  // plus a real query's worth; the flex above still grows it into any slack
  // and shrinks it to the floor below when the trays crowd in.
  width: 88px;
  min-width: 36px;
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
  //
  // **`--indigo-1` SINCE 2026-08-22** (user ask — named on the CONTAINER, as
  // every one of today's five asks on this tone was; set here for the reason
  // above, which is the whole point of the warning). It is where this line
  // STARTED: the bed wore `--indigo-1` from 2026-07-25 until 2026-08-05 went
  // neutral, so the field has come home after a walk across the entire scale in
  // one sitting — `--grey-4` → `--grey-8` → `--grey-7` → `--grey-6` →
  // `--brown-1` → here, of which only -6 and brown-1 deployed.
  //
  // ⚠ IT IS THE BEST-SEPARATED SETTING OF THE SITTING. Measured at the seam:
  // bed rgb(232,234,246) against the card's veiled rgb(241,239,234) — the card
  // LIGHTER in red and green (+9, +5) and DARKER in blue (−12), so the pair
  // separates on TWO axes, a warm sheet on a COOL plate. Everything else today
  // had both tones neutral or both warm and leaned on lightness alone;
  // `--brown-1` immediately before this ran two levels of red with both warm,
  // the closest the pair has ever been. This opens the step back up without
  // going dark to do it, which is what the dark settings were reaching for.
  //
  // **THE WASH'S RULE IS SATISFIED FOR THE FIRST TIME TODAY**: "a wash may not
  // be, or approach, the BED's tone — the RELATION, not the token." It is not
  // approached here on any axis. ⚠ The corollary binds the CARD, not this line:
  // its coat may not follow the field into indigo. That is exactly what
  // `--light-cream` was minted to prevent on 2026-08-07 (a card drawn in the
  // field's own family reads as that plaque BORROWED rather than as a card with
  // a coat of its own), so what to protect here is the warm/cool OPPOSITION,
  // not either token by name.
  //
  // Two things the dark pass left behind on the card, both now standing as
  // decisions rather than as fallout — read their own notes before moving them:
  //  · the card's WHOLE LINE SYSTEM is `--grey-5`, one level lighter than the
  //    `--grey-6` it used from 2026-08-07 — the outer edge moved first as a
  //    repair, the ten inner lines followed as a choice, and the one-ink rule
  //    is intact at the new level;
  //  · the veil is `--grey-3` at 75% with a 1px hairline, having been darkened
  //    and thinned in the same sitting the bed was at its closest.
  // ⚠ **`--grey-8` SINCE 2026-08-24** (user ask: "please paint the background of
  // the feed container grey-8" — named on the CONTAINER again, and set here for
  // exactly the reason the warning above gives; this is the FOURTH time that
  // trap has been paid). The field crosses to the DARK half of the scale for
  // the first time, so every relation the note above records is inverted, not
  // merely re-toned:
  //  · FIGURE/GROUND FLIPS. The cards are the PALE things on a dark plate now,
  //    where the surface has always been a light box with slightly lighter or
  //    slightly darker sheets on it.
  //  · THE WASH RULE IS SATISFIED BY DISTANCE, not by hue. `--indigo-1` earned
  //    it on two axes at close range; grey-8 (97) against the card's veiled 241
  //    puts ~144 levels between them, the widest this pair has ever run, and
  //    the rule ("a wash may not be, or approach, the BED's tone") cannot be
  //    troubled at that distance.
  //  · WHAT NOW NEEDS WATCHING is the opposite of what did: not the card's
  //    separation from the bed, which is enormous, but every PALE-ON-PALE mark
  //    that used to sit safely on a light field — a hairline, a disabled chip,
  //    a scrollbar track — since each of those now has a dark plate behind it.
  //    The dark settings this line tried and rejected in one sitting
  //    (`--grey-8` itself, then -7 and -6) were rejected on that ground.
  background: var(--grey-8, #616161);
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
  //
  // **`3px` SINCE 2026-08-22** — the sides' half of a DENSITY PASS (user ask,
  // "reduce the overall padding around them to make the feed fit denser"),
  // after `8px` → `5px` earlier the same sitting. The full walk is now
  // `10px` → `5` → `0` → `3` (2026-08-06) → `8` (08-07) → `5` → **`3`**.
  //
  // 3px is THE FLOOR, and it is a floor with a reason rather than a taste:
  // it is the smallest reveal that keeps the card's own border from LANDING ON
  // the frieze bar. At `0` the two edges met as one line — that pass is why the
  // bar's lip draws nothing to this day — and every value above 3 has been
  // bought with a separate argument about how far apart bar and card are in
  // TONE. Those arguments have all expired: 8px was minted on 2026-08-07 for a
  // pale card against a newly-`--indigo-8` bar, 5px earlier today for a bed
  // that had gone dark enough to read as one frame with that bar. What is left
  // is the original mechanical job, and 3px does exactly it and nothing more.
  //
  // ⚠ SO THE NEXT MOVE DOWN IS `0`, AND `0` COSTS SOMETHING SPECIFIC — not a
  // little less air, but the card's edge and the bar's becoming one line. If a
  // future ask wants denser still, take it out of the VERTICAL rhythm or the
  // card's own inner padding, not out of these three pixels.
  //
  // The vertical rhythm came down in the same pass (the stream's flex `gap` is
  // 6px now, from 10), so the reveal stays deliberately UNEVEN — 3 against 6 —
  // and for the reason it always has been: the sides are read against a hard
  // vertical edge, the top and bottom against another card of the same
  // material, and equal numbers do not look equal across that difference.
  // The head band's negative side margins used to be exactly `-1 x` this number
  // so the band stayed full-bleed lip to lip while the cards kept the sliver
  // (`-10px`, `-5px`, `0`, `-3px`, in step with it); the head is a BOX outside
  // this scroller since 2026-08-06 and spans the field on its own, so that
  // pairing is retired and this padding is the cards' alone.
  //
  // ⭐ THE HOME SLOT IS AT THE BOTTOM NOW (2026-09-05, user ask: "make
  // Talavero's board start being rendered at the bottom of the rails instead
  // of at the top … also make sure the content starts being drawed at the top
  // of the feed container"). The reserve did not shrink, it changed ENDS —
  // the two halves of that one ask are these two numbers:
  //   · TOP is `6px` flat: the stream's own flex gap, and nothing else. It is
  //     the whole "content starts at the top" half. ⚠ NOT `0` — that is the
  //     same trade the side padding's note above spells out, in the other
  //     axis: at 0 the first card's border and the container's top edge stop
  //     being two lines.
  //   · BOTTOM carries the slot: `--fhead-h` (the box's measured height,
  //     published down from `setup()` — a px value, for the same reason
  //     `--post-square-max` is one) + `12px`, the daylight the box keeps off
  //     the container's end (`EDGE` in FeedHeadBox — it clears the corner
  //     sweeps, so it moved with them when the edge was thickened) + `6px`,
  //     the gap to the LAST card, on top of the frieze clearance that was
  //     already there. So the stream ends where the board begins, exactly as
  //     it used to begin where the board ended.
  // (History: from 2026-08-06 the top read `--fhead-h + 18px` on the same
  // three terms, `10px` of gap until the 2026-08-22 density pass took it to
  // 6. The TOTAL is 6px more than that arrangement's — one gap is paid at
  // each end now instead of one at the top — which is why both dependent
  // sites below moved with this line.)
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
  // ⚠ ALL THREE TERMS MOVED IN THE DENSITY PASS. Top `+22px` → **`+18px`**
  // (the 12px EDGE offset is untouched — it clears the head box's corner
  // sweeps — and the 10px gap to the first card became 6, matching the new
  // flex gap); bottom `+12px` → **`+8px`**. KEEP THE SUBTRACTION IN STEP: the
  // expanded card states its height as this well minus these constants, and
  // `fsck --static`'s `expanded-card` witness fails the build if they drift.
  // Grep `KEEP THE SUBTRACTION IN STEP` — there are exactly two sites.
  // ⚠ THE WITNESS WAS RE-KEYED WITH THE 2026-09-05 SWAP: it reads THREE
  // numbers now (top, the slot's own constant, the frieze's), because the
  // bottom is a two-term calc since the slot moved into it.
  padding: 6px 3px calc(var(--fhead-h, 120px) + 18px + var(--frieze-h) + 8px);

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

// ── EMBED DRESS (2026-08-17) — the element flyout's post face ────────────
// One card in another window's well. The CARD is the feed's, its FURNITURE
// is not: the bed goes transparent (the flyout's own sunk `--grey-4` floor
// is the ground the card lies on), the feed-shaped padding collapses (there
// is no head-box home slot to hold open and no footer band to clear — the
// `--fhead-h` term is 0 here anyway, the box being `v-if`ed out), and the
// indigo side borders stay behind — they are the graded frame's inner edge,
// and the frame did not come along.
.feed-stream-pane.is-embed .feed-stream__well {
  background: transparent;
  padding: 0;
  border-left: none;
  border-right: none;
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
  // **6px SINCE 2026-08-22** (user ask, "reduce the overall padding around them
  // to make the feed fit denser"), from the `10px` it had held since
  // 2026-07-25 — the vertical half of the density pass, the sides' half being
  // the well's 3px reveal above.
  //
  // ⚠ THIS NUMBER IS RESTATED IN THE WELL'S TOP PADDING and must move with it:
  // that padding is `12px` (the head box's HOME offset) + this gap, so the
  // first card sits the same distance under the box as every later card sits
  // under its neighbour. It reads `+18px` now; it read `+22px` at a 10px gap.
  //
  // Density is bought HERE rather than at the sides for the reason written on
  // that reveal: the 3px side value is a mechanical floor (below it a card's
  // border lands on the frieze bar), while this gap has no floor but legibility
  // — two cards of the same material still separate at 6px because each carries
  // its own outline and its own contact shadow, whose reach is ~2.5px down and
  // dies well inside it.
  //
  // ⚠ **ONE MEASURED CONSEQUENCE, AND IT IS THE FIRST CARD'S ALONE.** The head
  // box is not a card and does not cast like one: `0 7px 14px -7px
  // rgba(0,0,0,.45)`, a floating shadow reaching ~21px down at two orders of
  // alpha above a card's `.045/.05` contact shadow. At the old 10px gap it
  // already landed on card₁'s top border; at 6px it lands 4px deeper into the
  // falloff. Measured, that border renders **rgb(173,173,173)** where the card's
  // other three edges draw `--grey-5`'s rgb(189,189,189) — card₂'s top border
  // measures a clean 189, so nothing systemic is wrong. It is the head box
  // reading as ABOVE the stream, which is precisely what its shadow is for.
  //
  // Worth knowing anyway, because it means **card₁'s top edge is 16 levels
  // darker than the rest of its own outline**, and because it names the dial:
  // if that ever reads wrong the fix is the head box's shadow or its 12px HOME
  // offset — NOT the card's border tone, which is already correct and shared
  // with ten other lines.
  gap: 6px;
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
  //
  //
  //
  // ── **`--grey-5` SINCE 2026-08-22** (user ask, "make the outer border of the
  // post cards grey-5 again") — and this time it is a SETTLED CHOICE rather
  // than a fix, which is the whole reason the detour is written down.
  //
  // It went -6 → -5 → -6 → -5 across one sitting, and only the middle move had
  // a mechanical cause: the bed had walked to `--grey-6`, this line's own ink,
  // so for one setting bed and card edge were the same value, the border did
  // not draw against the field at all, and the card's silhouette fell to the
  // veil's `--grey-1` hairline alone. -5 fixed that at the card's end; when the
  // bed went `--brown-1` the collision evaporated and -6 came back as the
  // one-ink rule's default. This last step chooses -5 on a pale bed, where -6
  // draws perfectly well — so it is a judgement about WEIGHT, not a repair.
  //
  // ⚠ IT BROKE THE ONE-INK RULE FOR PART OF ONE SITTING AND THE RULE IS WHOLE
  // AGAIN — because the CARD came to this line rather than this line going
  // back. The last ask of the day moved all ten of the card's inner lines to
  // `--grey-5` too ("make the inner hairlines of the post cards grey-5 like
  // their borders"), so the card is once more drawn in ONE INK, one level
  // lighter than the -6 it used from 2026-08-07. "Grep `.post-square` and move
  // the LINES together" is back to meaning exactly what it says: eleven
  // declarations, no exception.
  //
  // What the whole move is, stated once: **the card's entire line system
  // stepped one level lighter in a single sitting.** The outer edge went first
  // and as a REPAIR — the bed had briefly walked to `--grey-6`, this line's own
  // ink, so the border stopped drawing against the field altogether — and the
  // inner lines followed later as a CHOICE, on a bed that had since gone
  // `--indigo-1` and made the repair unnecessary. So a collision fix became a
  // deliberate softening of the card's whole ruling.
  //
  // ⚠ Which means: do not "fix" this one line back to -6. Doing it to any
  // single declaration reopens the exception that was just closed; the value
  // only makes sense applied to all eleven at once.
  border: 1px solid var(--grey-5, #bdbdbd);
  // ── THE CORNER — **`2px` SINCE 2026-08-22** (user ask, "return a very subtle
  // roundness to the post card borders"), off the `0` set hours earlier the
  // same day. The full walk: `--radius-md` → `--radius-sm` → `4px` (2026-08-06)
  // → `6px` → `8px` (08-07, two asks) → `6px` → `0` → **`2px`** (all four
  // today). It is the smallest value that reads as a DECISION: at 1px the arc
  // is a single antialiased pixel and looks like a rendering artifact, at 2px
  // it is visibly a softened corner. Below `--radius-sm`'s 7px there is no
  // platform step to land on, so a flat px stays right — minting one for a
  // single box would state a rhythm the platform does not have.
  //
  // ⚠ THE 7px RULE STILL STANDS, AND THIS VALUE IS SAFE FROM IT — but the
  // reason is worth stating precisely, because the rule has been misread once
  // already today. It says: the pit, the title plate and the label rail all
  // turn at exactly `--radius-sm` (7px), and **a container turning at the same
  // radius as the boxes INSIDE it reads as a tray moulded around them** rather
  // than as a sheet they are laid on. The danger zone is therefore NEAR 7, not
  // BELOW it. That is what made `6px` the weak setting on 08-07 — one pixel
  // tighter than its contents reads as a failed match, an attempt at the same
  // corner that missed — and why the ask that wanted less roundness that day
  // knowingly took the worse of two readings. At `2px` the outer edge is five
  // pixels off its contents: nobody reads that as an attempt at 7. It is
  // unambiguously its own register, a squared sheet with the corner taken off,
  // holding boxes that are frankly round. Same escape `0` used — a change of
  // KIND rather than a contest of degree — just one step less absolute.
  //
  // So the ordering to carry forward is not "bigger is safer": it is **6 is
  // the value to avoid, 7 is the value to skip, and everything ≤4 or ≥8 states
  // itself.**
  //
  // ⚠ The card is now the ONLY thing on this surface turning a corner at the
  // outer level — bed and container are square. That is fine at 2px (a corner
  // this subtle does not ask its field to answer it); it would not be at 8.
  //
  // ── **`4px` SINCE 2026-09-13** (user ask, "make the post's corners from the
  // post feed rounder"), off the `2px` above. The ordering rule above picked
  // the value: "rounder" from 2, with 6 to avoid and 7 to skip, leaves 4 as
  // the last step that still states itself on the NEAR side of the pit's 7 —
  // a doubled arc that is plainly a softened square, three pixels short of its
  // contents, so nobody reads it as an attempt at 7. It is the 2026-08-06
  // setting again. `8px` stays the next step if "rounder" comes back, and the
  // square-field caveat just above is what it would cost: at 8 the bed and
  // the container would have to answer the corner. The veil follows: 4 − 1 = 3.
  border-radius: 4px;
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
  // the reading surface itself: full height, from the container's ceiling
  // down to the board's home slot (⚠ the two ends swapped on 2026-09-05 with
  // the board — it read "from the board's home slot down to the container's
  // floor" for the whole first era, and the ARITHMETIC below is unchanged by
  // the swap: it subtracts the well's paddings, not a named end). The height is stated rather than grown —
  // `--feed-well-h` is the well's measured visible height (published by the
  // same ResizeObserver that measures the width, for the same reason: a px
  // value cannot fail) minus the well's OWN paddings, which is what leaves
  // the little daylight above and below the card the well already reserves
  // for every card. ⚠ KEEP THE SUBTRACTION IN STEP with the well's
  // `padding` line: top = 6px, bottom = --fhead-h + 18px + --frieze-h + 8px
  // (the 18/8 pair came down from 22/12 in the 2026-08-22 density pass and
  // the whole slot moved to the bottom on 2026-09-05; `fsck --static`'s
  // `expanded-card` witness exists to catch exactly the case where one of the
  // two sites moves without the other, and it reads all THREE numbers).
  // The square ceiling lifts (`max-height: none`) and the PIT — the one
  // flexible track — takes every pixel the rigid strips leave, scrolling in
  // place exactly as it does at card scale.
  &.is-expanded {
    height: calc(var(--feed-well-h, 100vh) - 6px - var(--fhead-h, 120px) - 18px - var(--frieze-h) - 8px);
    max-height: none;
  }
}

// The expanded pit re-derives the MEDIA BUDGET from the expanded height
// (2026-08-09): the resting formula is written against the SQUARE ceiling,
// and a medium sized for a ≤60vh card standing in a full-height one would
// leave the pit half empty. Same shape as the resting formula below — the
// card's height term swapped for the expanded height, the well's paddings
// (6 + 18 + 8 = 32px since the 2026-09-05 slot swap, 26 before it, plus its
// 1× --frieze-h) folded in beside the card's own 276px chrome — which no longer carries a
// band term of its own. Keep all three lines in step: the well's
// `padding`, `.is-expanded`'s height, and this. (276 + 32 = 308; the pair was
// 300 + 34 = 334 until 2026-08-10, whose rail-padding asks took 8px out of
// the card's chrome and whose frieze move traded a 6px band for a band
// already counted in the variable term, and 276 + 34 = 310 until that day's
// LAST rail ask deleted the label bracket's two 4px bands and gave the strip
// its padding and rim back, +2 net — move the resting constant and move this
// one with it. ⚠ THIS LINE HAS LAGGED THE RESTING ONE THREE TIMES now: the
// frieze's two grey-6 rules went into the resting 280 → 282 and not into this,
// the rail's rim pass landed here a beat late, and the 2026-08-22 density pass
// took the well's own paddings 22/12 → 18/8 while this constant kept counting
// the old 34 — an 8px overcharge that stood until the frieze move audited the
// line. That is exactly the drift the sentence above warns about, and it is
// always THIS copy: the resting rule is the one you naturally edit — and it
// did NOT lag on 2026-09-05, when the slot moved ends and the well's pads
// went 26 → 32. Both terms are current at 276 / 308, and the variable term is
// the WELL's own `1 × --frieze-h` alone — the card's `0.55 ×` half went with
// the band.)
// ⭐ **302 SINCE 2026-09-13** (270 + 32) — moved WITH the resting one, same
// ask: the foot's band became a 1px rule (−5) and the label strip's rule
// went (−1). Fourth time this line was touched; first time it did not lag.
// ⭐ **283 THE SAME DAY** (251 + 32) — the byline's one-line pass, −19, moved
// with the resting one again.
// ⭐ **275 THE SAME DAY** (243 + 32) — the foot's density pass, −8, moved with
// the resting one a third time.
.post-square.is-expanded .post-square__pit {
  // ⭐ 257 since 2026-09-22 PM (265 that morning, 275 before): resting 225 + the well's 32 — see the resting note.
  --media-max-h: max(120px, calc(var(--feed-well-h, 60vh) - var(--fhead-h, 120px) - 257px - var(--frieze-h)));
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
// the card's own radius for free, so the veil has no corners of its own to
// state (its border does, though — see the veil's radius note below).
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
  // **`--grey-3` AT 75% SINCE 2026-08-22** (user ask, "one tone darker of grey
  // and 10% less transparent"), from `--grey-2` at 65%. Both dials move the
  // same way — a darker wash applied more strongly — so the walk's whole
  // history is one axis: `--grey-3` 30% → 50% → `--grey-2` 50% → `--grey-3` 70%
  // → `--grey-4` → -3 → -4 → `--grey-3` → `--grey-2` at 80% → 65% → **here**.
  //
  // ⚠ READ THE WASH'S ONE RULE BEFORE THE NEXT SETTING — it is the reason this
  // dial has a history at all: **a wash may not be, or approach, the BED's
  // tone; the rule is the RELATION, not the token.** The repeated `--grey-4`
  // settings above are not dithering, they were measured against different
  // beds. This setting is the closest the pair has ever run: measured, the
  // veiled field lands rgb(241,239,234) against a `--brown-1` bed of
  // rgb(239,235,233) — **two levels of red, four of green, one of blue**, and
  // both warm, so there is no hue step underneath the value one either. The
  // card is very nearly the tone of the plate it lies on — closer than the
  // 2026-08-06 convergence the wash's rule was written for (which ran eight
  // levels of red), and closer than any setting since.
  //
  // That is a legitimate register and not a mistake — it is the 2026-07-25
  // arrangement, a card stated by LINE rather than by tone — but it moves the
  // whole job onto the outline: the `--grey-6` border and this element's own
  // `--grey-1` hairline are now what say where a card is, and the contact
  // shadow is what says it is lying on something. If the cards ever read as
  // washed out, **the dial is the BED, not this line**: a wash can only give
  // back some of what it took from a coat, while the field states whatever
  // value it likes.
  //
  // Note for whoever reads the border's own MEASURED line below: it has said
  // "x=3 onward rgb(242,239,234) the veiled field" since 2026-08-07 and that
  // number had drifted badly (it read rgb(247,244,237) at `--grey-2`/65%).
  // This setting brings it back to within one level — the field is
  // rgb(241,239,234) today — and the offsets in that note are stale in a
  // second way now: with the corner square and the reveal at 3px the card's
  // first pixel is not where it was. Trust the pixel row in the bed's note
  // above, which was taken today.
  // The wash is `--card-veil` since 2026-08-23 — it was a literal
  // `rgba(238, 238, 238, 0.75)` here until the NodeMini quoted inside a post
  // had to wear this same coat (user ask). Tokenising it rather than copying
  // it is what keeps ONE number: `--card-coat` in `_tokens.scss` composes
  // this exact wash over `--light-cream` for surfaces that need the sandwich
  // as a single `background`, and both read this line.
  background: var(--card-veil, rgba(238, 238, 238, 0.75)); // --grey-3 at 75%
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
  // **1px SINCE 2026-08-22** (user ask, "make the veil border slightly
  // thinner"), from the 2px it took on 2026-08-07. The full walk is
  // `6px --light-cream` at 50% ("thick transparent borders") → `1px --grey-2`
  // at 80% ("waay thinner") → `1px --grey-1` at 80% → `2px --grey-1` at full
  // strength → **back to 1px, at full strength this time**.
  //
  // ⚠ **1.5px WAS TRIED FIRST AND IS NOT AVAILABLE — A HALF-STEP BORDER DOES
  // NOT EXIST HERE.** Chrome rounds a border's USED width to whole pixels, and
  // `getComputedStyle` reports that used value, so `border-width: 1.5px`
  // came back as `1px` — measured at **BOTH DPR 1 AND DPR 2** (CDP
  // `Emulation.setDeviceMetricsOverride`), which rules out the obvious guess
  // that it survives on a retina screen as three device pixels. The rendered
  // pixel row agrees: one solid `rgb(250,250,250)` pixel and no half-intensity
  // neighbour on either edge. So 1.5 and 1 are the SAME LINE, and writing 1.5
  // would state a step the browser does not draw. ⚠ Note this also means the
  // card's own outer border was very probably rendering at 1px for the whole
  // hour its history records as "1.5px" (see the walk on `.post-square`) —
  // that half-step was measured by eye, not off a pixel.
  //
  // The law was already on file — [specs/gotchas.md](../../../../specs/gotchas.md),
  // "a border cannot be thinner than 1px", written 2026-08-18 for the feed's
  // marble keys; today's setting only confirmed it UPWARD (every fraction
  // snaps, not just sub-1px ones). That entry also names the escape hatch, and
  // it applies here if 1px ever reads as too big a step:
  // **`box-shadow: inset 0 0 0 1.5px <color>` draws a real 1.5px ring**, costs
  // no box and follows `border-radius` exactly. It is NOT a drop-in for this
  // line, and the difference is the mechanism written just below: a border here
  // composites over its own washed self because `background-clip` defaults to
  // `border-box`, and it grows the veil INWARD from the padding box it is
  // pinned to. An inset shadow paints above the background instead and rings a
  // different rectangle. Worth doing if a true half-step is wanted; not worth
  // doing silently.
  //
  // So 1px is what "slightly thinner" resolves to as a border: the only step
  // between 2px and nothing, and a return to the width this line held for two
  // of its four settings. What is genuinely new is the pairing — 1px at FULL
  // strength, where the earlier 1px settings were 80% washes.
  //
  // ⚠ IT MATTERS MORE THAN ITS WIDTH SUGGESTS RIGHT NOW. With the bed at
  // `--brown-1` the card sits two levels off its field, so this hairline and
  // the card's `--grey-5` edge are very nearly the entire silhouette — halving
  // the brighter of the two lines is thinning the card's statement of itself.
  // Both moved the same sitting and in the same direction (softer: -6 → -5
  // outside, 2px → 1px inside), which is worth knowing if the cards start
  // reading as washed out. They were not softened once, they were softened
  // twice, on a bed that had just stopped separating them by tone.
  border: 1px solid var(--grey-1, #fafafa);
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
  //
  // **`1px` SINCE 2026-08-22**, following the card back off `0` in the same ask
  // ("a very subtle roundness"). Nothing here decided anything — this number is
  // DERIVED, and the whole value of the line above is that it says from what:
  // card radius (2) − card border (1). Today it went 7 → 5 → 0 → 1, in step
  // with the card at 8 → 6 → 0 → 2 each time.
  //
  // ⚠ AND IT IS LIVE AGAIN. At `0` this declaration was a no-op kept only so
  // the reason would survive; at 1px the mechanism above is doing real work
  // once more — the card's `overflow: hidden` clips the veil's square corners
  // to the card's round ones for free, but a clip cannot BEND the veil's own
  // border, and a square corner clipped by an arc leaves that line thickening
  // into the bend instead of following it. One pixel of arc against a one-pixel
  // border is the smallest case where that is still true.
  //
  // Note this is NOT the same snap trap as the veil's border WIDTH (see its
  // note above, and specs/gotchas.md): `border-radius` takes fractional and
  // sub-pixel values and renders them — it is `border-width` alone that Chrome
  // rounds to whole pixels. Do not let one rule talk you out of the other.
  //
  // **`3px` SINCE 2026-09-13** — derived again, nothing decided here: card
  // radius (4) − card border (1), in step with the card's 2 → 4 ("rounder").
  border-radius: 3px;
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
//
// ⭐ `--cap-cell` (2026-09-13) — the ONE width of every control cell on this
// strip, five of them since the pin moved to the right edge. 32px = the foot's
// references cell (16 + 8 + 8), so the card's two strips box a lone control
// in the same width at both ends; here that is 20 + 6 + 6, a 20px control
// with 6px of air a side. The lane it replaces padded its four buttons as one
// group (`2px 9px` round the lot, 2px between), so its cells came out
// 31 / 24 / 24 / 31 beside a 38px expand lead — read the cell rule below.
.post-square__cap {
  --cap-cell: 32px;
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
  // THE CAP'S OWN CLOSING LINE (2026-08-22, user ask: "on the post card,
  // remove the frieze bar and leave just a thick grey-6 hairline"). For twelve
  // days this seam WAS the frieze — the cap drew no line of its own and the
  // band standing after it was the edge (before that, the flipped
  // `RgbHairline` of 2026-08-09's divider walk). With the band gone from the
  // card entirely, the seam is a border again, and it is the ONE LINE ON THIS
  // CARD
  // THAT IS NOT THE CARD'S LINE INK: 2px of `--grey-6` where every other rule
  // on the square — the outer border, the byline, the cap's own cell rules, the
  // pit, the rail, the foot — runs 1px of `--grey-5` since this morning's walk
  // (see `--grey-5` in _tokens.scss). Both halves of that are the ask: DOUBLE
  // the weight and ONE STEP darker, because this seam has to do alone what a
  // motif band did before it. `--grey-6` is also exactly where the card's whole
  // line system stood until today, so the ink is a return rather than a new
  // pick — this line is the card's old voice kept for its loudest seam.
  // ⚠ Worth 2px in BOTH `--media-max-h` constants; see the pit's note.
  border-bottom: 2px solid var(--grey-6, #9e9e9e);
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

// THE CONTROL CELL (2026-09-13, user ask) — ONE box for all five controls:
// the expand lead at the card's left edge (its own `__cap-lead` from
// 2026-08-09 until today) and the four at the right (a padded `__cap-side`
// LANE holding them all, rules slipped between, over the same span). Rigid
// both ways at exactly `--cap-cell`: it may not grow into the title's room
// and may not be squeezed by a long one (the fact cell is the one that
// gives, which is why it carries `min-width: 0` and this does not), and the
// control is centred in it rather than padded into place — so the width is
// a stated number, not padding + glyph + gap summed differently at each end
// of a lane. The 2px vertical padding is the strip's own (26 = 2 + 20 + 2
// + the closing border), unchanged.
//
// Why a lane was wrong: the rules INSIDE it had to stretch and win back its
// padding with a negative margin (the `__byline-rule` trick), and the lane's
// horizontal padding fell on its outer two members alone — the pin cell was
// 31px, the flyout cell 24. With the cells at the cap's own level, every
// `__cap-rule` stands between two unpadded siblings of a stretch container
// and meets both edges square with no trick at all, and the card's edge
// closes the two end cells the way a rule closes the rest: every control is
// boxed on both sides, by a rule or an edge, and every box is one width.
.post-square__cap-cell {
  flex: 0 0 var(--cap-cell);
  width: var(--cap-cell);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px 0;
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
// is needed (unlike `__byline-rule`) — the cells carry the padding here, not
// the flex parent, so `align-self: stretch` already reaches both edges. ⭐
// ALL of them are cap-level since 2026-09-13: the copies that lived INSIDE
// the control lane (2026-08-09) and needed the stretch + negative-margin
// override went with the lane (see `__cap-cell`).
.post-square__cap-rule {
  flex: 0 0 1px;
  width: 1px;
  background: var(--grey-5, #bdbdbd);
}

// The kind marks. One step under the ink — they classify, they do not name.
// ⭐ INSIDE the name's pill since 2026-09-13 (user ask) — they led the fact
// cell from the cap's first day; now they lead the chip, so mark and name
// are one boxed object.
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
// (2026-09-21 PM: the cap chip is the STOCK pill — its display face, its
// 0.92em, its 500 weight are gone with the user's ask that the card's chip
// BE the content's. What stays is the row's arithmetic: a width cap so the
// cap keeps its other cells, lifted when a name shows.)
.post-square__cap-chip {
  flex: 0 1 auto;
  min-width: 7ch;
  max-width: 13ch;

  &.is-named {
    max-width: 100%;
    :deep(.micro-chip__hash) { min-width: 0; }
  }
}

.post-square__cap-sep {
  flex: 0 0 auto;
  opacity: 0.45;
}

// The post's name, taking all the slack and ellipsizing alone.
// ⚠ IT STEPS UP ON DESKTOP — see the media query directly below this rule.
//
// ⭐ A CENTRED CHIP since 2026-09-13 (user ask). This span is the CELL — it
// still takes every pixel the icons and the origin clause leave — and the
// name moved into `__cap-title-chip` inside it, which the cell centres. So
// the name floats mid-strip on a titleless "post #n" and on a short title
// alike, and a long one grows the pill until it meets the cell's edges and
// then ellipsizes INSIDE the pill (the cell's `min-width: 0` is what lets
// the pill be squeezed at all — the flex-basis-is-a-request rule, gotchas).
// The clip and ellipsis moved down onto the pill with the text; the cell
// only positions.
.post-square__cap-title {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

// THE PILL. Clear-backed — the strip's own ground shows through, so it is a
// drawn OUTLINE around the name rather than a plate under it — with the
// card's hairline ink as its rim (`--grey-5`, the one line ink every rule
// on this square runs; the cap's cell rules are the same 1px, so the name's
// box and the strip's seams are one system) and 999px ends: the same pill
// the label rail's members wear one strip down, at the cap's register.
// EXACTLY the fact cell's content height — the cell pads 4px in a 24px
// strip, so 16 = the whole box, 1px rim + 14px line — which is what keeps
// the strip at 26 (the cap's `--media-max-h` share is unchanged; the media
// budget did not move for this). The desktop step-up below lands on the
// cell and reaches the chip by inheritance: 1.16em of the cap in a 14px
// line still clears.
.post-square__cap-title-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  box-sizing: border-box;
  height: 16px;
  line-height: 14px;
  // Tighter on the left: the 13px mark leads, and a glyph's own drawing
  // leaves air a letter does not, so 6 before it lands its ink where 8
  // lands the name's.
  padding: 0 8px 0 6px;
  border: 1px solid var(--grey-5, #bdbdbd);
  border-radius: 999px;
  background: transparent;
  overflow: hidden;
}

// The name inside the pill — the one member that gives. `min-width: 0` so
// the flex item may be squeezed below its text (the marks are `0 0 auto`),
// and the ellipsis lands here, after the mark, never over it.
.post-square__cap-title-text {
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
// own: it is the card's TYPE gate, shared with the byline's fold below, and
// the two move together. ⚠ It was FeedPage's gate too until 2026-08-12, when
// that page's full-height-column block was RETIRED (the column stops on the
// nav bar's top edge now, at every width, so the page states no breakpoint at
// all). The number stayed here because the reason was always different — 1024
// is where the cap has the WIDTH for a bigger name, not where the page had
// chrome beside the bar. It is this component's own gate now.
// Under it the name stays flush with the rest of the lane,
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

// THE BYLINE BAND — ONE ROW OF NANO PILLS (2026-09-21, user ask; the
// template note has the words). The band was the author's identity block
// from 2026-07-25 and ONE LINE — face 18 · `name — age` │ `🕓 when · where`
// — since 2026-09-13; the pills replaced all of it in one sitting. What
// stays: the strip's own box (2px 7px, the grey-5 rule under it, the display
// face for the org badge and the heat plate). What goes: the face wrapper,
// the two-line block, the age, the seam rule and the right-aligned moment
// run — the byline has no right end any more, it packs left.
// ⭐ 2026-09-22 — TWO ROWS (user ask; the template's notes say what): the
// band holds the AUTHOR PILL, two rows tall (`.post-square__identity`),
// beside a COLUMN (`.post-square__byline-col`) of two 18px rows — the
// moment pill, then the label rail that used to stand under the pit. Same
// padding, same gap, same rule under it; the band is 2 + 40 + 2 + 1 = 45px
// (was 25). `--pill-h` is declared HERE as the band's ROW UNIT (20px) so
// the column can read it — `.post-square__pill` restates the same number
// for itself, and the moment pill dials its own down to 18.
.post-square__byline {
  --pill-h: 20px;
  // ⭐ 2026-09-22 PM — THE TWO DIALS OF THE 2×2 (user ask: "reduce the
  // vertical padding of the new label section as much as possible … specially
  // between name and badges and also moment chips and labels scroll"):
  // `--row-h` is EVERY row's height (the moment pill, the rail, and — less
  // the pill's own 1px border a side — the name row and the seats row),
  // `--row-gap` the ONE lane between rows, in the pill and in the column
  // alike. 16 / 2: a 16px moment pill is the 10.08px words' 14.1px line box
  // plus its two borders (no air left to take), the rail is its 16px plates
  // exactly, and 2px is the least a lane between two rimmed objects can be
  // and still read as a lane. The band is 2 × 16 + 2 = 34 inside, 37 with
  // its 1px pads and its rule (was 45). Tune the two numbers, nothing else.
  --row-h: 16px;
  --row-gap: 2px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 5px;
  // `1px 7px` since 2026-09-22 PM (was 2px): the least air between the cap's
  // rule and the pills' rims that keeps them from touching — the same ask.
  padding: 1px 7px;
  flex: 0 0 auto;
  min-width: 0;
  border-bottom: 1px solid var(--grey-5, #bdbdbd);
  font-family: var(--font-display);
  letter-spacing: 0.02em;
}

// THE PILL — MicroChip's material restated for a chip that carries WORDS
// rather than an address (a face + a name; a glyph + a date). Byte for byte
// the nano pill's box (`components/shared/MicroChip.vue`): the cream
// `--plaque-coat` face, the 18% ink hairline, `1px 6px`, 0.72em Space Mono
// on a 1.4 line, and the EXTENDED pill's corner — `--chip-half-h` (0.7em +
// 2px, half the chip's height) × `--round` 0.7 — so the two byline pills, the
// foot's address pill and the pit turn the same corner on the same card. It
// reads the chip's two colour dials by the chip's own names — `--kind-accent`
// on the glyph, `--kind-ink` on the words — set inline off kinds.js where a
// pill HAS a kind (the moment) and left unset where it has none (the author:
// grey-8 words). Restated rather than reused because MicroChip is
// address-bound (it resolves and verifies what it names); these two name a
// person and a time in words. ⚠ Keep the dials in step with the chip's — a
// pill that drifts is a second object.
.post-square__pill {
  // ⭐ SLIGHTLY TALLER THAN THE CHIP (2026-09-21, later ask: "make both pills
  // slightly higher"): the height is a DIAL, `--pill-h` 20px, against the
  // nano pill's 18.11 by construction (1.4 × 10.08 + 2 + 2). The corner keeps
  // the chip's LAW — 70% of half the height — so it is 7px here (the foot
  // chip's 6.34 is 70% of ITS half); the pit stays on the foot's number.
  --pill-h: 20px;
  --chip-half-h: calc(var(--pill-h) / 2);
  --round: 0.7;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex: 0 1 auto;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  height: var(--pill-h);
  padding: 0 6px;
  border-radius: calc(var(--chip-half-h) * var(--round));
  border: 1px solid rgba(var(--ink-rgb), 0.18);
  background: var(--plaque-coat, #f8f2e4);
  color: var(--kind-ink, var(--grey-8, #424242));
  font-family: 'Space Mono', monospace;
  font-size: 0.72em;
  font-weight: 400;
  line-height: 1.4;
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-decoration: none;
  vertical-align: middle;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
  // Hover — the chip's 12% wash of the accent over the cream.
  &:hover { background: color-mix(in srgb, var(--kind-accent, var(--ink)) 12%, var(--plaque-coat, #f8f2e4)); }
}
// The author's face — the profile picture at the pill's INNER height less a
// 1px ring (16px inside the 20px pill; see `.post-square__identity`),
// EntityAvatar's tile with its corner fitted to the pill's.
.post-square__pill-face { flex: 0 0 auto; }
// The moment's glyph — `globe_clock` (utils/glyphs.js; the installed font
// lacks it), in the kind's accent like MicroChip's own `__icon`.
.post-square__pill-icon { flex: 0 0 auto; opacity: 0.85; color: var(--kind-accent, currentColor); }

// THE RIGHT COLUMN (2026-09-22) — what is left of the band beside the author
// pill, as TWO ROWS of the pill's height: `space-between` puts row 1 at the
// top edge and row 2 at the bottom, the 2px lane between them the pill's
// own (the pill's rows are 18 in 40 with its two 1px borders; the column's
// are 18 in 40 with a 4px lane — the pills' TOP edges align, which is what
// the eye reads). ⚠ `min-width: 0` is load-bearing: a flex column full of
// pills refuses to shrink without it, and the moment pill's ellipsis never
// fires.
.post-square__byline-col {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  // 2 × --row-h + --row-gap since 2026-09-22 PM (was 2 × --pill-h = 40):
  // the column IS its two rows and the one lane between them.
  height: calc(2 * var(--row-h) + var(--row-gap));
  gap: var(--row-gap);
}
// One row of the column — 18px, the row unit less the pill's two borders,
// so a pill in it is the row and a rail in it is the row.
.post-square__byline-row {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  height: var(--row-h); // the dial (2026-09-22 PM; was --pill-h − 2 = 18)
}

// ── THE CARD'S FRIEZE BAND — GONE FROM THIS SURFACE 2026-08-22 ────────────
// (user ask: "take the cyan-indigo frieze bar from the post cards and incrust
// it on the top navigation header of the whole screen".) The band lived here
// from 2026-08-07, born as a PAIR standing where the byline's and the label
// rail's hairlines used to (the second `vflip`ped, so the two reflected about
// the label lane); the mirrored half went the same day, the survivor moved UP
// to close the CAP on 08-10, walked INTO the cap as its floor for one pass
// this morning, and then off the card entirely.
//
// WHERE IT WENT AND WHAT CAME WITH IT: `media/MediaTabsBar.vue`, inlaid at the
// bottom of the window's light-cream top rail over `--media-tabs-frieze-pad`
// of the rail's own coat. Everything that made this band THIS band travelled —
// the `slim` recipe, the `--grey-8` plaque two steps under its host's line
// ink, the indigo→cyan paint on the wave, and the `0.55 × --frieze-h + 2px`
// height dial the card walked four asks in one day (the notes on all of it are
// on the rail's own rule now, including the ~0.7px-per-motif-row floor any
// future move of that dial has to clear).
//
// WHAT THE CARD KEPT is the argument the band left behind: its seam. The cap
// closes itself with `border-bottom: 2px solid var(--grey-6)` — see
// `.post-square__cap`. And what the card GOT BACK is a px-only media budget:
// the band was the one piece of this square's chrome that was viewport-
// relative, subtracted as `0.55 × --frieze-h` beside a px constant, and with
// it gone `--media-max-h` is a flat number again on the resting card (the
// expanded twin keeps a 1× term, but that one is the WELL's padding, not the
// card's). One motif for the whole screen now, instead of one per card.

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
// THERE WERE THREE OF THEM for one day (2026-08-10, four asks across it):
// two copied in around the LABEL STRIP as a `--rail` PAIR — thin-breaded, the
// lower one `--flip`ped so the two indigo ends faced each other across the
// chips — plus the foot's. **THE PAIR IS GONE** (the day's last rail ask) and
// so are both modifiers with it: `--rail` (1px bread instead of 2) and
// `--flip` (the filling restated backwards, CSS being unable to read a
// gradient in reverse) existed only to dial that bracket, and a modifier with
// no element left to modify is dead weight, not a spare part. The label strip
// draws its OWN rim now, and a rimmed box pressed between two full-bleed rules
// is the same seam stated twice — the rules lost, because the box is the thing
// the user asked to see.
//
// So the card reads cap │ FRIEZE │ byline │ labels │ pit │ RGB │ foot, and
// this element is back to ONE instance at its base weight, closing the reading
// area. It is half of nothing and has no mirror to keep — the same standing
// the cap's band had before the frieze took that seam.
//
// KEEP THE PIT'S MEDIA BUDGET IN STEP: 6px of bands now, all of it the foot's,
// unconditional.
//
// ── ⭐ A PLAIN RULE SINCE 2026-09-13 (user ask: "remove that hairline and turn
// it into a normal thin hairline") ──────────────────────────────────────────
// Everything above is the band's history; the element is a 1px `--grey-5`
// block now — the card's ONE line ink, the byline's rule repeated at the
// foot — and the `RgbHairline` component has left this file. It is a plain
// `<div>` in the flex column rather than a `border-top` on the foot because
// the foot's background is a border-box layer stack (see `.post-square__foot`)
// and a border there would enter it. `flex: 0 0 auto` for the same reason
// the component stated it: a card with a ceiling takes its slack out of a
// shrinkable divider first, and a squashed 1px rule simply vanishes.
//
// The card reads cap │ byline │ pit │ labels │ HERE │ foot since the same ask
// moved the label strip under the content (see the template): this rule
// closes the labels when the post carries any and the pit when it does not.
// KEEP THE PIT'S MEDIA BUDGET IN STEP: 1px of rule now, from 6px of band —
// the constants took −5 for it (and −1 for the strip's rule, gone the same
// ask): 276 → 270, 308 → 302 (then 251 / 283 the same day — the byline pass).
.post-square__hairline {
  flex: 0 0 auto;
  height: 1px;
  min-width: 0;
  background: var(--grey-5, #bdbdbd);
}

// THE MOMENT PILL — `.post-square__pill` in the moments kind's colours
// (`momentPillStyle` in the script: `--kind-accent` gold `#c79a00` on the
// glyph, `--kind-ink` `#5f4700` on the words — kinds.js, the ONE colour
// source, the same pair the skeleton viewers' moment chips wear). It is the
// pill that yields: `flex: 0 1 auto` + the text's ellipsis, so on a narrow
// card the place goes before the date does and the author never loses a
// letter. Hover lifts the words to the accent, the chip's own gesture.
.post-square__when {
  // ⭐ 2026-09-22 — THINNER AND FULL-WIDTH (user ask: "make the moment chip
  // thinner and extend its width to its container so it occupies all
  // available space"): `--pill-h` 18 against the band's row unit of 20 (the
  // corner follows the chip's LAW — 70% of 9 = 6.3px, the foot chip's own
  // family), and `flex: 1 1 auto` so it takes the column's whole first row;
  // the heat plate, when the heat lens is on, is the one rigid thing after
  // it. `0 1 auto` before this — it hugged its words beside the author.
  // `--row-h` since 2026-09-22 PM (was 18): the pill IS the row — 16px, its
  // words' line box plus two borders; corner by the law, 70% of 8 = 5.6px.
  --pill-h: var(--row-h);
  flex: 1 1 auto;
  width: 100%;
  &:hover .post-square__when-text,
  &:hover .post-square__when-place { color: var(--kind-accent, currentColor); }
}
// The WHEN never yields; the WHERE does (the 2026-08-10 argument: a trimmed
// place is better than a trimmed date, and the author beside them never
// loses a letter either way). The pin glyph leads the place (2026-09-21).
.post-square__when-text { flex: 0 0 auto; }
.post-square__when-sep { flex: 0 0 auto; opacity: 0.55; }
.post-square__when-place {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
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
  // 1440×900: 148px of card chrome (the CAP 26 — measured; a one-line strip
  // of 24 plus the 2px `--grey-6` rule it closes itself with since 2026-08-22.
  // It touched 29 for one pass that morning, while the frieze band stood
  // inside the box over 3px of padding; the band then left the card for the
  // window's top rail and took its padding with it — + byline
  // 41 — measured on the SPLIT-STAMP arrangement, 2026-08-09's last: author
  // over ago │ two stacked moment chips; the day walked it 42 → 33 → 32 →
  // here, and 2026-08-10's hop-chip move traded a plate off the who line for
  // one on the ago line, leaving the worst case where it was — + rail strip
  // 31 — it was 42, went to 21 across 2026-08-10's run of rail asks (the
  // strip's vertical padding −12, the band's own vertical padding −8 once
  // the chips' rims became the only lane, the band's rim −3) and came back:
  // +3 when the chips became per-TREE bundles holding member plates, +4 when
  // the band's vertical padding returned at a thin 2px, and +10 on the day's
  // last rail ask — the strip's vertical padding restored at 4px (+8) and the
  // band's own rim redrawn at an even 1px (+2), the two dials that turned this
  // row back into an inset panel — then **31** on the day's very last ask,
  // which tightened that padding 4px → 2px (−4) and closed the strip with a
  // hairline of its own (+1): once a rule states the lane, the air in it is
  // doing less work. It takes back 8px of the bands below —
  // + foot 28 — was 30 until the same day's four-cell refit —
  // + margins 7 — the pit's own, halved from 13 on 2026-08-10 when the card
  // closed in on it (user ask); see the `margin` line below —
  // + borders 6 — 3 of the card's own 1.5px pair since
  // 2026-08-07, 1 of the pit's, and the LABEL STRIP'S TWO CLASSIC HAIRLINES
  // (2026-08-10's last two asks): the byline's `border-bottom` back on the
  // byline→labels seam after a pass with it bare, and the rail strip's own on
  // the labels→content seam, which brackets the strip in plain `--grey-6`
  // where rgb bands briefly did — + ONE rgb band at 6, the
  // foot's, which is the only one left: the label bracket's thin pair (4px
  // each) went when the strip took a rim of its own. The cap's band is not
  // among them either — the frieze closes that seam since 2026-08-10, and a
  // frieze is the variable term below, not a px one.
  // ⚠ 143 is MEASURED as `card − pit-outer − frieze` + the pit's own margin
  // (13px then, 7px since 2026-08-10), not summed from the parts: at 1.5px
  // borders and sub-pixel band heights the sum lands ~2px high), then
  // inside the pit 16px of padding,
  // ~70px of the Mini's own header and foot, ~21px of embed caption and
  // ~20px of block margin. Budget + all of that = the ceiling, which is the
  // point: a card holding one medium comes out exactly full, with nothing to
  // scroll for.
  //
  // ⚠ THE FORMULA IS PX-ONLY AGAIN SINCE 2026-08-22 — no variable term at all.
  // From 2026-08-07 the frieze band was the one part of this chrome that could
  // not be folded into a px total (`0.55 × --frieze-h`, viewport-relative, so
  // it was subtracted as itself while its two 1px rules went into the constant,
  // 280 → 282). The band has left the card for the window's top rail, and the
  // whole term left with it: −2 for the rules, −`0.55 × --frieze-h` for the
  // plate, +2 for the cap's own closing rule — landing the constant back on
  // **276** by three moves that cancel. Anything viewport-relative that ever
  // joins this card's chrome goes back OUTSIDE the constant, the same way.
  // The band's former mirrored twin is an `RgbHairline` now, at a flat 6px
  // (2px + 2px + 2px). There were THREE of those for one pass on 2026-08-10 —
  // 14px in the constant, the label bracket's pair riding thin at 4px each —
  // and the same day's last rail ask took the pair back out: ONE is left, over
  // the foot, unconditional. Worst case is still what the constant carries:
  // a card with no labels draws no rail strip at all and is that much to the
  // good. Both of the card's motif bands are gone from this seam now: the
  // `RgbHairline` that used to close the cap went down to the foot in 2026-08-09,
  // the frieze that replaced it went to the top rail on 2026-08-22, and what
  // closes the cap is the cap's own 2px `--grey-6` border — the only line on
  // this square at neither the card's weight nor its ink.
  //
  // Keep it in step with the 60vh ceiling and with the Mini's chrome — grow
  // one without the other and you get either a player that needs a scroll or
  // a small player in a half-empty card. The 120px floor is for the narrowest
  // columns, where the subtraction would otherwise go negative.
  //
  // ⭐ **270 SINCE 2026-09-13** — the foot's `RgbHairline` (6px) became a 1px
  // rule (−5) and the label strip's own rule went (−1) when the strip moved
  // under the pit (its padding re-split 2/2 → 0/4, no change). Measured, not
  // derived: the labelled card's non-pit chrome read 142px before the ask
  // and 136px after (`flow-feed-card-rows.mjs` reads the rows), −6 exactly.
  // ⭐ **251 THE SAME DAY** — the byline's one-line pass (face 18, padding
  // 2px, one row) took the band 41.75 → 23px; chrome measured 136 → 117.25,
  // −18.75, carried as −19 (over-subtracting a quarter pixel keeps a maxed
  // medium inside the card; under-subtracting would not).
  // ⭐ **243 THE SAME DAY** — the foot's DENSITY PASS (votes one row, every
  // cell `2px 8px`, every control 16px; the foot's own note) took the strip
  // 28.22 → 20px; chrome measured 110.25 → 102.03 (pit margins excluded this
  // time, the same 7px either side of the delta), −8.22, carried as −8: the
  // constant stays 0.22 above the measured chrome, which is the side a
  // maxed medium wants to be on.
  // ⭐ 233 since 2026-09-22 (was 243) — THE BYLINE'S 2×2 PASS: the band grew 25 → 45 (the
  // author pill two rows tall) and the label strip under the pit went (its rail is the
  // band's second row), so the labelled card's non-pit chrome MEASURED 113.14 → 103.11:
  // carried −10. Every card carries the rail row now, so labelled and bare cards share
  // one chrome and this constant is no longer a worst case. The expanded twin above
  // moved with it (275 → 265); flow-feed-card-rows reads both off the CSSOM.
  // ⭐ 225 since 2026-09-22 PM (233 that morning) — THE DENSE PASS: the band
  // 45 → 37 (rows 16 on a 2px lane, the pill a 34px grid, 1px pads), chrome
  // MEASURED 103.11 → 95.11, carried −8. The expanded twin above moved with it.
  --media-max-h: max(120px, calc(min(var(--post-square-max, 100cqw), 60vh) - 225px));

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
  // ── THE BLEED CONTRACT (2026-08-23, user ask: "remove the padding between
  // the mini node viewer's right border and the post card's content
  // container's right border, and also the left") ──────────────────────────
  // This box IS the content container, and its 10px side inset is what stood
  // between a quoted panel's borders and its own. Rather than hard-code the
  // pull-out at the other end, the pit PUBLISHES its inset and the panel
  // reads it — the same publisher/consumer seam `--media-max-h` uses two
  // lines up, and for the same reason: the number is a fact about THIS box,
  // so it should be stated here once and consumed, never mirrored. A surface
  // publishing nothing leaves the panel at its `0px` fallback, i.e. unbled.
  // ⚠ `overflow-x: hidden` above is why the contract is the padding EXACTLY:
  // a panel pulled further than this would be clipped, not shown.
  --quoted-bleed-x: 10px;
  padding: 8px var(--quoted-bleed-x);
  // LESS ROUNDED since 2026-08-10 (same ask): `7px` → `3px`. Seven was
  // `--radius-sm`, the platform's panel radius, which is right for a panel
  // FLOATING on a surface and wrong for a frame set INTO one — at the new
  // margin the pit sits nearly flush with the card's own corners, and a soft
  // radius that close to a crisp one reads as a mistake in the smaller box
  // rather than as a style. Three is the tightest step still visibly a curve
  // (it is the radius the scrollbar thumbs already run), so the pit reads as
  // cut into the card rather than laid on it — the same argument as its flat,
  // carve-free surface below.
  // ⭐ SLIGHTLY ROUNDER since 2026-09-13 (user ask, "make its corners
  // slightly rounder"): 3 → 5px. One step past the card's own 4px corner —
  // the pit is inset from the card's edge by its margins, so a radius a
  // hair over the card's reads as a softer inner frame, not as the mismatch
  // the 2026-08-10 note above guards against (that was 7 against a 2px
  // card corner, three and a half times over; this is five against four).
  // ⭐ **THE FOOT PILL'S CORNER since 2026-09-21** (user ask, "make the
  // corners of the content container … match the post pill on the footer"):
  // 5 → `6.34px`. The card's foot wears the nano pill in its EXTENDED state
  // (`MicroChip.is-extended`, PM8c), whose corner is a RATIO — `--chip-half-h`
  // (0.7em + 2px) × `--round` 0.7 — and on THIS card's foot that resolves to
  // (0.7 × 10.08 + 2) × 0.7 = 6.3392px (the chip is 0.72em of the card's
  // 14px). A flat px here rather than the calc, because the pit's em is
  // 12.32 (its own 0.88em), not the chip's — the ratio restated in the pit's
  // em would resolve to a different corner and only LOOK like the same law.
  // The 2026-09-13 argument holds one step further: 6.34 against the card's
  // 4 still reads as a softer inner frame, not as an attempt at the outer
  // corner. Two decimals (`border-radius` takes fractions — the veil's note).
  // ⚠ Moves with the chip: retune `--round` / `--chip-half-h` in MicroChip,
  // or the foot chip's font size, and this number follows BY HAND —
  // `flow-feed-card-rows` measures both and holds them equal.
  border-radius: 6.34px;
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
  border: 1px solid var(--grey-5, #bdbdbd);
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
// ⭐ THE STRIP IS GONE (2026-09-22, user ask: "adapt the second row below to
// contain the current label slider that is on top of the footer"). The rail
// stands in the BYLINE's right column now — `.post-square__rail-row`, a
// `.post-square__byline-row` (18px, flex, 4px gap), the column's second row
// — and the card has no separate label strip: it reads cap │ byline │ pit │
// hairline │ foot on every card. The strip's insets, its rule, its 0/4
// split (2026-08-10 → 09-13) are history: the ROW is the lane now, and the
// row's `+` cell holds while the rail gives (`flex: 1 1 auto` + `min-width:
// 0` below — 2026-08-10's arithmetic, kept). `.post-square__rail-strip` has
// no rule and no consumer.

.post-square__rail {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  // 3px since 2026-09-22 (was 4): the row is 18px and the plates 16, and the
  // lane between plates came down with their padding ("reduce its padding so
  // it remains readable").
  gap: 3px;
  flex: 1 1 auto;
  min-width: 0;
  // ⭐ 2026-09-22 — THE BOX IS GONE. The rail was a rimmed, rounded,
  // grey-floored PANEL (1px `--grey-5` rim, 10px corners — the head of a
  // rail 10 › bundle 7 › member 5 radius family — a `--grey-5` floor that
  // walked the greys across 2026-08-10's asks, `2px 4px` of padding: the
  // long note above is that panel's record) standing in a strip of its own.
  // In an 18px row a box inside a box is chrome on chrome: the rail is a
  // bare SCROLLER now, its plates the only drawn things, 16px tall on the
  // row's 18 — ⚠ CENTRED, not padded: `overflow-y: hidden` (a horizontal
  // scroller cannot leave the other axis visible) clips anything past the
  // row, so the plates' 1px of clearance a side is all there is. The run-in
  // lead stays 2px (a scroller with no lead reads as content already cut
  // off at rest — the one thing that dial exists to prevent).
  // `--row-h` since 2026-09-22 PM (was --pill-h − 2 = 18): the rail is the
  // row, and its 16px plates fill it EXACTLY — no clearance, none needed
  // (equal heights under `overflow-y: hidden` clip nothing).
  height: var(--row-h);
  padding: 0 2px;
  border: 0;
  border-radius: 0;
  background: transparent;
  overflow-x: auto;
  overflow-y: hidden;
  // ⚠ NO VISIBLE SCROLLBAR (2026-09-22). A 4px horizontal bar takes its 4px
  // from the scroller's content box — 16px plates + 4 = 20 in an 18px row,
  // and the plates would lose their feet on exactly the cards that
  // overflow. The rail still scrolls (wheel, trackpad, drag); the overflow
  // shows as a plate cut at the right edge, which is what a scroller looks
  // like. (Was a 4px thumb at 25% ink on a transparent track.)
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
  // `is-empty` — a card with no labels: nothing to draw and nothing drawn,
  // the `+` cell alone at the row's end; the row keeps the band's height.
  &.is-empty { min-width: 0; }
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
  gap: 3px;
  // Natural width, never squeezed (2026-07-25): inside a horizontal scroller
  // a shrinkable plate would compress to fit the visible box and there would
  // be nothing to scroll — the point is that the rail runs PAST its own
  // right edge.
  flex: 0 0 auto;
  // ⭐ 2026-09-22 — 16px TALL on the row's 18, `0 3px` (was `1.5px 4px`, and
  // ~24px measured): the ask's "reduce its padding so it remains readable".
  height: 16px;
  box-sizing: border-box;
  padding: 0 3px;
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
  //
  // ⭐ `--red-3` SINCE 2026-09-13 (user ask: "recolor the labels section with
  // purple tones to red tones and make them slightly more visible"), off the
  // `--indigo-2` the plate wore since 2026-08-10. RED is the labels family —
  // the label maker's window went red on 2026-09-07 (`--labels-contrast` is
  // `--red-7`) and the card's rail is the one other place labels are drawn
  // as chrome, so the two now speak one family. "Slightly more visible" is
  // ONE INDEX UP: Material 100 → 200 (indigo-2 #c5cae9 → red-3 #ef9a9a,
  // luma ~204 → ~180), a line you see without looking for it, still a tint.
  // ⚠ The tiers used to be told apart by FAMILY at one index (indigo plate,
  // deep-purple members). One family cannot do that, so the INDEX does it
  // now: rim -3 here, ring -4 on the member — see `.post-square__bundle-item`.
  // ⭐ 2026-09-22 — GREY, SOBER (user ask: "remove the subtle red outline
  // from the labels, leaving a gray sober one, but paint its text and icons
  // with dark red quasar tones"): the rim is the card's own hairline grey-5,
  // and the labels' RED moved off the LINES onto the INK — every word, mark,
  // seam and glyph on the plate is red-9 at rest and red-10 under the
  // pointer (the rules below). One line, one grey: the 0.5px grey-7 outer
  // ring is gone with the band it stated the plate against (the note above
  // is that ring's record).
  border: 1px solid var(--grey-5, #bdbdbd);
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
  box-shadow: none;
  // `7px` since 2026-08-10's last rail ask (it was 4px) — the middle tier of
  // the rail's nested radius family, rail 10 › HERE › member 5. See
  // `.post-square__rail`: the three move together.
  // `5px` since 2026-09-22 — the family is bundle 5 › member 3 now that the
  // rail's 10px box is gone (7 › 5 under it before); on a 16px plate 5 is
  // the 6–7px card family's next step down.
  border-radius: 5px;
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
    // ⭐ `--red-7` SINCE 2026-09-13 (the red re-family) — the labels window's
    // own contrast index, off `--deep-purple-11`. Not the family's A100 (the
    // old rim's index): `--red-11` (#ff8a80) is LIGHTER than the resting
    // `--red-3` rim, so the hover would have read as the rim fading, and an
    // edge that answers the pointer has to deepen. -7 is the clear step
    // (#e53935, luma ~108) that stays the same hue.
    // ⭐ 2026-09-22 — the rim answers in GREY (grey-7, the divider-plate
    // tone: two steps deeper, same family), the ink in red-10 below — the
    // colour on the state is on the WORDS now, not the edge.
    border-color: var(--grey-7, #757575);

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
    // ⭐ `--red-9` SINCE 2026-09-13 (the red re-family) — ONE hover ink for
    // every mark on this rail (the tree's mark, the `::` seam, the label
    // text, the funnel), off the -8/-9 split indigo ran. The split's reason
    // ("a mark this size wants the step the text does not need") priced
    // indigo's -8 against its -9; red-9 (#c62828) already carries the ink
    // weight both wanted, and one index is one fewer dial to keep in step.
    .post-square__label-mark { background-color: var(--red-10, #b71c1c); }
    .post-square__bundle-sep { color: var(--red-10, #b71c1c); }
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
  // ⭐ red-9 since 2026-09-22 (the ink re-family; was grey-9) — the root's
  // side of the plate speaks in the labels' dark red, red-10 under the
  // pointer with the mark.
  color: var(--red-9, #c62828);
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
  color: var(--red-9, #c62828); // ⭐ 2026-09-22 — the ink re-family (was ink at .62)
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
  // ⭐ 2026-09-22 — 12px in the 16px plate (14 inside its borders, 1px of
  // clearance a side), unit line-height so the 8.7px type is the box.
  height: 12px;
  box-sizing: border-box;
  line-height: 1;
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
  //
  // ⭐ `--red-4` SINCE 2026-09-13 (user ask: purple → red, "slightly more
  // visible"). The plate's rim is `--red-3` at 1px; this ring is `--red-4`
  // at 0.5px, INSET as before. Two indices of one family where there were
  // two families at one index: a single hue cannot tell the tiers apart by
  // family, so the index carries it — and the DEEPER index goes on the
  // THINNER line, because a half-pixel ring renders at roughly half
  // strength and needs a step more ink to read as strongly as the 1px rim
  // around it. Same tone on both would have read as the ring fading.
  // Reading outward from a member now: ring red-4 → member border -5 →
  // plate coat -3 → plate rim red-3 → plate ring -7 → band -5.
  // `--deep-purple-2` has no consumer left; its token stays with a note.
  // ⭐ GONE 2026-09-22 (user ask: "remove the subtle red outline from the
  // labels, leaving a gray sober one"): the member's one edge is its 0.5px
  // grey-5 border above; the red went to the ink. (Was `inset 0 0 0 0.5px
  // --red-4` — the note above is that ring's record.)
  box-shadow: none;
  // `5px` since 2026-08-10's last rail ask (it was 3px) — the innermost tier
  // of the rail's nested radius family, rail 10 › bundle 7 › HERE.
  border-radius: 3px; // 2026-09-22: bundle 5 › member 3 (was 7 › 5 under the rail's 10)
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
  // ⭐ 2026-09-22 — DARK RED QUASAR TONES (user ask): the ancestor steps in
  // red-9 (#c62828), the leaf in red-10 (#b71c1c, below) — the ~one-index
  // spread that made the path read as "context › THING" when it was two
  // ink alphas (.62 / .9), now two indices of the labels' family. The
  // separators (`›`) inherit and keep their .55.
  color: var(--red-9, #c62828);
  line-height: 1;

  // The LABEL answers for itself, where the plate around it answers for the
  // tree: ink only, no coat of its own. `--indigo-9` is the same ink the
  // member took while it was a chip in its own right.
  // ⭐ `--red-9` SINCE 2026-09-13 — the rail's one hover ink (see the plate's
  // hover note); the leaf and the funnel take the same token below.
  &:hover { color: var(--red-10, #b71c1c); } // 2026-09-22: the hover ink is red-10 now (rest is red-9)
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
    color: var(--red-10, #b71c1c); // ⭐ 2026-09-22 — the leaf in the family's deepest index
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
// 20.03px and the rail band 26px (34 with the strip's padding and rim since
// 2026-08-10's last rail ask), so the pit's `--media-max-h` constant is
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
  background-color: var(--red-9, #c62828); // ⭐ 2026-09-22 — the ink re-family (was grey-9); red-10 on the plate's hover
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
.post-square__label:hover .post-square__label-step.is-leaf { color: var(--red-10, #b71c1c); } // 2026-09-22: red-10, the hover ink

// The chip's FUNNEL (2026-08-01) — the second door into the label lens:
// filter the stream by this chip without leaving the feed. Hover-revealed
// (the rail is a hover surface already; touch has the head band's picker),
// and pulled against its chip's gap so the pair reads as one unit.
.post-square__label-filter {
  flex: 0 0 auto;
  border: 0;
  background: transparent;
  color: var(--red-9, #c62828); // ⭐ 2026-09-22 — the ink re-family (was ink at .45; revealed at .6 opacity below)
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
  // ⭐ `--red-9` SINCE 2026-09-13 — the rail's one hover ink (plate hover note).
  &:hover { opacity: 1 !important; color: var(--red-10, #b71c1c); } // 2026-09-22: red-10, the hover ink
}

// THE ADD CELL in an 18px row (2026-09-22): the cap-act's 20px box would
// overhang the row by a pixel a side, so it is the row's height here; the
// glyph keeps its 14. Still no action (the note in the template).
.post-square__rail-add {
  width: var(--row-h);
  height: var(--row-h);
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
//
// ⭐ THREE DIALS SINCE 2026-09-13's DENSITY PASS (user ask: "homogenize the
// size of the footer bar subsections and buttons and text … reduce the
// padding on top and bottom"). The four cells had drifted into four
// paddings (4/8, 4/8, 4/9, 3/9) and three gaps (4, 8, 1), and the strip's
// height was whichever cell happened to be tallest — the votes column, at
// 28.22px. Now every cell reads the same three numbers off the strip:
//   `--foot-ctl`  16px — the height of EVERYTHING standing in a cell: both
//                 buttons, the chip, each tally's line box. One register
//                 under the cap's 20px control, as the foot has always been.
//   `--foot-pad`  2px 8px — each cell's padding (the strip itself stays
//                 unpadded so the rules meet its edges square, see above).
//   `--foot-gap`  6px — between the things a cell holds.
// So the strip is 16 + 2 + 2 = 20px tall by construction, not by whichever
// member overshoots, and the next thing added to a cell inherits the height
// instead of setting a new one. Measured 28.22 → 20; both `--media-max-h`
// constants carry the −8 (the pit's note).
.post-square__foot {
  --foot-ctl: 16px;
  --foot-pad: 2px 8px;
  --foot-gap: 6px;
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
  background: var(--grey-5, #bdbdbd);
}

// THE REFERENCES CELL, at the far LEFT edge — one control, rigid, the mirror
// of the cap's expand lead at the other end of the card.
.post-square__foot-lead {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  padding: var(--foot-pad);
}

// THE ADDRESS CELL — the only one that gives. `min-width: 0` is what lets the
// chip's hash ellipsize instead of pushing the three rigid cells off the card
// (a flex-basis is a request; content overrules it — gotchas.md).
.post-square__foot-main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--foot-gap);
  padding: var(--foot-pad);
  overflow: hidden;
}

// THE TALLY CELL — comments and forks, measured by what it holds.
.post-square__foot-side {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: var(--foot-gap);
  padding: var(--foot-pad);
}

// THE VOTES CELL, closing the strip at the far RIGHT edge — up then down,
// ONE ROW, the tally cell's twin. ⭐ It was a COLUMN from 2026-08-10 to
// 2026-09-13 (up over down, rows tightened to `line-height: 1.15` "so two of
// them stand in about the height one tally row did") — they did not, quite:
// two 10.6px rows + 1px gap + 6px padding = 28.22, and that was the strip's
// height, 2px over every other cell. The density pass laid the pair flat
// (user ask) and the cell reads the strip's three dials like the others.
.post-square__votes {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: var(--foot-gap);
  padding: var(--foot-pad);
}

// The foot's own controls — the references button and the copy. Chromeless
// until hovered, exactly as the cap's `__cap-act`: this strip is read far
// more often than it is pressed. A SEPARATE class from the cap's for the
// reason `__foot-rule` is separate, and one register smaller (`--foot-ctl`
// 16px against 20px; 18px until 2026-09-13's density pass) — the foot's type
// is smaller than the cap's, and a button drawn to the cap's size stood
// taller than the chip it sits beside. Both glyphs 12px since the same pass
// (the references mark was 14 beside a 12 copy).
.post-square__foot-act {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: var(--foot-ctl);
  height: var(--foot-ctl);
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

// THE AUTHOR PILL — `.post-square__pill` with no kind: the cream face, grey-8
// words (2026-09-21, user ask: "in a cream color with grey text"), the
// profile picture at the head. Still the entity DOOR it has been since
// 2026-09-11: a `#/entities/<id>` router-link, caught by
// `utils/entityDoor.js`'s capture-phase listener → the entity window (the
// page stays a modifier click away). `flex: 0 0 auto` — the author never
// yields; the moment pill beside it is the one that ellipsizes. Hover keeps
// the identity's cyan on the name.
.post-square__identity {
  flex: 0 0 auto;
  // ⭐ 2026-09-22 — TWO ROWS TALL (user ask: "twice as tall and keep the
  // layout and paddings very dense"), and ⭐ THE SAME EVENING A GRID (user
  // ask: "make the author profile pic occupy the whole chip height so we
  // put the org badges below the name … reduce the vertical padding … as
  // much as possible"): two columns — the FACE, spanning both rows, and
  // beside it the NAME over the SEATS — two rows of `--row-h − 1px` (the
  // pill's own border a side is the difference from the column's rows) with
  // `--row-gap` between, so the pill's height is the column's: 2 × 16 + 2 =
  // 34 (was 40 with 18px rows and a 2px lane; before that one 20px row).
  // No vertical padding at all — the rows centre their own contents and
  // the face's 1px inset is the pill's inner height minus 30. The CORNER
  // keeps the ROW UNIT's law (7px off `--pill-h` 20 — not off the pill's
  // own height): every corner on this card turns in the 6–7px family.
  // ⚠ A `<div>`, and the door is ONE anchor drawn `display: contents`
  // (`__identity-door`) so its two children — the face and the name — are
  // the GRID's items while the seats (siblings of the door, since
  // interactive content cannot nest in an anchor) take the third cell.
  --author-h: calc(2 * var(--row-h) + var(--row-gap));
  --face-inset: 1px;
  // ⭐ THE ENTITY FAMILY'S DIALS (2026-09-22 PM, blue-grey): the pill reads the
  // chip's two names off the family's tokens — the name in the entity INK, the
  // hover wash in the ACCENT — as the moment pill reads the moments kind's.
  --kind-accent: var(--entity-accent, #546e7a);
  --kind-ink: var(--entity-ink, #263238);
  // ⭐ THE VEIL (2026-09-22 PM4, user ask: "apply the same veil on the author
  // chip used on the post cards and the button on the footer") —
  // `--identity-coat`: the identity window's coat, the entity family's pale
  // (blue-grey-1) at 40% over the same light-cream sheet every pill wears
  // (the nano pill's `--plaque-coat` is that sheet under the bar's grey-3).
  // A layer list, so the hover restates it under the pill's 12% accent wash
  // as a third layer (the base pill's `color-mix` over a list would be
  // dropped as invalid).
  background: var(--identity-coat, var(--plaque-coat));
  &:hover {
    background:
      linear-gradient(color-mix(in srgb, var(--kind-accent) 12%, transparent), color-mix(in srgb, var(--kind-accent) 12%, transparent)),
      var(--identity-coat, var(--plaque-coat));
  }
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-rows: calc(var(--row-h) - 1px) calc(var(--row-h) - 1px);
  grid-template-areas: 'face name' 'face seats';
  column-gap: 4px;
  row-gap: var(--row-gap);
  align-items: center;
  height: var(--author-h);
  padding: 0 6px 0 var(--face-inset);
  // The face: the pill's first column, both rows, 30px in the 32px inner
  // height (`:size` in the template — move it with the dials); its corner
  // concentric with the pill's: 7 − 1 (border) − 1 (inset) = 5px.
  :deep(.entity-avatar) {
    grid-area: face;
    align-self: center;
    border-radius: calc(var(--chip-half-h) * var(--round) - 1px - var(--face-inset));
  }
  &:hover .post-square__identity-name { color: var(--entity-accent, #546e7a); } // the family's accent (2026-09-22 PM; was cyan-14)
}

// THE DOOR ROW — the face and the name, still the entity door it has been
// since 2026-09-11: the pill's one `#/entities/<id>` anchor, caught by
// `utils/entityDoor.js`'s capture-phase listener → the entity window (the
// page a modifier click away). 18px, the band's row less the pill's borders.
// THE DOOR — still the entity door it has been since 2026-09-11: the pill's
// one `#/entities/<id>` anchor, caught by `utils/entityDoor.js`'s
// capture-phase listener → the entity window (the page a modifier click
// away). ⭐ `display: contents` since 2026-09-22 PM: the anchor draws NO BOX
// of its own so the face and the name it wraps are laid out by the pill's
// grid (face down the left, name top right); a click on either still
// resolves `closest('a[href]')` to this anchor, and `:hover` on it still
// lights the name. ⚠ Its own rect is 0×0 — witnesses measure its children.
.post-square__identity-door {
  display: contents;
  color: inherit;
  text-decoration: none;
}

// THE SEATS ROW (2026-09-22) — one chip per organization the person holds a
// seat in, `author.affiliations` off the feed. The door row's twin: 18px,
// its chips 14 inside it with 2px of air a side. Empty (a person with no
// seat, an org authoring as itself) it still stands, so every author pill
// is the same 40px and the band never jumps between cards.
.post-square__identity-seats {
  display: flex;
  align-items: center;
  gap: 3px;
  flex: 0 0 auto;
  // The grid's bottom-right cell since 2026-09-22 PM (was the pill's whole
  // second row): `--row-h − 1px` = 15, its 14px chips centred; no lead — the
  // face's column is the lead now.
  grid-area: seats;
  height: calc(var(--row-h) - 1px);
  min-width: 0;
  padding-left: 0;
}

// ONE SEAT — the org's FACE (a `#/entities/<org entity>` anchor → the org's
// entity window, drawn as an org there) then its BADGES. The nano pill's
// material one register smaller: 14px, the 18% ink hairline, the corner by
// the chip's law (70% of 7 = 4.9px), the face flush with the rim's inside
// (12px in 14 with a 1px border, `--grey-2` under it so the chip reads as a
// token lying on the pill's cream). `is-active` = the seat the post was
// PUBLISHED UNDER (the author IS that seat's mask — `affiliations[].active`
// off the feed): the entities' cyan-9 on the rim, the one fact the
// standalone OrgLogoChip beside the name used to carry.
.post-square__seat {
  --seat-h: 14px;
  display: inline-flex;
  align-items: center;
  gap: 1px;
  flex: 0 0 auto;
  height: var(--seat-h);
  box-sizing: border-box;
  padding: 0 2px 0 0;
  border: 1px solid rgba(var(--ink-rgb), 0.18);
  border-radius: calc(var(--seat-h) / 2 * var(--round));
  background: var(--grey-2, #f5f5f5);
  overflow: hidden;
  transition: border-color 0.12s, background 0.12s;
  &:hover { background: var(--grey-1, #fafafa); }
  &.is-active { border-color: var(--entity-accent, #546e7a); }
}
.post-square__seat-face {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  line-height: 0;
  text-decoration: none;
  color: inherit;
  // The mark's corner concentric with the chip's — 4.9 − 1 ≈ 4px over the
  // chip's own 26% (3.1px on 12): the identity pill's face rule restated one
  // register down. Its hairline shadow goes: the seat's rim is the edge.
  :deep(.org-logo-chip__mark) { border-radius: 4px; box-shadow: none; }
}
// A BADGE — the role's glyph (`utils/roleBadges.js`: shield_person for an
// admin seat, badge for a titled member, person for an untitled one; the
// title on hover), a BUTTON since its door is a fetch, not a route. The
// entities' cyan-9, the seat's own family; cyan-10 under the pointer on the
// card's act-button wash.
.post-square__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 12px;
  height: 12px;
  padding: 0;
  border: 0;
  border-radius: 3px;
  background: transparent;
  color: var(--entity-accent, #546e7a);
  cursor: pointer;
  line-height: 1;
  transition: background 0.12s, color 0.12s;
  &:hover { background: rgba(var(--ink-rgb), 0.08); color: var(--entity-ink, #263238); }
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
// (`.post-square__trust` — the byline's `[1 hop]` plate, Thread J's face on
// the feed since 2026-07-29 — is GONE since 2026-09-13, user ask: the hop
// count lives on the entity window's origin constellation now,
// `entities/OriginSky.vue`. The API still sends `author.trust`.)

// HEAT CHIP (2026-08-07) — the trust chip's recipe with the tones flipped
// warm: under `order=heat` the card states its own score, so the ordering
// reads as the heat map it is.
.post-square__heat {
  // `0` since 2026-09-22 — it stands after the full-width moment pill in the
  // byline's first row; the `-3px` tucked it against the org badge that was
  // beside the author (gone — a seat inside the pill now).
  margin-left: 0;
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

// The name — the pill's words, on the pill's own face and size (Space Mono
// 0.72em off `.post-square__pill`; the display face and the 700 weight went
// with the identity block on 2026-09-21).
.post-square__identity-name {
  // The grid's top-right cell since 2026-09-22 PM (`grid-area: name`); the
  // 14.1px line box centred in the 15px row.
  grid-area: name;
  align-self: center;
  flex: 0 0 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

// The foot's tallies. NASALIZATION since 2026-08-10 (user ask) — `'Space
// Mono', monospace` was the last typeface on this card that was not the
// display one, and these are COUNTS, not addresses: nothing about `0` needs a
// fixed advance width. With this the whole square letters in one face, cap to
// foot. The line box is the strip's control height (`--foot-ctl`, 2026-09-13)
// so a tally and the button beside it stand the same 16px — the votes' own
// tightened rows and the default 1.5 both went with the density pass.
.post-square__stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  line-height: var(--foot-ctl, 16px);
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
  // ⚠ NO CONTROLS OVERRIDES ANY MORE (2026-08-21). This block invented the
  // single-row arrangement in 2026-08-08 — row, stretch, natural-width
  // bundle, the bar taking the slack — and the manual-band pass promoted all
  // of it to the BASE, so the phone and the desktop run the same section and
  // only the head box's own media block (which wraps the band into two rows)
  // says anything phone-shaped about it.

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
  // (the name's narrow size — 0.66em — stood here until 2026-09-21: the name
  // is the author PILL's words now, on the pill's own 0.72em; a second
  // multiplier would shrink it under the face beside it.)

  // The hop chip travels with them: it leads the ago line now, and a plate
  // dialled for the desktop band would out-weigh the name it sits under.
  // (the handle's and the hop plate's narrow-column sizes stood here until
  // 2026-09-13 — both elements are gone from the band.)

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
  // …the moment PILL since 2026-09-21 (the `__byline-when` block it names
  // is gone; the pill is the yielding item at every width, this is the
  // narrow width's harder ratio).
  .post-square__when {
    flex: 0 20 auto;
    min-width: 0;
  }
  // (`.post-square__moment-chip { max-width: 100% }` stood here until
  // 2026-09-13 — the chips are gone and `.post-square__when` states its own
  // `max-width: 100%` at its base rule, so the narrow column needs nothing
  // more: the `0 20 auto` above is what makes the one text run give first.)
}
</style>
