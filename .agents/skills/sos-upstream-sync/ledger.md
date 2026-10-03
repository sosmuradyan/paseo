# Sos changes on top of upstream Paseo

Base tag: `v0.10.3`

Every Sos change, the upstream files it hooks, and when to drop it. Update this file in the same
commit as the change. "Drop when" names the upstream feature that would replace ours.

## 1. Separate "Paseo Sos" desktop app

Runs beside the official Paseo, never updates itself, leaves the daemon to the official app.

- Files: `packages/desktop/electron-builder.yml` (appId `sh.paseo.desktop.sos`, display name,
  no `paseo://` handler), `packages/desktop/src/main.ts` (`APP_NAME` "Paseo Sos" → own userData),
  `packages/desktop/src/settings/desktop-settings.ts` (`manageBuiltInDaemon: false`),
  `packages/desktop/src/features/auto-updater.ts` (`isPackaged: () => false`).
- Watch: electron-builder config, after-pack scripts, desktop settings schema, auto-updater.
- Drop when: never. This is what makes the fork a separate app.

## 2. WebStorm Islands shell (Electron desktop only)

Code in `packages/app/src/sos/`. Switched on by `sos/shell-enabled.ts` (Electron, not compact).

- Upstream hooks: `app/_layout.tsx` (SosShell, SosIsland), `components/left-sidebar.tsx`
  (SosWorkspacesHeader replaces nav rows), `components/split-container.tsx` and
  `components/resize-handle.tsx` (pane islands, `hideLine`), `screens/workspace/workspace-screen.tsx`
  (SosWorkspaceHeader portals header actions into the toolbar),
  `screens/workspace/workspace-desktop-tabs-row.tsx` (tab pill styles).
- Parts:
  - Toolbar (`toolbar.tsx`): project and branch widgets, agent run counts, New agent,
    Notifications, Search, Settings, plus the workspace header actions including upstream's
    Explorer toggle. Drop a widget when upstream's header shows the same thing.
  - Left stripe (`tool-stripes.tsx`, 32px): Workspaces, History, Schedules, Plugins, Help.
    No right stripe.
  - Notifications bell (`notifications.tsx`): agents needing attention. Drop when upstream ships
    its own attention inbox or notification center.
  - Status bar (`status-bar.tsx`): breadcrumb, working timer, usage meters, host, version.
    Drop parts upstream shows elsewhere.
  - Islands, tab pills, project glow (`island.tsx`, `tab-styles.ts`, `shell-css.tsx`, `color.ts`).
- `shell-css.tsx` keys on upstream test IDs. Check each still exists after a rebase:
  `agent-chat-scroll`, `explorer-sidebar-tab-*` (`files`, `changes_tree`, `pull_request`),
  `message-input-root`, `sidebar-project-new-workspace-row-*`, `sidebar-project-row-*`,
  `sidebar-project-show-more-*`, `sidebar-project-workspace-list-scroll`, `sidebar-workspace-row-*`,
  `user-message`, `workspace-open-in-editor-caret`, `workspace-open-in-editor-primary`,
  `workspace-tabs-row`; also `data-paseo-markdown-tag="code"`.
- Watch: sidebar, workspace header, tabs row, split container, window chrome, explorer sidebar.

## 3. Chat polish

- `components/message.tsx`: user messages render Markdown, full width, long ones fold;
  code-font (mono) tool summaries tagged as code surfaces; the shimmer overlay must use the same
  mono font size as the text under it; opened tool cards keep spacing.
- `components/tool-call-details.tsx`: one card tone, code in darker wells, captions instead of
  bordered strips, shell output wraps, calm error.
- `agent-stream/view.tsx`: user messages wrapped in `AssistantFileLinkResolverProvider`.
- `styles/markdown-styles.ts` (+ its test): inline code one size above `fontSize.code`.
- `sos/shell-css.tsx` inline-code rule: quiet fill and hairline edge, scoped off code blocks
  (their text is tagged `code` too, inside a `pre`).
- `constants/layout.ts`: `MAX_CONTENT_WIDTH` 1200 instead of 820.
- Watch: message rendering, tool call cards, shimmer, markdown styles.
- Drop when: upstream renders user messages as Markdown (drop the resolver wrap and folding),
  upstream restyles tool cards (compare with Sos before dropping ours).

## 4. JetBrains Islands themes (separate repo)

`~/Documents/Code/personal/paseo-sos` plugin, `client.addTheme` with Islands Dark and Light.

- Watch: `packages/plugin` client API, `docs/plugins.md` theme section, `requirements.paseo`.
- Drop when: upstream ships the JetBrains Islands themes itself.
