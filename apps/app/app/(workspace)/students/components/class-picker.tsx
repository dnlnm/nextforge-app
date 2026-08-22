"use client";

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
  PopoverContent,
  PopoverTrigger,
} from "@repo/design-system/components/ui/popover";
import { cn } from "@repo/design-system/lib/utils";
import { formatMoney } from "@repo/money";
import { CheckIcon, ChevronDownIcon, InfoIcon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";

export interface EnrollableClassOption {
  readonly activeEnrollmentCount: number;
  readonly capacity: number | null;
  readonly id: string;
  readonly levelId: string | null;
  readonly monthlyFeeSen: number;
  readonly name: string;
  readonly subjectName: string;
}

interface ClassPickerProperties {
  readonly classes: readonly EnrollableClassOption[];
  readonly currency: string;
  readonly error?: string;
  readonly levels: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
  }>;
  readonly onToggle: (classId: string) => void;
  readonly selectedIds: readonly string[];
}

const levelNameFor = (
  levels: ClassPickerProperties["levels"],
  levelId: string | null
) => levels.find((level) => level.id === levelId)?.name ?? "Other classes";

export const ClassPicker = ({
  classes,
  currency,
  error,
  levels,
  selectedIds,
  onToggle,
}: ClassPickerProperties) => {
  const [open, setOpen] = useState(false);
  const format = (amountSen: number) => formatMoney(amountSen, { currency });

  const grouped = useMemo(() => {
    const groups = new Map<
      string,
      Array<EnrollableClassOption & { isFull: boolean }>
    >();

    for (const learningClass of classes) {
      const key = levelNameFor(levels, learningClass.levelId);
      const isFull =
        learningClass.capacity !== null &&
        learningClass.activeEnrollmentCount >= learningClass.capacity &&
        !selectedIds.includes(learningClass.id);
      const current = groups.get(key) ?? [];

      current.push({ ...learningClass, isFull });
      groups.set(key, current);
    }

    return groups;
  }, [classes, levels, selectedIds]);

  const remaining = classes.filter(
    (learningClass) => !selectedIds.includes(learningClass.id)
  ).length;
  const selectedClasses = classes.filter((learningClass) =>
    selectedIds.includes(learningClass.id)
  );

  return (
    <div className="grid gap-3">
      {selectedClasses.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedClasses.map((learningClass) => (
            <Badge
              className="h-auto gap-2 py-1.5 pl-3"
              key={learningClass.id}
              variant="secondary"
            >
              <span className="grid text-left leading-tight">
                <span className="font-semibold text-xs">
                  {learningClass.subjectName}
                </span>
                <span className="text-[10px] text-primary">
                  {format(learningClass.monthlyFeeSen)}/mo
                </span>
              </span>
              <button
                aria-label={`Remove ${learningClass.name}`}
                className="ml-1 text-muted-foreground transition-colors hover:text-destructive"
                onClick={() => onToggle(learningClass.id)}
                type="button"
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}

      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger
          render={
            <Button
              aria-invalid={Boolean(error)}
              className={cn(
                "w-full justify-between font-normal",
                error && "border-destructive",
                open && "border-primary ring-2 ring-primary/30"
              )}
              type="button"
              variant="outline"
            />
          }
        >
          <span className="text-muted-foreground">
            {remaining > 0 ? "Add subject..." : "All subjects added"}
          </span>
          <ChevronDownIcon
            className={cn(
              "size-4 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 p-0">
          <Command>
            <CommandInput placeholder="Search subject or class..." />
            <CommandList>
              <CommandEmpty>No matching classes.</CommandEmpty>
              {[...grouped.entries()].map(([groupName, groupClasses]) => (
                <CommandGroup heading={groupName} key={groupName}>
                  {groupClasses.map((learningClass) => {
                    const isSelected = selectedIds.includes(learningClass.id);

                    return (
                      <CommandItem
                        className="gap-2"
                        disabled={learningClass.isFull}
                        key={learningClass.id}
                        onSelect={() => onToggle(learningClass.id)}
                        value={`${learningClass.subjectName} ${learningClass.name}`}
                      >
                        <CheckIcon
                          className={cn(
                            "size-4 shrink-0 text-primary",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="min-w-0 flex-1 truncate">
                          {learningClass.subjectName} · {learningClass.name}
                        </span>
                        <span className="shrink-0 text-muted-foreground text-xs">
                          {learningClass.isFull
                            ? "Full"
                            : `${format(learningClass.monthlyFeeSen)}/mo`}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {error ? (
        <p className="flex items-center gap-1 text-destructive text-xs">
          <InfoIcon className="size-3" />
          {error}
        </p>
      ) : null}
    </div>
  );
};
