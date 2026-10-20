// The board's provide/inject key (dashboards phase 9, 2026-10-19):
// DashboardBoard provides `{ chain, slotKinds }` — the addresses of every
// board standing above this one (the cycle guard: a slot never offers or
// accepts an address in the chain) and the template's slot kinds (the
// field tag a template slot wears). A plain module so the slot, the
// picker and the mini import ONE symbol without importing the board.
export const DASHBOARD_HOST = Symbol('pathos.dashboardHost')
