import { router, usePathname } from "expo-router";
import { Blocks, CalendarClock, History, Layers } from "lucide-react-native";
import { useCallback, useMemo } from "react";
import { Pressable, View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { SidebarHelpMenu } from "@/components/sidebar/sidebar-help-menu";
import { usePanelStore } from "@/stores/panel-store";
import type { Theme } from "@/styles/theme";
import {
  buildSchedulesRoute,
  buildSessionsRoute,
  buildSettingsHostSectionRoute,
} from "@/utils/host-routes";
import { SOS_STRIPE_WIDTH } from "./metrics";
import { useSosActiveWorkspace } from "./use-shell-data";

const mutedIcon = (theme: Theme) => ({ color: theme.colors.foregroundMuted });
const activeIcon = (theme: Theme) => ({ color: theme.colors.foreground });
const ThemedLayers = withUnistyles(Layers);
const ThemedHistory = withUnistyles(History);
const ThemedCalendarClock = withUnistyles(CalendarClock);
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
  panel?: "workspaces";
  onPress: () => void;
}) {
  const Icon = icon;
  const dataSet = useMemo(
    () => (panel ? { sosStripe: panel, sosStripeActive: active ? "true" : "false" } : undefined),
    [active, panel],
  );
  const accessibilityState = useMemo(() => ({ selected: active }), [active]);
  const buttonStyle = useCallback(
    ({ hovered }: { hovered?: boolean }) => [
      styles.button,
      hovered && styles.buttonHovered,
      active && styles.buttonActive,
    ],
    [active],
  );
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityState={accessibilityState}
      dataSet={dataSet}
      onPress={onPress}
      style={buttonStyle}
    >
      <Icon size={16} uniProps={active ? activeIcon : mutedIcon} />
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

const styles = StyleSheet.create((theme) => ({
  stripe: {
    width: SOS_STRIPE_WIDTH,
    alignItems: "center",
    gap: 2,
    paddingTop: theme.spacing[0.5],
  },
  button: {
    width: 26,
    height: 26,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonHovered: {
    backgroundColor: theme.colors.interactionHighlight,
  },
  divider: {
    width: 16,
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
