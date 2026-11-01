<template>
  <!-- ── THE LEGAL PAGES (2026-10-31, user ask: privacy policy + terms of
       service for Google's OAuth consent screen, "in plain written
       nasalization english", EN + ES, based on a node allegue can edit).
       ONE page for both documents (`meta.legal` picks privacy | terms), in
       the landing's grammar: the metallic wordmark over the starfield, one
       warm plaque, the whole surface in ONE FACE (Nasalization — the same
       single rule as `.auth-page`). The text is NOT in the repo: it is read
       live from allegue's source note through GET /api/legal/:doc
       (services/legalService.js), so a saved edit of the note IS the new
       policy. Google links the clean doors public/privacy/ + public/terms/,
       which forward here keeping ?lang=. -->
  <q-page class="legal-page" :style-fn="() => ({})">
    <header class="legal-hero">
      <router-link to="/auth" class="legal-wordmark nasalization">pathos.cloud</router-link>
      <nav class="legal-switch" :aria-label="copy.nav">
        <div class="legal-switch__group">
          <router-link
            v-for="d in DOCS" :key="d"
            :to="{ path: `/${d}`, query: { lang } }"
            class="legal-chip" :class="{ 'is-on': d === doc }"
            :aria-current="d === doc ? 'page' : null"
          >{{ copy.docs[d] }}</router-link>
        </div>
        <div class="legal-switch__group">
          <button
            v-for="l in LANGS" :key="l" type="button"
            class="legal-chip legal-chip--lang" :class="{ 'is-on': l === lang }"
            :aria-pressed="l === lang"
            @click="setLang(l)"
          >{{ l }}</button>
        </div>
      </nav>
    </header>

    <article class="legal-plaque" :lang="served || lang">
      <div v-if="loading" class="legal-state">
        <q-spinner-dots size="28px" color="brown-6" />
      </div>
      <div v-else-if="failed" class="legal-state">
        {{ copy.unavailable }}
        <a href="mailto:allegue@pathos.cloud">allegue@pathos.cloud</a>
      </div>
      <template v-else>
        <h1 class="legal-title">{{ title }}</h1>
        <MarkdownBody class="legal-body md-rendered" :text="markdown" :breaks="false" plain-refs />
        <footer v-if="source" class="legal-receipt">
          {{ copy.receipt }} {{ source.author }} · {{ copy.version }}
          {{ shortHash }} · {{ stamp }}
        </footer>
      </template>
      <FriezeBar slim />
    </article>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from 'src/services/api'
import MarkdownBody from 'src/components/shared/MarkdownBody.vue'
import FriezeBar from 'src/components/layout/FriezeBar.vue'

const DOCS = ['privacy', 'terms']
const LANGS = ['en', 'es']

// The page's own chrome only — the documents themselves live in the note.
const COPY = {
  en: {
    nav: 'Legal documents',
    docs: { privacy: 'privacy', terms: 'terms' },
    unavailable: 'This page is unavailable right now. Write to',
    receipt: 'read live from a signed note by',
    version: 'version',
    locale: 'en-US'
  },
  es: {
    nav: 'Documentos legales',
    docs: { privacy: 'privacidad', terms: 'condiciones' },
    unavailable: 'Esta página no está disponible por ahora. Escribe a',
    receipt: 'leído en vivo de una nota firmada por',
    version: 'versión',
    locale: 'es-MX'
  }
}

// No ?lang → the browser's language, so a Spanish visitor arriving from
// Google's consent screen (one URL per document there) reads Spanish.
const browserLang = () =>
  (typeof navigator !== 'undefined' && /^es\b/i.test(navigator.language || '')) ? 'es' : 'en'

export default defineComponent({
  name: 'LegalPage',
  components: { MarkdownBody, FriezeBar },
  setup () {
    const route = useRoute()
    const router = useRouter()

    const doc = computed(() => (DOCS.includes(route.meta.legal) ? route.meta.legal : 'privacy'))
    const lang = computed(() => {
      const q = String(route.query.lang || '').toLowerCase()
      return LANGS.includes(q) ? q : browserLang()
    })
    const copy = computed(() => COPY[lang.value])

    const loading = ref(true)
    const failed = ref(false)
    const title = ref('')
    const markdown = ref('')
    const served = ref('')
    const source = ref(null)
    const updatedAt = ref(null)

    const load = async () => {
      loading.value = true
      failed.value = false
      try {
        const { data } = await api.get(`/legal/${doc.value}`, { params: { lang: lang.value } })
        title.value = data.title
        markdown.value = data.markdown
        served.value = data.lang
        source.value = data.source
        updatedAt.value = data.updated_at
        document.title = `${data.title} · pathos.cloud`
      } catch (e) {
        failed.value = true
        document.title = 'pathos.cloud'
      } finally {
        loading.value = false
      }
    }
    watch([doc, lang], load, { immediate: true })

    const setLang = (l) => router.replace({ query: { ...route.query, lang: l } })

    const shortHash = computed(() => String(source.value?.version || '').replace(/^nodes\//, '').slice(0, 8))
    const stamp = computed(() => {
      if (!updatedAt.value) return ''
      return new Date(updatedAt.value).toLocaleDateString(copy.value.locale, {
        year: 'numeric', month: 'long', day: 'numeric'
      })
    })

    return {
      DOCS,
      LANGS,
      doc,
      lang,
      copy,
      setLang,
      loading,
      failed,
      title,
      markdown,
      served,
      source,
      shortHash,
      stamp
    }
  }
})
</script>

<style scoped lang="scss">
// ONE FACE, as on the landing (`.auth-page`): set once, inherited by the
// switch, the title, the prose and the receipt.
.legal-page {
  font-family: var(--font-display);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 22px;
  padding: 40px 14px 56px;
}

.legal-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  max-width: 96vw;
}

// The landing's metallic wordmark, smaller: a way home, not a hero.
.legal-wordmark {
  font-size: clamp(1.6em, 4.6vw, 2.2em);
  letter-spacing: 0.14em;
  text-decoration: none;
  background: linear-gradient(172deg,
    var(--brown-1) 8%, var(--brown-3) 38%, var(--brown-1) 52%,
    var(--brown-4) 78%, var(--brown-2) 96%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 14px rgba(100, 255, 218, 0.16));
}

.legal-switch {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px 22px;
}

.legal-switch__group { display: flex; gap: 6px; }

// Doors on the canvas: warm outline at rest, the mint of "enter" when on.
.legal-chip {
  font: inherit;
  font-size: 0.74em;
  letter-spacing: 0.16em;
  padding: 4px 12px;
  border-radius: 7px;
  border: 1px solid rgba(255, 224, 178, 0.28);
  background: transparent;
  color: var(--brown-3);
  text-decoration: none;
  cursor: pointer;
  transition: box-shadow 0.2s ease, color 0.2s ease;

  &:hover { color: var(--brown-1); box-shadow: 0 0 14px rgba(100, 255, 218, 0.22); }

  &.is-on {
    color: var(--brown-10);
    border-color: transparent;
    background: linear-gradient(180deg, #a7ffeb 0%, #64ffda 100%);
  }
}

.legal-chip--lang { text-transform: uppercase; }

// The landing's plaque (brown-1 coat, heavier foot, mint/ember halo) sized
// for reading.
.legal-plaque {
  --ink: var(--brown-10);
  --ink-rgb: 62, 39, 35;
  width: min(820px, 96vw);
  background: var(--brown-1);
  border: 1px solid var(--brown-4);
  border-bottom-width: 3px;
  border-radius: 10px;
  overflow: hidden;
  color: var(--ink);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.85),
    0 4px 10px rgba(0, 0, 0, 0.42),
    0 -16px 60px -22px rgba(100, 255, 218, 0.28),
    0 26px 70px -26px rgba(255, 110, 64, 0.30);
}

.legal-title {
  margin: 0;
  padding: 32px 40px 6px;
  font-size: 1.5em;
  line-height: 1.3;
  letter-spacing: 0.1em;
  color: var(--brown-8);
}

// `.md-rendered` (css/_components.scss) is the platform's prose skin; the
// page only puts its type back on the ONE FACE (the skin sets display/mono
// faces per element) and opens the measure.
.legal-body {
  padding: 4px 40px 8px;
  font-size: 0.9em;
  line-height: 1.75;

  :deep(h2) {
    font-family: inherit;
    font-size: 1.08em;
    letter-spacing: 0.08em;
    color: var(--brown-8);
    margin: 1.7em 0 0.5em;
  }
  :deep(code) { font-family: inherit; font-size: 0.92em; word-break: break-word; }
  :deep(strong) { color: var(--brown-10); }
  :deep(a) { color: #00829c; word-break: break-word; }
  :deep(li) { margin: 0.3em 0; }
}

// The receipt: which signed version this page is, and when it was minted.
.legal-receipt {
  margin: 18px 40px 22px;
  padding-top: 12px;
  border-top: 1px solid rgba(var(--ink-rgb), 0.18);
  font-size: 0.66em;
  letter-spacing: 0.06em;
  color: var(--brown-6);
}

.legal-state {
  padding: 48px 40px;
  text-align: center;
  font-size: 0.86em;
  a { color: #00829c; }
}

@media (max-width: 600px) {
  .legal-title { padding: 24px 20px 4px; font-size: 1.24em; }
  .legal-body { padding: 4px 20px 8px; }
  .legal-receipt { margin: 16px 20px 18px; }
}
</style>
