import { Theme } from "@reearth/beta/lib/core/Crust/types";
import type { Layer } from "@reearth/beta/lib/core/mantle";
import type { FlyTo } from "@reearth/beta/lib/core/types";
import { ValueType, ValueTypes } from "@reearth/beta/utils/value";
import type { Camera } from "@reearth/beta/utils/value";

import { StoryBlock } from "../types";

export type BlockProps = {
  block?: StoryBlock;
  layer?: Layer;
  onClick?: () => void;
  onBlockDoubleClick?: () => void;
};

export type CommonProps = {
  pageId?: string;
  isEditable?: boolean;
  isBuilt?: boolean;
  isSelected?: boolean;
  block?: StoryBlock;
  theme?: Theme;
  currentCamera?: Camera;
  padding?: {
    bottom: number;
    top: number;
    left?: number;
    right?: number;
  };
  onClick?: () => void;
  onBlockDoubleClick?: () => void;
  onClickAway?: () => void;
  onRemove?: (pageId?: string, id?: string) => void;
  onPropertyUpdate?: (
    propertyId?: string,
    schemaItemId?: string,
    fieldId?: string,
    itemId?: string,
    vt?: ValueType,
    v?: ValueTypes[ValueType],
  ) => Promise<void>;
  onPropertyItemAdd?: (propertyId?: string, schemaGroupId?: string) => Promise<void>;
  onPropertyItemMove?: (
    propertyId?: string,
    schemaGroupId?: string,
    itemId?: string,
    index?: number,
  ) => Promise<void>;
  onPropertyItemDelete?: (
    propertyId?: string,
    schemaGroupId?: string,
    itemId?: string,
  ) => Promise<void>;
  onFlyTo?: FlyTo;
};

export type Range = {
  start: number;
  mid: number;
  end: number;
};
