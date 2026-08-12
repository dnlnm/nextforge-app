import {
  OTPField,
  OTPFieldInput,
  OTPFieldSeparator,
} from "@repo/design-system/components/ui/otp-field";
import type { Meta, StoryObj } from "@storybook/react";

/**
 * Accessible one-time password component with copy paste functionality.
 */
const meta = {
  title: "ui/OTPField",
  component: OTPField,
  tags: ["autodocs"],
  argTypes: {},
  args: {
    length: 6,
  },

  render: (args) => (
    <OTPField {...args}>
      <OTPFieldInput />
      <OTPFieldInput />
      <OTPFieldInput />
      <OTPFieldInput />
      <OTPFieldInput />
      <OTPFieldInput />
    </OTPField>
  ),
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof OTPField>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The default form of the OTP field.
 */
export const Default: Story = {};

/**
 * Use separators to split the input slots into groups.
 */
export const SeparatedGroup: Story = {
  render: (args) => (
    <OTPField {...args}>
      <OTPFieldInput />
      <OTPFieldInput />
      <OTPFieldInput />
      <OTPFieldSeparator />
      <OTPFieldInput />
      <OTPFieldInput />
      <OTPFieldInput />
    </OTPField>
  ),
};
