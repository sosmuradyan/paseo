import type { ReactNode } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useSosShellEnabled } from "./shell-enabled";
import { SOS_ISLAND_GAP, SOS_ISLAND_RADIUS } from "./metrics";

/**
 * A rounded JetBrains "island" around an upstream region. Without the shell it is a
 * pass-through, so upstream layout stays byte-for-byte the same. `bare` keeps the flex
 * slot but leaves painting to islands further down (the workspace splits its main
 * column and Explorer into their own islands).
 */
export function SosIsland({
  children,
  grow = false,
  visible = true,
  bare = false,
  trailingGap = false,
}: {
  children: ReactNode;
  grow?: boolean;
  visible?: boolean;
  bare?: boolean;
  trailingGap?: boolean;
}) {
  const enabled = useSosShellEnabled();
  if (!enabled) {
    return <>{children}</>;
  }
  return (
    <View
      style={[
        styles.slot,
        !bare && visible && styles.island,
        grow && styles.grow,
        visible && trailingGap && styles.trailingGap,
      ]}
    >
      {children}
    </View>
  );
}

/** Island styles for upstream panes that sit inside a `bare` slot. */
export function useSosPaneIslandStyles() {
  const enabled = useSosShellEnabled();
  return enabled ? paneStyles : null;
}

const styles = StyleSheet.create((theme) => ({
  slot: {
    flexDirection: "row",
    minHeight: 0,
  },
  island: {
    borderRadius: SOS_ISLAND_RADIUS,
    overflow: "hidden",
    backgroundColor: theme.colors.surface0,
  },
  grow: {
    flex: 1,
    minWidth: 0,
  },
  trailingGap: {
    marginRight: SOS_ISLAND_GAP,
  },
}));

const paneStyles = StyleSheet.create((theme) => ({
  // Paints the gap between the main column and Explorer with the frame color.
  frame: {
    backgroundColor: theme.colors.surface1,
  },
  island: {
    borderRadius: SOS_ISLAND_RADIUS,
    overflow: "hidden",
    backgroundColor: theme.colors.surface0,
  },
  // The 1px resize handle before it supplies the rest of the gap.
  trailingIsland: {
    marginLeft: SOS_ISLAND_GAP - 1,
  },
}));
