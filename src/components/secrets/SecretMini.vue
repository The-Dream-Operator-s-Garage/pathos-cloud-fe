<template>
  <MiniPanel :to="targetRoute">
    <template #title>
      <q-icon name="key" size="13px" class="q-mr-xs secret-mini__icon" />
      secret #{{ secret.id }}
    </template>

    <template #chips>
      <span class="mini-chip-fact" :class="secret.used_at ? 'secret-mini__used' : 'secret-mini__unused'">
        <q-icon :name="secret.used_at ? 'lock' : 'lock_open'" size="11px" class="q-mr-xs" />
        {{ secret.used_at ? 'used' : 'unused' }}
      </span>
      <span v-if="owner" class="mini-chip-fact">
        <EntityName :entity="owner" :bold="false" />
      </span>
      <span v-if="receiver" class="mini-chip-fact">
        <EntityName :entity="receiver" icon="person_add" :bold="false" />
      </span>
    </template>

    <template #hash>
      <SecretMicro :id="secret.id" :path="secret.path" :show-type="true" />
    </template>

    <template #body>
      <div class="secret-mini__body">
        <template v-if="secret.used_at">
          consumed {{ usedAgo }}
        </template>
        <template v-else>
          open invitation — not consumed yet
        </template>
      </div>
    </template>
  </MiniPanel>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { timeAgo } from 'src/utils/time'
import MiniPanel from 'src/components/shared/MiniPanel.vue'
import SecretMicro from './SecretMicro.vue'
import EntityName from 'src/components/entities/EntityName.vue'

export default defineComponent({
  name: 'SecretMini',
  components: { MiniPanel, SecretMicro, EntityName },
  props: {
    // Sanitized secret row { id, path, owner_id, receiver_id, used_at, … }.
    secret: { type: Object, required: true },
    owner: { type: Object, default: null },
    receiver: { type: Object, default: null },
    to: { type: String, default: null }
  },
  setup (props) {
    const targetRoute = computed(() => props.to || `/secrets/${props.secret.id}`)
    const usedAgo = computed(() =>
      props.secret?.used_at ? timeAgo(props.secret.used_at) : '')
    return { targetRoute, usedAgo }
  }
})
</script>

<style lang="scss" scoped>
.secret-mini__icon { color: #a06070; }
.mini-chip-fact {
  display: inline-flex;
  align-items: center;
}
.secret-mini__used   { color: #9c4a4a; }
.secret-mini__unused { color: #22794a; }
.secret-mini__body {
  font-size: 0.8em;
  color: rgba(var(--ink-rgb), 0.6);
}
</style>
