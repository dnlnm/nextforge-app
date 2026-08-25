"use client";

import { CheckIcon, ChevronsUpDownIcon, XIcon } from "lucide-react";
import * as React from "react";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/design-system/components/ui/command";
import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
} from "@repo/design-system/components/ui/popover";
import { cn } from "@repo/design-system/lib/utils";

export interface FacetedOption {
  label: string;
  value: string;
}

interface FacetedProps {
  value?: string | string[];
  options: FacetedOption[];
  onValueChange: (value: string | string[]) => void;
  placeholder?: string;
  emptyText?: string;
  multiple?: boolean;
  className?: string;
  triggerClassName?: string;
}

function SelectedBadges({
  options,
  value,
  placeholder,
  multiple,
}: {
  options: FacetedOption[];
  value: string[];
  placeholder?: string;
  multiple?: boolean;
}) {
  if (value.length === 0) {
    return <span className="text-muted-foreground">{placeholder}</span>;
  }

  if (!multiple && value.length === 1) {
    const selected = options.find((option) => option.value === value[0]);
    return <span>{selected?.label ?? value[0]}</span>;
  }

  const selected = options.filter((option) => value.includes(option.value));
  return (
    <span className="flex flex-wrap gap-1">
      {selected.map((option) => (
        <Badge key={option.value} variant="outline">
          {option.label}
        </Badge>
      ))}
    </span>
  );
}

export function Faceted({
  value,
  options,
  onValueChange,
  placeholder = "Select...",
  emptyText = "No options found.",
  multiple = false,
  className,
  triggerClassName,
}: FacetedProps) {
  const [open, setOpen] = React.useState(false);
  const selected = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : value !== undefined
          ? [value]
          : [],
    [value]
  );

  const toggleValue = (optionValue: string) => {
    if (multiple) {
      onValueChange(
        selected.includes(optionValue)
          ? selected.filter((item) => item !== optionValue)
          : [...selected, optionValue]
      );
    } else {
      onValueChange([optionValue]);
      setOpen(false);
    }
  };

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        render={
          <Button
            aria-label={placeholder}
            className={cn(
              "min-w-0 w-full justify-between gap-2 font-normal",
              triggerClassName
            )}
            size="sm"
            variant="outline"
          />
        }
      >
        <SelectedBadges
          multiple={multiple}
          options={options}
          placeholder={placeholder}
          value={selected}
        />
        <ChevronsUpDownIcon className="size-3.5 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverPopup className={cn("w-(--anchor-width) p-0", className)}>
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => toggleValue(option.value)}
                  value={option.value}
                >
                  <span className="truncate">{option.label}</span>
                  {selected.includes(option.value) ? (
                    <CheckIcon className="ml-auto size-4 shrink-0" />
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverPopup>
    </Popover>
  );
}

interface FacetedChipListProps {
  options: FacetedOption[];
  values: string[];
  onRemove: (value: string) => void;
}

export function FacetedChipList({
  options,
  values,
  onRemove,
}: FacetedChipListProps) {
  if (values.length === 0) {
    return null;
  }

  return (
    <span className="flex flex-wrap gap-1">
      {values.map((itemValue) => {
        const label =
          options.find((option) => option.value === itemValue)?.label ??
          itemValue;
        return (
          <span
            className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs"
            key={itemValue}
          >
            {label}
            <button
              aria-label={`Remove ${label}`}
              className="text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => onRemove(itemValue)}
              type="button"
            >
              <XIcon className="size-3" />
            </button>
          </span>
        );
      })}
    </span>
  );
}