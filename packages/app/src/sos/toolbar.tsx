import { router } from "expo-router";
import { Search, Settings } from "lucide-react-native";
import { useCallback } from "react";
import { Pressable, Text, View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { TitlebarDragRegion } from "@/components/desktop/titlebar-drag-region";
import { useKeyboardShortcutsStore } from "@/stores/keyboard-shortcuts-store";
import type { Theme } from "@/styles/theme";
import { WindowChromeSafeArea } from "@/utils/desktop-window";
import { buildSettingsRoute } from "@/utils/host-routes";
import { useSosHeaderSlotRef } from "./header-slot";
import { SOS_TOOLBAR_HEIGHT } from "./metrics";
import { useSosAgentCounts } from "./use-shell-data";

const ThemedSearch = withUnistyles(Search);
const ThemedSettings = withUnistyles(Settings);
const mutedIcon = (theme: Theme) => ({ color: theme.colors.foregroundMuted });

/**
 * JetBrains main toolbar. The left and right slots receive the focused workspace's own
 * header content through `SosWorkspaceHeader`; the rest is shell-owned.
 */
export function SosToolbar() {
  const leftSlotRef = useSosHeaderSlotRef("left");
  const rightSlotRef = useSosHeaderSlotRef("right");
  const setCommandCenterOpen = useKeyboardShortcutsStore((state) => state.setCommandCenterOpen);
  const openSearch = useCallback(() => setCommandCenterOpen(true), [setCommandCenterOpen]);
  const openSettings = useCallback(() => router.push(buildSettingsRoute()), []);

  return (
    <WindowChromeSafeArea placement="inline" horizontalPadding={8} style={styles.toolbar}>
      <TitlebarDragRegion />
      <View ref={leftSlotRef} style={styles.leftSlot} />
      <View style={styles.spacer} pointerEvents="none" />
      <AgentStatusWidget />
      <View ref={rightSlotRef} style={styles.rightSlot} />
      <Pressable
        accessibilityLabel="Search"
        onPress={openSearch}
        style={({ hovered }) => [styles.iconButton, hovered && styles.iconButtonHovered]}
      >
        <ThemedSearch size={16} uniProps={mutedIcon} />
      </Pressable>
      <Pressable
        accessibilityLabel="Settings"
        onPress={openSettings}
        style={({ hovered }) => [styles.iconButton, hovered && styles.iconButtonHovered]}
      >
        <ThemedSettings size={16} uniProps={mutedIcon} />
      </Pressable>
    </WindowChromeSafeArea>
  );
}

function AgentStatusWidget() {
  const counts = useSosAgentCounts();
  if (counts.running === 0 && counts.waiting === 0 && counts.failed === 0) {
    return null;
  }
  return (
    <View style={styles.statusWidget}>
      {counts.running > 0 ? (
        <View style={styles.statusSegment}>
          <View style={[styles.dot, styles.dotRunning]} />
          <Text style={styles.statusText}>
            {counts.running === 1 ? "1 agent running" : `${counts.running} agents running`}
          </Text>
        </View>
      ) : null}
      {counts.waiting > 0 ? (
        <View style={[styles.statusSegment, counts.running > 0 && styles.statusSegmentDivided]}>
          <View style={[styles.dot, styles.dotWaiting]} />
          <Text style={styles.statusText}>{`${counts.waiting} waiting`}</Text>
        </View>
      ) : null}
      {counts.failed > 0 ? (
        <View
          style={[
            styles.statusSegment,
            (counts.running > 0 || counts.waiting > 0) && styles.statusSegmentDivided,
          ]}
        >
          <View style={[styles.dot, styles.dotFailed]} />
          <Text style={styles.statusText}>{`${counts.failed} failed`}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  toolbar: {
    position: "relative",
    height: SOS_TOOLBAR_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[1],
  },
  leftSlot: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    flexShrink: 1,
  },
  spacer: {
    flex: 1,
  },
  rightSlot: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonHovered: {
    backgroundColor: theme.colors.interactionHighlight,
  },
  statusWidget: {
    flexDirection: "row",
    alignItems: "center",
    height: 28,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.interactionHighlight,
    marginRight: theme.spacing[1.5],
  },
  statusSegment: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[2],
    height: "100%",
    paddingHorizontal: theme.spacing[3],
  },
  statusSegmentDivided: {
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.surface1,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: theme.borderRadius.full,
  },
  dotRunning: {
    backgroundColor: theme.colors.statusDotRunning,
  },
  dotWaiting: {
    backgroundColor: theme.colors.statusDotWarning,
  },
  dotFailed: {
    backgroundColor: theme.colors.statusDotDanger,
  },
  statusText: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fontFamily.ui,
  },
}));
