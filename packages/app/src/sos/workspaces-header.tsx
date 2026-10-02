import { router } from "expo-router";
import {
  ChevronDown,
  FolderPlus,
  Import,
  Minus,
  MoreVertical,
  Plus,
  Server,
} from "lucide-react-native";
import { useCallback } from "react";
import { Pressable, Text, View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { SidebarDisplayPreferencesMenu } from "@/components/sidebar/display-preferences/menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspace } from "@/stores/session-store-hooks";
import { useActiveWorkspaceSelection } from "@/stores/navigation-active-workspace-store";
import { usePanelStore } from "@/stores/panel-store";
import { type SidebarGroupMode, useSidebarViewStore } from "@/stores/sidebar-view-store";
import type { Theme } from "@/styles/theme";
import { buildNewWorkspaceRoute } from "@/utils/host-routes";

const ThemedChevronDown = withUnistyles(ChevronDown);
const ThemedPlus = withUnistyles(Plus);
const ThemedMore = withUnistyles(MoreVertical);
const ThemedMinus = withUnistyles(Minus);
const ThemedFolderPlus = withUnistyles(FolderPlus);
const ThemedImport = withUnistyles(Import);
const ThemedServer = withUnistyles(Server);
const mutedIcon = (theme: Theme) => ({ color: theme.colors.foregroundMuted });

const GROUP_MODES: { mode: SidebarGroupMode; label: string }[] = [
  { mode: "project", label: "Group by project" },
  { mode: "status", label: "Group by status" },
];

/**
 * JetBrains tool-window header for the Workspaces sidebar. It replaces upstream's nav rows,
 * section label and footer; every action still calls upstream's own handlers.
 */
export function SosWorkspacesHeader({
  onAddProject,
  onImportSession,
  onAddHost,
}: {
  onAddProject: () => void;
  onImportSession: () => void;
  onAddHost: () => void;
}) {
  const selection = useActiveWorkspaceSelection();
  const workspace = useWorkspace(selection?.serverId ?? null, selection?.workspaceId ?? null);
  const groupMode = useSidebarViewStore((state) => state.groupMode);
  const setGroupMode = useSidebarViewStore((state) => state.setGroupMode);
  const hideSidebar = usePanelStore((state) => state.toggleDesktopAgentList);

  const openNewWorkspace = useCallback(() => {
    router.push(
      selection && workspace
        ? buildNewWorkspaceRoute({
            serverId: selection.serverId,
            sourceDirectory: workspace.projectRootPath,
            projectId: workspace.projectId,
          })
        : buildNewWorkspaceRoute(),
    );
  }, [selection, workspace]);

  return (
    <View style={styles.header}>
      <DropdownMenu>
        <DropdownMenuTrigger style={titleStyle} accessibilityLabel="Workspaces view">
          <Text style={styles.title}>Workspaces</Text>
          <ThemedChevronDown size={14} uniProps={mutedIcon} />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="start" offset={4} width={200}>
          {GROUP_MODES.map(({ mode, label }) => (
            <DropdownMenuItem
              key={mode}
              onSelect={() => setGroupMode(mode)}
              selected={groupMode === mode}
              showSelectedCheck
            >
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <View style={styles.spacer} />
      <Pressable accessibilityLabel="New workspace" onPress={openNewWorkspace} style={iconStyle}>
        <ThemedPlus size={15} uniProps={mutedIcon} />
      </Pressable>
      <SidebarDisplayPreferencesMenu />
      <DropdownMenu>
        <DropdownMenuTrigger style={iconStyle} accessibilityLabel="More workspace actions">
          <ThemedMore size={15} uniProps={mutedIcon} />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end" offset={4} width={200}>
          <DropdownMenuItem
            leading={<ThemedFolderPlus size={14} uniProps={mutedIcon} />}
            onSelect={onAddProject}
          >
            Add project
          </DropdownMenuItem>
          <DropdownMenuItem
            leading={<ThemedImport size={14} uniProps={mutedIcon} />}
            onSelect={onImportSession}
          >
            Import session
          </DropdownMenuItem>
          <DropdownMenuItem
            leading={<ThemedServer size={14} uniProps={mutedIcon} />}
            onSelect={onAddHost}
          >
            Add host
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Pressable accessibilityLabel="Hide Workspaces" onPress={hideSidebar} style={iconStyle}>
        <ThemedMinus size={15} uniProps={mutedIcon} />
      </Pressable>
    </View>
  );
}

function titleStyle({ hovered }: { hovered?: boolean }) {
  return [styles.titleButton, hovered && styles.hovered];
}

function iconStyle({ hovered }: { hovered?: boolean }) {
  return [styles.iconButton, hovered && styles.hovered];
}

const styles = StyleSheet.create((theme) => ({
  header: {
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingLeft: 6,
    paddingRight: 6,
    flexShrink: 0,
  },
  titleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 26,
    paddingHorizontal: 6,
    borderRadius: theme.borderRadius.md,
  },
  title: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
  },
  spacer: {
    flex: 1,
  },
  iconButton: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  hovered: {
    backgroundColor: theme.colors.interactionHighlight,
  },
}));
