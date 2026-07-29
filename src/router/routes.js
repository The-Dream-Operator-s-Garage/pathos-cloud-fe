const routes = [
  {
    path: '/auth',
    component: () => import('src/layouts/AuthLayout.vue'),
    children: [
      { path: '', component: () => import('src/pages/AuthPage.vue') }
    ]
  },
  {
    path: '/',
    component: () => import('src/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/feed' },
      { path: 'feed', component: () => import('src/pages/FeedPage.vue') },

      // Mercury playground — intentionally blank sandbox page, no drawer.
      { path: 'mercury-playground', component: () => import('src/pages/MercuryPlaygroundPage.vue'), meta: { hideDrawer: true } },

      // Explorers
      { path: 'nodes', component: () => import('src/pages/NodeExplorerPage.vue') },
      { path: 'nodes/path/:path', component: () => import('src/pages/NodeDetailPage.vue') },
      { path: 'nodes/:id/edit', component: () => import('src/pages/NodeEditPage.vue') },
      { path: 'nodes/:id', component: () => import('src/pages/NodeDetailPage.vue') },
      { path: 'labels', component: () => import('src/pages/LabelExplorerPage.vue') },
      { path: 'labels/:id', component: () => import('src/pages/LabelDetailPage.vue') },
      // Path viewer — paths are primal pathchain types. `:id` is the
      // Path ROW id (the one the file tree surfaces under
      // `files/<owner>/paths/<hash>`). Paths are discovered from a
      // pathchain file tree, so the bare `/paths` route redirects there
      // instead of trying to render a standalone path index.
      { path: 'paths', redirect: '/files' },
      { path: 'paths/:id', component: () => import('src/pages/PathViewerPage.vue') },
      // Primal-type viewers — moments, secrets, links. `:id` accepts a DB
      // row id or a 64-hex element hash (page picks get vs getByHash).
      { path: 'moments/:id', component: () => import('src/pages/MomentViewerPage.vue') },
      { path: 'secrets/:id', component: () => import('src/pages/SecretViewerPage.vue') },
      { path: 'links/:id', component: () => import('src/pages/LinkViewerPage.vue') },
      // Post viewer — content-focused. `:id` is the skeleton id of a POST instance.
      { path: 'posts/:id', component: () => import('src/pages/PostViewerPage.vue') },
      // Skeleton viewer — structure-focused. Shows slots, attached labels,
      // identifying metadata for ANY skeleton (template, instance, directory).
      { path: 'skeletons', component: () => import('src/pages/SkeletonPage.vue') },
      { path: 'skeletons/:id', component: () => import('src/pages/SkeletonPage.vue') },
      // File tree viewer — browses the on-disk pathchain tree rooted at
      // the user's entity hash. /files = self, /files/:ownerHash = peek
      // another entity's tree.
      { path: 'files', component: () => import('src/pages/FileTreePage.vue') },
      { path: 'files/:ownerHash', component: () => import('src/pages/FileTreePage.vue') },

      // Identity — "Profile" now resolves to the logged-in user's
      // /entities/:id view; no separate ProfilePage.
      { path: 'entities/:id', component: () => import('src/pages/EntityProfilePage.vue') },
      { path: 'organizations', component: () => import('src/pages/OrganizationsPage.vue') },
      // Org detail — `:id` is the organization ROW id (the entity behind
      // it renders through /entities/:entity_id).
      { path: 'organizations/:id', component: () => import('src/pages/OrgDetailPage.vue') }
    ]
  },
  { path: '/:catchAll(.*)*', component: () => import('src/pages/ErrorNotFound.vue') }
]

export default routes
