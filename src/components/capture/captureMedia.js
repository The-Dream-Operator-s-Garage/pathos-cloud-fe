import { nodeService } from 'src/services/node.service'

// Shared by the capture window's camera and recorder faces (2026-10-11):
// which container the browser can record, what extension the platform
// reads it under, the one upload seam, and the small formatters.

// MediaRecorder's menu differs per engine — Chrome/Firefox hand out WebM
// (vp9/vp8 + opus), Safari MP4 (h264 + aac) — so each face asks for the
// first supported type in its list and names the file after what it got.
export const VIDEO_TYPES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
  'video/mp4'
]
export const AUDIO_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus'
]

export const pickMimeType = (candidates) => {
  if (typeof MediaRecorder === 'undefined') return ''
  return candidates.find((t) => {
    try { return MediaRecorder.isTypeSupported(t) } catch (_) { return false }
  }) || ''
}

// The API reads a FILE node's KIND off its extension (uploadService
// .KIND_BY_EXT): audio/webm must land as `.weba` — `.webm` reads as VIDEO
// there and the node would draw a video player around a voice note.
export const extForMime = (mime) => {
  const m = String(mime || '').toLowerCase()
  if (m.startsWith('audio/webm')) return 'weba'
  if (m.startsWith('audio/mp4')) return 'm4a'
  if (m.startsWith('audio/ogg')) return 'ogg'
  if (m.startsWith('audio/mpeg')) return 'mp3'
  if (m.startsWith('video/webm')) return 'webm'
  if (m.startsWith('video/mp4')) return 'mp4'
  if (m.startsWith('video/quicktime')) return 'mov'
  if (m === 'image/jpeg') return 'jpg'
  if (m === 'image/png') return 'png'
  if (m === 'image/webp') return 'webp'
  return 'bin'
}

// `20261011-142233` — local time, so two takes a second apart never share
// a name in the explorer (the hash is the identity; the name is for eyes).
export const stamp = () => {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

export const fmtClock = (ms) => {
  const s = Math.max(0, Math.floor((ms || 0) / 1000))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export const fmtBytes = (n) => {
  if (!n) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), u.length - 1)
  return `${(n / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${u[i]}`
}

export const stopStream = (stream) => {
  try { stream?.getTracks().forEach((t) => t.stop()) } catch (_) { /* already gone */ }
}

// One sentence per failure the permission dance can end in.
export const mediaErrorText = (e, device = 'device') => {
  const n = e?.name || ''
  if (n === 'NotAllowedError' || n === 'SecurityError') return `Permission refused — allow the browser to use the ${device}, then try again.`
  if (n === 'NotFoundError' || n === 'OverconstrainedError') return `No ${device} found on this machine.`
  if (n === 'NotReadableError' || n === 'AbortError') return `The ${device} is busy in another app.`
  if (typeof navigator !== 'undefined' && !navigator.mediaDevices) return 'This browser cannot open media devices here (needs https or localhost).'
  return e?.message || `Could not start the ${device}.`
}

// The multer cap on POST /nodes/upload (api/routes/nodeRoutes.js), restated
// so an oversize take fails with a sentence instead of a 500.
export const UPLOAD_CAP = 25 * 1024 * 1024

// THE ONE UPLOAD SEAM: the same POST /nodes/upload the uploader's files
// section uses, plus the `capture` door (CAMERA | RECORDER | NOTEPAD →
// a PATHCHAIN > CAPTURE leaf on the node). No labels, no author picker —
// a quick capture is minted by the acting identity as it stands, private
// by default (no ACCESS path = owner-only), onto the owner's UPLOADS_PATH.
export const uploadCapture = async (blob, name, capture) => {
  if (blob.size > UPLOAD_CAP) {
    return { success: false, error: { message: `${fmtBytes(blob.size)} is over the ${fmtBytes(UPLOAD_CAP)} upload cap` } }
  }
  const fd = new FormData()
  fd.append('files', blob, name)
  fd.append('labelIds', '[]')
  fd.append('capture', capture)
  try {
    return await nodeService.upload(fd)
  } catch (e) {
    return { success: false, error: { message: e?.response?.data?.error?.message || e?.message || 'Upload failed' } }
  }
}
