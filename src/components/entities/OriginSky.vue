<template>
  <!-- THE ORIGIN CONSTELLATION's sky itself (2026-07-30 as the body of
       OriginTree's dialog; its own component since 2026-09-11, when the
       entity WINDOW wanted the sky INLINE — a block in the window's side
       column, no dialog). OriginTree is the dialog host that still mounts
       it for the profile page's button; EntityFace mounts it bare. Same
       stars, same thread, same disclosure switch; `inline` only changes
       the box (full width, capped height, no close button). -->
  <div class="origin-sky" :class="{ 'origin-sky--inline': inline }">
    <!-- drifting starfield — three parallax layers of pure CSS stars -->
    <div class="origin-sky__stars origin-sky__stars--far" />
    <div class="origin-sky__stars origin-sky__stars--mid" />
    <div class="origin-sky__stars origin-sky__stars--near" />

    <div class="origin-sky__head">
      <q-icon name="hub" size="18px" />
      <span>Origin constellation</span>
      <q-space />
      <!-- ⭐ THE HOP LINE (2026-09-13, user ask: "for the flyout window for
           entities, include the hop thing on the constellation section").
           The viewer's distance to this entity through the vouch tree —
           the `[n hops]` plate the feed card's byline wore from 2026-07-29
           until today, moved to where the chain is DRAWN. `trust` rides
           the origin read (`{ hops, path }`, docs/concepts/trust.md); the
           tooltip walks the path, "you" first, as the plate's did. -->
      <span
        v-if="hopsLabel"
        class="origin-sky__hops"
        :class="{ 'origin-sky__hops--you': trust.hops === 0 }"
        :title="hopsTitle"
      >
        <q-icon name="connect_without_contact" size="13px" />
        {{ hopsLabel }}
      </span>
      <q-btn v-if="!inline" flat dense round icon="close" size="sm" @click="$emit('close')" />
    </div>

    <div v-if="loading" class="origin-sky__center">
      <q-spinner-orbit color="amber" size="42px" />
    </div>

    <div v-else-if="chain.length" class="origin-vine">
      <!-- The chain renders BOTTOM-UP: you stand at the bottom, the
           thread unravels upward through your identities to your root,
           then climbs the invitation chain to the pioneer's star. -->
      <template v-for="(card, i) in displayChain" :key="card.id ?? 'fog'">
        <!-- connector ABOVE each node (not for the last/topmost) -->
        <div
          v-if="i > 0"
          class="origin-vine__thread"
          :class="`origin-vine__thread--${card.edgeUp}`"
          :style="{ animationDelay: `${i * 0.28}s` }"
        >
          <svg viewBox="0 0 40 64" class="origin-vine__svg">
            <path
              d="M20 64 C 8 48, 32 32, 20 16 L 20 0"
              fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" class="origin-vine__path"
            />
          </svg>
          <span class="origin-vine__caption">{{ edgeCaption(card.edgeUp) }}</span>
        </div>

        <!-- the node itself -->
        <div
          v-if="card.fog"
          class="origin-node origin-node--fog"
          :style="{ animationDelay: `${i * 0.28}s` }"
        >
          <q-icon name="blur_on" size="34px" />
          <div class="origin-node__name">the thread fades here</div>
          <div class="origin-node__sub">this identity keeps its origin private</div>
        </div>
        <div
          v-else
          class="origin-node"
          :class="{
            'origin-node--self': card.edge === 'self',
            'origin-node--pioneer': card.isPioneer
          }"
          :style="{ animationDelay: `${i * 0.28}s` }"
        >
          <!-- A star is an entity link — and since 2026-09-11 every entity
               link is a door to that entity's WINDOW (utils/entityDoor). -->
          <!-- ⭐ THE REAL FACE (2026-09-13, user ask: "include the actual
               profile pictures there"). The star passed `entity-id` and
               `photo` — two props `EntityAvatar` never declared (it takes
               `entity`, `id`, `size`), so every star fell through to the
               monogram. The chain card already carries the photo card
               (`{ url, ref }`, or null for a faceless / undisclosed face)
               and the name; handed over as `entity`, the avatar draws the
               picture and never fetches. A FACELESS card (photo null — the
               pioneer by seed, or a face the viewer may not see) is handed
               only its `id` instead, so the avatar resolves the summary
               itself and the pioneer earns its star glyph rather than a
               monogram. -->
          <router-link :to="`/entities/${card.id}`" class="origin-node__ring">
            <EntityAvatar
              :entity="card.photo ? { id: card.id, display_name: card.name, photo: card.photo } : null"
              :id="card.id"
              :size="card.edge === 'self' ? 52 : 42"
            />
          </router-link>
          <div class="origin-node__name">
            <q-icon v-if="card.isPioneer" name="star" size="13px" class="origin-node__star" />
            {{ card.isPioneer ? 'pioneer' : card.name }}
          </div>
          <div v-if="card.edge === 'self'" class="origin-node__sub">{{ inline ? 'this entity' : 'you are here' }}</div>
        </div>
      </template>

      <!-- the owner's disclosure switch, on the sky itself -->
      <div v-if="owns && selfIsAlterEgo" class="origin-sky__disclosure">
        <q-toggle
          :model-value="!concealedForOthers"
          color="amber"
          dense
          :label="concealedForOthers ? 'origin hidden from others' : 'origin visible to everyone'"
          @update:model-value="toggleDisclosure"
        />
      </div>
    </div>

    <div v-else class="origin-sky__center origin-sky__empty">
      nothing to unravel
    </div>
  </div>
</template>

<script>
// The ORIGIN CONSTELLATION (2026-07-30) — an entity's lineage drawn as a
// night sky: you at the bottom, the thread unraveling upward through your
// alter-egos to your root identity, then climbing the invitation chain
// star by star to the pioneer. Data = GET /entities/:id/origin — the
// server has already enforced disclosure, so a concealed edge arrives as
// a terminated chain and renders as fog, never as a redacted name.
//
// The thread is one repeated SVG bezier whose stroke "draws" upward
// (dashoffset animation), staggered per node — the unravel is the
// animation. Owners of an alter-ego get the disclosure toggle right here
// on the sky: privacy where you'd look for the thing it hides.
//
// Loads on mount and again whenever the entity changes — inside the
// dialog that is the dialog's show (it mounts its content lazily), inside
// the entity window it is the window's retarget.
import { defineComponent, ref, computed, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { entityService } from 'src/services/entity.service'
import EntityAvatar from './EntityAvatar.vue'

export default defineComponent({
  name: 'OriginSky',
  components: { EntityAvatar },
  props: {
    entityId: { type: Number, required: true },
    // A block in a column rather than a dialog's card.
    inline: { type: Boolean, default: false }
  },
  emits: ['close'],
  setup (props) {
    const $q = useQuasar()
    const loading = ref(false)
    const chain = ref([])
    const concealed = ref(false)
    const owns = ref(false)
    // The viewer's `{ hops, path }` to this entity (2026-09-13) — null until
    // loaded, and null from the server when either end is off the tree.
    const trust = ref(null)
    // What OTHERS would see — asked once so the toggle reflects reality.
    const concealedForOthers = ref(false)

    const load = async () => {
      loading.value = true
      const id = props.entityId
      try {
        const r = await entityService.origin(id)
        if (props.entityId !== id) return
        if (r.success) {
          chain.value = r.chain
          concealed.value = r.concealed
          owns.value = r.owns
          trust.value = r.trust || null
          // the server answers what strangers see; null = not an alter-ego
          concealedForOthers.value = r.disclosed_to_others === null
            ? r.concealed
            : !r.disclosed_to_others
        }
      } catch (_) { chain.value = [] }
      loading.value = false
    }

    // chain[i].edge names how entry i connects DOWN to entry i-1, so the
    // connector drawn between them simply wears entry i's edge. The column
    // is flex column-reverse — index 0 (you) lands at the bottom.
    const displayChain = computed(() => {
      const cards = chain.value.map((c, i) => ({
        ...c,
        edgeUp: i === 0 ? null : c.edge,
        isPioneer: !concealed.value && i === chain.value.length - 1 && c.edge === 'invite'
      }))
      return concealed.value
        ? [...cards, { fog: true, edgeUp: 'alter_ego' }]
        : cards
    })

    const selfIsAlterEgo = computed(() => chain.value[0]?.type_id === 4)

    const edgeCaption = (edge) =>
      edge === 'alter_ego' ? 'unravels to' : 'invited by'

    // The hop line's two strings — the feed byline's former `trustLabel` /
    // `trustTitle`, verbatim in meaning: the label states the DISTANCE, the
    // tooltip walks the PATH with "you" in the first seat.
    const hopsLabel = computed(() => {
      const t = trust.value
      if (!t) return ''
      return t.hops === 0 ? 'you' : `${t.hops} hop${t.hops === 1 ? '' : 's'} away`
    })
    const hopsTitle = computed(() => {
      const t = trust.value
      if (!t) return ''
      if (t.hops === 0) return 'This is you'
      const names = (t.path || []).map((p) => p.name)
      if (names.length) names[0] = 'you'
      return `Invite chain: ${names.join(' › ')}`
    })

    const toggleDisclosure = async (v) => {
      try {
        const r = await entityService.setOriginDisclosure(props.entityId, v)
        if (r.success) {
          concealedForOthers.value = !v
          $q.notify({ type: 'positive', message: v ? 'Origin disclosed — the thread is visible to everyone' : 'Origin hidden — others see the thread fade' })
        } else {
          $q.notify({ type: 'negative', message: r.error?.message || 'could not change disclosure' })
        }
      } catch (e) {
        $q.notify({ type: 'negative', message: e.response?.data?.error?.message || e.message })
      }
    }

    onMounted(load)
    watch(() => props.entityId, load)

    return { loading, chain, concealed, owns, concealedForOthers, trust, hopsLabel, hopsTitle, displayChain, selfIsAlterEgo, edgeCaption, toggleDisclosure, load }
  }
})
</script>

<style lang="scss" scoped>
// ⭐ RE-FAMILIED 2026-09-13 (user ask: "adjust its aesthetic to fit the general
// color palette"). It was a NIGHT SKY — deep ink (#0d131b), white stars, a
// mint thread, amber toggles — the one dark object in a window whose every
// other panel is `EntityCard`'s idiom: a white body, a `#f4f7fb` chrome
// band, `#e2e6ed` rules, the `--radius-md` corner, inks off `--ink`. The sky
// is that panel now. What SURVIVES of the night is the drawing — the three
// drifting star layers (ink specks on paper instead of light on dark), the
// bottom-up vine, the unravelling thread — and one warm accent: the pioneer
// gold `#c79a00`, which is the window's own pioneer tint (`EntityCard`'s
// `.pioneer-tint`), on the invite thread, the pioneer's star and the self
// ring. The tokens are `EntityCard`'s, restated here because a scoped panel
// cannot read a sibling's; keep the seven in step with `.subject-panel`.
.origin-sky {
  --panel-chrome: #f4f7fb;
  --panel-body:   #ffffff;
  --panel-rule:   #e2e6ed;
  --panel-ink:    #2C3D4E;
  --panel-ink-1:  #1F2A38;
  --panel-ink-2:  #5b6c82;
  --panel-ink-mute: #8995a8;
  --sky-gold: #c79a00;

  position: relative;
  width: 420px;
  max-width: 92vw;
  max-height: 84vh;
  overflow: hidden;
  border-radius: var(--radius-md, 0.85em);
  background: var(--panel-body);
  border: 1px solid var(--panel-rule);
  color: var(--panel-ink);
  display: flex;
  flex-direction: column;
  // The dialog's lift, on a pale card now — a soft ink shadow, not the
  // night's black one.
  box-shadow: 0 12px 40px rgba(var(--ink-rgb), 0.18);

  // INLINE (2026-09-11): a block in the entity window's column — the
  // column's width, a capped height the vine scrolls inside, the dialog's
  // lift gone (the window already floats; a shadow inside it would read as
  // a second box).
  &--inline {
    width: 100%;
    max-width: none;
    max-height: 380px;
    min-height: 200px;
    box-shadow: none;
  }
}

.origin-sky__stars {
  position: absolute;
  inset: -50%;
  pointer-events: none;
  background-repeat: repeat;
  opacity: 0.9;
}
// each layer is a handful of specks on a 1px dot, tiled by size — INK on
// paper since the re-family (they were white on the night); the far layer
// faintest, the near one a touch of the gold so the sky keeps one warm dust.
.origin-sky__stars--far {
  background-image: radial-gradient(1px 1px at 20px 30px, rgba(var(--ink-rgb), .18) 50%, transparent 51%),
    radial-gradient(1px 1px at 90px 110px, rgba(var(--ink-rgb), .12) 50%, transparent 51%),
    radial-gradient(1px 1px at 160px 60px, rgba(var(--ink-rgb), .14) 50%, transparent 51%);
  background-size: 200px 160px;
  animation: origin-drift 160s linear infinite;
}
.origin-sky__stars--mid {
  background-image: radial-gradient(1.5px 1.5px at 50px 80px, rgba(var(--ink-rgb), .16) 50%, transparent 51%),
    radial-gradient(1px 1px at 130px 20px, rgba(var(--ink-rgb), .14) 50%, transparent 51%);
  background-size: 240px 200px;
  animation: origin-drift 110s linear infinite reverse;
}
.origin-sky__stars--near {
  background-image: radial-gradient(2px 2px at 70px 140px, rgba(199, 154, 0, .35) 50%, transparent 51%);
  background-size: 300px 260px;
  animation: origin-drift 80s linear infinite;
}
@keyframes origin-drift {
  from { transform: translate(0, 0); }
  to   { transform: translate(120px, 80px); }
}

// The head is the panel's CHROME band — EntityCard's own header recipe
// (chrome coat, rule under it, ink-1), the title in small caps as before.
.origin-sky__head {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--panel-ink-1);
  background: var(--panel-chrome);
  border-bottom: 1px solid var(--panel-rule);
  .q-icon { color: var(--panel-ink-2); }
}
.origin-sky--inline .origin-sky__head { padding: 6px 10px; font-size: 0.72rem; }

// THE HOP LINE (2026-09-13) — the feed byline's `[n hops]` plate, relocated:
// the same tiny plate idiom the window's chips use (`rgba(ink, .04)` coat,
// `.15` rim, 6px corner — EntityAnchors' fact chip), lower-case against the
// head's small caps so it reads as a VALUE beside a TITLE. "you" wears the
// gold: the one case where the distance is not a distance.
.origin-sky__hops {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: none;
  white-space: nowrap;
  color: var(--panel-ink-1);
  background: rgba(var(--ink-rgb), 0.04);
  border: 1px solid rgba(var(--ink-rgb), 0.15);
  border-radius: 6px;
  cursor: help;
  .q-icon { color: var(--panel-ink-2); }
  &--you {
    color: var(--sky-gold);
    border-color: rgba(199, 154, 0, 0.45);
    .q-icon { color: var(--sky-gold); }
  }
}

.origin-sky__center {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 0 80px;
}
.origin-sky--inline .origin-sky__center { padding: 30px 0 40px; }
.origin-sky__empty { color: var(--panel-ink-2); font-style: italic; }

// the column: BOTTOM-UP — you at the bottom, pioneer at the top
.origin-vine {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  overflow-y: auto;
  padding: 10px 18px 26px;
  min-height: 0;
}

.origin-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  opacity: 0;
  animation: origin-appear 0.7s ease forwards;

  // The ring around a star: the window's chip coat + rim, the face inside
  // it a REAL picture now (see the template). Hover lifts the rim to ink.
  &__ring {
    display: inline-flex;
    border-radius: 26%;
    padding: 3px;
    background: rgba(var(--ink-rgb), 0.04);
    border: 1px solid rgba(var(--ink-rgb), 0.15);
    transition: border-color 0.2s, box-shadow 0.25s;
    &:hover {
      border-color: rgba(var(--ink-rgb), 0.45);
      box-shadow: 0 2px 10px rgba(var(--ink-rgb), 0.16);
    }
  }
  &__name {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--panel-ink-1);
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  &__sub { font-size: 0.66rem; color: var(--panel-ink-2); }
  &__star { color: var(--sky-gold); }

  &--self &__ring {
    background: rgba(199, 154, 0, 0.08);
    border-color: rgba(199, 154, 0, 0.55);
  }
  &--pioneer &__name { color: var(--sky-gold); }
  &--fog {
    color: var(--panel-ink-mute);
    .origin-node__name { color: var(--panel-ink-2); font-style: italic; font-weight: 400; }
  }
}

// The thread: ink-2 for an alter-ego's unravelling, the gold for an invite
// — the two edge kinds told apart by the palette's own two accents.
.origin-vine__thread {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0;
  animation: origin-appear 0.7s ease forwards;
  color: rgba(91, 108, 130, 0.7);

  &--invite { color: rgba(199, 154, 0, 0.75); }

  .origin-vine__svg { width: 40px; height: 56px; display: block; }
  .origin-vine__path {
    stroke-dasharray: 120;
    stroke-dashoffset: 120;
    animation: origin-draw 0.9s ease forwards;
    animation-delay: inherit;
  }
  .origin-vine__caption {
    position: absolute;
    top: 50%;
    left: calc(50% + 26px);
    transform: translateY(-50%);
    font-size: 0.62rem;
    letter-spacing: 0.04em;
    color: var(--panel-ink-mute);
    white-space: nowrap;
  }
}

@keyframes origin-appear { to { opacity: 1; } }
@keyframes origin-draw { to { stroke-dashoffset: 0; } }

.origin-sky__disclosure {
  position: sticky;
  bottom: 0;
  margin-top: 14px;
  padding: 8px 12px;
  border-radius: 10px;
  background: rgba(244, 247, 251, 0.9);
  border: 1px solid var(--panel-rule);
  backdrop-filter: blur(3px);
  font-size: 0.72rem;
  color: var(--panel-ink-1);
}
</style>
