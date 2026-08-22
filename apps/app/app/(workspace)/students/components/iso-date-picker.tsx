"use client";

import { parseLocalCalendarDate } from "@repo/date";
import { Button } from "@repo/design-system/components/ui/button";
import { Calendar } from "@repo/design-system/components/ui/calendar";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from "@repo/design-system/components/ui/combobox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/design-system/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

const isoFromDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

interface CalendarDropdownItem {
  readonly disabled?: boolean;
  readonly label: string;
  readonly value: string;
}

interface CalendarDropdownProps {
  readonly "aria-label"?: string;
  readonly onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  readonly options?: ReadonlyArray<{
    readonly disabled?: boolean;
    readonly label: string;
    readonly value: number | string;
  }>;
  readonly value?: number | string | readonly string[];
}

/**
 * Month/year dropdown for the calendar caption, rendered as a coss Combobox
 * (adapted from the coss p-date-picker-3 particle).
 */
const CalendarDropdown = (props: CalendarDropdownProps) => {
  const { "aria-label": ariaLabel, onChange, options, value } = props;
  const items: CalendarDropdownItem[] =
    options?.map((option) => ({
      disabled: option.disabled,
      label: option.label,
      value: option.value.toString(),
    })) ?? [];
  const selectedItem = items.find((item) => item.value === value?.toString());

  return (
    <Combobox
      aria-label={ariaLabel}
      autoHighlight
      items={items}
      onValueChange={(newValue) => {
        if (onChange && newValue) {
          onChange({
            target: { value: newValue.value },
          } as React.ChangeEvent<HTMLSelectElement>);
        }
      }}
      value={selectedItem}
    >
      <ComboboxInput
        className="**:[input]:w-0 **:[input]:flex-1"
        onFocus={(event) => event.currentTarget.select()}
      />
      <ComboboxPopup aria-label={ariaLabel}>
        <ComboboxEmpty>No items found.</ComboboxEmpty>
        <ComboboxList>
          {(item: CalendarDropdownItem) => (
            <ComboboxItem
              disabled={item.disabled}
              key={item.value}
              value={item}
            >
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  );
};

export const IsoDatePicker = ({
  endMonth,
  name,
  onCancel,
  onChange,
  placeholder = "Select date",
  startMonth,
  toDisplay = (selected: Date) => isoFromDate(selected),
  value,
}: {
  readonly endMonth?: Date;
  readonly name?: string;
  /** Called when Escape is pressed while the trigger is focused. */
  readonly onCancel?: () => void;
  readonly onChange: (iso: string) => void;
  readonly placeholder?: string;
  readonly startMonth?: Date;
  readonly toDisplay?: (selected: Date) => string;
  readonly value: string;
}) => {
  const [open, setOpen] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const selected = parseLocalCalendarDate(localValue);

  return (
    <div>
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger
          render={
            <Button
              className="w-full justify-start text-left font-normal"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  onCancel?.();
                }
              }}
              type="button"
              variant="outline"
            />
          }
        >
          <CalendarIcon className="size-4 text-muted-foreground" />
          <span className="min-w-0 truncate">
            {selected ? toDisplay(selected) : placeholder}
          </span>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            captionLayout="dropdown"
            components={{ Dropdown: CalendarDropdown }}
            defaultMonth={selected}
            endMonth={endMonth}
            mode="single"
            onSelect={(day) => {
              if (day) {
                const iso = isoFromDate(day);
                setLocalValue(iso);
                onChange(iso);
                setOpen(false);
              }
            }}
            selected={selected ?? undefined}
            startMonth={startMonth}
          />
        </PopoverContent>
      </Popover>
      {name ? <input name={name} type="hidden" value={localValue} /> : null}
    </div>
  );
};
