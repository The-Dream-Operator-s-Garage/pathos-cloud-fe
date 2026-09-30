<template>
  <!-- THE SECRET MINI — an invite secret (minted by an owner, consumed by
       the entity that registered through it) as a panel: the element
       window's face, a path lane's member, the file tree.

       ⭐ REBUILT 2026-09-30 ON THE FAMILY BASIS (user ask: "take as layout
       the node mini viewer … use the nano pills icons and coloring"). It was
       the default STACK head (key + secret # / used + parties / the chip).
       NodeMini's grammar now, in the secret pill's sealed brown:
         HEAD  chip+copy │ secret #12 │ open          (MiniHead)
         BODY  the seal's state + its two parties — owner → receiver
         FOOT  🔑 minted 3d ago · consumed 2d ago      (MiniFoot)
       The row is the sanitized one (never password_hash — secretService's
       allow-list). -->
  <MiniPanel kind="secrets" :to="targetRoute">
    <template #head>
      <MiniHead
        kind="secrets"
        :id="secret.id"
        :path="secret.path"
        :integrity="secret.integrity || null"
        :name="`secret #${secret.id}`"
      />
    </template>

    <template #body>
      <div class="secret-mini__body">
        <span class="secret-mini__state" :class="secret.used_at ? 'is-used' : 'is-open'">
          <q-icon :name="secret.used_at ? 'lock' : 'lock_open'" size="11px" />
          {{ secret.used_at ? 'consumed' : 'open invitation' }}
        </span>
        <span v-if="owner || receiver" class="secret-mini__parties">
          <EntityName v-if="owner" :entity="owner" :bold="false" />
          <template v-if="receiver">
            <span class="secret-mini__arrow">→</span>
            <EntityName :entity="receiver" icon="person_add" :bold="false" />
          </template>
        </span>
      </div>
    </template>

    <template v-if="footFacts.length" #foot>
      <MiniFoot kind="secrets" :facts="footFacts" />
    </template>
  </MiniPanel>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { timeAgo } from 'src/utils/time'
import MiniPanel from 'src/components/shared/MiniPanel.vue'
import MiniHead from 'src/components/shared/MiniHead.vue'
import MiniFoot from 'src/components/shared/MiniFoot.vue'
import EntityName from 'src/components/entities/EntityName.vue'

export default defineComponent({
  name: 'SecretMini',
  components: { MiniPanel, MiniHead, MiniFoot, EntityName },
  props: {
    // Sanitized secret row { id, path, owner_id, receiver_id, used_at, … }.
    secret: { type: Object, required: true },
    owner: { type: Object, default: null },
    receiver: { type: Object, default: null },
    to: { type: String, default: null }
  },
  setup (props) {
    const targetRoute = computed(() => props.to || `/secrets/${props.secret.id}`)
    const footFacts = computed(() => [
      props.secret.created_at && { text: 'minted ' + timeAgo(props.secret.created_at), title: props.secret.created_at },
      props.secret.used_at && { text: 'consumed ' + timeAgo(props.secret.used_at), title: props.secret.used_at }
    ].filter(Boolean))
    return { targetRoute, footFacts }
  }
})
</script>

<style lang="scss" scoped>
.secret-mini__body {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 4px 10px;
  padding: 3px 4px;
  font-size: 0.8em;
}
.secret-mini__state {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  &.is-used { color: #9c4a4a; }
  &.is-open { color: #22794a; }
}
.secret-mini__parties {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
.secret-mini__arrow { color: var(--mini-accent, #4e342e); }
</style>
