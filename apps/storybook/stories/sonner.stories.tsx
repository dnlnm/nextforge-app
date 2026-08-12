import { ToastProvider } from "@repo/design-system/components/ui/toast";
import { toastManager } from "@repo/design-system/components/ui/toast";
import type { Meta, StoryObj } from "@storybook/react";
import { action } from "storybook/actions";

/**
 * An opinionated toast component for React.
 */
const meta: Meta<typeof ToastProvider> = {
  title: "ui/Toast",
  component: ToastProvider,
  tags: ["autodocs"],
  argTypes: {},
  args: {
    position: "bottom-right",
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ToastProvider>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The default form of the toaster.
 */
export const Default: Story = {
  render: (args) => (
    <div className="flex min-h-96 items-center justify-center space-x-2">
      <button
        onClick={() =>
          toastManager.add({
            title: "Event has been created",
            description: new Date().toLocaleString(),
            actionProps: {
              children: "Undo",
              onClick: () => action("Undo clicked")(),
            },
          })
        }
        type="button"
      >
        Show Toast
      </button>
      <ToastProvider {...args} />
    </div>
  ),
};
