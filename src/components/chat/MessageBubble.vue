<template>
  <!-- One message in a conversation — classic chat layout: the viewer's
       own messages sit right (teal), everyone else's left (paper). The
       body is a full markdown surface, so [[pathos:…]] refs render as
       Minis (and locked refs as lock-bubbled hash chips) inside the
       bubble. This IS the message viewer — messages are read here first. -->
  <div class="msg-row" :class="{ 'is-mine': mine }">
    <div class="msg-bubble">
      <div v-if="!mine && author" class="msg-bubble__author">
        {{ author.display_name || author.username || ('entity #' + author.id) }}
      </div>
      <MarkdownBody class="msg-bubble__body" :text="body" ref-display="mini" />
      <div class="msg-bubble__meta">
        <slot name="meta" />
        <span v-if="when" :title="when.time_utc || ''">{{ when.human || when.time_utc || '' }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import MarkdownBody from 'src/components/shared/MarkdownBody.vue'

export default defineComponent({
  name: 'MessageBubble',
  components: { MarkdownBody },
  props: {
    body: { type: String, default: '' },
    author: { type: Object, default: null },
    mine: { type: Boolean, default: false },
    // { human, time_utc } from the feed item's moment.
    when: { type: Object, default: null }
  }
})
</script>

<style lang="scss" scoped>
.msg-row {
  display: flex;
  justify-content: flex-start;
  padding: 2px 0;

  &.is-mine { justify-content: flex-end; }
}

// The chat window's GREEN colorway (2026-08-03) reaches the bubbles: theirs is
// paper on a --green-3 rim, MINE is the well tone --green-2 on the heavier
// --green-4 — so "who said it" is stated by how green the bubble is, on a bed
// that is the window's own --green-1 coat. Both fills are OPAQUE; the teal
// `rgba(#00829c, .09)` my side used to wear was the last translucency left in
// here, and a tint over a coloured coat is not the colour it was drawn as.
.msg-bubble {
  max-width: min(72%, 560px);
  padding: 7px 12px 5px;
  border-radius: 12px 12px 12px 4px;
  background: var(--paper-card, #ffffff);
  border: 1px solid var(--green-3);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  overflow-wrap: anywhere;

  .is-mine & {
    border-radius: 12px 12px 4px 12px;
    background: var(--green-2);
    border-color: var(--green-4);
  }
}

.msg-bubble__author {
  font-size: 0.68em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--green-8);
  margin-bottom: 2px;
}

.msg-bubble__body {
  font-size: 0.88em;

  // Bubbles are compact surfaces — tame the markdown spacing.
  :deep(p) { margin: 0 0 4px; }
  :deep(p:last-child) { margin-bottom: 0; }
  :deep(h1), :deep(h2), :deep(h3) { font-size: 1.05em; margin: 4px 0; }
  :deep(.element-mini) { margin: 6px 0; }
}

.msg-bubble__meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  font-size: 0.62em;
  color: var(--ink-mute, #8995a8);
  margin-top: 3px;
}
</style>
