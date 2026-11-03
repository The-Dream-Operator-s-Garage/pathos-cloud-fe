import { defineStore } from 'pinia'
import { siteIconService } from 'src/services/siteIcon.service'

// ── THE SITE ICONS (2026-11-03) — one answer per host for the session ──
// Every <SiteIcon> asks `want(host)`; the asks of one render collect for
// BATCH_MS and go out as ONE POST /site-icons (≤ HOSTS_MAX hosts each), so
// a lane of twenty visits is one request, and a host already answered is
// never asked again. A host the server is still resolving (`pending`) is
// asked again after RETRY_MS, at most RETRIES times; then — like a refused
// host or a failed request — it settles as null and the component draws
// its fallback (the brand mark, else the globe).

const BATCH_MS = 40
const RETRY_MS = 4000
const RETRIES = 2
const HOSTS_MAX = 40

const queued = new Set()
const inflight = new Set()
const tries = new Map()
let timer = null

export const useSiteIconsStore = defineStore('siteIcons', {
  state: () => ({
    // host → { icon, color, name, source } (icon null = the site has none) | null (unanswerable)
    byHost: {}
  }),
  actions: {
    want (host) {
      if (!host || host in this.byHost || queued.has(host) || inflight.has(host)) return
      queued.add(host)
      if (!timer) timer = setTimeout(() => this.flush(), BATCH_MS)
    },
    async flush () {
      timer = null
      const all = [...queued]
      queued.clear()
      for (let i = 0; i < all.length; i += HOSTS_MAX) {
        const hosts = all.slice(i, i + HOSTS_MAX)
        hosts.forEach((h) => inflight.add(h))
        try {
          const r = await siteIconService.icons(hosts)
          if (!r.success) throw new Error(r.error?.message || 'site icons refused')
          for (const [h, v] of Object.entries(r.icons || {})) this.byHost[h] = v
          for (const h of hosts) {
            if (h in this.byHost) continue
            const n = (tries.get(h) || 0) + 1
            if ((r.pending || []).includes(h) && n <= RETRIES) {
              tries.set(h, n)
              setTimeout(() => this.want(h), RETRY_MS)
            } else this.byHost[h] = null
          }
        } catch (_) {
          for (const h of hosts) if (!(h in this.byHost)) this.byHost[h] = null
        } finally {
          hosts.forEach((h) => inflight.delete(h))
        }
      }
    }
  }
})
