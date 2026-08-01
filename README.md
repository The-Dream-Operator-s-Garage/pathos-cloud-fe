# pathos.cloud — dashboard

The user interface of [pathos.cloud](https://pathos.cloud): a platform where
everything you make — posts, files, moments, links, labels, even organizations —
is an addressed element on a personal pathchain, private by default, shared by
explicit grant.

This repo is the Quasar (Vue 3) single-page app. The API it talks to lives in a
separate repository and serves `https://api.pathos.cloud`.

## Stack

- [Quasar 2](https://quasar.dev/) (webpack mode) · Vue 3 · Pinia · Vue Router
  (hash mode)
- Markdown via `marked` + `dompurify` — rendered only through
  `src/components/shared/MarkdownBody.vue`
- ESLint `standard` config (no semicolons)

## Development

```bash
npm ci
npm run dev        # dev server on :8080, expects the API on :3000
npm run lint
npm run build      # production build to dist/spa
```

Point the app at an API with `PATHOS_API_URL` (defaults to `http://localhost:3000`).

## Contributing

Development of this platform happens *on* the platform — merged pull requests
become posts in the Dream Operator's Garage organization feed, and change
suggestions are posts too. Read [CONTRIBUTING.md](CONTRIBUTING.md) for the flow.

Short version: branch from **`staging-main`** and open your PR against it.
`main` is the deployed line and is merged from `staging-main` manually after
testing.

## Branches

| branch | role |
|---|---|
| `staging-main` | default branch — all external PRs land here |
| `main` | deployed line; CI builds it into the `deploy` branch |
| `deploy` | build artifact only, pulled by the production server |

## License

[MIT](LICENSE)
