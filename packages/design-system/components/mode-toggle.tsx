"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "../components/ui/button";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "../components/ui/menu";

const themes = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
];

export const ModeToggle = () => {
  const { setTheme } = useTheme();

  return (
<Menu>
      <MenuTrigger
        render={
          <Button
            className="relative size-9 shrink-0 text-foreground"
            size="icon"
            variant="ghost"
          />
        }
      >
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </MenuTrigger>
      <MenuContent>
        {themes.map(({ label, value }) => (
          <MenuItem key={value} onClick={() => setTheme(value)}>
            {label}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
};
