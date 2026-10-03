import { Bell } from "lucide-react-native";
import { useCallback, useMemo } from "react";
import { View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAggregatedAgents } from "@/hooks/use-aggregated-agents";
import { navigateToWorkspace } from "@/stores/navigation-active-workspace-store";
import type { Theme } from "@/styles/theme";

const ThemedBell = withUnistyles(Bell);
const mutedIcon = (theme: Theme) => ({ color: theme.colors.foregroundMuted });

const ATTENTION_LABELS = {
  finished: "Finished",
  error: "Failed",
  permission: "Needs permission",
} as const;

function triggerStyle({ hovered }: { hovered?: boolean }) {
  return [styles.button, hovered && styles.hovered];
}

/**
 * JetBrains Notifications button in the main toolbar: agents that asked for attention,
 * newest first. Selecting one opens its tab.
 */
export function SosNotificationsButton() {
  const { agents } = useAggregatedAgents();
  const pending = useMemo(
    () =>
      agents
        .filter((agent) => agent.requiresAttention && agent.workspaceId)
        .sort(
          (a, b) => (b.attentionTimestamp?.getTime() ?? 0) - (a.attentionTimestamp?.getTime() ?? 0),
        )
        .slice(0, 12),
    [agents],
  );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger style={triggerStyle} accessibilityLabel="Notifications">
        <ThemedBell size={16} uniProps={mutedIcon} />
        {pending.length > 0 ? <View style={styles.dot} /> : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" offset={6} width={320}>
        <DropdownMenuLabel>
          {pending.length > 0 ? "Needs your attention" : "Nothing needs your attention"}
        </DropdownMenuLabel>
        {pending.map((agent) => (
          <NotificationItem key={`${agent.serverId}:${agent.id}`} agent={agent} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type AttentionAgent = ReturnType<typeof useAggregatedAgents>["agents"][number];

function NotificationItem({ agent }: { agent: AttentionAgent }) {
  const handleSelect = useCallback(
    () =>
      navigateToWorkspace({
        serverId: agent.serverId,
        workspaceId: agent.workspaceId as string,
        target: { kind: "agent", agentId: agent.id },
      }),
    [agent.id, agent.serverId, agent.workspaceId],
  );
  return (
    <DropdownMenuItem
      description={agent.attentionReason ? ATTENTION_LABELS[agent.attentionReason] : undefined}
      onSelect={handleSelect}
    >
      {agent.title || "Untitled agent"}
    </DropdownMenuItem>
  );
}

const styles = StyleSheet.create((theme) => ({
  button: {
    position: "relative",
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  hovered: {
    backgroundColor: theme.colors.interactionHighlight,
  },
  dot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.statusDotWarning,
    borderWidth: 1.5,
    borderColor: theme.colors.surface1,
  },
}));
