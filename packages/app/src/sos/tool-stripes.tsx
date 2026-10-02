import { router, usePathname } from "expo-router";
import { CalendarClock, FolderTree, GitCompare, History, Layers } from "lucide-react-native";
import { useCallback } from "react";
import { Pressable, View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { useKeyboardActionDispatcher } from "@/keyboard/keyboard-action-dispatcher-context";
import { usePanelStore } from "@/stores/panel-store";
import type { SplitNode } from "@/stores/workspace-layout-actions";
import {
  selectExplorerSidebarPaneId,
  selectIsExplorerSidebarVisible,
  useWorkspaceLayoutStore,
} from "@/stores/workspace-layout-store";
import type { Theme } from "@/styles/theme";
import { buildSchedulesRoute, buildSessionsRoute } from "@/utils/host-routes";
import { buildWorkspaceTabPersistenceKey } from "@/workspace-tabs/model";
import { SOS_STRIPE_WIDTH } from "./metrics";
import { useSosActiveWorkspace } from "./use-shell-data";

const mutedIcon = (theme: Theme) => ({ color: theme.colors.foregroundMuted });
const activeIcon = (theme: Theme) => ({ color: theme.colors.foreground });
const ThemedLayers = withUnistyles(Layers);
const ThemedHistory = withUnistyles(History);
const ThemedCalendarClock = withUnistyles(CalendarClock);
const ThemedFolderTree = withUnistyles(FolderTree);
const ThemedGitCompare = withUnistyles(GitCompare);
type ThemedIcon = typeof ThemedLayers;

function StripeButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: ThemedIcon;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const Icon = icon;
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ hovered }) => [
        styles.button,
        hovered && styles.buttonHovered,
        active && styles.buttonActive,
      ]}
    >
      <Icon size={18} uniProps={active ? activeIcon : mutedIcon} />
    </Pressable>
  );
}

/** Left edge: the app's navigation tool windows. */
export function SosLeftStripe() {
  const pathname = usePathname();
  const isWorkspacesOpen = usePanelStore((state) => state.desktop.agentListOpen);
  const toggleWorkspaces = usePanelStore((state) => state.toggleDesktopAgentList);
  const openHistory = useCallback(() => router.push(buildSessionsRoute()), []);
  const openSchedules = useCallback(() => router.push(buildSchedulesRoute()), []);

  return (
    <View style={styles.stripe}>
      <StripeButton
        icon={ThemedLayers}
        label="Workspaces"
        active={isWorkspacesOpen}
        onPress={toggleWorkspaces}
      />
      <StripeButton
        icon={ThemedHistory}
        label="History"
        active={pathname.includes("/sessions")}
        onPress={openHistory}
      />
      <StripeButton
        icon={ThemedCalendarClock}
        label="Schedules"
        active={pathname.includes("/schedules")}
        onPress={openSchedules}
      />
    </View>
  );
}

type ExplorerView = "files" | "changes_tree";

function useExplorerView(workspaceKey: string | null): ExplorerView | null {
  return useWorkspaceLayoutStore((state) => {
    if (!workspaceKey || !selectIsExplorerSidebarVisible(state, workspaceKey)) {
      return null;
    }
    const paneId = selectExplorerSidebarPaneId(state, workspaceKey);
    const focusedTabId = findFocusedTabId(state.layoutByWorkspace[workspaceKey]?.root, paneId);
    if (focusedTabId?.includes("changes_tree")) return "changes_tree";
    if (focusedTabId?.includes("files")) return "files";
    return null;
  });
}

function findFocusedTabId(node: SplitNode | undefined, paneId: string | null): string | null {
  if (!node || !paneId) return null;
  if (node.kind === "pane") {
    return node.pane.id === paneId ? node.pane.focusedTabId : null;
  }
  for (const child of node.group.children) {
    const found = findFocusedTabId(child, paneId);
    if (found) return found;
  }
  return null;
}

/** Right edge: the focused workspace's Explorer views. Hidden off workspace routes. */
export function SosRightStripe() {
  const { selection } = useSosActiveWorkspace();
  const dispatcher = useKeyboardActionDispatcher();
  const workspaceKey = selection
    ? buildWorkspaceTabPersistenceKey({
        serverId: selection.serverId,
        workspaceId: selection.workspaceId,
      })
    : null;
  const activeView = useExplorerView(workspaceKey);

  const toggleView = useCallback(
    (view: ExplorerView) => {
      if (activeView === view) {
        dispatcher.dispatch({ id: "sidebar.toggle.right", scope: "workspace" });
        return;
      }
      dispatcher.dispatch({
        id: view === "files" ? "workspace.tab.target.files" : "workspace.tab.target.changes",
        scope: "workspace",
      });
    },
    [activeView, dispatcher],
  );
  const toggleFiles = useCallback(() => toggleView("files"), [toggleView]);
  const toggleChanges = useCallback(() => toggleView("changes_tree"), [toggleView]);

  return (
    <View style={styles.stripe}>
      {workspaceKey ? (
        <>
          <StripeButton
            icon={ThemedFolderTree}
            label="Files"
            active={activeView === "files"}
            onPress={toggleFiles}
          />
          <StripeButton
            icon={ThemedGitCompare}
            label="Changes"
            active={activeView === "changes_tree"}
            onPress={toggleChanges}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  stripe: {
    width: SOS_STRIPE_WIDTH,
    alignItems: "center",
    gap: theme.spacing[1],
    paddingTop: theme.spacing[0.5],
  },
  button: {
    width: 30,
    height: 30,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonHovered: {
    backgroundColor: theme.colors.interactionHighlight,
  },
  buttonActive: {
    backgroundColor: theme.colors.surface3,
  },
}));
