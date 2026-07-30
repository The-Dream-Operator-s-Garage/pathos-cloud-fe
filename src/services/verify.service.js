import api from './api'

// The truth spine's read surface (Thread B). One report per element —
// ProvenanceBadge renders it; the bundle download is the same walk packed
// for the offline verifier (scripts/verify-bundle.mjs in the api repo).
export const verifyService = {
  // ref = '<kind>/<hash>' with kind ∈ paths|links|nodes.
  async verify (ref) {
    const { data } = await api.get(`/verify/${ref}`)
    return data
  },
  // Fetch the portable bundle and hand it to the browser as a download.
  async downloadBundle (ref) {
    const { data } = await api.get(`/verify/export/${ref}`)
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pathos-${ref.replace('/', '-').slice(0, 24)}.bundle.json`
    a.click()
    URL.revokeObjectURL(url)
  }
}
