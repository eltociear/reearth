import { FC, useMemo } from "react";

import Icon from "@reearth/beta/components/Icon";
import Icons from "@reearth/beta/components/Icon/icons";
import { styled } from "@reearth/services/theme";

import Text from "../Text";

type menuAlignment = "top" | "left";

export type TabObject = {
  id: string;
  name?: string;
  icon?: keyof typeof Icons;
  component?: JSX.Element;
};

export type Props = {
  tabs: TabObject[];
  selectedTab: string;
  onSelectedTabChange: (tab: string) => void;
  menuAlignment?: menuAlignment;
};

const TabMenu: FC<Props> = ({ tabs, selectedTab, onSelectedTabChange, menuAlignment }) => {
  const selectedTabItem = useMemo(() => {
    return tabs.find(({ id }) => id === selectedTab);
  }, [selectedTab, tabs]);

  return (
    <Wrapper menuAlignment={menuAlignment}>
      <Tabs menuAlignment={menuAlignment}>
        {tabs.map(({ id, icon }) => (
          <TabIconWrapper
            key={id}
            onClick={() => onSelectedTabChange(id)}
            selected={id === selectedTab}>
            <Icon icon={icon} size={20} />
          </TabIconWrapper>
        ))}
      </Tabs>
      <MainArea>
        {selectedTabItem?.name && !menuAlignment && (
          <Header>
            <Text size="body">{selectedTabItem.name}</Text>
          </Header>
        )}
        {selectedTabItem ? selectedTabItem.component : null}
      </MainArea>
    </Wrapper>
  );
};

export default TabMenu;

const Wrapper = styled.div<{ menuAlignment?: menuAlignment }>`
  display: flex;
  flex-flow: ${({ menuAlignment }) => (menuAlignment === "top" ? "column" : "row")} nowrap;
  position: relative;
  background: ${({ theme }) => theme.bg[1]};
`;

const Tabs = styled.div<{ menuAlignment?: menuAlignment }>`
  padding-top: 4px;
  background: ${({ theme }) => theme.bg[0]};
  display: flex;
  flex-flow: ${({ menuAlignment }) => (menuAlignment === "top" ? "row" : "column")} nowrap;
`;

const TabIconWrapper = styled.div<{ selected: boolean }>`
  padding: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  color: ${({ selected, theme }) => (selected ? theme.content.main : theme.content.weak)};
  background: ${props => (props.selected ? props.theme.bg[1] : "inherit")};
`;

const Header = styled.div`
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.outline.weak};
`;

const MainArea = styled.div`
  display: block;
  padding: 12px;
  background: ${({ theme }) => theme.bg[1]};
`;
