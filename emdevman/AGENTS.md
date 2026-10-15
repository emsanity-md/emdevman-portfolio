# Agent rules

The full rules live in [`../AGENTS.md`](../AGENTS.md). They are repeated here
because this file is the nearest one to any work under `emdevman/`, and a tool
that reads only the nearest file would otherwise miss them.

## Never commit or push

Do not create a git commit, and do not send anything to a remote, unless the
user asks for that in the message where they ask for it.

Never run: `git commit` (including `--amend`, `--no-verify`, `-a`, `-F <file>`) ·
`git push` (any force, tag, or delete variant) · `gh pr create` / `gh pr merge`
/ `gh release` / any `gh` command that writes · `git rebase` · `git cherry-pick`
· `git revert` · `git tag` · any script or npm target whose job is to commit.

A commit message drafted earlier in the session is not permission to commit, and
"commit this" said before the work finished is not permission to commit after it.

**Stage the work and stop:** `git add -A`, then `git status` and `git diff --cached`.
Report what changed and let the user make the commit.

**Ask first:** `git stash` · `git checkout`/`switch` with uncommitted changes ·
`git reset` · deleting or renaming tracked files · `git clean` · installing
dependencies · anything touching the network.

**Always fine:** `git status` · `git diff` · `git log` · `git show` · `git blame`
· `git reflog` · `git add` · `git restore --staged` · `git branch` · `git remote -v`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
