<template>
  <q-dialog v-model="open" @show="load">
    <div class="origin-sky">
      <!-- drifting starfield — three parallax layers of pure CSS stars -->
      <div class="origin-sky__stars origin-sky__stars--far" />
      <div class="origin-sky__stars origin-sky__stars--mid" />
      <div class="origin-sky__stars origin-sky__stars--near" />

      <div class="origin-sky__head">
        <q-icon name="hub" size="18px" />
        <span>Origin constellation</span>
        <q-space />
        <q-btn flat dense round icon="close" size="sm" @click="open = false" />
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
            <router-link :to="`/entities/${card.id}`" class="origin-node__ring">
              <EntityAvatar :entity-id="card.id" :photo="card.photo" :size="card.edge === 'self' ? 52 : 42" />
            </router-link>
            <div class="origin-node__name">
              <q-icon v-if="card.isPioneer" name="star" size="13px" class="origin-node__star" />
              {{ card.isPioneer ? 'pioneer' : card.name }}
            </div>
            <div v-if="card.edge === 'self'" class="origin-node__sub">you are here</div>
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
  </q-dialog>
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
import { defineComponent, ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { entityService } from 'src/services/entity.service'
import EntityAvatar from './EntityAvatar.vue'

export default defineComponent({
  name: 'OriginTree',
  components: { EntityAvatar },
  props: {
    entityId: { type: Number, required: true },
    modelValue: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],
  setup (props, { emit }) {
    const $q = useQuasar()
    const open = computed({
      get: () => props.modelValue,
      set: (v) => emit('update:modelValue', v)
    })
    const loading = ref(false)
    const chain = ref([])
    const concealed = ref(false)
    const owns = ref(false)
    // What OTHERS would see — asked once so the toggle reflects reality.
    const concealedForOthers = ref(false)

    const load = async () => {
      loading.value = true
      try {
        const r = await entityService.origin(props.entityId)
        if (r.success) {
          chain.value = r.chain
          concealed.value = r.concealed
          owns.value = r.owns
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

    return { open, loading, chain, concealed, owns, concealedForOthers, displayChain, selfIsAlterEgo, edgeCaption, toggleDisclosure, load }
  }
})
</script>

<style lang="scss" scoped>
// A night sky, not a form: deep ink, three drifting star layers, and one
// luminous thread. The only warm things are the pioneer's gold and the
// amber toggle — edges and marks, never surfaces.
.origin-sky {
  position: relative;
  width: 420px;
  max-width: 92vw;
  max-height: 84vh;
  overflow: hidden;
  border-radius: 14px;
  background: radial-gradient(ellipse at 50% 120%, #1d2733 0%, #0d131b 60%, #070b10 100%);
  color: #cfd8dc;
  display: flex;
  flex-direction: column;
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.55);
}

.origin-sky__stars {
  position: absolute;
  inset: -50%;
  pointer-events: none;
  background-repeat: repeat;
  opacity: 0.8;
}
// each layer is a handful of box-shadow "stars" on a 1px dot, tiled by size
.origin-sky__stars--far {
  background-image: radial-gradient(1px 1px at 20px 30px, rgba(255,255,255,.5) 50%, transparent 51%),
    radial-gradient(1px 1px at 90px 110px, rgba(255,255,255,.35) 50%, transparent 51%),
    radial-gradient(1px 1px at 160px 60px, rgba(255,255,255,.4) 50%, transparent 51%);
  background-size: 200px 160px;
  animation: origin-drift 160s linear infinite;
}
.origin-sky__stars--mid {
  background-image: radial-gradient(1.5px 1.5px at 50px 80px, rgba(178,235,242,.5) 50%, transparent 51%),
    radial-gradient(1px 1px at 130px 20px, rgba(255,255,255,.45) 50%, transparent 51%);
  background-size: 240px 200px;
  animation: origin-drift 110s linear infinite reverse;
}
.origin-sky__stars--near {
  background-image: radial-gradient(2px 2px at 70px 140px, rgba(255,224,130,.5) 50%, transparent 51%);
  background-size: 300px 260px;
  animation: origin-drift 80s linear infinite;
}
@keyframes origin-drift {
  from { transform: translate(0, 0); }
  to   { transform: translate(120px, 80px); }
}

.origin-sky__head {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  font-size: 0.8rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #90a4ae;
}

.origin-sky__center {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 0 80px;
}
.origin-sky__empty { color: #607d8b; font-style: italic; }

// the column: BOTTOM-UP — you at the bottom, pioneer at the top
.origin-vine {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  overflow-y: auto;
  padding: 10px 18px 26px;
}

.origin-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  opacity: 0;
  animation: origin-appear 0.7s ease forwards;

  &__ring {
    display: inline-flex;
    border-radius: 26%;
    padding: 3px;
    background: rgba(128, 203, 196, 0.12);
    box-shadow: 0 0 14px rgba(128, 203, 196, 0.25);
    transition: box-shadow 0.25s;
    &:hover { box-shadow: 0 0 22px rgba(128, 203, 196, 0.55); }
  }
  &__name {
    font-size: 0.8rem;
    font-weight: 600;
    color: #eceff1;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  &__sub { font-size: 0.66rem; color: #78909c; }
  &__star { color: #ffd54f; filter: drop-shadow(0 0 4px rgba(255, 213, 79, 0.8)); }

  &--self &__ring {
    background: rgba(255, 213, 79, 0.14);
    box-shadow: 0 0 18px rgba(255, 213, 79, 0.35);
  }
  &--pioneer &__name {
    background: linear-gradient(160deg, #f5e6b8, #d4af37 55%, #b8860b);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  &--fog {
    color: #546e7a;
    .origin-node__name { color: #78909c; font-style: italic; font-weight: 400; }
  }
}

.origin-vine__thread {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0;
  animation: origin-appear 0.7s ease forwards;
  color: rgba(128, 203, 196, 0.75);

  &--invite { color: rgba(255, 213, 79, 0.55); }

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
    color: #607d8b;
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
  background: rgba(13, 19, 27, 0.85);
  backdrop-filter: blur(3px);
  font-size: 0.72rem;
}
</style>
