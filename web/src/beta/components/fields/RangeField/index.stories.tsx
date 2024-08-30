import { styled } from "@reearth/services/theme";
import { useArgs } from "@storybook/preview-api";
import { Meta, StoryObj } from "@storybook/react";
import { useCallback } from "react";


import RangeField, { Props } from ".";

const meta: Meta<typeof RangeField> = {
  component: RangeField
};

export default meta;

type Story = StoryObj<typeof RangeField>;

export const Default: Story = (args: Props) => {
  const [_, updateArgs] = useArgs();

  const handleChange = useCallback(
    (value: number[]) => {
      updateArgs({ value: value });
    },
    [updateArgs]
  );

  return (
    <Wrapper>
      <div>
        <RangeField {...args} onChange={handleChange} />
      </div>
      <div>
        <RangeField
          {...args}
          name="Disabled"
          description="Disabled field"
          disabled={true}
          onChange={handleChange}
        />
      </div>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10%;
  margin: 2rem;
  height: 300px;
`;

Default.args = {
  name: "Slider Field",
  description: "Slider field Sample description",
  value: [0, 50],
  min: 0,
  max: 100,
  step: 1,
  disabled: false,
  onChange: () => console.log("clicked")
};
