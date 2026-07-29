// useElementSurround — the per-viewer surround seam (pair-path refactor).
//
// Every element viewer renders its platform surround (author, creation
// moment, label rail, versions, forks, comments, scores, owned-things)
// from ONE call: GET /refs/surround. The data is the element's SKELETON
// WALK, perfectly grounded in the pathchain — and every value in it is a
// REFERENCE routed to its own viewer.
//
// Usage:
//   const { surround, sections, loading, load, reload } =
//     useElementSurround(() => `nodes/${hash.value}`)
//   watch(hash, load, { immediate: true })

import { ref, computed } from 'vue'
import { refService } from 'src/services/ref.service'

export function useElementSurround (refSource, { limit = 10 } = {}) {
  const surround = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const resolveRef = () =>
    typeof refSource === 'function' ? refSource() : refSource

  const load = async () => {
    const address = resolveRef()
    if (!address) { surround.value = null; return }
    loading.value = true
    error.value = null
    try {
      const r = await refService.surround(address, limit)
      surround.value = r.success ? r : null
      if (!r.success) error.value = r.error || { message: 'surround failed' }
    } catch (e) {
      error.value = { message: e?.message || 'surround failed' }
      surround.value = null
    } finally {
      loading.value = false
    }
  }

  const sections = computed(() => surround.value?.sections || null)
  const skeleton = computed(() => surround.value?.skeleton || null)
  const slots = computed(() => surround.value?.slots || [])
  const element = computed(() => surround.value?.element || null)

  return { surround, sections, skeleton, slots, element, loading, error, load, reload: load }
}
