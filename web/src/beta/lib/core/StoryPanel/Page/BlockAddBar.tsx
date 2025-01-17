import { useCallback, useEffect, useMemo } from "react";

import Icon from "@reearth/beta/components/Icon";
import * as Popover from "@reearth/beta/components/Popover";
import PopoverMenuContent, { MenuItem } from "@reearth/beta/components/PopoverMenuContent";
import type { InstallableStoryBlock } from "@reearth/services/api/storytellingApi/blocks";
import { styled } from "@reearth/services/theme";

import { STORY_PANEL_WIDTH } from "../constants";

type Props = {
  id?: string;
  installableStoryBlocks?: InstallableStoryBlock[];
  openBlocks: boolean;
  alwaysShow?: boolean;
  showAreaHeight?: number;
  onBlockOpen: () => void;
  onBlockAdd?: (extensionId?: string, pluginId?: string) => void;
};

const BlockAddBar: React.FC<Props> = ({
  id,
  installableStoryBlocks,
  openBlocks,
  alwaysShow,
  showAreaHeight,
  onBlockOpen,
  onBlockAdd,
}) => {
  const items: MenuItem[] = useMemo(
    () =>
      installableStoryBlocks?.map?.(sb => {
        return {
          name: sb.name,
          icon: sb.extensionId ?? "plugin",
          onClick: () => {
            onBlockAdd?.(sb.extensionId, sb.pluginId);
            onBlockOpen();
          },
        };
      }) ?? [],
    [installableStoryBlocks, onBlockAdd, onBlockOpen],
  );

  const handleBlockOpen = useCallback(
    (e: React.MouseEvent<Element> | undefined) => {
      e?.stopPropagation();
      onBlockOpen();
    },
    [onBlockOpen],
  );

  const persist = useMemo(() => alwaysShow || openBlocks, [alwaysShow, openBlocks]);

  useEffect(() => {
    if (!id) return;
    const persistUI = alwaysShow || openBlocks;
    const listener = showWhenCloseToElement(id, persistUI);
    document.addEventListener("mousemove", listener);
    return () => {
      document.removeEventListener("mousemove", listener);
    };
  }, [id, alwaysShow, openBlocks]);

  return (
    <Wrapper>
      <Popover.Provider open={openBlocks} placement="bottom-start" onOpenChange={onBlockOpen}>
        <Popover.Trigger asChild>
          <Bar
            id={id}
            persist={persist}
            height={showAreaHeight}
            onClick={e => e.stopPropagation()}
            onMouseOver={e => e.stopPropagation()}>
            <StyledIcon icon="plus" persist={persist} size={16} onClick={handleBlockOpen} />
            <Line persist={persist} />
          </Bar>
        </Popover.Trigger>
        <Popover.Content>
          <PopoverMenuContent size="md" width="200px" items={items} />
        </Popover.Content>
      </Popover.Provider>
    </Wrapper>
  );
};

export default BlockAddBar;

const Wrapper = styled.div`
  position: relative;
  z-index: ${({ theme }) => theme.zIndexes.visualizer.storyBlockAddBar};
`;

const Bar = styled.div<{ persist?: boolean; height?: number }>`
  position: absolute;
  left: 0;
  right: 0;
  left: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  height: ${({ height }) => height ?? 1}px;
`;

const StyledIcon = styled(Icon)<{ persist?: boolean }>`
  color: ${({ theme }) => theme.content.main};
  background: ${({ theme }) => theme.select.main};
  border-radius: 4px;
  padding: 2px;
  cursor: pointer;
  transition: opacity 0.4s;
  opacity: ${({ persist }) => (persist ? "100%" : "0%")};
`;

const Line = styled.div<{ persist?: boolean }>`
  height: 1px;
  width: 100%;
  background: ${({ theme }) => theme.select.main};
  transition: opacity 0.4s;
  opacity: ${({ persist }) => (persist ? "100%" : "0%")};
`;

const showWhenCloseToElement = (id?: string, persist?: boolean) => (event: MouseEvent) => {
  if (!id) return;

  const targetElement = document.getElementById(id) as HTMLElement;
  if (!targetElement) return;
  // Get the cursor position
  const cursorX = event.clientX;
  const cursorY = event.clientY;

  // Get the position and dimensions of the target element
  const targetRect = targetElement.getBoundingClientRect();
  const targetX = targetRect.x;
  const targetY = targetRect.y;
  const targetWidth = targetRect.width;
  const targetHeight = targetRect.height;

  // Calculate the distance between the cursor and the center of the target element
  const distanceX = Math.abs(cursorX - (targetX + targetWidth / 2));
  const distanceY = Math.abs(cursorY - (targetY + targetHeight / 2));

  // These values are how far from the center (x or y axis) of the element the cursor can be
  const yProximityThreshold = 10;
  const xProximityThreshold = STORY_PANEL_WIDTH / 2;

  // If the cursor is close enough to the target element, show it; otherwise, hide it
  if (distanceX < xProximityThreshold && distanceY < yProximityThreshold) {
    const children = targetElement.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      if (child.style.opacity === "100%") return;
      child.style.opacity = "100%";
    }
  } else {
    if (persist) return;
    const children = targetElement.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      if (child.style.opacity === "0%") return;
      child.style.opacity = "0%";
    }
  }
};
