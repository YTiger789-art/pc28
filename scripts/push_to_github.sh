#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: bash scripts/push_to_github.sh <github_repo_url> [branch]"
  echo "Example: bash scripts/push_to_github.sh git@github.com:you/pc28.git main"
  exit 1
fi

REPO_URL="$1"
BRANCH="${2:-main}"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: current directory is not a git repository"
  exit 1
fi

if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi

git branch -M "$BRANCH"
git push -u origin "$BRANCH"

echo "Done: pushed to $REPO_URL ($BRANCH)"
