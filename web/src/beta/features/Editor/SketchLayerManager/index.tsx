import React, { useCallback, useMemo, useState } from "react";

import Modal from "@reearth/beta/components/Modal";
import TabMenu from "@reearth/beta/components/TabMenu";
import { useT } from "@reearth/services/i18n";

import { LayerAddProps } from "../useLayers";

import CustomedProperties from "./CustomedProperties";
import General from "./General";

export type SketchProps = {
  sceneId: string;
  onClose: () => void;
  onSubmit: (layerAddInp: LayerAddProps) => void;
};

type TabObject = {
  id: string;
  name?: string | undefined;
  component?: JSX.Element | undefined;
};

const SketchLayerManager: React.FC<SketchProps> = ({ sceneId, onClose, onSubmit }) => {
  const t = useT();
  const [selectedTab, setSelectedTab] = useState("general");

  const handleTabChange = useCallback((newTab: string) => {
    setSelectedTab(newTab);
  }, []);

  const tabs: TabObject[] = useMemo(
    () => [
      {
        id: "general",
        name: t("General"),
        component: <General onClose={onClose} sceneId={sceneId} onSubmit={onSubmit} />,
      },
      {
        id: "customized Properties",
        name: t("Customized Properties"),
        component: <CustomedProperties onClose={onClose} sceneId={sceneId} onSubmit={onSubmit} />,
      },
    ],
    [onClose, onSubmit, sceneId, t],
  );

  return (
    <Modal
      size="md"
      isVisible={true}
      title={t("New Sketch Layer")}
      onClose={onClose}
      isContent={true}>
      <TabMenu
        menuAlignment="top"
        tabs={tabs}
        selectedTab={selectedTab}
        onSelectedTabChange={handleTabChange}
      />
    </Modal>
  );
};

export default SketchLayerManager;