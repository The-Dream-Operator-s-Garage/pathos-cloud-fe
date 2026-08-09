<template>
  <!-- Talavero's THIRD face (integrity-debt plan): he already wears
       not-found and no-access; this is integrity-violated — the element
       exists, the viewer may read it, and the platform is REFUSING to
       show an unproven body. Same porcelain guardian, same slate field,
       a red seam instead of a lock. -->
  <div class="integrity-banner">
    <img class="integrity-banner__octopus" src="~assets/access-octopus-gray.png" alt="Talavero, the porcelain guardian">
    <div class="integrity-banner__copy">
      <div class="integrity-banner__head">
        <q-icon name="report" size="18px" />
        <span>Integrity check failed</span>
      </div>
      <p>
        This element's chain proof contradicts —
        <code class="mono">{{ check || 'integrity' }}</code> — so its body is
        withheld. The record of what was found, both sides of it, and the
        trail are in the incident{{ report ? '' : ' (report still being filed)' }}.
      </p>
      <button v-if="report" type="button" class="integrity-banner__cta" @click="openReport">
        <q-icon name="menu_book" size="14px" />
        Open Talavero's report
      </button>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'IntegrityBanner',
  props: {
    // node.integrity from the API: { status, check, report }
    check: { type: String, default: null },
    report: { type: String, default: null }
  },
  setup (props) {
    const router = useRouter()
    const openReport = () => {
      if (props.report) router.push({ path: '/feed', query: { flyout: props.report } })
    }
    return { openReport }
  }
})
</script>

<style lang="scss" scoped>
.integrity-banner {
  display: flex;
  align-items: center;
  gap: 22px;
  margin: 14px;
  padding: 22px 26px;
  border-radius: 10px;
  background: #2e3c45;                       // the guardian's slate field
  border: 1px solid #a03d3d;                 // the red seam — the dot's ink at wall size
  box-shadow: inset 0 0 0 1px rgba(160, 61, 61, 0.25);
  color: #e8e4dc;
}

.integrity-banner__octopus {
  width: 132px;
  max-width: 30%;
  flex-shrink: 0;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.35));
}

.integrity-banner__copy {
  display: flex;
  flex-direction: column;
  gap: 8px;
  p { margin: 0; font-size: 0.86em; line-height: 1.5; opacity: 0.92; }
  code { color: #e8b4b4; }
}

.integrity-banner__head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Space Mono', monospace;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #e8b4b4;
}

.integrity-banner__cta {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 2px;
  padding: 7px 14px;
  border-radius: 6px;
  border: 1px solid rgba(232, 180, 180, 0.5);
  background: rgba(160, 61, 61, 0.28);
  color: #e8e4dc;
  font-family: 'Space Mono', monospace;
  font-size: 0.8em;
  cursor: pointer;
  transition: background 0.12s;
  &:hover { background: rgba(160, 61, 61, 0.45); }
}

@media (max-width: 600px) {
  .integrity-banner { flex-direction: column; text-align: center; }
  .integrity-banner__cta { align-self: center; }
}
</style>
