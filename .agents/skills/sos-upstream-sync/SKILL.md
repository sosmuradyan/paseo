---
name: sos-upstream-sync
description: Move the Paseo Sos fork (branch `sos`) onto a new upstream Paseo release, keeping Sos's changes on top. Checks every Sos change against what upstream shipped — when upstream now does the same job, drop ours and adopt theirs. Then builds and installs "Paseo Sos.app". Use when Sos says "update paseo", "sync paseo", "new paseo version", "paseo released", "rebase sos", "upstream sync", or "/sos-upstream-sync".
user-invocable: true
---

# Sos upstream sync

The fork lives in `~/Documents/Code/personal/paseo`, branch `sos`, remote `origin` (Sos's fork) and
`upstream` (getpaseo/paseo). Sos's changes are the commits after the base tag named in
[ledger.md](ledger.md). The ledger lists every change, the upstream files it hooks, and when
to drop it. Read the ledger first; it is the source of truth for what "ours" means.

The Paseo Sos app has no daemon of its own. It talks to the official Paseo app's daemon on
port 6767. So the target tag is normally the version the official app now runs:
`defaults read /Applications/Paseo.app/Contents/Info.plist CFBundleShortVersionString`.
Stable tags only (`vX.Y.Z`), unless Sos asks for a beta.

## 1. Preflight

1. `git status --short --branch` on `sos` must be clean. Commit or ask about dirty files.
2. `git fetch upstream --tags` and `git fetch origin`.
3. Base = `Base tag` in the ledger. Target = the tag above. Stop if target is not newer.
4. Back up: `git branch sos-backup-<base> sos` (skip if it exists).

## 2. Read what upstream changed

1. `CHANGELOG.md` sections between base and target: `git diff <base> <target> -- CHANGELOG.md`.
2. `git log --oneline <base>..<target>` and grep it for each ledger entry's watch words.
3. `git diff --stat <base> <target> -- <every upstream file the ledger hooks>`. A hooked file
   that changed is where conflicts and silent breakage come from.
4. For each `shell-css.tsx` selector, check the `data-testid` still exists in the target:
   `git grep -n '<testid>' <target> -- packages/app/src`. A missing test ID means the CSS rule
   stops matching silently.
5. If `packages/plugin` or `docs/plugins.md` changed, check the `paseo-sos` plugin
   (`~/Documents/Code/personal/paseo-sos`) still matches the `addTheme` contract.

## 3. Decide per ledger entry

For each entry, pick one and write it down:

- **Keep** — upstream did not touch the area.
- **Adapt** — upstream changed the code ours hooks; port our change onto their new code.
- **Drop, adopt upstream** — upstream now does the same job (its changelog or code shows it).
  Remove our version and its hooks; let their version show. Example: upstream ships its own
  background-process panel → delete ours, keep theirs, restyle only if it clashes with the shell.
- **Ask Sos** — upstream covers part of the job, or theirs behaves differently in a way Sos
  will notice. Show both, recommend one, wait.

Show Sos the table of decisions before rebasing when anything is Drop or Ask.

## 4. Rebase

1. `git rebase --onto <target> <base> sos`.
2. Conflicts: keep upstream's logic and re-apply our hook on top. Our hooks are small and
   marked `// SOS:` or `// sos:`; most of our code lives in `packages/app/src/sos/`.
3. Drop entries as decided: remove the code, the hooks, and the ledger line in one commit
   named `sos: drop <feature>, upstream ships <their feature>`.
4. `npm install` at the repo root when `package-lock.json` changed.

## 5. Build, install, check

1. Run tests for files we touch, for example `npx vitest run packages/app/src/styles/markdown-styles.test.ts`.
2. `npm run build:desktop` (several minutes). The build is the gate.
3. Install: quit `Paseo Sos` (`osascript -e 'tell application id "sh.paseo.desktop.sos" to quit'`),
   then `rm -rf "/Applications/Paseo Sos.app" && ditto packages/desktop/release/mac-arm64/Paseo.app "/Applications/Paseo Sos.app" && open "/Applications/Paseo Sos.app"`.
   Never touch `/Applications/Paseo.app` or restart the daemon on 6767.
4. Screenshot the running app (`screencapture -x`) and check the shell: toolbar, left stripe,
   status bar, tabs, a chat with tool calls, the bell menu.

## 6. Finish

1. Update [ledger.md](ledger.md): new `Base tag`, entries dropped or adapted, new watch words.
2. Commit the ledger on `sos`.
3. Pushing a rebased `sos` needs `git push --force-with-lease origin sos`. Ask Sos first.
4. Clean up: delete `sos-backup-<base>` once the push is done and the app works, delete other
   branches merged into `sos` (locally and on `origin`), `git worktree remove` their worktrees,
   then `git worktree prune`. Ask before deleting anything not merged into `sos`.
5. Report: target tag, kept / adapted / dropped entries, build and install result.

Outside syncs, the same rule holds for every fork change: commit, merge into `sos`, push, and
clean up branches and worktrees without asking (see `CLAUDE.local.md`).
