import { useIsCompactFormFactor } from "@/constants/layout";
import { getIsElectron } from "@/constants/platform";

// SOS: the WebStorm-style shell only wraps the Electron desktop window. Phones and the
// browser build keep upstream chrome untouched.
export function useSosShellEnabled(): boolean {
  const isCompact = useIsCompactFormFactor();
  return !isCompact && getIsElectron();
}
