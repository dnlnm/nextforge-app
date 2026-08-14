import { Checkbox } from "@repo/design-system/components/ui/checkbox";
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

/**
 * A control that allows the user to toggle between checked and not checked.
 */
const meta: Meta<typeof Checkbox> = {
  title: "ui/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  argTypes: {},
  args: {
    id: "terms",
    disabled: false,
  },
  render: (args) => (
    <div className="flex space-x-2">
      <Checkbox {...args} />
      <label
        className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
        htmlFor={args.id}
      >
        Accept terms and conditions
      </label>
    </div>
  ),
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The default form of the checkbox.
 */
export const Default: Story = {};

/**
 * Use the `disabled` prop to disable the checkbox.
 */
export const Disabled: Story = {
  args: {
    id: "disabled-terms",
    disabled: true,
  },
};

/**
 * A "select all" checkbox whose state animates between unchecked, checked, and
 * indeterminate as individual options are toggled.
 */
export const Indeterminate: Story = {
  render: () => {
    const items = ["Newsletter", "Product updates", "Promotions"];

    function CheckboxGroup() {
      const [selected, setSelected] = useState<string[]>([]);
      const allChecked = selected.length === items.length;
      const someChecked = selected.length > 0;

      return (
        <div className="flex flex-col gap-2">
          <label
            className="flex cursor-pointer items-center gap-2 font-medium text-sm"
            htmlFor="select-all"
          >
            <Checkbox
              checked={allChecked}
              id="select-all"
              indeterminate={!allChecked && someChecked}
              onCheckedChange={(checked) => setSelected(checked ? items : [])}
            />
            Select all
          </label>
          {items.map((item) => (
            <label
              className="flex cursor-pointer items-center gap-2 text-sm"
              htmlFor={`option-${item}`}
              key={item}
            >
              <Checkbox
                checked={selected.includes(item)}
                id={`option-${item}`}
                onCheckedChange={(checked) =>
                  setSelected((prev) =>
                    checked
                      ? [...prev, item]
                      : prev.filter((value) => value !== item)
                  )
                }
              />
              {item}
            </label>
          ))}
        </div>
      );
    }

    return <CheckboxGroup />;
  },
};
