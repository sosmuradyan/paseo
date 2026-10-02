import { StyleSheet } from "react-native-unistyles";
import { useSosShellEnabled } from "./shell-enabled";

// SOS: JetBrains Islands editor tabs: the selected tab is a bordered pill, accent-tinted while
// its pane has focus and neutral otherwise. Every tab carries a transparent 1px border so the
// label does not shift when the selection border appears.
const tabStyles = StyleSheet.create((theme) => ({
  base: {
    borderWidth: 1,
    borderColor: "transparent",
  },
  active: {
    backgroundColor: theme.colors.surface2,
    borderColor: theme.colors.border,
  },
  // Islands Dark: #283456 fill, #384C85 border over the #191A1C island. CSS color-mix,
  // because on web the theme colors reach the stylesheet as CSS variables.
  activeFocused: {
    backgroundColor: `color-mix(in srgb, ${theme.colors.accent} 27%, ${theme.colors.surface0})`,
    borderColor: `color-mix(in srgb, ${theme.colors.accent} 50%, ${theme.colors.surface0})`,
  },
}));

export function useSosTabStyles() {
  return useSosShellEnabled() ? tabStyles : null;
}
