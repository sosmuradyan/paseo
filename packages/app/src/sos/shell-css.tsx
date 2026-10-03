import { useEffect } from "react";
import { withUnistyles } from "react-native-unistyles";
import { isWeb } from "@/constants/platform";
import { deriveIdentityColorName, identityColor } from "@/styles/identity-colors";
import type { Theme } from "@/styles/theme";
import { mixHex } from "./color";
import { SOS_ISLAND_RADIUS, SOS_TOOLBAR_HEIGHT } from "./metrics";

// SOS: JetBrains density for upstream screens the shell does not own. Every selector keys on
// upstream `data-testid` / ARIA attributes under `[data-sos-shell]`, never on component code or
// generated class names. When upstream renames a test ID the rule stops matching and that spot
// falls back to the stock look; a rebase never conflicts on it.
//
// Specificity: `[data-sos-shell] [data-testid…]` is (0,2,0), above Unistyles' (0,1,0) classes.
// `!important` only where upstream sets the same property inline.
const STYLE_ID = "sos-shell-css";

const WS_ROW = '[data-sos-shell] [data-testid^="sidebar-workspace-row-"]';
const PROJECT_ROW = '[data-sos-shell] [data-testid^="sidebar-project-row-"]';
const PROJECT_GROUP =
  '[data-sos-shell] [data-testid="sidebar-project-workspace-list-scroll"] [role="group"]';
const HAS_CHILD_ROWS =
  ':has([data-testid^="sidebar-workspace-row-"], [data-testid^="sidebar-project-new-workspace-row-"])';
const EXPLORER_TAB = '[data-sos-shell] [data-testid^="explorer-sidebar-tab-"]:is(button)';
// JetBrains marks the tool window holding keyboard focus: its stripe button turns solid accent.
const WORKSPACES_FOCUSED =
  '[data-sos-shell]:has([data-testid="sidebar-project-workspace-list-scroll"]:focus-within)';
const FOCUSED_STRIPE = `${WORKSPACES_FOCUSED} [data-sos-stripe="workspaces"][data-sos-stripe-active="true"]`;

const RULES = `
/* Upstream panes paint the frame color as opaque squares behind the islands, so the glow stays
   inside the toolbar band; past it, it would outline those squares at the island corners. */
[data-sos-shell] {
  background-image: radial-gradient(760px 46px at 170px 0, var(--sos-project-glow), transparent);
  background-size: 100% ${SOS_TOOLBAR_HEIGHT}px;
  background-repeat: no-repeat;
}

${WS_ROW} {
  min-height: 26px !important;
  padding: 3px 8px 3px 10px !important;
  margin-bottom: 0 !important;
  border-radius: 5px !important;
  gap: 2px !important;
}
${FOCUSED_STRIPE} { background-color: var(--sos-accent) !important; }
:is(${FOCUSED_STRIPE}) svg [stroke]:not([stroke="none"]) { stroke: #ffffff; }
${WS_ROW}[aria-selected="true"] div[dir="auto"] { opacity: 1 !important; }

/* Upstream's project icon turns into the expand chevron on hover; no chevron of our own. */
${PROJECT_ROW} {
  min-height: 26px !important;
  padding: 3px 8px !important;
  margin-bottom: 0 !important;
  border-radius: 5px !important;
}
${PROJECT_ROW} > div > div:last-child > div[dir="auto"] {
  color: var(--sos-foreground) !important;
  font-weight: 500 !important;
}
${PROJECT_GROUP}${HAS_CHILD_ROWS} { padding-bottom: 6px !important; }

[data-sos-shell] [data-testid^="sidebar-project-show-more-"],
[data-sos-shell] [data-testid^="sidebar-project-new-workspace-row-"] {
  min-height: 26px !important;
  padding: 3px 8px 3px 10px !important;
  margin-bottom: 0 !important;
  border-radius: 5px !important;
}

${EXPLORER_TAB} {
  background-color: transparent !important;
  border-color: transparent !important;
  padding-left: 6px !important;
  padding-right: 6px !important;
}
${EXPLORER_TAB} svg { display: none; }
${EXPLORER_TAB} div[dir="auto"] { color: var(--sos-muted) !important; font-weight: 400 !important; }
[data-sos-shell][data-sos-explorer-tab="files"] [data-testid="explorer-sidebar-tab-files"] div[dir="auto"],
[data-sos-shell][data-sos-explorer-tab="changes_tree"] [data-testid="explorer-sidebar-tab-changes_tree"] div[dir="auto"],
[data-sos-shell][data-sos-explorer-tab="pull_request"] [data-testid="explorer-sidebar-tab-pull_request"] div[dir="auto"] {
  color: var(--sos-foreground) !important;
  font-weight: 600 !important;
}

[data-sos-shell] [data-testid="message-input-root"] > div:first-child {
  background-color: var(--sos-island) !important;
  border-radius: 10px !important;
}
[data-sos-shell] [data-testid="message-input-root"] > div:first-child:focus-within {
  border-color: var(--sos-composer-accent) !important;
}
[data-sos-shell] [data-testid="message-input-root"] [aria-label="Send message"] {
  background-color: var(--sos-composer-accent) !important;
}

/* Your messages: one full-width filled block, no border; long ones fold (message.tsx). */
[data-sos-shell] [data-testid="user-message"] > div:first-child {
  flex: 1 1 auto !important;
  align-items: stretch !important;
}
[data-sos-shell] [data-testid="user-message"] > div > div:first-child {
  background-color: color-mix(in srgb, var(--sos-foreground) 6%, var(--sos-island)) !important;
  border-radius: 10px !important;
  padding: 10px 14px !important;
}
[data-sos-shell] [data-sos-user-folded] {
  -webkit-mask-image: linear-gradient(#000 70%, transparent);
  mask-image: linear-gradient(#000 70%, transparent);
}

/* Inline code: a quiet box with a hairline edge instead of a heavy grey fill. Code blocks tag
   their text "code" too, so skip anything inside a "pre" or it draws a box inside the block. */
[data-sos-shell] [data-paseo-markdown-tag="code"]:not([data-paseo-markdown-tag="pre"] *) {
  background-color: color-mix(in srgb, var(--sos-foreground) 7%, var(--sos-island)) !important;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--sos-foreground) 12%, var(--sos-island));
  border-radius: 4px !important;
}

[data-sos-shell] [data-testid="workspace-tabs-row"] {
  border-top-left-radius: ${SOS_ISLAND_RADIUS}px;
  border-top-right-radius: ${SOS_ISLAND_RADIUS}px;
}
/* The close button's fade matches the focused tab pill (tab-styles.ts activeFocused). */
[data-sos-shell] [data-sos-tab-focused] stop {
  stop-color: color-mix(in srgb, var(--sos-accent) 27%, var(--sos-island));
}

[data-sos-toolbar] :has(> [data-testid="workspace-open-in-editor-primary"]) {
  border-color: transparent !important;
}
[data-sos-toolbar] [data-testid="workspace-open-in-editor-caret"] {
  border-left-color: transparent !important;
}

/* Window dragging: Electron subtracts every no-drag box from the toolbar's drag region, even
   boxes scrolled out of view above a list. The chat and the workspace list scroll their content
   up behind the toolbar and tab row, and their buttons (no-drag via index.html) killed dragging
   there. Nothing inside these lists sits under a drag region, so they never need no-drag. */
[data-testid="agent-chat-scroll"],
[data-testid="agent-chat-scroll"] *,
[data-testid="sidebar-project-workspace-list-scroll"],
[data-testid="sidebar-project-workspace-list-scroll"] * {
  -webkit-app-region: initial !important;
}

[data-sos-shell] ::selection { background: var(--sos-selection); }
[data-sos-shell] ::-webkit-scrollbar { width: 10px; height: 10px; }
[data-sos-shell] ::-webkit-scrollbar-track { background: transparent; }
[data-sos-shell] ::-webkit-scrollbar-thumb {
  background-color: var(--sos-scroll-thumb);
  border: 3px solid transparent;
  border-radius: 10px;
  background-clip: padding-box;
}
`;

// Sos keeps the message box edge and send button on JetBrains' blue-90 while the rest of
// Islands Dark uses the lighter #6FA4FF accent from the paseo-sos plugin.
const COMPOSER_ACCENT_BY_ACCENT: Record<string, string> = { "#6FA4FF": "#538AF9" };

interface ShellCssVars {
  surface: string;
  border: string;
  accent: string;
  foreground: string;
  muted: string;
}

function ShellCssVarsWriter({ surface, border, accent, foreground, muted }: ShellCssVars) {
  useEffect(() => {
    if (!isWeb || typeof document === "undefined") return;
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = RULES;
      document.head.appendChild(style);
    }
    const root = document.documentElement.style;
    // JetBrains selection-bg-active (#2A4371) is the accent at ~30% over the island.
    root.setProperty("--sos-selection", mixHex(surface, accent, 0.3));
    root.setProperty("--sos-foreground", foreground);
    root.setProperty("--sos-island", surface);
    // JetBrains editor-bg-inline (#212326): a 3% lift off the island.
    root.setProperty("--sos-inline", mixHex(surface, foreground, 0.03));
    root.setProperty("--sos-border", border);
    root.setProperty("--sos-accent", accent);
    root.setProperty("--sos-composer-accent", COMPOSER_ACCENT_BY_ACCENT[accent] ?? accent);
    root.setProperty("--sos-muted", muted);
    root.setProperty("--sos-scroll-thumb", mixHex(surface, foreground, 0.16));
  }, [accent, border, foreground, muted, surface]);
  return null;
}

const ThemedShellCssVarsWriter = withUnistyles(ShellCssVarsWriter);
const cssVarsFromTheme = (theme: Theme): ShellCssVars => ({
  surface: theme.colors.surface0,
  border: theme.colors.border,
  accent: theme.colors.accent,
  foreground: theme.colors.foreground,
  muted: theme.colors.foregroundMuted,
});

/** Injects the shell stylesheet once and keeps its color variables on the active theme. */
export function SosShellCss() {
  return <ThemedShellCssVarsWriter uniProps={cssVarsFromTheme} />;
}

/**
 * JetBrains project-colored title bar: the current project's identity color glows from the
 * top-left corner behind the toolbar. With no project the variable is unset and the
 * gradient drops out.
 */
export function useSosProjectGlow(projectViewKey: string | null) {
  useEffect(() => {
    if (!isWeb || typeof document === "undefined" || !projectViewKey) return;
    const color = identityColor(deriveIdentityColorName(projectViewKey));
    const root = document.documentElement.style;
    root.setProperty("--sos-project-glow", `color-mix(in srgb, ${color} 60%, transparent)`);
    return () => {
      root.removeProperty("--sos-project-glow");
    };
  }, [projectViewKey]);
}
