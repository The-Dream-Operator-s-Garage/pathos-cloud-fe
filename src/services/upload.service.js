import api from './api'

// Contract layer for sealed uploads. Every FILE node's bytes live on disk
// as an encrypted+authenticated container bound to the node's address; the
// API exposes GET /uploads/verify/<owner>/<ext>/<file> to run the full
// contract check (public endpoint — same visibility as the bytes).
export const uploadService = {
  // address: node.file.address — "uploads/<owner>/<ext>/<hash>.<ext>"
  // → { verified, sha256?, size?, reason? }
  async verify (address) {
    const parts = String(address || '').split('/')
    if (parts.length !== 4 || parts[0] !== 'uploads') {
      return { verified: false, reason: 'bad_address' }
    }
    const [, owner, ext, file] = parts
    const { data } = await api.get(`/uploads/verify/${owner}/${ext}/${file}`)
    return data
  }
}
