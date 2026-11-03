<template>
  <!-- THE SITE ICON (2026-11-03, user ask: "incorporate the icons for
       popular sites next to the links … extracting the icons from the
       metadata, which would be better"): the icon a link's SITE publishes
       about itself — read by the server from the site's <head> (POST
       /api/site-icons, stores/siteIcons.js batches one render's asks into
       one request). Until it answers, or when the site has none, the
       brand's own mark stands in (utils/brandIcons.js), else a globe.
       `data-state` says which is drawn: site · brand · loading · none. -->
  <span
    class="site-icon"
    :style="{ '--site-icon-size': size }"
    :title="label"
    :data-state="state"
    data-testid="site-icon"
  >
    <img v-if="state === 'site'" :src="entry.icon" alt="" draggable="false" @error="broken = true">
    <q-icon v-else-if="state === 'brand'" :name="brand" :size="size" />
    <q-icon v-else name="public" :size="size" class="site-icon__globe" />
  </span>
</template>

<script>
import { defineComponent, computed, ref, watch } from 'vue'
import { useSiteIconsStore } from 'src/stores/siteIcons'
import { brandOfHost } from 'src/utils/brandIcons'

const hostOf = (href) => {
  try {
    const u = new URL(String(href || ''))
    return /^https?:$/.test(u.protocol) ? u.hostname.toLowerCase() : null
  } catch (_) { return null }
}

export default defineComponent({
  name: 'SiteIcon',
  props: {
    href: { type: String, default: null },
    host: { type: String, default: null },
    size: { type: String, default: '14px' }
  },
  setup (props) {
    const store = useSiteIconsStore()
    const broken = ref(false)
    const theHost = computed(() => (props.host ? String(props.host).toLowerCase() : hostOf(props.href)))
    const entry = computed(() => (theHost.value ? store.byHost[theHost.value] : null))
    const brand = computed(() => brandOfHost(theHost.value))

    watch(theHost, (h) => { broken.value = false; if (h) store.want(h) }, { immediate: true })

    const state = computed(() => {
      if (entry.value?.icon && !broken.value) return 'site'
      if (brand.value) return 'brand'
      return theHost.value && entry.value === undefined ? 'loading' : 'none'
    })
    const label = computed(() => entry.value?.name || theHost.value || '')

    return { entry, brand, state, label, broken }
  }
})
</script>

<style lang="scss" scoped>
.site-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: var(--site-icon-size);
  height: var(--site-icon-size);
  line-height: 1;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 2px;
  }
}

.site-icon__globe { color: var(--grey-6); }
.site-icon[data-state='loading'] .site-icon__globe { opacity: 0.45; }
</style>
