import api from './api'

// The site icons (2026-11-03, docs/concepts/extensions.md § Site icons):
// POST /site-icons { hosts } → per host the icon the site's <head> names
// (a data: URL), its theme colour and name; `pending` hosts are still
// resolving on the server. A POST so visited hosts stay out of URLs.
export const siteIconService = {
  async icons (hosts) {
    const { data } = await api.post('/site-icons', { hosts })
    return data
  }
}
