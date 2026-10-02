import { useMemo } from "react";
import { useAggregatedAgents } from "@/hooks/use-aggregated-agents";
import { useHosts } from "@/runtime/host-runtime";
import { useActiveWorkspaceSelection } from "@/stores/navigation-active-workspace-store";
import { useWorkspace } from "@/stores/session-store-hooks";
import { deriveSidebarStateBucket } from "@/utils/sidebar-agent-state";

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
  return { selection, workspace, serverId, host };
}
