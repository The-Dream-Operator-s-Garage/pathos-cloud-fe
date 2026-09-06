// THE ACTION REGISTRY — every event that can land on a trail item's SUB-STACK.
//
// The navigation trail (stores/navigation.js § trail) is a ledger of PLACES.
// This module is the vocabulary of what you DID in each of them: one entry
// per action code, carrying the three things the stack bar needs to draw it —
// a human `label`, a Material `icon`, and the `group` that tints it.
//
// ONE SOURCE OF TRUTH, deliberately. Before this file the vocabulary was
// six string literals scattered across five components ('VOTE_UP' in three
// places, 'PIN' in two) with no list of what was legal and no icon for any
// of them; the API's `event_type` is VARCHAR(32) and accepted every typo.
// A code that is not declared here still records (the column is free-form —
// never make it an ENUM), but it draws as the neutral fallback, which is the
// visible signal that a call site invented a name.
//
// ⚠ THE API KNOWS ONLY ONE THING about this list: which codes are the
// NAVIGATION spine (NAV_CODES below). `api/services/navService.js` folds an
// event into a trail STOP when its type is in that set and into the current
// stop's SUB-STACK otherwise — so adding an action code here needs no server
// change at all, and no keep-in-step witness. Keep it that way: the moment
// the server needs a per-code table, it needs a witness too.

// ── The groups ────────────────────────────────────────────────
// A group is the action's VOICE, not its subject. It answers "what kind of
// mark did the user leave", which is what the sub-stack line is reporting:
//   nav      moved through the platform (the spine — these BECOME stops)
//   window   opened/parked/closed a floating viewer
//   author   put new content on the chain
//   judge    scored, voted, or withdrew a judgement
//   curate   filed, pinned, labelled — arrangement, not content
//   build    schema and slot work
//   social   access, chat, orgs, money
export const ACTION_GROUPS = {
  nav: { label: 'Navigation', icon: 'explore' },
  window: { label: 'Windows', icon: 'web_asset' },
  author: { label: 'Authoring', icon: 'edit_note' },
  judge: { label: 'Judgement', icon: 'thumbs_up_down' },
  curate: { label: 'Curation', icon: 'push_pin' },
  build: { label: 'Structure', icon: 'schema' },
  social: { label: 'Social', icon: 'group' }
}

// ── The registry ──────────────────────────────────────────────
// `label` is written as a COMPLETED ACT in the past tense ("Commented",
// "Pinned"): the sub-stack line reads as a log entry under the item's
// title, never as a button. Keep them one or two words — the wide tile
// gives this line ~150px at 9px and ellipsizes past it.
export const ACTIONS = {
  // ── nav: the spine. These fold into trail STOPS, not sub-items;
  // they are declared so the expanded panel can letter them too.
  VISIT: { label: 'Visited', icon: 'east', group: 'nav' },
  BACK: { label: 'Went back', icon: 'west', group: 'nav' },
  FORWARD: { label: 'Went forward', icon: 'east', group: 'nav' },
  CHECKPOINT: { label: 'Flagged', icon: 'flag', group: 'nav' },
  CHECKPOINT_BACK: { label: 'Back to flag', icon: 'first_page', group: 'nav' },
  CHECKPOINT_FORWARD: { label: 'On to flag', icon: 'last_page', group: 'nav' },
  // INTERACT predates this registry (navService.saveState mints it when a
  // viewer reports an interaction). It stays an ACTION, not a stop.
  INTERACT: { label: 'Followed', icon: 'touch_app', group: 'nav' },

  // ── window: the flyout family (stores/flyoutViewers.js). OPEN_WINDOW is
  // the one action that ALSO opens a trail stop — visiting an element in a
  // floating window is a visit, which is the whole point of tracking it.
  OPEN_WINDOW: { label: 'Opened window', icon: 'open_in_new', group: 'window' },
  MINIMIZE_WINDOW: { label: 'Minimized', icon: 'minimize', group: 'window' },
  RESTORE_WINDOW: { label: 'Restored', icon: 'open_in_full', group: 'window' },
  MAXIMIZE_WINDOW: { label: 'Maximized', icon: 'crop_free', group: 'window' },
  CLOSE_WINDOW: { label: 'Closed window', icon: 'close', group: 'window' },
  SWITCH_VIEW: { label: 'Switched view', icon: 'swap_horiz', group: 'window' },
  // ── the CREATION WINDOWS (2026-09-06 PM, user ask: "adding to the event
  // track the opening of the uploads/skeletons/labels/posts windows"). One
  // open + one close code PER DOCK rather than a generic OPEN_DOCK with the
  // dock in the target label: the wide tile letters the CODE's label alone,
  // and "Opened uploader" is the line the ask wants read there. Recorded by
  // the four dock stores' open()/close() (every door — nav bar, note→post
  // hand-off, a viewer's "edit this label" — goes through them). Minimize /
  // restore are NOT recorded for docks: a parked dock is still open, and
  // the minitab already says so. The DOCK_WINDOWS map below ties each dock
  // key to its pair + the NAV_WINDOW leaf the API binds as the act's TARGET.
  OPEN_MAKER: { label: 'Opened post maker', icon: 'edit_note', group: 'window' },
  CLOSE_MAKER: { label: 'Closed post maker', icon: 'edit_note', group: 'window' },
  OPEN_UPLOADER: { label: 'Opened uploader', icon: 'upload_file', group: 'window' },
  CLOSE_UPLOADER: { label: 'Closed uploader', icon: 'upload_file', group: 'window' },
  OPEN_BUILDER: { label: 'Opened skeleton builder', icon: 'schema', group: 'window' },
  CLOSE_BUILDER: { label: 'Closed skeleton builder', icon: 'schema', group: 'window' },
  OPEN_LABELS: { label: 'Opened label maker', icon: 'label', group: 'window' },
  CLOSE_LABELS: { label: 'Closed label maker', icon: 'label', group: 'window' },

  // ── author
  CREATE_POST: { label: 'Posted', icon: 'edit_note', group: 'author' },
  CREATE_NODE: { label: 'Created node', icon: 'adjust', group: 'author' },
  COMMENT: { label: 'Commented', icon: 'chat_bubble', group: 'author' },
  FORK: { label: 'Forked', icon: 'call_split', group: 'author' },
  EDIT: { label: 'Edited', icon: 'edit', group: 'author' },
  SAVE_DRAFT: { label: 'Saved draft', icon: 'save', group: 'author' },
  DISCARD_DRAFT: { label: 'Discarded draft', icon: 'delete_sweep', group: 'author' },
  PROMOTE: { label: 'Published draft', icon: 'publish', group: 'author' },
  UPLOAD: { label: 'Uploaded', icon: 'upload_file', group: 'author' },
  // The uploader's acts by WHAT went up (2026-09-06 PM — the ask's own
  // example was "uploaded an image"): `uploadCodeFor(files)` picks one by
  // the batch's media kind, UPLOAD staying the mixed-batch / other-kind
  // fallback. CREATE_NOTE is the note section (a .md node), CREATE_LINK the
  // link section, NOTE_TO_POST the note's hand-off into a maker draft.
  UPLOAD_IMAGE: { label: 'Uploaded image', icon: 'image', group: 'author' },
  UPLOAD_VIDEO: { label: 'Uploaded video', icon: 'movie', group: 'author' },
  UPLOAD_AUDIO: { label: 'Uploaded audio', icon: 'audiotrack', group: 'author' },
  UPLOAD_DOC: { label: 'Uploaded document', icon: 'description', group: 'author' },
  CREATE_NOTE: { label: 'Wrote a note', icon: 'sticky_note_2', group: 'author' },
  CREATE_LINK: { label: 'Saved a link', icon: 'link', group: 'author' },
  NOTE_TO_POST: { label: 'Turned note into post', icon: 'move_up', group: 'author' },
  // The post maker's own: a fresh tab, a grid drafted into the body (the
  // ⟪skeleton⟫ token — it mints as SKELETON_CREATE once its keys are set).
  NEW_DRAFT: { label: 'Started a draft', icon: 'post_add', group: 'author' },
  SKELETON_DRAFT: { label: 'Drafted a skeleton', icon: 'grid_on', group: 'author' },
  ATTACH: { label: 'Attached', icon: 'attach_file', group: 'author' },
  DELETE: { label: 'Deleted', icon: 'delete', group: 'author' },

  // ── judge
  VOTE_UP: { label: 'Upvoted', icon: 'thumb_up', group: 'judge' },
  VOTE_DOWN: { label: 'Downvoted', icon: 'thumb_down', group: 'judge' },
  UNVOTE: { label: 'Took vote back', icon: 'thumbs_up_down', group: 'judge' },
  POLL_VOTE: { label: 'Voted in poll', icon: 'how_to_vote', group: 'judge' },
  POLL_REVERSE: { label: 'Reversed poll vote', icon: 'undo', group: 'judge' },
  CLAIM: { label: 'Made a claim', icon: 'gavel', group: 'judge' },
  CLAIM_VOTE: { label: 'Backed a claim', icon: 'gavel', group: 'judge' },
  CLAIM_RETRACT: { label: 'Retracted claim', icon: 'undo', group: 'judge' },

  // ── curate
  PIN: { label: 'Pinned', icon: 'push_pin', group: 'curate' },
  UNPIN: { label: 'Unpinned', icon: 'remove', group: 'curate' },
  LABEL_ATTACH: { label: 'Labelled', icon: 'label_important', group: 'curate' },
  LABEL_CREATE: { label: 'Created label', icon: 'new_label', group: 'curate' },
  LABEL_FORK: { label: 'Forked label', icon: 'fork_right', group: 'curate' },
  LABEL_SUGGEST: { label: 'Suggested label', icon: 'lightbulb', group: 'curate' },
  LABEL_DELETE: { label: 'Deleted label', icon: 'delete', group: 'curate' },
  // The label maker's two remaining verbs (2026-09-06 PM).
  LABEL_RENAME: { label: 'Renamed label', icon: 'drive_file_rename_outline', group: 'curate' },
  LABEL_MOVE: { label: 'Re-hung label', icon: 'low_priority', group: 'curate' },
  DASHBOARD_ADD: { label: 'Added to dashboard', icon: 'dashboard_customize', group: 'curate' },
  DASHBOARD_REMOVE: { label: 'Off the dashboard', icon: 'dashboard', group: 'curate' },

  // ── build
  SKELETON_CREATE: { label: 'Created schema', icon: 'schema', group: 'build' },
  SKELETON_FORK: { label: 'Forked schema', icon: 'fork_right', group: 'build' },
  INSTANTIATE: { label: 'Instantiated', icon: 'content_copy', group: 'build' },
  SLOT_SET: { label: 'Bound a slot', icon: 'input', group: 'build' },
  SLOT_CLEAR: { label: 'Cleared a slot', icon: 'backspace', group: 'build' },
  SLOT_DECLARE: { label: 'Declared a slot', icon: 'playlist_add', group: 'build' },
  AXIS_SET: { label: 'Set the axis', icon: 'swap_vert', group: 'build' },
  ORDER_SET: { label: 'Reordered', icon: 'sort', group: 'build' },
  SNAPSHOT: { label: 'Snapshotted', icon: 'photo_camera', group: 'build' },
  LOCK: { label: 'Locked', icon: 'lock', group: 'build' },
  UNLOCK: { label: 'Unlocked', icon: 'lock_open', group: 'build' },

  // ── social
  GRANT: { label: 'Granted access', icon: 'key', group: 'social' },
  REVOKE: { label: 'Revoked access', icon: 'key_off', group: 'social' },
  PUBLISH: { label: 'Made public', icon: 'public', group: 'social' },
  REQUEST_ACCESS: { label: 'Asked for access', icon: 'pan_tool', group: 'social' },
  CHAT_START: { label: 'Started a chat', icon: 'forum', group: 'social' },
  CHAT_SEND: { label: 'Sent a message', icon: 'send', group: 'social' },
  ORG_CREATE: { label: 'Created an org', icon: 'domain_add', group: 'social' },
  ORG_INVITE: { label: 'Invited', icon: 'person_add', group: 'social' },
  ORG_JOIN: { label: 'Joined an org', icon: 'groups', group: 'social' },
  TRANSFER: { label: 'Sent DOG', icon: 'paid', group: 'social' },
  IDENTITY_SWITCH: { label: 'Switched identity', icon: 'switch_account', group: 'social' }
}

// The NAVIGATION spine — the codes that BECOME a trail stop instead of
// landing in one's sub-stack. Mirrors `NAV_CODES` in api/services/navService.js;
// this is the ONE fact the two sides share (see the header note).
export const NAV_CODES = new Set([
  'VISIT', 'BACK', 'FORWARD', 'CHECKPOINT_BACK', 'CHECKPOINT_FORWARD'
])

const FALLBACK = { label: 'Acted', icon: 'bolt', group: 'nav' }

// The one lookup every surface uses. An undeclared code returns the neutral
// fallback rather than throwing — a stack bar must never be the thing that
// breaks because someone shipped a new verb.
export function actionMeta (code) {
  return ACTIONS[code] || FALLBACK
}

export const actionLabel = (code) => actionMeta(code).label
export const actionIcon = (code) => actionMeta(code).icon
export const actionGroup = (code) => actionMeta(code).group

// True when the code is the navigation spine (a stop, not a sub-item).
export const isNavCode = (code) => NAV_CODES.has(code)

// ── THE CREATION WINDOWS (2026-09-06 PM) ────────────────────────────
// Dock store key → its open/close codes, the human name, and the
// PATHCHAIN > NAV_WINDOW leaf the API binds as the act's TARGET (a window
// is not an element; its leaf is). `navStore.recordDock(key, 'open'|'close')`
// is the one call site shape; the four dock stores use it.
export const DOCK_WINDOWS = {
  maker: { open: 'OPEN_MAKER', close: 'CLOSE_MAKER', label: 'Post maker', leaf: 'MAKER' },
  uploader: { open: 'OPEN_UPLOADER', close: 'CLOSE_UPLOADER', label: 'Uploader', leaf: 'UPLOADER' },
  skeletonBuilder: { open: 'OPEN_BUILDER', close: 'CLOSE_BUILDER', label: 'Skeleton builder', leaf: 'SKELETON_BUILDER' },
  labelMaker: { open: 'OPEN_LABELS', close: 'CLOSE_LABELS', label: 'Label maker', leaf: 'LABEL_MAKER' }
}

// The uploader's verb for a batch of files (File objects or { type } /
// { file: { mime } } rows): one media kind across the batch names it;
// a mixed batch or an unknown kind falls back to UPLOAD.
export function uploadCodeFor (files) {
  const list = Array.isArray(files) ? files : [files]
  const kinds = new Set(list.map(f => {
    const mime = String(f?.type || f?.mime || f?.file?.mime || f?.file?.type || '').toLowerCase()
    if (mime.startsWith('image/')) return 'UPLOAD_IMAGE'
    if (mime.startsWith('video/')) return 'UPLOAD_VIDEO'
    if (mime.startsWith('audio/')) return 'UPLOAD_AUDIO'
    if (mime === 'application/pdf' || mime.startsWith('text/') || mime.includes('document') || mime.includes('markdown')) return 'UPLOAD_DOC'
    return 'UPLOAD'
  }))
  return kinds.size === 1 ? [...kinds][0] : 'UPLOAD'
}
