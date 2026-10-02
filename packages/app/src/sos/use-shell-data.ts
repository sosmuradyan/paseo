import { useMemo } from "react";
import { useCheckoutStatusQuery } from "@/git/use-status-query";
import { useAggregatedAgents } from "@/hooks/use-aggregated-agents";
import { useHosts } from "@/runtime/host-runtime";
import { useActiveWorkspaceSelection } from "@/stores/navigation-active-workspace-store";
import { useWorkspace } from "@/stores/session-store-hooks";
import { collectAllPanes, collectAllTabs } from "@/stores/workspace-layout-actions";
import {
  selectExplorerSidebarPaneId,
  selectIsExplorerSidebarVisible,
  useWorkspaceLayoutStore,
} from "@/stores/workspace-layout-store";
import { deriveSidebarStateBucket } from "@/utils/sidebar-agent-state";
import { buildWorkspaceTabPersistenceKey } from "@/workspace-tabs/model";

export interface SosAgentCounts {
  running: number;
  waiting: number;
  failed: number;
}

/** Live agents across every host, bucketed the same way the sidebar status dots are. */
export function useSosAgentCounts(): SosAgentCounts {
  const { agents } = useAggregatedAgents();
  return useMemo(() => {
    const counts: SosAgentCounts = { running: 0, waiting: 0, failed: 0 };
    for (const agent of agents) {
      const bucket = deriveSidebarStateBucket({
        status: agent.status,
        requiresAttention: Boolean(agent.requiresAttention),
        attentionReason: agent.attentionReason ?? null,
        pendingPermissionCount: agent.pendingPermissionCount ?? 0,
      });
      if (bucket === "running") counts.running += 1;
      else if (bucket === "needs_input") counts.waiting += 1;
      else if (bucket === "failed") counts.failed += 1;
    }
    return counts;
  }, [agents]);
}

/** The workspace the main window is showing, plus the host the status bar reports on. */
export function useSosActiveWorkspace() {
  const selection = useActiveWorkspaceSelection();
  const hosts = useHosts();
  const workspace = useWorkspace(selection?.serverId ?? null, selection?.workspaceId ?? null);
  const serverId = selection?.serverId ?? hosts[0]?.serverId ?? null;
  const host = hosts.find((candidate) => candidate.serverId === serverId) ?? null;
  const workspaceKey = selection
    ? buildWorkspaceTabPersistenceKey({
        serverId: selection.serverId,
        workspaceId: selection.workspaceId,
      })
    : null;
  return { selection, workspace, serverId, host, workspaceKey };
}

/** The checkout's live branch, from the same push-driven query the workspace header uses. */
export function useSosCheckout(serverId: string | null, cwd: string | null) {
  const { status } = useCheckoutStatusQuery({ serverId: serverId ?? "", cwd: cwd ?? "" });
  return {
    isGit: Boolean(status?.isGit),
    branch: status?.isGit ? (status.currentBranch ?? null) : null,
  };
}

/** Target kind of the Explorer sidebar's focused tab, or null while the sidebar is hidden. */
export function useSosExplorerTabKind(workspaceKey: string | null): string | null {
  return useWorkspaceLayoutStore((state) => {
    if (!workspaceKey || !selectIsExplorerSidebarVisible(state, workspaceKey)) return null;
    const layout = state.layoutByWorkspace[workspaceKey];
    const paneId = selectExplorerSidebarPaneId(state, workspaceKey);
    const pane = layout ? collectAllPanes(layout.root).find((p) => p.id === paneId) : null;
    if (!layout || !pane?.focusedTabId) return null;
    const tab = collectAllTabs(layout.root).find((t) => t.tabId === pane.focusedTabId);
    return tab?.target.kind ?? null;
  });
}

/** Agent id of the main area's focused tab (ignores the Explorer sidebar). */
export function useSosFocusedAgentId(workspaceKey: string | null): string | null {
  return useWorkspaceLayoutStore((state) => {
    if (!workspaceKey) return null;
    const layout = state.layoutByWorkspace[workspaceKey];
    if (!layout) return null;
    const explorerPaneId = selectExplorerSidebarPaneId(state, workspaceKey);
    const panes = collectAllPanes(layout.root).filter((p) => p.id !== explorerPaneId && !p.hidden);
    const pane = panes.find((p) => p.id === layout.focusedPaneId) ?? panes[0];
    if (!pane?.focusedTabId) return null;
    const tab = collectAllTabs(layout.root).find((t) => t.tabId === pane.focusedTabId);
    return tab?.target.kind === "agent" ? tab.target.agentId : null;
  });
}
