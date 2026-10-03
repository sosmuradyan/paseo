import { useMemo, type ReactNode } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { WindowChromeRootRegion } from "@/utils/desktop-window";
import { SOS_ISLAND_GAP } from "./metrics";
import { SosShellCss } from "./shell-css";
import { SosStatusBar } from "./status-bar";
import { SosLeftStripe } from "./tool-stripes";
import { SosToolbar } from "./toolbar";
import { useSosActiveWorkspace, useSosExplorerTabKind } from "./use-shell-data";

/**
 * The WebStorm frame: main toolbar on top, the tool-window stripe on the left edge, status
 * bar at the bottom. No right stripe: Notifications and the Explorer toggle sit in the toolbar. `children` is upstream's sidebar + content row, untouched. The
 * toolbar owns both top window corners, so nothing below it pads for traffic lights.
 * `data-sos-shell` scopes the shell stylesheet; `data-sos-explorer-tab` tells it which
 * Explorer tab is focused, since upstream exposes that only through generated classes.
 */
export function SosShell({ children }: { children: ReactNode }) {
  const { workspaceKey } = useSosActiveWorkspace();
  const explorerTab = useSosExplorerTabKind(workspaceKey);
  const dataSet = useMemo(
    () => ({ sosShell: "true", sosExplorerTab: explorerTab ?? "none" }),
    [explorerTab],
  );
  return (
    <View style={styles.frame} dataSet={dataSet}>
      <SosShellCss />
      <SosToolbar />
      <WindowChromeRootRegion corners="none">
        <View style={styles.body}>
          <SosLeftStripe />
          <View style={styles.content}>{children}</View>
        </View>
        <SosStatusBar />
      </WindowChromeRootRegion>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  frame: {
    flex: 1,
    backgroundColor: theme.colors.surface1,
  },
  body: {
    flex: 1,
    flexDirection: "row",
    minHeight: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    marginHorizontal: SOS_ISLAND_GAP,
  },
}));
