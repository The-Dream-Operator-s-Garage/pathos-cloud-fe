<template>
  <!-- ── THE CAMERA FACE (2026-10-11): "the camera permission pops and if
       accepted, a new window appears with basic photo and video taking
       features … Then, if accepted, this is directly uploaded to the private
       node collection of the user".

       Three states on one stage: LIVE (the preview, shutter + record),
       REVIEW (the take just made — Keep or Retake; nothing uploads until
       Keep), and the notices (asking, refused, no device). A photo is a
       JPEG drawn off the live frame; a clip is what MediaRecorder hands
       back, capped at two minutes and ~1.5 Mbps so a full take stays under
       the 25 MB upload cap. Keep → POST /nodes/upload with `capture=camera`;
       the face goes back to LIVE for the next take and the dock draws the
       node's chip in its receipts row. ── -->
  <div class="cam" :class="{ 'is-review': !!shot, 'is-recording': recording }">
    <div class="cam__stage">
      <video v-show="!shot" ref="videoEl" class="cam__video" autoplay muted playsinline />
      <img v-if="shot && shot.kind === 'photo'" :src="shot.url" class="cam__still" alt="The photo just taken" />
      <video v-if="shot && shot.kind === 'video'" :src="shot.url" class="cam__still" controls playsinline />

      <div v-if="error" class="cam__notice">
        <q-icon name="videocam_off" size="22px" />
        <span>{{ error }}</span>
        <q-btn flat dense no-caps class="cam__retry" label="Try again" @click="start" />
      </div>
      <div v-else-if="!ready && !shot" class="cam__notice">
        <q-spinner size="18px" />
        <span>Asking for the camera…</span>
      </div>

      <span v-if="recording" class="cam__rec mono"><i class="cam__rec-dot" /> REC {{ clock }}</span>
      <span v-if="shot" class="cam__badge mono">
        {{ shot.kind === 'photo' ? 'photo' : `video · ${fmtClock(shot.ms)}` }} · {{ fmtBytes(shot.blob.size) }}
      </span>
    </div>

    <div class="cam__controls">
      <template v-if="!shot">
        <button type="button" class="cam__btn" :disabled="!ready || cameras < 2 || recording" title="Switch camera" @click="flip">
          <q-icon name="cameraswitch" size="18px" />
        </button>
        <button type="button" class="cam__shutter" :disabled="!ready || recording" title="Take a photo" @click="snap">
          <q-icon name="photo_camera" size="22px" />
        </button>
        <button type="button" class="cam__btn cam__btn--rec" :class="{ 'is-on': recording }" :disabled="!ready || !canRecord" :title="recording ? 'Stop recording' : 'Record a video'" @click="toggleRecord">
          <q-icon :name="recording ? 'stop' : 'videocam'" size="18px" />
        </button>
      </template>
      <template v-else>
        <q-btn unelevated no-caps class="cam__plate cam__plate--retake" icon="replay" label="Retake" :disable="busy" @click="discard" />
        <q-btn unelevated no-caps class="cam__plate cam__plate--keep" icon="check" :label="busy ? 'Saving…' : 'Keep'" :loading="busy" @click="keep" />
      </template>
    </div>
    <p class="cam__hint">{{ hint }}</p>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useNavStore } from 'src/stores/navigation'
import {
  VIDEO_TYPES, pickMimeType, extForMime, stamp, fmtClock, fmtBytes,
  stopStream, mediaErrorText, uploadCapture
} from './captureMedia'

const VIDEO_CAP_MS = 2 * 60 * 1000
const VIDEO_BPS = 1500000

export default defineComponent({
  name: 'CameraFace',
  emits: ['created'],
  setup (props, { emit }) {
    const videoEl = ref(null)
    const ready = ref(false)
    const error = ref('')
    const cameras = ref(0)
    const facing = ref('user')
    const silent = ref(false)
    const recording = ref(false)
    const clock = ref('00:00')
    const shot = ref(null)
    const busy = ref(false)
    const saveError = ref('')

    let stream = null
    let recorder = null
    let chunks = []
    let recStart = 0
    let clockTimer = null
    let capTimer = null

    const videoType = pickMimeType(VIDEO_TYPES)
    const canRecord = computed(() => !!videoType)

    const hint = computed(() => {
      if (saveError.value) return saveError.value
      if (shot.value) return 'Keep saves it to your private node collection; Retake throws it away.'
      if (recording.value) return `Recording — stops by itself at ${fmtClock(VIDEO_CAP_MS)}.`
      if (silent.value) return 'No microphone — clips record without sound.'
      if (!canRecord.value && ready.value) return 'This browser cannot record video; photos still work.'
      return 'Photos save as JPEG; clips as the browser records them.'
    })

    const countCameras = async () => {
      try {
        const devs = await navigator.mediaDevices.enumerateDevices()
        cameras.value = devs.filter(d => d.kind === 'videoinput').length
      } catch (_) { cameras.value = 1 }
    }

    const start = async () => {
      error.value = ''
      ready.value = false
      stopStream(stream)
      stream = null
      if (!navigator.mediaDevices?.getUserMedia) {
        error.value = mediaErrorText(null, 'camera')
        return
      }
      const video = { facingMode: facing.value, width: { ideal: 1280 }, height: { ideal: 720 } }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video, audio: true })
        silent.value = false
      } catch (e) {
        // A refused or missing microphone must not cost the camera: retry
        // video-only and say the clips will be silent.
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video, audio: false })
          silent.value = true
        } catch (e2) {
          error.value = mediaErrorText(e2, 'camera')
          return
        }
      }
      if (videoEl.value) {
        videoEl.value.srcObject = stream
        try { await videoEl.value.play() } catch (_) { /* autoplay policies — muted + playsinline covers it */ }
      }
      ready.value = true
      countCameras()
    }

    const flip = async () => {
      facing.value = facing.value === 'user' ? 'environment' : 'user'
      await start()
    }

    const clearShot = () => {
      if (shot.value?.url) URL.revokeObjectURL(shot.value.url)
      shot.value = null
    }

    const snap = () => {
      const v = videoEl.value
      if (!v || !ready.value) return
      const w = v.videoWidth || 1280
      const h = v.videoHeight || 720
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      const ctx = c.getContext('2d')
      // A front camera previews mirrored (CSS); the file keeps the true
      // orientation, as every camera app does.
      ctx.drawImage(v, 0, 0, w, h)
      c.toBlob((blob) => {
        if (!blob) return
        clearShot()
        saveError.value = ''
        shot.value = { kind: 'photo', blob, url: URL.createObjectURL(blob), ms: 0, mime: 'image/jpeg' }
      }, 'image/jpeg', 0.92)
    }

    const tick = () => { clock.value = fmtClock(Date.now() - recStart) }

    const stopRecord = () => {
      if (!recorder || recorder.state === 'inactive') return
      try { recorder.stop() } catch (_) { /* already stopping */ }
    }

    const toggleRecord = () => {
      if (recording.value) { stopRecord(); return }
      if (!stream || !videoType) return
      chunks = []
      try {
        recorder = new MediaRecorder(stream, { mimeType: videoType, videoBitsPerSecond: VIDEO_BPS })
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
        const blob = new Blob(chunks, { type: videoType.split(';')[0] })
        chunks = []
        if (!blob.size) return
        clearShot()
        saveError.value = ''
        shot.value = { kind: 'video', blob, url: URL.createObjectURL(blob), ms, mime: blob.type }
      }
      recStart = Date.now()
      tick()
      recorder.start(1000)
      recording.value = true
      clockTimer = setInterval(tick, 250)
      capTimer = setTimeout(stopRecord, VIDEO_CAP_MS)
    }

    const discard = () => { clearShot(); saveError.value = '' }

    const keep = async () => {
      const s = shot.value
      if (!s || busy.value) return
      busy.value = true
      saveError.value = ''
      const ext = extForMime(s.mime)
      const name = `${s.kind === 'photo' ? 'photo' : 'clip'}-${stamp()}.${ext}`
      const r = await uploadCapture(s.blob, name, 'camera')
      busy.value = false
      if (!r.success || !r.nodes?.length) {
        saveError.value = r.error?.message || r.errors?.[0]?.message || 'Upload failed'
        return
      }
      const node = r.nodes[0]
      try {
        useNavStore().recordAction(s.kind === 'photo' ? 'CAPTURE_PHOTO' : 'CAPTURE_VIDEO', {
          targetType: 'node', targetId: node.id, targetLabel: name, targetPath: node.path
        })
      } catch (_) { /* a capture must never fail because its log did */ }
      emit('created', r.nodes, s.kind === 'photo' ? 'photo_camera' : 'videocam')
      clearShot()
    }

    onMounted(start)
    onBeforeUnmount(() => {
      stopRecord()
      clearInterval(clockTimer)
      clearTimeout(capTimer)
      stopStream(stream)
      stream = null
      clearShot()
    })

    return {
      videoEl,
      ready,
      error,
      cameras,
      recording,
      clock,
      shot,
      busy,
      canRecord,
      hint,
      start,
      flip,
      snap,
      toggleRecord,
      discard,
      keep,
      fmtClock,
      fmtBytes
    }
  }
})
</script>

<style lang="scss" scoped>
// The face's dials come from the capture dock (teal via `--dock-*`). The
// stage is a dark well — a viewfinder is black by convention and the
// preview's own pixels are the only colour on it.
.cam {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  flex: 1;
}
.cam__stage {
  position: relative;
  flex: 1;
  min-height: 160px;
  border-radius: var(--radius-md);
  background: var(--grey-10, #212121);
  border: 1px solid var(--dock-rule, var(--teal-7));
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cam__video,
.cam__still {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: var(--grey-10, #212121);
}
// The live preview reads as a mirror (the front camera convention); the
// photo it yields is not — see snap().
.cam__video { transform: scaleX(-1); }
.cam__notice {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  text-align: center;
  color: var(--grey-3, #eee);
  font-size: 0.8em;
  background: var(--grey-10, #212121);
}
.cam__retry { color: var(--teal-3); }
.cam__rec {
  position: absolute;
  top: 8px;
  left: 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 0.68em;
  letter-spacing: 0.06em;
}
.cam__rec-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff5f57;
  animation: cam-blink 1s steps(2, start) infinite;
}
@keyframes cam-blink { to { visibility: hidden; } }
.cam__badge {
  position: absolute;
  bottom: 8px;
  left: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 0.66em;
  letter-spacing: 0.05em;
}

.cam__controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  flex-shrink: 0;
}
.cam__btn,
.cam__shutter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 50%;
  border: 1.5px solid var(--dock-rule, var(--teal-7));
  background: var(--dock-well, var(--teal-1));
  color: var(--dock-ink, var(--teal-7));
  cursor: pointer;
  transition: background 0.12s, color 0.12s, transform 0.12s;
  &:hover:not(:disabled) { background: var(--paper-card); }
  &:active:not(:disabled) { transform: scale(0.95); }
  &:disabled { opacity: 0.35; cursor: default; }
}
.cam__btn { width: 38px; height: 38px; }
.cam__shutter {
  width: 54px;
  height: 54px;
  border-width: 3px;
  box-shadow: inset 0 0 0 3px var(--paper-card);
}
.cam__btn--rec.is-on {
  background: #ff5f57;
  border-color: #d84f47;
  color: #fff;
}
.cam__plate {
  border-radius: 4px;
  font-size: 0.74em;
  letter-spacing: 0.04em;
  min-height: 30px;
  padding: 0 14px;
}
.cam__plate--retake {
  background: var(--dock-well, var(--teal-1));
  color: var(--dock-ink, var(--teal-7));
  border: 1px solid var(--dock-rule, var(--teal-7));
}
.cam__plate--keep {
  background: var(--dock-ink, var(--teal-7));
  color: #fff;
  border: 1px solid var(--dock-rule-strong, var(--teal-9));
}
.cam__hint {
  margin: 0;
  text-align: center;
  font-size: 0.68em;
  color: var(--dock-ink-mute, var(--teal-4));
  min-height: 1.2em;
}
</style>
