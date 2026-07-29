import api from './api'

// Embeds: a web link resolved through the platform's EMBED_RULE skeletons
// into the descriptor `EmbedFrame.vue` renders ({ provider, src, title,
// allow, aspect, url, rule }). Node reads already carry it on `node.embed`
// — this service is for the surfaces holding a URL BEFORE it is a node
// (the uploader's link mode previewing what it is about to save).
export const embedService = {
  // → { success, embed: <descriptor>|null }. A link no rule matches is a
  // 200 with embed:null — "not embeddable" is an answer, not an error.
  async resolve (url) {
    const { data } = await api.post('/embeds/resolve', { url })
    return data
  },

  // → { success, rules: [{ provider, patterns, embed_url, … }] }
  async rules () {
    const { data } = await api.get('/embeds/rules')
    return data
  }
}
