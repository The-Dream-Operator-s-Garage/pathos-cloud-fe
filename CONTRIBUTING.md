# Contributing to pathos.cloud

Thanks for wanting to improve pathos. This project runs an experiment: the
development flow lives on the platform itself.

## How changes flow

1. **Suggest** — members of the Dream Operator's Garage organization post a
   *change request* on pathos.cloud: a normal post carrying the
   `DEVELOPMENT > CHANGE REQUEST` label, shared with the organization. Describe
   what you want changed and why; reference the elements it touches with
   `[[pathos:]]` chips where you can.
2. **Decide** — the maintainer reviews open change requests and picks what gets
   implemented.
3. **Implement** — the change is developed and lands as a pull request against
   **`staging-main`**. When it merges, the platform posts it automatically to
   the organization feed as a `DEVELOPMENT > PULL REQUEST` post (a PR card +
   changelog), and the originating change request is stamped
   `DEVELOPMENT > SOLVED` and cross-linked.
4. **Land** — `staging-main` is merged into `main` manually by the maintainer
   after testing. `main` is built by CI into the `deploy` branch, which
   production pulls.

You can also skip the platform and open a PR directly — it still must target
`staging-main`, and it still becomes a feed post when it merges.

## Pull requests

- Branch from `staging-main`, open the PR against `staging-main` (the default
  branch — GitHub will pick it for you).
- If your PR implements a change request from the platform, add a line to the
  PR description:

  ```
  Solves: [[pathos:skeletons/<hash of the change request>]]
  ```

  That line is what lets the platform stamp the request SOLVED automatically.
- `npm run lint` must pass (ESLint `standard`, no semicolons).
- `npm run build` must succeed — the PR check runs both.
- Keep PR titles descriptive: the title becomes the feed post's title verbatim.
- Write a real PR description: it becomes the changelog body of the feed post.

## What we won't merge

- Changes that weaken the access doctrine (private by default, explicit grants).
- Markdown rendered outside `MarkdownBody.vue`.
- Anything that puts data in labels — labels are finite categories, never
  storage.

## Local setup

See [README.md](README.md). The API repository is not public yet; against a
local stack the dashboard expects it on `:3000`.
