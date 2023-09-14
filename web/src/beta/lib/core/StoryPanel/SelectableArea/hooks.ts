import {
  Dispatch,
  MouseEvent,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { Item } from "@reearth/services/api/propertyApi/utils";

type Props = {
  editMode?: boolean;
  isSelected?: boolean;
  propertyItems?: Item[];
  setEditMode?: Dispatch<SetStateAction<boolean>>;
};

export default ({ editMode, isSelected, propertyItems, setEditMode }: Props) => {
  const [isHovered, setHover] = useState(false);
  const [showPadding, setShowPadding] = useState(false);

  useEffect(() => {
    if (!isSelected && editMode) {
      setEditMode?.(false);
    }
  }, [isSelected, editMode, setEditMode]);

  const handleMouseOver = useCallback((e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setHover(true);
  }, []);

  const handleMouseOut = useCallback(() => setHover(false), []);

  const panelSettings: Item | undefined = useMemo(
    () => propertyItems?.find(i => i.schemaGroup === "panel"),
    [propertyItems],
  );

  return {
    isHovered,
    showPadding,
    panelSettings,
    setShowPadding,
    handleMouseOver,
    handleMouseOut,
  };
};