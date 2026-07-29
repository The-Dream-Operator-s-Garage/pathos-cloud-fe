<template>
  <!-- Mono-style navigation links for the same record:
       - `sk #N`   → /skeletons/N  (skeleton structure viewer)
       - `post/N`  → /posts/N      (post content viewer)

       Used everywhere a skeleton id used to be displayed as a bare
       chip — comment headers, fork rows, feed footers, versions, etc.

       The post link only makes sense for POST instances: posts ARE
       skeletons, so the same id has both a structure view and a content
       view — but no post row exists for any other schema's instance
       (USER_PROFILE, PIN, PATH, …), and /posts/N on those is a dead end.
       Callers listing arbitrary skeletons pass :post="row.name === 'POST'";
       the default stays true for the post-only surfaces (comments, forks,
       feed). -->
  <span class="sk-ref-links" :class="{ 'sk-ref-stacked': stacked }">
    <router-link
      :to="'/skeletons/' + id"
      class="ref-link ref-skeleton"
      title="Open structure (skeleton viewer)"
      @click.stop
    >sk #{{ id }}</router-link>
    <template v-if="post">
      <span class="ref-sep" aria-hidden="true">·</span>
      <router-link
        :to="'/posts/' + id"
        class="ref-link ref-post"
        title="Open content (post viewer)"
        @click.stop
      >post/{{ id }}</router-link>
    </template>
  </span>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'SkeletonRefLinks',
  props: {
    id: { type: [Number, String], required: true },
    // Whether this skeleton is a POST instance (i.e. /posts/:id can render
    // it). False hides the post link — the record has no post view.
    post: { type: Boolean, default: true },
    // When true, lay out the two links vertically instead of inline. Useful
    // in tight columns where horizontal space is at a premium (sidebar lists).
    stacked: { type: Boolean, default: false }
  }
})
</script>

<style lang="scss" scoped>
.sk-ref-links {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace;
  font-size: 0.76em;
  white-space: nowrap;
  flex-shrink: 0;
}
.sk-ref-stacked {
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
  .ref-sep { display: none; }
}

.ref-link {
  text-decoration: none;
  padding: 1px 4px;
  border-radius: 3px;
  line-height: 1.4;
  transition: color 0.10s, background 0.10s;
}
.ref-skeleton {
  color: #5b6c82;
  &:hover { color: #1F2A38; background: rgba(31, 42, 56, 0.06); }
}
.ref-post {
  color: #2a5a87;
  &:hover { color: #b14848; background: rgba(211, 95, 95, 0.06); }
}
.ref-sep {
  color: #c8d0dc;
  font-size: 1em;
  user-select: none;
}
</style>
