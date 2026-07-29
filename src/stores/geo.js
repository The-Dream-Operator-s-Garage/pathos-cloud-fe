import { defineStore } from 'pinia'
import { Dialog } from 'quasar'

// Approximate-location sharing — the "anchor your moments" feature.
//
// On entry (MainLayout mount) `maybeAsk()` shows a one-time consent dialog;
// agreeing triggers the browser geolocation prompt. Coordinates are rounded
// to ONE decimal (~11 km — city precision) BEFORE they ever leave this
// store, then persisted so services/api.js can attach them to every request
// as `X-Pathos-Geo: <lat>,<lon>`. The API stamps them onto any moment
// minted while creating things; precise coordinates never leave the browser.
//
// localStorage keys:
//   pathos_geo_choice — 'granted' | 'denied' ('' = never asked → ask on entry)
//   pathos_geo        — 'lat,lon' (city-rounded), read by the axios interceptor

const CITY_DECIMALS = 1

const roundCoord = (v) => {
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  return Math.round(n * 10 ** CITY_DECIMALS) / 10 ** CITY_DECIMALS
}

export const useGeoStore = defineStore('geo', {
  state: () => ({
    choice: localStorage.getItem('pathos_geo_choice') || '',
    coords: localStorage.getItem('pathos_geo') || ''
  }),

  actions: {
    _remember (choice) {
      this.choice = choice
      localStorage.setItem('pathos_geo_choice', choice)
    },

    // Browser geolocation → rounded 'lat,lon' in localStorage. A browser-level
    // denial (or timeout) downgrades the choice so we stop asking.
    capture () {
      if (!navigator.geolocation) return
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = roundCoord(pos.coords.latitude)
          const lon = roundCoord(pos.coords.longitude)
          if (lat === null || lon === null) return
          this.coords = `${lat},${lon}`
          localStorage.setItem('pathos_geo', this.coords)
          this._remember('granted')
        },
        () => {
          this.coords = ''
          localStorage.removeItem('pathos_geo')
          this._remember('denied')
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 }
      )
    },

    // Entry-point hook: first visit asks, a past yes silently refreshes the
    // stored coords (the browser permission persists), a past no stays quiet.
    maybeAsk () {
      if (this.choice === 'denied') return
      if (this.choice === 'granted') { this.capture(); return }
      Dialog.create({
        title: 'Anchor your moments?',
        message: 'pathos can stamp the things you create with where you were — ' +
          'a tiny world pin on their moment. Only your approximate city is ' +
          'kept (coordinates are blurred to ~11 km before leaving your browser).',
        ok: { label: 'Share my city', color: 'primary', unelevated: true },
        cancel: { label: 'No thanks', flat: true, color: 'grey-7' },
        persistent: false
      }).onOk(() => {
        this.capture()
      }).onCancel(() => {
        this._remember('denied')
      })
    }
  }
})
