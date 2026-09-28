// A node that is SHOWABLE is one whose preview is the thing itself: a
// URL an EMBED_RULE recognizes (YouTube, Spotify, Wikipedia, …) — the API
// hands those a `node.embed` descriptor — or a media file (image / video /
// audio). Everywhere the platform decides between "point at the node" (a
// micro chip) and "show the node" (its Mini panel with the player or the
// picture), this is the one law it reads (2026-09-28):
//
//   · NodeRefAuto — a bare [[pathos:nodes/…]] ref on an AUTO surface
//     blooms into the Mini when the node is showable;
//   · RefBrowser / the uploader — a showable node staged on a post draft
//     is stamped `mini` by default, so the body carries `![[…]]` and the
//     player shows on EVERY surface, not only the AUTO ones.
//
// Binary files stay a one-line row, so the chip serves them better inline.
export const MEDIA_FILE_KINDS = new Set(['image', 'video', 'audio'])

export function isShowableNode (node) {
  if (!node) return false
  return !!node.embed || MEDIA_FILE_KINDS.has(node.file?.kind)
}
