import { useEffect } from "react";
import { withUnistyles } from "react-native-unistyles";
import { isWeb } from "@/constants/platform";
import { deriveIdentityColorName, identityColor } from "@/styles/identity-colors";
import type { Theme } from "@/styles/theme";
import { mixHex } from "./color";
import { SOS_ISLAND_RADIUS } from "./metrics";

// SOS: JetBrains density for upstream screens the shell does not own. Every selector keys on
// upstream `data-testid` / ARIA attributes under `[data-sos-shell]`, never on component code or
// generated class names. When upstream renames a test ID the rule stops matching and that spot
// falls back to the stock look; a rebase never conflicts on it.
//
// Specificity: `[data-sos-shell] [data-testid…]` is (0,2,0), above Unistyles' (0,1,0) classes.
// `!important` only where upstream sets the same property inline.
const STYLE_ID = "sos-shell-css";

const CHEVRON_MASK =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

const WS_ROW = '[data-sos-shell] [data-testid^="sidebar-workspace-row-"]';
const PROJECT_ROW = '[data-sos-shell] [data-testid^="sidebar-project-row-"]';
const PROJECT_GROUP =
  '[data-sos-shell] [data-testid="sidebar-project-workspace-list-scroll"] [role="group"]';
const HAS_CHILD_ROWS =
  ':has([data-testid^="sidebar-workspace-row-"], [data-testid^="sidebar-project-new-workspace-row-"])';
const EXPLORER_TAB = '[data-sos-shell] [data-testid^="explorer-sidebar-tab-"]:is(button)';
// JetBrains marks the tool window holding keyboard focus: its stripe button turns solid accent
// and its selected row keeps the accent selection. Elsewhere the selection goes neutral.
const WORKSPACES_FOCUSED =
  '[data-sos-shell]:has([data-testid="sidebar-project-workspace-list-scroll"]:focus-within)';
const EXPLORER_FOCUSED =
  '[data-sos-shell]:has([data-testid="workspace-explorer-sidebar"]:focus-within)';
const FOCUSED_STRIPE = `${WORKSPACES_FOCUSED} [data-sos-stripe="workspaces"][data-sos-stripe-active="true"],
${EXPLORER_FOCUSED} [data-sos-stripe="explorer"][data-sos-stripe-active="true"]`;

const RULES = `
[data-sos-shell] {
  background-image: radial-gradient(760px 90px at 170px 0, var(--sos-project-glow), transparent);
  background-repeat: no-repeat;
}

${WS_ROW} {
  min-height: 26px !important;
  padding: 3px 8px 3px 22px !important;
  margin-bottom: 0 !important;
  border-radius: 5px !important;
  gap: 2px !important;
}
${WS_ROW}[aria-selected="true"] { background-color: var(--sos-selection-inactive) !important; }
${WORKSPACES_FOCUSED} [data-testid^="sidebar-workspace-row-"][aria-selected="true"] {
  background-color: var(--sos-selection) !important;
}
${FOCUSED_STRIPE} { background-color: var(--sos-accent) !important; }
:is(${FOCUSED_STRIPE}) svg [stroke]:not([stroke="none"]) { stroke: #ffffff; }
${WS_ROW}[aria-selected="true"] div[dir="auto"] { opacity: 1 !important; }

${PROJECT_ROW} {
  min-height: 26px !important;
  padding: 3px 8px 3px 20px !important;
  margin-bottom: 0 !important;
  border-radius: 5px !important;
}
${PROJECT_ROW}::before {
  content: "";
  position: absolute;
  left: 3px;
  top: 50%;
  width: 14px;
  height: 14px;
  margin-top: -7px;
  background-color: var(--sos-muted);
  -webkit-mask: ${CHEVRON_MASK} center / 14px 14px no-repeat;
  mask: ${CHEVRON_MASK} center / 14px 14px no-repeat;
  transition: transform 120ms ease-out;
}
${PROJECT_GROUP}:not(${HAS_CHILD_ROWS}) [data-testid^="sidebar-project-row-"]::before {
  transform: rotate(-90deg);
}
${PROJECT_ROW} > div > div:last-child > div[dir="auto"] {
  color: var(--sos-foreground) !important;
  font-weight: 500 !important;
}
${PROJECT_GROUP}${HAS_CHILD_ROWS} { padding-bottom: 6px !important; }

[data-sos-shell] [data-testid^="sidebar-project-show-more-"],
[data-sos-shell] [data-testid^="sidebar-project-new-workspace-row-"] {
  min-height: 26px !important;
  padding: 3px 8px 3px 22px !important;
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
  border-color: var(--sos-accent) !important;
  outline: 1px solid var(--sos-accent);
}

[data-sos-shell] [data-testid="user-message"] > div > div:first-child {
  background-color: var(--sos-inline) !important;
  border: 1px solid var(--sos-border);
  border-radius: 10px !important;
  padding: 9px 13px !important;
}

[data-sos-shell] [data-testid="workspace-tabs-row"] {
  border-top-left-radius: ${SOS_ISLAND_RADIUS}px;
  border-top-right-radius: ${SOS_ISLAND_RADIUS}px;
}
/* The close button's fade matches the focused tab pill (tab-styles.ts activeFocused). */
[data-sos-shell] [data-sos-tab-focused] stop {
  stop-color: color-mix(in srgb, var(--sos-accent) 27%, var(--sos-island));
}

[data-sos-toolbar] [data-testid="workspace-explorer-toggle"] { display: none !important; }
[data-sos-toolbar] :has(> [data-testid="workspace-open-in-editor-primary"]) {
  border-color: transparent !important;
}
[data-sos-toolbar] [data-testid="workspace-open-in-editor-caret"] {
  border-left-color: transparent !important;
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
    // JetBrains selection-bg-inactive: a neutral lift for the selection outside focus.
    root.setProperty("--sos-selection-inactive", mixHex(surface, foreground, 0.08));
    root.setProperty("--sos-foreground", foreground);
    root.setProperty("--sos-island", surface);
    // JetBrains editor-bg-inline (#212326): a 3% lift off the island.
    root.setProperty("--sos-inline", mixHex(surface, foreground, 0.03));
    root.setProperty("--sos-border", border);
    root.setProperty("--sos-accent", accent);
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
