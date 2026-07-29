<template>
  <!-- Tall right-hand section of the feed — the twin of LabelUsages on the
       labels page. For the selected feed item it lays out everything the
       feed endpoint knows about the post: full excerpt, the identity of
       every bound element as a Micro / Info chip (author entity, post
       skeleton, content node, moment), thread provenance, labels, and the
       activity tallies. -->
  <div class="feed-post-panel pathos-card">
    <div class="feed-post-panel__head">
      <q-icon name="edit_note" size="16px" class="q-mr-sm text-accent" />
      <div class="col">
        <div class="nasalization text-accent" style="font-size:0.9em;">Post</div>
        <div v-if="item" class="feed-post-panel__sub">
          <span class="mono">#{{ item.skeleton_id }}</span>
          <span> — {{ timeAgo(item.created_at, item.moment) }}</span>
        </div>
      </div>
      <router-link v-if="item" :to="'/posts/' + item.skeleton_id" class="feed-post-panel__open">
        open <q-icon name="arrow_forward" size="12px" />
      </router-link>
    </div>

    <div v-if="!item" class="feed-post-panel__empty">
      <q-icon name="touch_app" size="28px" style="opacity:.3;" />
      <div class="q-mt-sm">Select a post to inspect everything it carries.</div>
    </div>

    <div v-else class="feed-post-panel__scroll">

      <!-- Content — the title, then the CONTENT node ITSELF.

           The body used to be a plain `panel-excerpt` div: `item.excerpt`,
           280 chars, markdown punctuation stripped. That is a preview of a
           node printed as if it were the panel's own prose, on a surface
           whose whole job is to state what the post is MADE OF. So the same
           NodeMini a `![[pathos:nodes/…]]` block embed drops into a post
           body renders here instead (2026-07-27) — the node arrives as the
           teal element it is, carrying its address chip, its votes and its
           tallies, and `raw` makes its body the markdown AS WRITTEN rather
           than a stripped excerpt of it.

           It falls back to the feed item's excerpt only while the node
           request is in flight or if it fails, so the panel never blanks.

           The post's TITLE is INSIDE that panel's header (2026-07-27), not
           on a `panel-title` line above it. It was stacked over the node as
           a second heading, so the section stated the same document's name
           twice — once as the panel's own text and once as `Node #332` in
           the Mini's header, where a plain id is exactly the placeholder a
           real name should displace. NodeMini already resolves
           `node.title` first, so the title arrives as part of the card
           (`contentNodeCard`) and the id stands only when nothing better
           exists — a post whose markdown opens with no `# heading` has no
           TITLE bound, and `Node #332` is then the honest label. -->
      <section class="feed-post-panel__group">
        <div class="feed-post-panel__group-head">
          <q-icon name="article" size="12px" style="color:#7d8995;" />
          content
        </div>

        <NodeMini v-if="contentNodeCard" :node="contentNodeCard" raw />
        <div v-else-if="item.excerpt" class="panel-excerpt">
          {{ item.excerpt }}<span v-if="item.excerpt.length >= 280">…</span>
        </div>
        <div v-else class="panel-none">(no content)</div>
      </section>

      <!-- Identity — every bound element as a chip of the Micro family -->
      <section class="feed-post-panel__group">
        <div class="feed-post-panel__group-head">
          <q-icon name="fingerprint" size="12px" style="color:#5b6c82;" />
          identity
        </div>
        <div class="panel-fact">
          <span class="panel-fact__key">author</span>
          <span v-if="item.author" class="panel-fact__val">
            <EntityName class="panel-author" :entity="item.author" :show-icon="false" />
            <EntityMicro :id="item.author.id" :path="item.author.path" />
          </span>
          <span v-else class="panel-none">unknown</span>
        </div>
        <div class="panel-fact">
          <span class="panel-fact__key">post</span>
          <span class="panel-fact__val">
            <PostMicro :id="item.skeleton_id" :path="item.skeleton_path" />
          </span>
        </div>
        <div v-if="item.content_node" class="panel-fact">
          <span class="panel-fact__key">node</span>
          <span class="panel-fact__val">
            <NodeMicro :id="item.content_node.id" :path="item.content_node.path" />
          </span>
        </div>
        <div v-if="item.moment" class="panel-fact">
          <span class="panel-fact__key">moment</span>
          <span class="panel-fact__val">
            <MomentInfo :moment="item.moment" dense />
          </span>
        </div>
        <div v-if="item.provenance" class="panel-fact">
          <span class="panel-fact__key">origin</span>
          <span class="panel-fact__val mono panel-prov">{{ item.provenance }}</span>
        </div>
      </section>

      <!-- Thread — parent / fork lineage, self-resolving Info chips -->
      <section
        v-if="item.parent_skeleton_id || item.forked_from_id"
        class="feed-post-panel__group"
      >
        <div class="feed-post-panel__group-head">
          <q-icon name="account_tree" size="12px" style="color:#4d8a83;" />
          thread
        </div>
        <div v-if="item.parent_skeleton_id" class="panel-fact">
          <span class="panel-fact__key">comments on</span>
          <span class="panel-fact__val">
            <InfoChip kind="skeletons" :id="item.parent_skeleton_id" dense />
          </span>
        </div>
        <div v-if="item.forked_from_id" class="panel-fact">
          <span class="panel-fact__key">forked from</span>
          <span class="panel-fact__val">
            <InfoChip kind="skeletons" :id="item.forked_from_id" dense />
          </span>
        </div>
      </section>

      <!-- Labels — everything not already surfaced by a dedicated chip -->
      <section v-if="chipLabels.length" class="feed-post-panel__group">
        <div class="feed-post-panel__group-head">
          <q-icon name="label_important" size="12px" style="color:#00829c;" />
          labels <span class="feed-post-panel__total">{{ chipLabels.length }}</span>
        </div>
        <div class="panel-label-row">
          <router-link
            v-for="l in chipLabels"
            :key="l.id"
            :to="'/labels/' + l.id"
            class="panel-label-chip mono"
            :title="(l.chain || []).map(c => c.name).join(' > ')"
          >{{ l.name }}</router-link>
        </div>
      </section>

      <!-- Activity — vote / comment / fork tallies -->
      <section class="feed-post-panel__group">
        <div class="feed-post-panel__group-head">
          <q-icon name="bolt" size="12px" style="color:#c79a00;" />
          activity
        </div>
        <div class="panel-stats">
          <div class="panel-stat">
            <q-icon name="thumb_up" size="12px" /><span class="mono">{{ item.votes?.up || 0 }}</span>
          </div>
          <div class="panel-stat">
            <q-icon name="thumb_down" size="12px" /><span class="mono">{{ item.votes?.down || 0 }}</span>
          </div>
          <div class="panel-stat">
            <q-icon name="chat_bubble_outline" size="12px" /><span class="mono">{{ item.comment_count || 0 }}</span>
            <span class="panel-stat__word">comments</span>
          </div>
          <div class="panel-stat">
            <q-icon name="alt_route" size="12px" /><span class="mono">{{ item.fork_count || 0 }}</span>
            <span class="panel-stat__word">forks</span>
          </div>
        </div>
      </section>

      <router-link :to="'/posts/' + item.skeleton_id" class="panel-cta">
        <q-icon name="open_in_full" size="13px" class="q-mr-sm" />
        Open the full post
      </router-link>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed, ref, watch } from 'vue'
import { timeAgo } from 'src/utils/time'
import { displayLabels } from 'src/utils/labelChain'
import { nodeService } from 'src/services/node.service'
import EntityMicro from 'src/components/entities/EntityMicro.vue'
import EntityName from 'src/components/entities/EntityName.vue'
import PostMicro from 'src/components/posts/PostMicro.vue'
import NodeMicro from 'src/components/nodes/NodeMicro.vue'
import NodeMini from 'src/components/nodes/NodeMini.vue'
import MomentInfo from 'src/components/moments/MomentInfo.vue'
import InfoChip from 'src/components/shared/InfoChip.vue'

export default defineComponent({
  name: 'FeedPostPanel',
  components: { EntityMicro, EntityName, PostMicro, NodeMicro, NodeMini, MomentInfo, InfoChip },
  props: {
    item: { type: Object, default: null }
  },
  setup (props) {
    const chipLabels = computed(() => displayLabels(props.item?.labels))

    // The ENRICHED content node — the one thing on this panel the feed item
    // cannot supply. `/feed` hands over `content_node` as `{ id, path,
    // type_id }` only, and NodeMini needs the rest: `file` (a doc's body
    // lives in `file.text`; its `content` column is just the upload
    // address), `embed`, and the votes its caption thumbs state (the foot
    // that used to read the comment/fork tallies is gone, 2026-07-27).
    // `GET /nodes/by-path` is exactly that read — the same single request
    // a `![[pathos:nodes/…]]` block embed makes.
    //
    // So opening the box costs ONE request where it used to cost none —
    // the price of quoting the real document rather than the excerpt.
    // Cleared FIRST on every change so a stale node can never show under a
    // freshly selected post, and late responses are dropped by comparing
    // the path they were requested for.
    const contentNode = ref(null)

    const loadContentNode = async (item) => {
      contentNode.value = null
      const path = item?.content_node?.path
      if (!path) return
      try {
        const r = await nodeService.getByPath(path)
        if (r.success && r.node && props.item?.content_node?.path === path) {
          contentNode.value = r.node
        }
      } catch (_) { /* the excerpt fallback stands */ }
    }

    watch(
      () => props.item?.content_node?.path,
      () => loadContentNode(props.item),
      { immediate: true }
    )

    // The node as this panel presents it: the fetched row plus the POST's
    // title. NodeMini's header states the node's ADDRESS CHIP since
    // 2026-07-27 and keeps the human name on the title zone's TOOLTIP —
    // `effectiveTitle` still prefers `node.title` over its `Node #<id>`
    // placeholder, so handing it over is still worth doing. Merged into a
    // COPY: the fetched row is what `/nodes/by-path` said the node is, and
    // a title the post carries is not a fact about the node.
    const contentNodeCard = computed(() => {
      if (!contentNode.value) return null
      const title = (props.item?.title || '').trim()
      return title ? { ...contentNode.value, title } : contentNode.value
    })

    return { chipLabels, contentNodeCard, timeAgo }
  }
})
</script>

<style lang="scss" scoped>
.feed-post-panel {
  position: sticky;
  top: 12px;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 90px);
  min-height: 340px;
  padding: 12px;
  // Same opaque lift as LabelUsages: ink text on the dark page needs it.
  background: rgba(255, 255, 255, 0.85);
}

.feed-post-panel__head {
  display: flex;
  align-items: flex-start;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(var(--ink-rgb), 0.10);
  margin-bottom: 8px;
}

.feed-post-panel__sub {
  font-size: 0.74em;
  color: rgba(var(--ink-rgb), 0.6);
}

.feed-post-panel__open {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  align-self: center;
  font-family: 'Space Mono', monospace;
  font-size: 0.72em;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #00829c;
  text-decoration: none;
  padding: 3px 8px;
  border: 1px solid rgba(0, 130, 156, 0.4);
  border-radius: 7px;
  transition: background 0.12s, border-color 0.12s;
  &:hover { background: rgba(0, 130, 156, 0.08); border-color: #00829c; }
}

.feed-post-panel__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: rgba(var(--ink-rgb), 0.55);
  font-size: 0.82em;
  padding: 24px 12px;
}

.feed-post-panel__scroll {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  // Room on BOTH sides for anything a section draws OUTSIDE its border box.
  // Nothing does today: the 1px `outline` the flyout used to ring its quoted
  // NodeMini with is gone (2026-07-27 — the extra edge is a 2px `--teal-12`
  // BASE on the panel's bottom border now, which is inside the box and needs no
  // room here). The pair stays, and the lesson with it, because it is the trap
  // any future outline in this track will hit: `padding-right: 2px` was here for
  // the scrollbar and quietly paid for the right half of that ring, the left had
  // nothing, and the panel's left edge sits exactly on this track's (both
  // measured at 874.8px) — so the ring's left side landed one pixel BEFORE the
  // scroll origin, which is the part a scroll container cannot show. In LTR,
  // scrollable overflow extends right and down only: content before the origin
  // is clipped and unreachable, and no scrollbar will ever reveal it. The box
  // read as outlined on three sides. Matched at 2px rather than the 1px strictly
  // needed, so the track stays symmetric.
  padding-left: 2px;
  padding-right: 2px;
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--ink-rgb), 0.3) transparent;

  &::-webkit-scrollbar       { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(var(--ink-rgb), 0.3); border-radius: 2px; }
}

.feed-post-panel__group { margin-bottom: 14px; }

.feed-post-panel__group-head {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(var(--ink-rgb), 0.65);
  margin-bottom: 6px;
}

.feed-post-panel__total {
  font-family: 'Space Mono', monospace;
  background: rgba(var(--ink-rgb), 0.07);
  border-radius: 7px;
  padding: 0 6px;
}

// The excerpt sits in a carved inset — same pit language as the label
// squares, so the two pages read as siblings.
// NOTE — there is no `.panel-node` rule here, and a class on `<NodeMini>`
// would not reach one: `MiniPanel` sets `inheritAttrs: false`, so a class
// written on the component falls through NodeMini and is DROPPED at the
// panel. The symptom is silence — the rule simply never applies (measured:
// the pane kept NodeMini's 320px default while a `42vh` written this way
// looked correct in the source).
//
// The source pane's ceiling therefore comes from `--node-source-max-h`, a
// CUSTOM PROPERTY, which inherits down the DOM and so ignores that trap
// entirely. It is declared by the SURFACE that knows the height — the
// flyout sets `calc(20cqh - 34px)` on `.post-flyout`, capping the whole quoted
// PANEL at a fifth of that box — exactly as `--media-max-h` works.
// A panel mounted anywhere that publishes neither gets NodeMini's default.
.panel-excerpt {
  font-size: 0.82em;
  color: var(--ink, #2C3D4E);
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.45;
  padding: 8px 10px;
  border-radius: 7px;
  background: rgba(var(--ink-rgb), 0.05);
  box-shadow:
    inset 0 2px 5px rgba(var(--ink-rgb-deep), 0.14),
    inset 0 -1px 0 rgba(255, 255, 255, 0.35);
}

.panel-none {
  font-size: 0.78em;
  font-style: italic;
  color: rgba(var(--ink-rgb), 0.5);
}

.panel-fact {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 0;
  min-width: 0;
}

.panel-fact__key {
  flex: 0 0 84px;
  font-family: 'Space Mono', monospace;
  font-size: 0.68em;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(var(--ink-rgb), 0.5);
}

.panel-fact__val {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1 1 auto;
  font-size: 0.82em;
  overflow: hidden;
}

.panel-author { color: #4f3e98; }

.panel-prov {
  font-size: 0.78em;
  text-transform: uppercase;
  color: rgba(var(--ink-rgb), 0.7);
}

.panel-label-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.panel-label-chip {
  font-size: 0.7em;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--ink, #2C3D4E);
  text-decoration: none;
  padding: 2px 8px;
  border: 1px solid rgba(var(--ink-rgb), 0.16);
  border-radius: 7px;
  background: var(--paper-card, #ffffff);
  transition: border-color 0.12s, color 0.12s;
  &:hover { border-color: #00829c; color: #00829c; }
}

.panel-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.panel-stat {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.78em;
  color: rgba(var(--ink-rgb), 0.7);
  padding: 3px 9px;
  border: 1px solid rgba(var(--ink-rgb), 0.14);
  border-radius: 7px;
  background: rgba(var(--ink-rgb), 0.04);
  .mono { font-weight: 700; color: var(--ink, #2C3D4E); }
}

.panel-stat__word {
  font-size: 0.86em;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.7;
}

.panel-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Space Mono', monospace;
  font-size: 0.78em;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #00829c;
  text-decoration: none;
  padding: 7px 10px;
  border: 1px solid rgba(0, 130, 156, 0.4);
  border-radius: 9px;
  margin-bottom: 4px;
  transition: background 0.12s, border-color 0.12s;
  &:hover { background: rgba(0, 130, 156, 0.08); border-color: #00829c; }
}
</style>
