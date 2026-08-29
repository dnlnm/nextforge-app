import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuShortcut,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
} from "@repo/design-system/components/ui/menu";
import type { Meta, StoryObj } from "@storybook/react";
import { Mail, Plus, PlusCircle, Search, UserPlus } from "lucide-react";

/**
 * Displays a menu to the user — such as a set of actions or functions —
 * triggered by a button.
 */
const meta = {
  title: "ui/Menu",
  component: Menu,
  tags: ["autodocs"],
  argTypes: {},
  render: (args) => (
    <Menu {...args}>
      <MenuTrigger>Open</MenuTrigger>
      <MenuContent className="w-44">
        <MenuGroup>
          <MenuLabel>My Account</MenuLabel>
        </MenuGroup>
        <MenuSeparator />
        <MenuItem>Profile</MenuItem>
        <MenuItem>Billing</MenuItem>
        <MenuItem>Team</MenuItem>
        <MenuItem>Subscription</MenuItem>
      </MenuContent>
    </Menu>
  ),
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Menu>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The default form of the menu.
 */
export const Default: Story = {};

/**
 * A menu with shortcuts.
 */
export const WithShortcuts: Story = {
  render: (args) => (
    <Menu {...args}>
      <MenuTrigger>Open</MenuTrigger>
      <MenuContent className="w-44">
        <MenuGroup>
          <MenuLabel>Controls</MenuLabel>
        </MenuGroup>
        <MenuItem>
          Back
          <MenuShortcut>⌘[</MenuShortcut>
        </MenuItem>
        <MenuItem disabled>
          Forward
          <MenuShortcut>⌘]</MenuShortcut>
        </MenuItem>
      </MenuContent>
    </Menu>
  ),
};

/**
 * A menu with submenus.
 */
export const WithSubmenus: Story = {
  render: (args) => (
    <Menu {...args}>
      <MenuTrigger>Open</MenuTrigger>
      <MenuContent className="w-44">
        <MenuItem>
          <Search className="mr-2 size-4" />
          <span>Search</span>
        </MenuItem>
        <MenuSeparator />
        <MenuGroup>
          <MenuItem>
            <Plus className="mr-2 size-4" />
            <span>New Team</span>
            <MenuShortcut>⌘+T</MenuShortcut>
          </MenuItem>
          <MenuSub>
            <MenuSubTrigger>
              <UserPlus className="mr-2 size-4" />
              <span>Invite users</span>
            </MenuSubTrigger>
            <MenuSubContent>
              <MenuItem>
                <Mail className="mr-2 size-4" />
                <span>Email</span>
              </MenuItem>
              <MenuSeparator />
              <MenuItem>
                <PlusCircle className="mr-2 size-4" />
                <span>More...</span>
              </MenuItem>
            </MenuSubContent>
          </MenuSub>
        </MenuGroup>
      </MenuContent>
    </Menu>
  ),
};

/**
 * A menu with radio items.
 */
export const WithRadioItems: Story = {
  render: (args) => (
    <Menu {...args}>
      <MenuTrigger>Open</MenuTrigger>
      <MenuContent className="w-44">
        <MenuRadioGroup value="warning">
          <MenuLabel inset>Status</MenuLabel>
          <MenuRadioItem value="info">Info</MenuRadioItem>
          <MenuRadioItem value="warning">Warning</MenuRadioItem>
          <MenuRadioItem value="error">Error</MenuRadioItem>
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  ),
};

/**
 * A menu with checkboxes.
 */
export const WithCheckboxes: Story = {
  render: (args) => (
    <Menu {...args}>
      <MenuTrigger>Open</MenuTrigger>
      <MenuContent className="w-44">
        <MenuCheckboxItem checked>
          Autosave
          <MenuShortcut>⌘S</MenuShortcut>
        </MenuCheckboxItem>
        <MenuCheckboxItem>Show Comments</MenuCheckboxItem>
      </MenuContent>
    </Menu>
  ),
};