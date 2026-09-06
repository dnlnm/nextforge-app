"use client";

import { ChevronsUpDownIcon, XIcon } from "lucide-react";
import * as React from "react";
import { Badge } from "@repo/design-system/components/ui/fluid-badge";
import { Button } from "@repo/design-system/components/ui/fluid-button";
import {
  CheckboxGroup,
  CheckboxItem,
} from "@repo/design-system/components/ui/fluid-checkbox-group";
import { InputField, InputGroup } from "@repo/design-system/components/ui/fluid-input-group";
import {
  FluidPopover,
  FluidPopoverContent,
  FluidPopoverTrigger,
} from "@repo/design-system/components/ui/fluid-popover";
import { ScrollArea } from "@repo/design-system/components/ui/fluid-scroll-area";
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
        <Badge key={option.value} size="compact" variant="solid" color="gray">
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
  const [search, setSearch] = React.useState("");
  const selected = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : value !== undefined
          ? [value]
          : [],
    [value]
  );

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(query)
    );
  }, [options, search]);

  // CheckboxGroup is index-based: keep indices into the FULL option list so
  // they stay stable while search filters the visible rows.
  const checkedIndices = React.useMemo(() => {
    const indices = new Set<number>();
    options.forEach((option, index) => {
      if (selected.includes(option.value)) indices.add(index);
    });
    return indices;
  }, [options, selected]);

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
    <FluidPopover onOpenChange={setOpen} open={open}>
      <FluidPopoverTrigger
        render={
          <Button
            aria-label={placeholder}
            className={cn(
              "min-w-0 w-full justify-between gap-2 font-normal",
              triggerClassName
            )}
            size="compact"
            variant="tertiary"
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
      </FluidPopoverTrigger>
      <FluidPopoverContent className={cn("w-(--anchor-width) p-2", className)}>
        <InputGroup className="w-full">
          <InputField
            index={0}
            label="Search options"
            labelHidden
            onChange={setSearch}
            placeholder="Search..."
            value={search}
          />
        </InputGroup>
        {filtered.length === 0 ? (
          <p className="px-2 py-4 text-center text-muted-foreground text-sm">
            {emptyText}
          </p>
        ) : (
          <ScrollArea className="max-h-[240px]" viewportClassName="scroll-fade">
            <CheckboxGroup checkedIndices={checkedIndices}>
              {filtered.map((option) => {
                const index = options.findIndex(
                  (candidate) => candidate.value === option.value
                );
                return (
                  <CheckboxItem
                    checked={selected.includes(option.value)}
                    index={index}
                    key={option.value}
                    label={option.label}
                    onToggle={() => toggleValue(option.value)}
                  />
                );
              })}
            </CheckboxGroup>
          </ScrollArea>
        )}
      </FluidPopoverContent>
    </FluidPopover>
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
