<template>
  <div v-if="inspection" class="hash-inspection">
    <div class="hash-inspection__head">
      <q-icon :name="inspection.derivable ? 'calculate' : 'fingerprint'" size="14px" />
      <span class="hash-inspection__kind">{{ inspection.kind }}</span>
      <span class="hash-inspection__addr">{{ shortHash }}</span>
    </div>

    <!-- The sentence a reader gets wrong on their own. It leads, because
         everything below is detail in service of it. -->
    <p class="hash-inspection__summary">{{ inspection.summary }}</p>

    <!-- DERIVABLE (nodes): show the recomputation and whether it held. -->
    <dl v-if="inspection.derivable" class="hash-inspection__rows">
      <dt>address recomputes as</dt>
      <dd><code>{{ inspection.derivation }}</code></dd>
      <dt>recomputation</dt>
      <dd>
        <span :class="derivedClass">{{ derivedLabel }}</span>
      </dd>
      <dt>the address binds</dt>
      <dd>{{ inspection.binds.join(' · ') }}</dd>
      <dt class="hash-inspection__warn">it does NOT bind</dt>
      <dd class="hash-inspection__warn">{{ inspection.excludes.join(' · ') }}</dd>
    </dl>

    <!-- NON-DERIVABLE (links, paths): say so as a PROPERTY, never as a
         blank row. An empty "derivation" cell reads as a failed check. -->
    <dl v-else class="hash-inspection__rows">
      <dt>address recomputes as</dt>
      <dd class="hash-inspection__muted">
        not derivable, by design — {{ inspection.non_derivable_reason }}
      </dd>
    </dl>

    <!-- The proof that actually carries the weight, for BOTH cases. -->
    <dl class="hash-inspection__rows hash-inspection__rows--sig">
      <dt>signature covers</dt>
      <dd><code>{{ inspection.signature_covers }}</code></dd>
      <dt>signed fields</dt>
      <dd>{{ inspection.signed_fields.join(', ') }}</dd>
      <dt>signature</dt>
      <dd><span :class="sigClass">{{ sigLabel }}</span></dd>
    </dl>
  </div>
</template>

<script>
// HashInspection — what this element's ADDRESS proves, per kind
// (2026-08-15, eng-review E7).
//
// The finding it answers: an inspection surface written for nodes and
// applied to links quietly asserts a property links do not have. A node
// address re-derives from `sha256(register_author)`; a link or path
// address is minted with a random nonce and CANNOT be recomputed. Both
// facts are fine — but the report used to carry `hash_derived: null` for
// the second case, and a reader cannot tell "not checked" from "not
// checkable by construction". Rendering that as an empty derivation row
// is worse still: it looks like something failed.
//
// So the panel branches on `inspection.derivable` and the two branches
// say different things, in the API's own words (GET /verify/<kind>/<hash>
// → `verify.inspection`, from ONE source of truth in api utils/signatures
// `hashSpecOf`). No copy of the spec lives here.
//
// The other half is the sentence that leads: for a NODE the address
// proves who and when and NEVER what — the signature is what covers the
// text. That is not a nuance, it is the difference between a badge that
// means something and a badge a reader over-trusts.
import { defineComponent, computed } from 'vue'

export default defineComponent({
  name: 'HashInspection',
  props: {
    // `verify.inspection` from GET /api/verify/<kind>/<hash>.
    inspection: { type: Object, default: null },
    // `verify.checks` — for the recomputation + signature verdicts.
    checks: { type: Object, default: null },
    hash: { type: String, default: '' }
  },
  setup (props) {
    const shortHash = computed(() =>
      props.hash ? `${String(props.hash).slice(0, 10)}…` : ''
    )

    // Three states, never two: held / contradicted / not available. A
    // missing verdict is not a passing one.
    const derivedLabel = computed(() => {
      const d = props.checks?.hash_derived
      if (d === true) return 'holds — the address matches its moment and author'
      if (d === false) return 'CONTRADICTED — the address does not match'
      return 'not available (no protobuf to recompute from)'
    })
    const derivedClass = computed(() => {
      const d = props.checks?.hash_derived
      return d === true ? 'is-ok' : d === false ? 'is-bad' : 'is-muted'
    })

    const sigLabel = computed(() => {
      const s = props.checks?.signature
      if (s === 'signed-valid') return 'valid'
      if (s === 'invalid') return `INVALID${props.checks?.signature_reason ? ` — ${props.checks.signature_reason}` : ''}`
      if (s === 'unsigned') return 'unsigned (pre-truth-spine element — only the server vouches)'
      return 'not available'
    })
    const sigClass = computed(() => {
      const s = props.checks?.signature
      return s === 'signed-valid' ? 'is-ok' : s === 'invalid' ? 'is-bad' : 'is-muted'
    })

    return { shortHash, derivedLabel, derivedClass, sigLabel, sigClass }
  }
})
</script>

<style lang="scss" scoped>
.hash-inspection {
  border: 1px solid rgba(var(--ink-rgb), 0.18);
  border-radius: 8px;
  padding: 12px 14px;
  background: rgba(var(--ink-rgb), 0.03);
  font-size: 0.85em;
  line-height: 1.5;

  &__head {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 8px;
    color: rgba(var(--ink-rgb), 0.7);
  }

  &__kind {
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.85em;
  }

  &__addr {
    font-family: monospace;
    color: rgba(var(--ink-rgb), 0.5);
  }

  &__summary {
    margin: 0 0 10px;
    color: rgba(var(--ink-rgb), 0.85);
  }

  &__rows {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 3px 12px;
    margin: 0;

    dt {
      color: rgba(var(--ink-rgb), 0.55);
      white-space: nowrap;
    }

    dd {
      margin: 0;
      min-width: 0;
      overflow-wrap: anywhere;
    }

    code {
      font-size: 0.92em;
      background: rgba(var(--ink-rgb), 0.06);
      padding: 1px 5px;
      border-radius: 4px;
    }
  }

  &__rows--sig {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px dashed rgba(var(--ink-rgb), 0.18);
  }

  &__warn dt,
  &__warn {
    color: rgba(var(--ink-rgb), 0.75);
    font-weight: 500;
  }

  &__muted {
    color: rgba(var(--ink-rgb), 0.6);
  }

  .is-ok { color: var(--q-positive, #21ba45); }
  .is-bad { color: var(--q-negative, #c10015); font-weight: 600; }
  .is-muted { color: rgba(var(--ink-rgb), 0.55); }
}
</style>
