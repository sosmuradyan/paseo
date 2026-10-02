import type { ReactNode } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { WindowChromeRootRegion } from "@/utils/desktop-window";
import { SosStatusBar } from "./status-bar";
import { SosLeftStripe, SosRightStripe } from "./tool-stripes";
import { SosToolbar } from "./toolbar";

/**
 * The WebStorm frame: main toolbar on top, tool-window stripes on both edges, status
 * bar at the bottom. `children` is upstream's sidebar + content row, untouched. The
 * toolbar owns both top window corners, so nothing below it pads for traffic lights.
 */
export function SosShell({ children }: { children: ReactNode }) {
  return (
    <View style={styles.frame}>
      <SosToolbar />
      <WindowChromeRootRegion corners="none">
        <View style={styles.body}>
          <SosLeftStripe />
          <View style={styles.content}>{children}</View>
          <SosRightStripe />
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
  },
}));
