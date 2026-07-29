<!--
  LEGACY feed — the public post stream + the FeedPostPanel viewer on the
  right. PARKED, NOT ROUTED (2026-07-25): /feed now mounts the new
  FeedPage.vue container layout. Kept verbatim so the old surface can be
  restored by pointing the route back at this file.
-->
<template>
  <q-page class="bg-base q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-xl-10">
        <div class="row items-center q-mb-md">
          <div>
            <div class="nasalization text-accent" style="font-size:1.1em;">Public Feed</div>
            <div class="text-dim" style="font-size:0.78em;">Every POST instance on the platform, newest first.</div>
          </div>
          <q-space />
          <q-badge v-if="total > 0" color="primary" outline>{{ total }} posts</q-badge>
        </div>

        <div class="row q-col-gutter-md">
          <!-- Stream — one square card per post, same visual language as
               the label squares: bordered white square, mono head strip,
               carved excerpt pit. Clicking a card selects it; the panel
               on the right reacts. -->
          <div class="col-12 col-md-7">
            <div class="text-dim q-mb-sm" style="font-size:0.8em; text-transform:uppercase; letter-spacing:.05em;">
              Post instances — select a card to inspect it
            </div>

            <div v-if="loading" class="text-center q-py-lg">
              <q-spinner color="primary" size="32px" />
            </div>

            <div v-else-if="items.length === 0" class="text-dim text-center q-py-lg" style="font-size:0.82em;">
              <q-icon name="route" size="48px" style="opacity:0.18;" />
              <div class="q-mt-sm">Nothing posted yet.</div>
            </div>

            <div v-else class="feed-stream">
              <article
                v-for="item in items"
                :key="item.skeleton_id"
                class="post-square"
                :class="{ 'is-selected': selected && selected.skeleton_id === item.skeleton_id }"
                @click="select(item)"
              >
                <!-- Head strip — kind icon, title, kind tag, time -->
                <div class="post-square__head">
                  <q-icon
                    :name="item.is_doc ? 'menu_book' : (item.parent_skeleton_id ? 'forum' : 'article')"
                    size="14px"
                    class="post-square__icon"
                  />
                  <span class="post-square__name" :title="item.title">{{ cardName(item) }}</span>
                  <q-space />
                  <span class="post-square__tag">{{ kindTag(item) }}</span>
                  <span class="post-square__time mono" :title="absoluteTime(item.created_at, item.moment)">
                    {{ timeAgo(item.created_at, item.moment) }}
                  </span>
                  <router-link
                    :to="'/posts/' + item.skeleton_id"
                    class="post-square__go"
                    title="Open post"
                    @click.stop
                  >
                    <q-icon name="open_in_new" size="13px" />
                  </router-link>
                </div>

                <!-- Excerpt pit — the carved inset that echoes the dug-open
                     label squares -->
                <div v-if="item.excerpt" class="post-square__pit">
                  {{ item.excerpt }}<span v-if="item.excerpt.length >= 280">…</span>
                </div>

                <!-- Foot — micro chips + activity tallies -->
                <div class="post-square__foot">
                  <span v-if="item.author" class="post-square__author">
                    <strong>{{ item.author.username || ('entity #' + item.author.id) }}</strong>
                    <EntityMicro :id="item.author.id" :path="item.author.path" :show-type="false" />
                  </span>
                  <PostMicro :id="item.skeleton_id" :path="item.skeleton_path" :show-type="false" />
                  <q-space />
                  <span class="post-square__stat" title="votes">
                    <q-icon name="thumb_up" size="11px" />{{ item.votes?.up || 0 }}
                  </span>
                  <span class="post-square__stat" title="comments">
                    <q-icon name="chat_bubble_outline" size="11px" />{{ item.comment_count || 0 }}
                  </span>
                  <span class="post-square__stat" title="forks">
                    <q-icon name="alt_route" size="11px" />{{ item.fork_count || 0 }}
                  </span>
                </div>
              </article>
            </div>
          </div>

          <!-- Tall detail section — mirrors LabelUsages on the labels page -->
          <div class="col-12 col-md-5">
            <FeedPostPanel :item="selected" />
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'
import { feedService } from 'src/services/feed.service'
import { useStateHolder } from 'src/composables/useStateHolder'
import { timeAgo, absoluteTime } from 'src/utils/time'
import EntityMicro from 'src/components/entities/EntityMicro.vue'
import PostMicro from 'src/components/posts/PostMicro.vue'
import FeedPostPanel from 'src/components/posts/FeedPostPanel.vue'

export default defineComponent({
  name: 'FeedPageLegacy',
  components: { EntityMicro, PostMicro, FeedPostPanel },
  setup () {
    const items = ref([])
    const total = ref(0)
    const loading = ref(false)
    const selected = ref(null)

    // StateHolder — remember scroll + which card was open, so hopping into
    // a post and coming back lands exactly where the reading stopped.
    const holder = useStateHolder({ selectedKey: null })

    const select = (item) => {
      selected.value = item
      holder.state.selectedKey = item ? `${item.kind || 'post'}:${item.id}` : null
    }

    const load = async () => {
      loading.value = true
      try {
        const r = await feedService.getPublic({ limit: 30 })
        if (r.success) {
          items.value = r.items
          total.value = r.total
          // Restore the previously-open card; otherwise pre-select the
          // newest post so the panel never opens empty.
          const held = holder.state.selectedKey
            ? r.items.find(i => `${i.kind || 'post'}:${i.id}` === holder.state.selectedKey)
            : null
          if (held) selected.value = held
          else if (!selected.value && r.items.length) selected.value = r.items[0]
        }
      } catch (_) { items.value = [] }
      loading.value = false
      await holder.restore()
    }

    onMounted(load)

    const cardName = (item) => {
      if (item.title) return item.title
      if (item.parent_skeleton_id) return `comment on #${item.parent_skeleton_id}`
      return '(untitled)'
    }

    const kindTag = (item) => {
      if (item.parent_skeleton_id) return 'comment'
      if (item.forked_from_id) return 'fork'
      if (item.is_doc) return 'doc'
      return 'post'
    }

    return { items, total, loading, selected, select, cardName, kindTag, timeAgo, absoluteTime }
  }
})
</script>

<style lang="scss" scoped>
.feed-stream {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

// One post = one square, the same visual grammar as .label-square on the
// labels page: white card, hairline ink border, mono uppercase head, and
// a carved inset pit for the body.
.post-square {
  border: 1px solid rgba(var(--ink-rgb), 0.16);
  border-radius: 9px;
  background: var(--paper-card, #ffffff);
  box-shadow: 0 1px 3px rgba(var(--ink-rgb-deep), 0.08);
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.12s, box-shadow 0.12s;

  &:hover { border-color: rgba(0, 130, 156, 0.45); }

  &.is-selected {
    border-color: rgba(0, 130, 156, 0.65);
    box-shadow: 0 0 0 2px rgba(0, 130, 156, 0.18), 0 1px 3px rgba(var(--ink-rgb-deep), 0.08);
  }
}

.post-square__head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 9px;
  user-select: none;

  &:hover { background: rgba(0, 130, 156, 0.06); }
}

.post-square__icon {
  color: rgba(var(--ink-rgb), 0.55);
  flex-shrink: 0;
}

.is-selected .post-square__icon { color: #00829c; }

.post-square__name {
  font-family: 'Space Mono', monospace;
  font-size: 0.8em;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--ink, #2C3D4E);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.is-selected .post-square__name { color: #00829c; }

.post-square__tag {
  font-family: 'Space Mono', monospace;
  font-size: 0.66em;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(var(--ink-rgb), 0.5);
  background: rgba(var(--ink-rgb), 0.07);
  border-radius: 7px;
  padding: 0 6px;
  flex-shrink: 0;
}

.post-square__time {
  font-size: 0.68em;
  color: rgba(var(--ink-rgb), 0.5);
  flex-shrink: 0;
}

.post-square__go {
  display: inline-flex;
  align-items: center;
  color: rgba(var(--ink-rgb), 0.45);
  flex-shrink: 0;
  padding: 2px;
  border-radius: 4px;
  &:hover { color: #00829c; background: rgba(0, 130, 156, 0.08); }
}

// The carved pit — same inset shadow recipe as .label-square__pit so the
// feed reads as a sibling of the label explorer.
.post-square__pit {
  font-size: 0.82em;
  color: var(--ink, #2C3D4E);
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.4;
  // Show ~4 lines max; the panel carries the full excerpt.
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0 7px 7px;
  padding: 8px 10px;
  border-radius: 7px;
  background: rgba(var(--ink-rgb), 0.05);
  box-shadow:
    inset 0 2px 5px rgba(var(--ink-rgb-deep), 0.14),
    inset 0 -1px 0 rgba(255, 255, 255, 0.35);
}

.post-square__foot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 9px 7px;
  min-width: 0;
}

.post-square__author {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.76em;
  color: #4f3e98;
  min-width: 0;
  // The username must survive the hash chips' appetite for width: it
  // refuses to shrink (the adaptive micro chips truncate instead) but
  // caps itself so a huge handle can't push the chips out either.
  strong {
    flex-shrink: 0;
    max-width: 16ch;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.post-square__stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'Space Mono', monospace;
  font-size: 0.7em;
  color: rgba(var(--ink-rgb), 0.55);
  flex-shrink: 0;
}
</style>
