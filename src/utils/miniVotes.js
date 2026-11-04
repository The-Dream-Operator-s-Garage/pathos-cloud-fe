// ── THE MINI FAMILY'S VOTES — an opt-in (2026-11-04, user ask: the side
// viewer's comments, forks and references drawn in the path family "but
// attach the voting section on the footer of the family please. use thumbs
// up and down for voting icons instead of arrows").
//
// The family's foot (`shared/MiniFoot.vue`) draws `MiniVotes` at its right
// end only under a provider: a surface that wants votes on its minis wraps
// them in `shared/MiniVotesScope.vue` (or calls `provideMiniVotes()` in its
// own setup). Everywhere else the foot stays the provenance line it has been
// since the votes left the minis on 2026-08-23 (NodeMini: "remove the voting
// section"; PostMini printed ↑0 ↓0 on every quoted post) — so turning them
// back on is a surface's decision, never a family-wide side effect.
import { provide, inject } from 'vue'

const KEY = Symbol('pathos-mini-votes')

export const provideMiniVotes = (on = true) => provide(KEY, !!on)
export const useMiniVotes = () => inject(KEY, false)
