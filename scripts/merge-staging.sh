#!/usr/bin/env bash
# merge-staging.sh — the manual gate between staging-main and the deployed line.
#
#   merge-staging.sh land   merge origin/staging-main into main and push.
#                           Run AFTER testing staging-main. Pushing main kicks
#                           the CI build into the deploy branch; prod still
#                           changes only when deploy-pathos.sh runs.
#   merge-staging.sh sync   merge main into staging-main and push, so the
#                           contributor base stays fresh after direct-to-main
#                           commits.
set -euo pipefail
cd "$(dirname "$0")/.."

MODE="${1:-}"
[ "$MODE" = "land" ] || [ "$MODE" = "sync" ] || {
  echo "usage: $0 land|sync" >&2; exit 2; }

[ -z "$(git status --porcelain)" ] || {
  echo "working tree not clean — commit or stash first" >&2; exit 1; }

START_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
git fetch origin

if [ "$MODE" = "land" ]; then
  git checkout main
  git pull --ff-only origin main
  git merge --no-ff origin/staging-main -m "Land staging-main into main"
  git push origin main
  # keep staging-main from drifting behind what it just delivered
  git checkout staging-main
  git pull --ff-only origin staging-main
  git merge --ff-only main || git merge main -m "Sync main back into staging-main"
  git push origin staging-main
else
  git checkout staging-main
  git pull --ff-only origin staging-main
  git merge origin/main -m "Sync main into staging-main"
  git push origin staging-main
fi

git checkout "$START_BRANCH"
echo "done: $MODE"
