# Copilot instructions

The full agent rules are in [`../AGENTS.md`](../AGENTS.md). The operative rule is
repeated here so it survives on its own.

## Never commit or push

Do not create a git commit and do not send anything to a remote unless the user
asks for that in the same message they ask for the work.

Never run `git commit` (any variant, including `--amend`, `--no-verify`, `-F`),
`git push` (any variant), `gh pr create`, `gh pr merge`, `gh release`, any `gh`
command that writes, `git rebase`, `git cherry-pick`, `git revert`, `git tag`, or
any script whose job is to commit.

A commit message drafted earlier in the session is not permission to commit, and
"commit this" said before the work finished is not permission to commit after it.

**Stage and stop.** Run `git add -A`, then `git status` and `git diff --cached`,
then report what changed. The user makes the commit.

Ask before `git stash`, `git reset`, switching branches with uncommitted changes,
deleting tracked files, installing dependencies, or anything that touches the network.

`git status`, `git diff`, `git log`, `git show`, `git blame`, `git add` and
`git restore --staged` are always fine.

## Project notes

- The app is a Next.js 16 app in `emdevman/`. This is not the Next.js you know —
  see the managed block at the bottom of `emdevman/AGENTS.md`, and read
  `emdevman/node_modules/next/dist/docs/` before writing code.
- Five design variants (v1–v5) are served from one route via `?design=`.
  `DEFAULT_DESIGN` is `"v2"`; see `emdevman/app/lib/designs.ts`.