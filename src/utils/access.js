// Locked-element detection for the viewer pages: a direct read that 403s
// with the access-doctrine code (40310) carries a locked stub naming the
// element (hash stays visible — user law). Returns
// { kind, hash, id, address } or null when the error is anything else.
export const lockedInfoFromError = (err) => {
  const body = err?.response?.data
  if (err?.response?.status !== 403 || body?.error?.code !== 40310) return null
  const el = body.error.element || {}
  const address = el.kind && el.hash ? `${el.kind}/${el.hash}` : null
  return { kind: el.kind || null, hash: el.hash || null, id: el.id || null, address }
}
