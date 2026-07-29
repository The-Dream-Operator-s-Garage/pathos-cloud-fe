<template>
  <!-- ORG LOGO CHIP (2026-07-25) — the badge an author wears.

       A post published through an org MASK used to render its author as the
       mask's own display name, "<person> @ <org>": two facts crushed into
       one string, and the only thing on a feed card that had to be READ
       rather than recognised. The card now shows the PERSON (face, name,
       @handle) and this mark for the "where".

       It is a link to the organization, so the chip is also the way in. The
       mark itself is an ORG_PROFILE > LOGO element (a real image node), and
       when there is none — or it is private — the monogram plaque stands in,
       tinted deterministically from the org's id so two orgs never read as
       the same badge. -->
  <component
    :is="to ? 'router-link' : 'span'"
    v-bind="to ? { to } : {}"
    class="org-logo-chip"
    :class="{ 'org-logo-chip--labeled': showName }"
    :title="titleText"
    @click.stop
  >
    <img v-if="logoUrl" :src="logoUrl" :alt="org.name" class="org-logo-chip__mark" :style="markStyle">
    <span v-else class="org-logo-chip__mark org-logo-chip__mark--fallback" :style="fallbackStyle">
      {{ monogram }}
    </span>
    <span v-if="showName" class="org-logo-chip__name">{{ org.name }}</span>
  </component>
</template>

<script>
import { defineComponent, computed } from 'vue'

// Same golden-angle hue walk as EntityAvatar's monogram — neighbouring ids
// land as far apart as consecutive numbers allow.
const hueFor = (key) => {
  const s = String(key ?? '')
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return (h * 137.508) % 360
}

export default defineComponent({
  name: 'OrgLogoChip',
  props: {
    // { id, entity_id, name, handle, logo: { url, … }, role_title, self? }
    // — exactly the `author.org` card the feed hands out.
    org: { type: Object, required: true },
    size: { type: Number, default: 18 },
    // Draw the org's name beside the mark (profile bands, org lists). The
    // feed card wants the mark alone: the name lives in the tooltip, since
    // the row is already carrying a name.
    showName: { type: Boolean, default: false },
    link: { type: Boolean, default: true }
  },
  setup (props) {
    const logoUrl = computed(() => props.org?.logo?.url || null)
    const to = computed(() =>
      props.link && props.org?.id ? `/organizations/${props.org.id}` : null)

    const titleText = computed(() => {
      const parts = [props.org?.name || 'organization']
      if (props.org?.role_title) parts.push(props.org.role_title)
      return parts.join(' · ')
    })

    const monogram = computed(() => (props.org?.name || '?').trim().charAt(0).toUpperCase())

    const markStyle = computed(() => ({ width: `${props.size}px`, height: `${props.size}px` }))
    const fallbackStyle = computed(() => {
      const hue = hueFor(props.org?.id ?? props.org?.name)
      return {
        ...markStyle.value,
        fontSize: `${Math.round(props.size * 0.58)}px`,
        background: `hsl(${hue}, 46%, 32%)`,
        color: `hsl(${hue}, 40%, 94%)`
      }
    })

    return { logoUrl, to, titleText, monogram, markStyle, fallbackStyle }
  }
})
</script>

<style lang="scss" scoped>
.org-logo-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: 0 0 auto;
  text-decoration: none;
  color: inherit;
  line-height: 1;
}

.org-logo-chip__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  // The badge art is already drawn on a rounded plaque; the radius here is
  // the same shape one step tighter, so a mark and a face sit as a family.
  border-radius: 26%;
  overflow: hidden;
  object-fit: cover;
  // A hairline, for the light badges: a pale plaque on a pale card would
  // otherwise have no edge at all.
  box-shadow: 0 0 0 1px rgba(var(--ink-rgb), 0.12);
}

.org-logo-chip__mark--fallback {
  font-family: 'Space Mono', monospace;
  font-weight: 700;
  user-select: none;
}

.org-logo-chip__name {
  font-size: 0.72em;
  font-weight: 600;
  color: rgba(var(--ink-rgb), 0.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 20ch;
}

.org-logo-chip--labeled:hover .org-logo-chip__name { color: #00829c; }
</style>
