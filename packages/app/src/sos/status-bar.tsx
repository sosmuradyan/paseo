import { ChevronRight, GitBranch, Server } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { useAggregatedAgents } from "@/hooks/use-aggregated-agents";
import { useProviderUsage } from "@/provider-usage/use-provider-usage";
import { useHostRuntimeIsConnected } from "@/runtime/host-runtime";
import type { Theme } from "@/styles/theme";
import { resolveAppVersion } from "@/utils/app-version";
import { SOS_STATUS_BAR_HEIGHT } from "./metrics";
import { useSosActiveWorkspace, useSosCheckout, useSosFocusedAgentId } from "./use-shell-data";

const ThemedChevronRight = withUnistyles(ChevronRight);
const ThemedGitBranch = withUnistyles(GitBranch);
const ThemedServer = withUnistyles(Server);
const mutedIcon = (theme: Theme) => ({ color: theme.colors.foregroundMuted });
const extraMutedIcon = (theme: Theme) => ({ color: theme.colors.foregroundExtraMuted });

const MAX_USAGE_PROVIDERS = 2;

export function SosStatusBar() {
  const { workspace, serverId, host, workspaceKey } = useSosActiveWorkspace();
  const isConnected = useHostRuntimeIsConnected(serverId ?? "");
  const { branch } = useSosCheckout(serverId, workspace?.workspaceDirectory ?? null);
  const agent = useSosFocusedAgent(serverId, workspaceKey);
  const projectName = workspace?.projectCustomName || workspace?.projectDisplayName || null;
  const workspaceName = workspace ? workspace.title || workspace.name : null;
  const version = resolveAppVersion();

  return (
    <View style={styles.bar}>
      <View style={styles.crumbs}>
        {projectName ? <Text style={styles.crumb}>{projectName}</Text> : null}
        {projectName && workspaceName ? (
          <ThemedChevronRight size={12} uniProps={extraMutedIcon} />
        ) : null}
        {workspaceName ? (
          <Text style={[styles.crumb, !agent && styles.crumbCurrent]} numberOfLines={1}>
            {workspaceName}
          </Text>
        ) : null}
        {workspaceName && agent ? (
          <>
            <ThemedChevronRight size={12} uniProps={extraMutedIcon} />
            <Text style={[styles.crumb, styles.crumbCurrent]} numberOfLines={1}>
              {agent.title || "New agent"}
            </Text>
          </>
        ) : null}
      </View>
      <View style={styles.spacer} />
      {agent?.status === "running" ? <WorkingItem startedAt={agent.startedAt} /> : null}
      <UsageItems serverId={serverId} />
      {branch ? (
        <View style={styles.item}>
          <ThemedGitBranch size={13} uniProps={mutedIcon} />
          <Text style={styles.itemText} numberOfLines={1}>
            {branch}
          </Text>
        </View>
      ) : null}
      {host ? (
        <View style={styles.item}>
          <ThemedServer size={13} uniProps={mutedIcon} />
          <Text style={styles.itemText}>{host.label}</Text>
          <View style={[styles.dot, isConnected ? styles.dotOk : styles.dotOff]} />
        </View>
      ) : null}
      {version ? (
        <View style={styles.item}>
          <Text style={styles.itemText}>{`Paseo ${version}`}</Text>
        </View>
      ) : null}
    </View>
  );
}

function useSosFocusedAgent(serverId: string | null, workspaceKey: string | null) {
  const agentId = useSosFocusedAgentId(workspaceKey);
  const { agents } = useAggregatedAgents();
  const agent = agentId
    ? agents.find((candidate) => candidate.id === agentId && candidate.serverId === serverId)
    : undefined;
  if (!agent) return null;
  const startedAt = agent.turn?.phase === "open" ? agent.turn.startedAt : null;
  return { title: agent.title, status: agent.status, startedAt };
}

function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

/** "Working · 2m 2s" for the focused agent's open turn, ticking once a second. */
function WorkingItem({ startedAt }: { startedAt: Date | null }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startedAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [startedAt]);
  return (
    <View style={styles.item}>
      <View style={[styles.dot, styles.dotRunning]} />
      <Text style={styles.itemText}>
        {startedAt ? `Working · ${formatElapsed(now - startedAt.getTime())}` : "Working"}
      </Text>
    </View>
  );
}

function UsageItems({ serverId }: { serverId: string | null }) {
  const { view } = useProviderUsage(serverId);
  if (view.kind !== "ready") {
    return null;
  }
  const items = view.payload.providers
    .filter((provider) => provider.status === "available")
    .map((provider) => {
      const window = provider.windows.find((candidate) => typeof candidate.usedPct === "number");
      return window ? { id: provider.providerId, name: provider.displayName, window } : null;
    })
    .filter((item) => item !== null)
    .slice(0, MAX_USAGE_PROVIDERS);

  return (
    <>
      {items.map((item) => {
        const usedPct = Math.round(item.window.usedPct ?? 0);
        return (
          <View key={item.id} style={styles.item}>
            <Text style={styles.itemText}>{`${item.name} ${usedPct}%`}</Text>
            <View style={styles.meter}>
              <View
                style={[
                  styles.meterFill,
                  item.window.tone === "danger" && styles.meterDanger,
                  item.window.tone === "warning" && styles.meterWarning,
                  { width: `${Math.min(100, Math.max(0, usedPct))}%` },
                ]}
              />
            </View>
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  bar: {
    height: SOS_STATUS_BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: theme.spacing[3],
    paddingRight: theme.spacing[2],
    gap: theme.spacing[0.5],
  },
  crumbs: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1],
    minWidth: 0,
    flexShrink: 1,
  },
  crumb: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fontFamily.ui,
  },
  crumbCurrent: {
    color: theme.colors.foreground,
  },
  spacer: {
    flex: 1,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1.5],
    height: 22,
    paddingHorizontal: theme.spacing[2],
  },
  itemText: {
    color: theme.colors.foregroundMuted,
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fontFamily.ui,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: theme.borderRadius.full,
  },
  dotRunning: {
    backgroundColor: theme.colors.statusDotRunning,
  },
  dotOk: {
    backgroundColor: theme.colors.statusDotSuccess,
  },
  dotOff: {
    backgroundColor: theme.colors.statusDotDanger,
  },
  meter: {
    width: 32,
    height: 4,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface3,
    overflow: "hidden",
  },
  meterFill: {
    height: "100%",
    backgroundColor: theme.colors.foregroundMuted,
  },
  meterWarning: {
    backgroundColor: theme.colors.statusWarning,
  },
  meterDanger: {
    backgroundColor: theme.colors.statusDanger,
  },
}));
