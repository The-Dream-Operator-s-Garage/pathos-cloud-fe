<template>
  <!-- ── THE RECORDER FACE (2026-10-11): "Lets the user enable the
       microphone, record a note. Discard it in the moment to start over,
       and, if accepted, the voice note is saved straight back into the
       private node collection of the user".

       States: asking → ARMED (the meter breathes with the room) → RECORDING
       (clock, the meter scrolls) → REVIEW (a player; Discard starts over,
       Keep uploads). The meter is 28 bars of recent level off an
       AnalyserNode — a scrolling trace, not a VU needle, so a silent mic
       reads as a flat line rather than as "working". Ten-minute cap; the
       container is whatever the engine records (Chrome WebM/opus lands as
       `.weba`, Safari MP4 as `.m4a`), uploaded with `capture=recorder`. ── -->
  <div class="rec" :class="{ 'is-recording': recording, 'is-review': !!take }">
    <div class="rec__stage">
      <div class="rec__meter" aria-hidden="true">
        <i v-for="(lv, i) in levels" :key="i" class="rec__bar" :style="{ '--lv': lv }" />
      </div>
      <span class="rec__clock mono">{{ clock }}</span>
      <audio v-if="take" :src="take.url" class="rec__player" controls />

      <div v-if="error" class="rec__notice">
        <q-icon name="mic_off" size="22px" />
        <span>{{ error }}</span>
        <q-btn flat dense no-caps class="rec__retry" label="Try again" @click="start" />
      </div>
      <div v-else-if="!ready && !take" class="rec__notice">
        <q-spinner size="18px" />
        <span>Asking for the microphone…</span>
      </div>
    </div>

    <div class="rec__controls">
      <template v-if="!take">
        <button type="button" class="rec__main" :class="{ 'is-on': recording }" :disabled="!ready || !canRecord" :title="recording ? 'Stop' : 'Record'" @click="toggle">
          <q-icon :name="recording ? 'stop' : 'mic'" size="24px" />
        </button>
      </template>
      <template v-else>
        <q-btn unelevated no-caps class="rec__plate rec__plate--discard" icon="delete_outline" label="Discard" :disable="busy" @click="discard" />
        <q-btn unelevated no-caps class="rec__plate rec__plate--keep" icon="check" :label="busy ? 'Saving…' : 'Keep'" :loading="busy" @click="keep" />
      </template>
    </div>
    <p class="rec__hint">{{ hint }}</p>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useNavStore } from 'src/stores/navigation'
import {
  AUDIO_TYPES, pickMimeType, extForMime, stamp, fmtClock, fmtBytes,
  stopStream, mediaErrorText, uploadCapture
} from './captureMedia'

const AUDIO_CAP_MS = 10 * 60 * 1000
const BARS = 28

export default defineComponent({
  name: 'RecorderFace',
  emits: ['created'],
  setup (props, { emit }) {
    const ready = ref(false)
    const error = ref('')
    const recording = ref(false)
    const clock = ref('00:00')
    const take = ref(null)
    const busy = ref(false)
    const saveError = ref('')
    const levels = ref(new Array(BARS).fill(0))

    let stream = null
    let recorder = null
    let chunks = []
    let recStart = 0
    let clockTimer = null
    let capTimer = null
    let audioCtx = null
    let analyser = null
    let raf = 0
    let lastMeter = 0

    const audioType = pickMimeType(AUDIO_TYPES)
    const canRecord = computed(() => !!audioType)

    const hint = computed(() => {
      if (saveError.value) return saveError.value
      if (take.value) return `${fmtClock(take.value.ms)} · ${fmtBytes(take.value.blob.size)} — Keep saves it to your private node collection; Discard starts over.`
      if (recording.value) return `Recording — stops by itself at ${fmtClock(AUDIO_CAP_MS)}.`
      if (!canRecord.value && ready.value) return 'This browser cannot record audio.'
      return 'Press to record a voice note.'
    })

    // The trace: once every ~60ms push the current RMS level (0..1) and
    // drop the oldest, so the meter scrolls left while it listens.
    const meter = (now) => {
      raf = requestAnimationFrame(meter)
      if (!analyser || now - lastMeter < 60) return
      lastMeter = now
      const buf = new Uint8Array(analyser.fftSize)
      analyser.getByteTimeDomainData(buf)
      let sum = 0
      for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v }
      const rms = Math.sqrt(sum / buf.length)
      const lv = Math.min(1, rms * 3.2)
      levels.value = [...levels.value.slice(1), Number(lv.toFixed(3))]
    }

    const start = async () => {
      error.value = ''
      ready.value = false
      stopStream(stream)
      stream = null
      if (!navigator.mediaDevices?.getUserMedia) {
        error.value = mediaErrorText(null, 'microphone')
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      } catch (e) {
        error.value = mediaErrorText(e, 'microphone')
        return
      }
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext
        if (Ctx) {
          audioCtx = audioCtx || new Ctx()
          analyser = audioCtx.createAnalyser()
          analyser.fftSize = 1024
          audioCtx.createMediaStreamSource(stream).connect(analyser)
          cancelAnimationFrame(raf)
          raf = requestAnimationFrame(meter)
        }
      } catch (_) { /* no meter — recording still works */ }
      ready.value = true
    }

    const tick = () => { clock.value = fmtClock(Date.now() - recStart) }

    const stopRecord = () => {
      if (!recorder || recorder.state === 'inactive') return
      try { recorder.stop() } catch (_) { /* already stopping */ }
    }

    const clearTake = () => {
      if (take.value?.url) URL.revokeObjectURL(take.value.url)
      take.value = null
    }

    const toggle = () => {
      if (recording.value) { stopRecord(); return }
      if (!stream || !audioType) return
      chunks = []
      try {
        recorder = new MediaRecorder(stream, { mimeType: audioType })
      } catch (e) {
        saveError.value = 'Could not start recording: ' + (e?.message || e)
        return
      }
      recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data) }
      recorder.onstop = () => {
        recording.value = false
        clearInterval(clockTimer)
        clearTimeout(capTimer)
        const ms = Date.now() - recStart
        const blob = new Blob(chunks, { type: audioType.split(';')[0] })
        chunks = []
        if (!blob.size) return
        clearTake()
        saveError.value = ''
        take.value = { blob, url: URL.createObjectURL(blob), ms, mime: blob.type }
      }
      recStart = Date.now()
      tick()
      saveError.value = ''
      recorder.start(1000)
      recording.value = true
      clockTimer = setInterval(tick, 250)
      capTimer = setTimeout(stopRecord, AUDIO_CAP_MS)
    }

    const discard = () => {
      clearTake()
      clock.value = '00:00'
      saveError.value = ''
    }

    const keep = async () => {
      const t = take.value
      if (!t || busy.value) return
      busy.value = true
      saveError.value = ''
      const name = `voice-${stamp()}.${extForMime(t.mime)}`
      const r = await uploadCapture(t.blob, name, 'recorder')
      busy.value = false
      if (!r.success || !r.nodes?.length) {
        saveError.value = r.error?.message || r.errors?.[0]?.message || 'Upload failed'
        return
      }
      const node = r.nodes[0]
      try {
        useNavStore().recordAction('CAPTURE_AUDIO', {
          targetType: 'node', targetId: node.id, targetLabel: name, targetPath: node.path
        })
      } catch (_) { /* a capture must never fail because its log did */ }
      emit('created', r.nodes, 'mic', !!r.labeling)
      discard()
    }

    onMounted(start)
    onBeforeUnmount(() => {
      stopRecord()
      clearInterval(clockTimer)
      clearTimeout(capTimer)
      cancelAnimationFrame(raf)
      stopStream(stream)
      stream = null
      try { audioCtx?.close() } catch (_) { /* already closed */ }
      audioCtx = null
      clearTake()
    })

    return { ready, error, recording, clock, take, busy, levels, canRecord, hint, start, toggle, discard, keep }
  }
})
</script>

<style lang="scss" scoped>
.rec {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  flex: 1;
}
.rec__stage {
  position: relative;
  flex: 1;
  min-height: 140px;
  border-radius: var(--radius-md);
  background: var(--dock-well, var(--teal-1));
  border: 1px solid var(--dock-rule, var(--teal-7));
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px;
}
.rec__meter {
  display: flex;
  align-items: center;
  gap: 3px;
  height: 64px;
  width: min(100%, 340px);
}
.rec__bar {
  flex: 1;
  height: calc(4px + var(--lv, 0) * 60px);
  border-radius: 2px;
  background: var(--dock-ink, var(--teal-7));
  opacity: 0.75;
  transition: height 0.08s linear;
}
.is-recording .rec__bar { background: #d84f47; opacity: 0.85; }
.rec__clock {
  font-size: 1.1em;
  letter-spacing: 0.1em;
  color: var(--dock-ink, var(--teal-7));
}
.is-recording .rec__clock { color: #d84f47; }
.rec__player { width: min(100%, 340px); }
.rec__notice {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  text-align: center;
  color: var(--dock-ink, var(--teal-7));
  font-size: 0.8em;
  background: var(--dock-well, var(--teal-1));
}
.rec__retry { color: var(--dock-rule-strong, var(--teal-9)); }

.rec__controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  flex-shrink: 0;
}
.rec__main {
  width: 54px;
  height: 54px;
  padding: 0;
  border-radius: 50%;
  border: 3px solid var(--dock-rule, var(--teal-7));
  background: var(--dock-well, var(--teal-1));
  color: var(--dock-ink, var(--teal-7));
  box-shadow: inset 0 0 0 3px var(--paper-card);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.12s, color 0.12s, transform 0.12s;
  &:hover:not(:disabled) { background: var(--paper-card); }
  &:active:not(:disabled) { transform: scale(0.95); }
  &:disabled { opacity: 0.35; cursor: default; }
  &.is-on {
    background: #ff5f57;
    border-color: #d84f47;
    color: #fff;
    box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.6);
  }
}
.rec__plate {
  border-radius: 4px;
  font-size: 0.74em;
  letter-spacing: 0.04em;
  min-height: 30px;
  padding: 0 14px;
}
.rec__plate--discard {
  background: var(--dock-well, var(--teal-1));
  color: var(--dock-ink, var(--teal-7));
  border: 1px solid var(--dock-rule, var(--teal-7));
}
.rec__plate--keep {
  background: var(--dock-ink, var(--teal-7));
  color: #fff;
  border: 1px solid var(--dock-rule-strong, var(--teal-9));
}
.rec__hint {
  margin: 0;
  text-align: center;
  font-size: 0.68em;
  color: var(--dock-ink-mute, var(--teal-4));
  min-height: 1.2em;
}
</style>
