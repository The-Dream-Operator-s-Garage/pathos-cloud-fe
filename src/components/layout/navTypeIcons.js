// Nav-entry type → icon / MicroChip kind, shared by NavigationBar (current
// title) and StackPanel (history rows).

export const TYPE_ICONS = {
  feed: 'dynamic_feed',
  node: 'adjust',
  node_edit: 'edit',
  label: 'label_important',
  post: 'edit_note',
  skeleton: 'schema',
  explorer: 'explore',
  profile: 'person',
  page: 'circle'
}

// Nav entry types → MicroChip kind slugs (posts render as posts even
// though they're skeletons under the hood — the chip tint should match
// what the user clicked).
export const CHIP_KINDS = {
  node_edit: 'node'
}

export const typeIcon = (type) => TYPE_ICONS[type] || 'circle'
export const chipKind = (type) => CHIP_KINDS[type] || type
