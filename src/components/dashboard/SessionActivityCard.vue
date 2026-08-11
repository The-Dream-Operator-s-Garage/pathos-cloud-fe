<template>
  <!-- THE SESSION PROJECTION CARD (dashboards phase 3, 2026-08-10) — the
       default dashboard's one VIRTUAL cell. It renders `user_session` SQL
       rows (GET /api/identity/sessions) in SkeletonTable's chrome: same
       grey family, same dials, same density — a PROJECTION dressed as a
       table, deliberately NOT a skeleton (decided 2026-08-10 against
       ~40–60 chain rows + ~15 files per login; the receipts-later path —
       lazy SESSION_EVENT minting — is written in the plan).

       Owner-only BY CONSTRUCTION: the endpoint answers for the caller's
       own login and never ships the sid. Person-only too — agent tokens
       403 and the card just shows its empty line.

       Chrome, not the component: SkeletonTable's columns are a skeleton's
       (Field | Type | Data); a session row is WHEN | DEVICE | IP. So this
       card restates the table's skin — consuming the same --skel-table-*
       dials, so a host that re-tones one re-tones both. Keep the two
       style blocks in step. -->
  <div class="session-card">
    <div class="session-card__head">
      <q-icon name="devices" size="13px" class="q-mr-xs" />
      <span class="nasalization">Session activity</span>
      <q-space />
      <span class="session-card__count mono">{{ rows.length }} active</span>
    </div>

    <div v-if="loading" class="session-card__loading">
      <q-spinner size="14px" color="primary" />
    </div>

    <table v-else class="session-card__grid">
      <colgroup>
        <col class="session-card__col-when">
        <col class="session-card__col-device">
        <col class="session-card__col-ip">
      </colgroup>
      <thead>
        <tr>
          <th>Session</th>
          <th>Device</th>
          <th>IP</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!rows.length">
          <td colspan="3" class="session-card__none">(no active sessions)</td>
        </tr>
        <tr v-for="s in rows" :key="s.id" class="session-card__row" :class="{ 'is-current': s.current }">
          <td class="session-card__when">
            <span v-if="s.current" class="session-card__current">this device</span>
            <div class="session-card__lines">
              <span>in {{ human(s.created_at) }}</span>
              <span class="session-card__seen">seen {{ human(s.last_seen_at) }}</span>
            </div>
          </td>
          <td class="session-card__device" :title="s.user_agent || ''">{{ deviceOf(s.user_agent) }}</td>
          <td class="session-card__ip mono">{{ s.ip || '—' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'
import { authService } from 'src/services/auth.service'

export default defineComponent({
  name: 'SessionActivityCard',
  setup () {
    const loading = ref(false)
    const rows = ref([])

    const load = async () => {
      loading.value = true
      try {
        const r = await authService.sessions()
        rows.value = r.success ? (r.sessions || []) : []
      } catch (_) {
        rows.value = []
      }
      loading.value = false
    }
    onMounted(load)

    const human = (iso) => {
      if (!iso) return '—'
      const d = new Date(iso)
      if (Number.isNaN(d.getTime())) return '—'
      return d.toLocaleString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    }

    // One readable word off the user-agent — the full string rides the
    // cell's tooltip.
    const deviceOf = (ua) => {
      if (!ua) return 'unknown'
      if (/mobile|iphone|android/i.test(ua)) return 'mobile'
      if (/electron/i.test(ua)) return 'app'
      const m = ua.match(/(firefox|edg|chrome|safari)/i)
      return m ? m[1].toLowerCase().replace('edg', 'edge') : 'browser'
    }

    return { loading, rows, human, deviceOf }
  }
})
</script>

<style lang="scss" scoped>
// SkeletonTable's chrome restated for session columns — same dial names,
// so the two tables re-tone together on any host.
.session-card {
  background: var(--skel-table-coat, var(--grey-3));
  border: 1px solid var(--skel-table-rule, var(--grey-4));
  border-radius: 6px;
  overflow: hidden;
}

.session-card__head {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  font-size: 0.72em;
  font-weight: 600;
  color: var(--skel-table-ink, var(--brown-8));
  border-bottom: 1px solid var(--skel-table-rule-strong, var(--grey-5));
}

.session-card__count {
  font-size: 0.9em;
  font-weight: 400;
  color: var(--skel-table-ink-mute, var(--brown-4));
}

.session-card__loading { padding: 8px; }

.session-card__grid {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;

  th {
    text-align: left;
    font-size: 0.6em;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 600;
    color: var(--skel-table-ink-mute, var(--brown-4));
    padding: 4px 8px;
    border-bottom: 1px solid var(--skel-table-rule, var(--grey-4));
  }
}

.session-card__col-when { width: 44%; }
.session-card__col-device { width: 26%; }
.session-card__col-ip { width: 30%; }

.session-card__row {
  td {
    padding: 4px 8px;
    vertical-align: top;
    border-bottom: 1px solid var(--skel-table-rule, var(--grey-4));
    font-size: 0.74em;
    color: var(--skel-table-ink, var(--brown-8));
  }
  &:last-child td { border-bottom: none; }
  &:hover td { background: rgba(255, 255, 255, 0.35); }
  &.is-current td:first-child { box-shadow: inset 2px 0 0 var(--skel-table-hover, var(--teal-12)); }
}

.session-card__lines {
  display: flex;
  flex-direction: column;
  line-height: 1.35;
}

.session-card__seen {
  color: var(--skel-table-ink-mute, var(--brown-4));
  font-size: 0.92em;
}

.session-card__current {
  display: inline-block;
  margin-bottom: 2px;
  padding: 0 6px;
  border-radius: var(--radius-pill);
  background: rgba(0, 184, 212, 0.12);
  border: 1px solid var(--skel-table-hover, var(--teal-12));
  color: var(--skel-table-ink, var(--brown-8));
  font-size: 0.88em;
}

.session-card__device,
.session-card__ip {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-card__none {
  padding: 8px;
  font-size: 0.74em;
  font-style: italic;
  color: var(--skel-table-ink-mute, var(--brown-4));
}
</style>
