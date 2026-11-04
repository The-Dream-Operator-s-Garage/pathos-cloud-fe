<script>
// ── A SCOPE THAT TURNS THE MINI FAMILY'S VOTES ON (2026-11-04) — every
// MiniFoot inside it draws its element's thumbs (`utils/miniVotes.js`).
// Renders its slot and nothing else: no box, no styles.
import { defineComponent } from 'vue'
import { provideMiniVotes } from 'src/utils/miniVotes'

export default defineComponent({
  name: 'MiniVotesScope',
  setup (_, { slots }) {
    provideMiniVotes(true)
    return () => (slots.default ? slots.default() : null)
  }
})
</script>
