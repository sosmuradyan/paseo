import { StyleSheet } from "react-native-unistyles";
import { useSosShellEnabled } from "./shell-enabled";

// SOS: JetBrains editor tabs: accent-tinted selection with an accent underline.
const tabStyles = StyleSheet.create((theme) => ({
  active: {
    backgroundColor: `${theme.colors.accent}1F`,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 2,
    borderBottomColor: `${theme.colors.accent}80`,
  },
  activeFocused: {
    backgroundColor: `${theme.colors.accent}33`,
    borderBottomColor: theme.colors.accent,
  },
}));

export function useSosTabStyles() {
  return useSosShellEnabled() ? tabStyles : null;
}
