"use client";

import { VanillaCheckbox as Checkbox } from "@repo/design-system/components/ui/checkbox-vanilla";
import { cn } from "@repo/design-system/lib/utils";
import { formatMoney } from "@repo/money";
import { InfoIcon } from "lucide-react";
import { useMemo } from "react";

export interface EnrollableClassOption {
  readonly activeEnrollmentCount: number;
  readonly capacity: number | null;
  readonly code: string;
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
  readonly filterLevelId?: string | null;
  readonly onToggle: (classId: string) => void;
  readonly selectedIds: readonly string[];
}

export const ClassPicker = ({
  classes,
  currency,
  error,
  filterLevelId,
  onToggle,
  selectedIds,
}: ClassPickerProperties) => {
  const format = (amountSen: number) => formatMoney(amountSen, { currency });

  const hasLevel = Boolean(filterLevelId);

  const visibleClasses = useMemo(
    () =>
      hasLevel
        ? classes.filter(
            (learningClass) => learningClass.levelId === filterLevelId
          )
        : [],
    [classes, filterLevelId, hasLevel]
  );

  const isFull = (learningClass: EnrollableClassOption) =>
    learningClass.capacity !== null &&
    learningClass.activeEnrollmentCount >= learningClass.capacity &&
    !selectedIds.includes(learningClass.id);

  const allSelected =
    visibleClasses.length > 0 &&
    visibleClasses.every((learningClass) =>
      selectedIds.includes(learningClass.id)
    );
  const someSelected = visibleClasses.some((learningClass) =>
    selectedIds.includes(learningClass.id)
  );

  const handleSelectAll = (checked: boolean) => {
    const targets = checked
      ? visibleClasses.filter(
          (learningClass) =>
            !selectedIds.includes(learningClass.id) && !isFull(learningClass)
        )
      : visibleClasses.filter((learningClass) =>
          selectedIds.includes(learningClass.id)
        );

    targets.forEach((learningClass) => onToggle(learningClass.id));
  };

  return (
    <div className="grid gap-2">
      {visibleClasses.length > 0 ? (
        <label className="flex cursor-pointer items-center gap-2 font-medium text-sm">
          <Checkbox
            checked={allSelected}
            indeterminate={!allSelected && someSelected}
            onCheckedChange={(checked) => handleSelectAll(checked === true)}
          />
          Select all subjects
        </label>
      ) : null}

      {!hasLevel ? (
        <p className="text-muted-foreground text-sm">
          Select a stage and level to choose subjects
        </p>
      ) : visibleClasses.length === 0 ? (
        <p className="text-muted-foreground text-sm">No available subjects</p>
      ) : (
        visibleClasses.map((learningClass) => {
          const full = isFull(learningClass);

          return (
            <div
              className={cn(
                "ms-4 flex items-stretch divide-x divide-border overflow-hidden rounded-lg border",
                full && "opacity-60"
              )}
              key={learningClass.id}
            >
              <span className="flex items-center py-1.5 pr-2 pl-3">
                <Checkbox
                  checked={selectedIds.includes(learningClass.id)}
                  disabled={full}
                  onCheckedChange={() => onToggle(learningClass.id)}
                />
              </span>
              <span className="self-center px-2 text-muted-foreground font-mono text-xs">
                {learningClass.code}
              </span>
              <span className="min-w-0 self-center px-2 text-sm font-medium">
                {learningClass.name}
              </span>
              <span className="self-center pr-3 pl-2 text-muted-foreground text-xs">
                {format(learningClass.monthlyFeeSen)}/mo
                {full ? " · Full" : ""}
              </span>
            </div>
          );
        })
      )}

      {error ? (
        <p className="flex items-center gap-1 text-destructive text-xs">
          <InfoIcon className="size-3" />
          {error}
        </p>
      ) : null}
    </div>
  );
};
