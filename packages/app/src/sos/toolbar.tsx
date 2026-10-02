import { router } from "expo-router";
import { ChevronDown, GitBranch, Plus, Search, Settings } from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { BranchSwitcher } from "@/components/branch-switcher";
import { TitlebarDragRegion } from "@/components/desktop/titlebar-drag-region";
import { ProjectIconView } from "@/components/project-icon-view";
import { Combobox, ComboboxItem, type ComboboxProps } from "@/components/ui/combobox";
import { useKeyboardActionDispatcher } from "@/keyboard/keyboard-action-dispatcher-context";
import { navigateToWorkspace } from "@/stores/navigation-active-workspace-store";
import { useKeyboardShortcutsStore } from "@/stores/keyboard-shortcuts-store";
import type { Theme } from "@/styles/theme";
import { WindowChromeSafeArea } from "@/utils/desktop-window";
import { buildSettingsRoute } from "@/utils/host-routes";
import { projectIconPlaceholderLabelFromDisplayName } from "@/utils/project-display-name";
import { useSosHeaderSlotRef } from "./header-slot";
import { SOS_TOOLBAR_HEIGHT } from "./metrics";
import { useSosProjectGlow } from "./shell-css";
import {
  useSosActiveWorkspace,
  useSosAgentCounts,
  useSosCheckout,
  useSosProjects,
} from "./use-shell-data";

const ThemedSearch = withUnistyles(Search);
const ThemedSettings = withUnistyles(Settings);
const ThemedPlus = withUnistyles(Plus);
const ThemedChevronDown = withUnistyles(ChevronDown);
const ThemedGitBranch = withUnistyles(GitBranch);
const mutedIcon = (theme: Theme) => ({ color: theme.colors.foregroundMuted });
const foregroundIcon = (theme: Theme) => ({ color: theme.colors.foreground });

/**
 * JetBrains main toolbar: project and branch widgets on the left, the agent run widget,
 * New agent, Search and Settings on the right. Notifications live on the right stripe. The right slot also receives
 * the focused workspace's own header actions (scripts, open in editor, plugin buttons).
 */
export function SosToolbar() {
  const rightSlotRef = useSosHeaderSlotRef("right");
  const setCommandCenterOpen = useKeyboardShortcutsStore((state) => state.setCommandCenterOpen);
  const openSearch = useCallback(() => setCommandCenterOpen(true), [setCommandCenterOpen]);
  const openSettings = useCallback(() => router.push(buildSettingsRoute()), []);
  const { selection, workspace } = useSosActiveWorkspace();

  return (
    <WindowChromeSafeArea placement="inline" horizontalPadding={8} style={styles.toolbar}>
      <TitlebarDragRegion />
      {selection && workspace ? (
        <>
          <ProjectWidget serverId={selection.serverId} workspaceId={selection.workspaceId} />
          <BranchWidget
            serverId={selection.serverId}
            workspaceId={selection.workspaceId}
            cwd={workspace.workspaceDirectory}
          />
        </>
      ) : null}
      <View style={styles.spacer} pointerEvents="none" />
      <AgentStatusWidget />
      <View ref={rightSlotRef} dataSet={TOOLBAR_DATA_SET} style={styles.rightSlot} />
      {selection ? <NewAgentButton /> : null}
      <IconButton label="Search" onPress={openSearch}>
        <ThemedSearch size={16} uniProps={mutedIcon} />
      </IconButton>
      <IconButton label="Settings" onPress={openSettings}>
        <ThemedSettings size={16} uniProps={mutedIcon} />
      </IconButton>
    </WindowChromeSafeArea>
  );
}

const TOOLBAR_DATA_SET = { sosToolbar: "true" };

function IconButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable accessibilityLabel={label} onPress={onPress} style={iconButtonStyle}>
      {children}
    </Pressable>
  );
}

function iconButtonStyle({ hovered }: { hovered?: boolean }) {
  return [styles.iconButton, hovered && styles.hovered];
}

function projectBadgeLabel(projectName: string, letters: number): string {
  return projectIconPlaceholderLabelFromDisplayName(projectName).slice(0, letters).toUpperCase();
}

function widgetStyle({ hovered }: { hovered?: boolean }) {
  return [styles.widget, hovered && styles.hovered];
}

/** Project switcher: same identity color and initial as the sidebar's project badge. */
function ProjectWidget({ serverId, workspaceId }: { serverId: string; workspaceId: string }) {
  const anchorRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const { projects: list, current } = useSosProjects(serverId, workspaceId);
  useSosProjectGlow(current?.viewKey ?? null);
  const options = useMemo(
    () =>
      list
        .filter((project) => project.workspaces.length > 0)
        .map((project) => ({ id: project.viewKey, label: project.projectName })),
    [list],
  );
  const handleSelect = useCallback(
    (viewKey: string) => {
      const project = list.find((candidate) => candidate.viewKey === viewKey);
      const target = project?.workspaces[0];
      if (target)
        navigateToWorkspace({ serverId: target.serverId, workspaceId: target.workspaceId });
      setOpen(false);
    },
    [list],
  );
  const renderOption = useCallback<NonNullable<ComboboxProps["renderOption"]>>(
    ({ option, selected, active, onPress }) => (
      <ComboboxItem
        label={option.label}
        selected={selected}
        active={active}
        onPress={onPress}
        leadingSlot={
          <ProjectIconView
            iconDataUri={null}
            initial={projectBadgeLabel(option.label, 1)}
            projectViewKey={option.id}
            size={16}
            textStyle={styles.badgeTextSmall}
          />
        }
      />
    ),
    [],
  );

  if (!current) return null;
  return (
    <View ref={anchorRef} collapsable={false}>
      <Pressable
        accessibilityLabel={`Project ${current.projectName}`}
        onPress={() => setOpen(true)}
        style={widgetStyle}
      >
        <ProjectIconView
          iconDataUri={null}
          initial={projectBadgeLabel(current.projectName, 2)}
          projectViewKey={current.viewKey}
          size={20}
          textStyle={styles.badgeText}
        />
        <Text style={styles.projectName} numberOfLines={1}>
          {current.projectName}
        </Text>
        <ThemedChevronDown size={14} uniProps={mutedIcon} />
      </Pressable>
      <Combobox
        options={options}
        value={current.viewKey}
        onSelect={handleSelect}
        searchable
        searchPlaceholder="Switch project"
        title="Projects"
        open={open}
        onOpenChange={setOpen}
        anchorRef={anchorRef}
        desktopPlacement="bottom-start"
        desktopPreventInitialFlash
        desktopMinWidth={260}
        renderOption={renderOption}
      />
    </View>
  );
}

/** Branch widget: upstream's BranchSwitcher behind a JetBrains-style git icon. */
function BranchWidget({
  serverId,
  workspaceId,
  cwd,
}: {
  serverId: string;
  workspaceId: string;
  cwd: string;
}) {
  const { isGit, branch } = useSosCheckout(serverId, cwd);
  if (!isGit || !branch) return null;
  return (
    <View style={styles.branchWidget}>
      <ThemedGitBranch size={14} uniProps={mutedIcon} />
      <BranchSwitcher
        currentBranchName={branch}
        serverId={serverId}
        workspaceId={workspaceId}
        workspaceDirectory={cwd}
        isGitCheckout
        testID="sos-toolbar-branch-switcher"
      />
    </View>
  );
}

function NewAgentButton() {
  const dispatcher = useKeyboardActionDispatcher();
  const handlePress = useCallback(
    () => dispatcher.dispatch({ id: "workspace.agent.new", scope: "workspace" }),
    [dispatcher],
  );
  return (
    <Pressable accessibilityLabel="New agent" onPress={handlePress} style={widgetStyle}>
      <ThemedPlus size={14} uniProps={foregroundIcon} />
      <Text style={styles.widgetText}>New agent</Text>
    </Pressable>
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
          <Text style={styles.widgetText}>
            {counts.running === 1 ? "1 agent running" : `${counts.running} agents running`}
          </Text>
        </View>
      ) : null}
      {counts.waiting > 0 ? (
        <View style={[styles.statusSegment, counts.running > 0 && styles.statusSegmentDivided]}>
          <View style={[styles.dot, styles.dotWaiting]} />
          <Text style={styles.widgetText}>{`${counts.waiting} waiting`}</Text>
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
          <Text style={styles.widgetText}>{`${counts.failed} failed`}</Text>
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
    gap: 4,
  },
  spacer: {
    flex: 1,
  },
  rightSlot: {
    flexDirection: "row",
    alignItems: "center",
  },
  widget: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 6,
    minWidth: 0,
  },
  branchWidget: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingLeft: 8,
    minWidth: 0,
    flexShrink: 1,
  },
  projectName: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  badgeTextSmall: {
    fontSize: 9,
    fontWeight: "700",
  },
  widgetText: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.base,
  },
  iconButton: {
    position: "relative",
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  hovered: {
    backgroundColor: theme.colors.interactionHighlight,
  },
  statusWidget: {
    flexDirection: "row",
    alignItems: "center",
    height: 28,
    marginRight: 6,
  },
  statusSegment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    height: "100%",
    paddingHorizontal: 10,
  },
  statusSegmentDivided: {
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.border,
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
}));
