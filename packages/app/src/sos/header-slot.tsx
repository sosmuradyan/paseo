import { useCallback, type ComponentProps } from "react";
import { createPortal } from "react-dom";
import { create } from "zustand";
import { ScreenHeader } from "@/components/headers/screen-header";
import { isWeb } from "@/constants/platform";
import { useSosShellEnabled } from "./shell-enabled";

type SlotName = "right";

interface HeaderSlotState {
  right: HTMLElement | null;
  setSlot: (name: SlotName, element: HTMLElement | null) => void;
}

const useHeaderSlotStore = create<HeaderSlotState>((set) => ({
  right: null,
  setSlot: (name, element) => set({ [name]: element }),
}));

/** Ref callback for the toolbar's left/right containers. React Native Web refs are DOM nodes. */
export function useSosHeaderSlotRef(name: SlotName): (node: unknown) => void {
  const setSlot = useHeaderSlotStore((state) => state.setSlot);
  return useCallback(
    (node: unknown) => setSlot(name, isWeb && node instanceof HTMLElement ? node : null),
    [name, setSlot],
  );
}

type ScreenHeaderProps = ComponentProps<typeof ScreenHeader>;

/**
 * Drop-in for the workspace `ScreenHeader`. With the shell on, the focused workspace
 * portals its header actions into the toolbar so every upstream control keeps its own
 * React context. The left side (title, project, menu) is replaced by the toolbar's own
 * project and branch widgets; retained background workspaces render nothing.
 */
export function SosWorkspaceHeader({ active, ...props }: ScreenHeaderProps & { active: boolean }) {
  const enabled = useSosShellEnabled();
  const right = useHeaderSlotStore((state) => state.right);
  if (!enabled || !isWeb) {
    return <ScreenHeader {...props} />;
  }
  if (!active) {
    return null;
  }
  return right && props.right ? createPortal(props.right, right) : null;
}
