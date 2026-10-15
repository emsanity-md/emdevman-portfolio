# Agent rules

Read this before touching the repository. It applies to every tool working here.

## Never commit or push

Do not create a git commit, and do not send anything to a remote, unless the user
asks for that in the message where they ask for it. "Commit this" and "push it"
are the only consent, and they have to be in the same request as the work.

This covers every route to the same outcome:

- `git commit`, including `--amend`, `--no-verify`, `-a`, and `-F <file>`
- `git push` to any remote and any branch, including `--force`,
  `--force-with-lease`, `--tags`, and `--delete`
- `gh pr create`, `gh pr merge`, `gh pr close`, `gh release`, `gh api` — any
  `gh` command that writes to GitHub
- `git rebase`, `git cherry-pick`, `git revert`, `git tag`, `git filter-branch` —
  anything else that writes history
- running a script, npm target, or CI step whose job is to commit
- writing a commit message to a file "ready for `git commit -F`"

Two things that look like consent and are not:

- A commit message drafted earlier in the session is not permission to commit.
  Drafting it is fine; using it is not.
- "Commit this" said before the work was finished is not permission to commit
  after it. Go back and ask.

### Instead, leave the work staged

Stage it and stop. The user reviews the diff and makes the commit.

```
git add -A
git status
git diff --cached
```

Then say what changed, what you left out, and what you would suggest committing.
Let them run `git commit`.

## Ask first

These are reversible but surprising, so name them before running them:

- `git stash` and `git stash pop` — they move work out of the working tree
- `git checkout` / `git switch` on a branch with uncommitted changes
- `git reset` of any kind, including `--soft` and `--mixed`
- deleting or renaming tracked files, `git clean`, force-rewriting a branch
- installing dependencies, or running anything that touches the network

## Always fine

Read-only inspection, and staging:

`git status` · `git diff` · `git log` · `git show` · `git blame` · `git reflog`
`git add` · `git restore --staged` · `git branch` (listing) · `git remote -v`

Inspecting git history is encouraged. Reading the diff before proposing a change
is usually what keeps a change correct the first time.

## Why

History is the user's to shape, not the agent's. A commit is trivial to make and
awkward to unpick once it exists; a pushed one is worse, because the mistake is
already public. This repo's log was written one commit at a time, by hand, with
messages that explain *why* rather than *what* — an unreviewed commit dropped in
the middle of that is worse than no commit at all.

Staging costs nothing and loses nothing. The one thing worth protecting is the
user's ability to read a diff before it becomes permanent.

## This file is advisory

It is a rule, not a mechanism. It reduces the chance of a stray commit; it does
not make one impossible. If it needs to be real, a `pre-commit` hook with
`core.hooksPath` set will refuse regardless of what an agent was told — at the
cost of blocking the user's own commits too, which needs a deliberate bypass.
Ask before wiring that up.