import { Bell } from "lucide-react-native";
import { useMemo } from "react";
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
 * JetBrains Notifications tool window button, top of the right stripe: agents that asked
 * for attention, newest first. Selecting one opens its tab.
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
        <ThemedBell size={18} uniProps={mutedIcon} />
        {pending.length > 0 ? <View style={styles.dot} /> : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="left" align="start" offset={6} width={320}>
        <DropdownMenuLabel>
          {pending.length > 0 ? "Needs your attention" : "Nothing needs your attention"}
        </DropdownMenuLabel>
        {pending.map((agent) => (
          <DropdownMenuItem
            key={`${agent.serverId}:${agent.id}`}
            description={
              agent.attentionReason ? ATTENTION_LABELS[agent.attentionReason] : undefined
            }
            onSelect={() =>
              navigateToWorkspace({
                serverId: agent.serverId,
                workspaceId: agent.workspaceId as string,
                target: { kind: "agent", agentId: agent.id },
              })
            }
          >
            {agent.title || "Untitled agent"}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const styles = StyleSheet.create((theme) => ({
  button: {
    position: "relative",
    width: 30,
    height: 30,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  hovered: {
    backgroundColor: theme.colors.interactionHighlight,
  },
  dot: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 7,
    height: 7,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.statusDotWarning,
    borderWidth: 1.5,
    borderColor: theme.colors.surface1,
  },
}));
