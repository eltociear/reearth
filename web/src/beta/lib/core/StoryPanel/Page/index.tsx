import { Fragment, useMemo } from "react";

import type { Spacing, ValueType, ValueTypes } from "@reearth/beta/utils/value";
import type {
  InstallableStoryBlock,
  InstalledStoryBlock,
} from "@reearth/services/api/storytellingApi/blocks";
import { useT } from "@reearth/services/i18n";
import { styled } from "@reearth/services/theme";

import StoryBlock from "../Block";
import type { Page } from "../hooks";
import SelectableArea from "../SelectableArea";

import BlockAddBar from "./BlockAddBar";
import useHooks from "./hooks";

type Props = {
  page?: Page;
  selectedPageId?: string;
  installableStoryBlocks?: InstallableStoryBlock[];
  installedStoryBlocks?: InstalledStoryBlock[];
  selectedStoryBlockId?: string;
  showPageSettings?: boolean;
  isEditable?: boolean;
  onPageSettingsToggle?: () => void;
  onPageSelect?: (pageId?: string | undefined) => void;
  onBlockCreate?: (index?: number) => (extensionId?: string, pluginId?: string) => Promise<void>;
  onBlockDelete?: (blockId?: string) => Promise<void>;
  onBlockSelect?: (blockId?: string) => void;
  onPropertyUpdate?: (
    propertyId?: string,
    schemaItemId?: string,
    fieldId?: string,
    itemId?: string,
    vt?: ValueType,
    v?: ValueTypes[ValueType],
  ) => Promise<void>;
  handleUpdatePropertyValue?: (
    propertyId?: string,
    schemaGroupId?: string,
    fieldId?: string,
    itemId?: string,
    vt?: ValueType,
    v?: ValueTypes[ValueType],
  ) => Promise<void>;
};

const StoryPage: React.FC<Props> = ({
  page,
  selectedPageId,
  installableStoryBlocks,
  installedStoryBlocks,
  selectedStoryBlockId,
  showPageSettings,
  isEditable,
  onPageSettingsToggle,
  onPageSelect,
  onBlockCreate,
  onBlockDelete,
  onBlockSelect,
  onPropertyUpdate,
  handleUpdatePropertyValue,
}) => {
  const t = useT();
  const propertyItems = useMemo(() => page?.property.items, [page?.property]);

  const { openBlocksIndex, titleId, titleProperty, handleBlockOpen } = useHooks({
    pageId: page?.id,
    propertyItems,
  });

  return (
    <SelectableArea
      title={page?.title ?? t("Page")}
      position="left-bottom"
      icon="storyPage"
      noBorder
      isSelected={selectedPageId === page?.id}
      propertyId={page?.property?.id}
      propertyItems={propertyItems}
      showSettings={showPageSettings}
      isEditable={isEditable}
      onClick={() => onPageSelect?.(page?.id)}
      onClickAway={onPageSelect}
      onSettingsToggle={onPageSettingsToggle}>
      <Wrapper id={page?.id}>
        {titleProperty && (
          <StoryBlock
            block={{
              id: titleId,
              pluginId: "reearth",
              extensionId: "titleStoryBlock",
              title: titleProperty.title,
              property: {
                id: page?.property?.id ?? "",
                items: [titleProperty],
              },
            }}
            isEditable={isEditable}
            isSelected={selectedStoryBlockId === titleId}
            onClick={() => onBlockSelect?.(titleId)}
            onClickAway={onBlockSelect}
            onChange={onPropertyUpdate}
            handleUpdatePropertyValue={handleUpdatePropertyValue}
          />
        )}
        {isEditable && (
          <BlockAddBar
            openBlocks={openBlocksIndex === -1}
            installableStoryBlocks={installableStoryBlocks}
            onBlockOpen={() => handleBlockOpen(-1)}
            onBlockAdd={onBlockCreate?.(0)}
          />
        )}
        {installedStoryBlocks &&
          installedStoryBlocks.length > 0 &&
          installedStoryBlocks.map((b, idx) => (
            <Fragment key={idx}>
              <StoryBlock
                block={b}
                isSelected={selectedStoryBlockId === b.id}
                isEditable={isEditable}
                onClick={() => onBlockSelect?.(b.id)}
                onClickAway={onBlockSelect}
                onChange={onPropertyUpdate}
                onRemove={onBlockDelete}
                handleUpdatePropertyValue={handleUpdatePropertyValue}
              />
              {isEditable && (
                <BlockAddBar
                  openBlocks={openBlocksIndex === idx}
                  installableStoryBlocks={installableStoryBlocks}
                  onBlockOpen={() => handleBlockOpen(idx)}
                  onBlockAdd={onBlockCreate?.(idx + 1)}
                />
              )}
            </Fragment>
          ))}
      </Wrapper>
    </SelectableArea>
  );
};

export default StoryPage;

const Wrapper = styled.div<{ padding?: Spacing }>`
  display: flex;
  flex-direction: column;
  color: ${({ theme }) => theme.content.weaker};

  padding: 20px;
  padding-top: ${({ padding }) => padding?.top + "px" ?? 0};
  padding-bottom: ${({ padding }) => padding?.bottom + "px" ?? 0};
  padding-left: ${({ padding }) => padding?.left + "px" ?? 0};
  padding-right: ${({ padding }) => padding?.right + "px" ?? 0};

  box-sizing: border-box;
`;
