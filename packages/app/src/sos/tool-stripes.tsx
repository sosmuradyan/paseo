import { router, usePathname } from "expo-router";
import {
  Blocks,
  CalendarClock,
  FolderTree,
  GitCompare,
  History,
  Layers,
} from "lucide-react-native";
import { useCallback, useMemo } from "react";
import { Pressable, View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { useKeyboardActionDispatcher } from "@/keyboard/keyboard-action-dispatcher-context";
import { SidebarHelpMenu } from "@/components/sidebar/sidebar-help-menu";
import { usePanelStore } from "@/stores/panel-store";
import type { Theme } from "@/styles/theme";
import {
  buildSchedulesRoute,
  buildSessionsRoute,
  buildSettingsHostSectionRoute,
} from "@/utils/host-routes";
import { SOS_STRIPE_WIDTH } from "./metrics";
import { SosNotificationsButton } from "./notifications";
import { useSosActiveWorkspace, useSosCheckout, useSosExplorerTabKind } from "./use-shell-data";

const mutedIcon = (theme: Theme) => ({ color: theme.colors.foregroundMuted });
const activeIcon = (theme: Theme) => ({ color: theme.colors.foreground });
const ThemedLayers = withUnistyles(Layers);
const ThemedHistory = withUnistyles(History);
const ThemedCalendarClock = withUnistyles(CalendarClock);
const ThemedFolderTree = withUnistyles(FolderTree);
const ThemedGitCompare = withUnistyles(GitCompare);
const ThemedBlocks = withUnistyles(Blocks);
type ThemedIcon = typeof ThemedLayers;

/**
 * `panel` names the tool window the button opens, so the shell stylesheet can paint the
 * active button solid accent while focus is inside that panel, as JetBrains does.
 */
function StripeButton({
  icon,
  label,
  active,
  panel,
  onPress,
}: {
  icon: ThemedIcon;
  label: string;
  active: boolean;
  panel?: "workspaces" | "explorer";
  onPress: () => void;
}) {
  const Icon = icon;
  const dataSet = useMemo(
    () => (panel ? { sosStripe: panel, sosStripeActive: active ? "true" : "false" } : undefined),
    [active, panel],
  );
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      dataSet={dataSet}
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
  const { serverId } = useSosActiveWorkspace();
  const openPlugins = useCallback(() => {
    if (serverId) router.push(buildSettingsHostSectionRoute(serverId, "plugins"));
  }, [serverId]);

  return (
    <View style={styles.stripe}>
      <StripeButton
        icon={ThemedLayers}
        label="Workspaces"
        active={isWorkspacesOpen}
        panel="workspaces"
        onPress={toggleWorkspaces}
      />
      <View style={styles.divider} />
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
      <View style={styles.grow} />
      {serverId ? (
        <StripeButton
          icon={ThemedBlocks}
          label="Plugins"
          active={pathname.endsWith("/plugins")}
          onPress={openPlugins}
        />
      ) : null}
      <SidebarHelpMenu />
      <View style={styles.bottomGap} />
    </View>
  );
}

type ExplorerView = "files" | "changes_tree";

/**
 * Right edge: Notifications on top, then the focused workspace's Explorer views, which hide
 * off workspace routes.
 */
export function SosRightStripe() {
  const { serverId, workspace, workspaceKey } = useSosActiveWorkspace();
  const dispatcher = useKeyboardActionDispatcher();
  const activeView = useSosExplorerTabKind(workspaceKey);
  const { isGit } = useSosCheckout(serverId, workspace?.workspaceDirectory ?? null);

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
      <SosNotificationsButton />
      {workspaceKey ? (
        <>
          <View style={styles.divider} />
          <StripeButton
            icon={ThemedFolderTree}
            label="Files"
            active={activeView === "files"}
            panel="explorer"
            onPress={toggleFiles}
          />
          {isGit ? (
            <StripeButton
              icon={ThemedGitCompare}
              label="Changes"
              active={activeView === "changes_tree"}
              panel="explorer"
              onPress={toggleChanges}
            />
          ) : null}
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
  divider: {
    width: 20,
    height: 1,
    marginVertical: 2,
    backgroundColor: theme.colors.border,
  },
  grow: {
    flex: 1,
  },
  bottomGap: {
    height: 6,
  },
  buttonActive: {
    backgroundColor: theme.colors.surface3,
  },
}));
