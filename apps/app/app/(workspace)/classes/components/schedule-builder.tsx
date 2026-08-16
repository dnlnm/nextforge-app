"use client";

import type { DayOfWeek } from "@repo/database";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/design-system/components/ui/alert-dialog";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxTrigger,
  ComboboxValue,
} from "@repo/design-system/components/ui/combobox";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Select,
  SelectButton,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { Switch } from "@repo/design-system/components/ui/switch";
import { cn } from "@repo/design-system/lib/utils";
import { SearchIcon } from "lucide-react";
import { useState } from "react";

export interface ScheduleEntry {
  readonly dayOfWeek: DayOfWeek | "";
  readonly endsAt: string;
  readonly id: string;
  readonly roomId: string;
  readonly startsAt: string;
}

interface RoomOption {
  readonly capacity: number | null;
  readonly id: string;
  readonly name: string;
}

interface ScheduleBuilderProperties {
  readonly classCapacity: number;
  readonly errors: Record<string, string>;
  readonly onSchedulesChange: (schedules: ScheduleEntry[]) => void;
  readonly rooms: RoomOption[];
  readonly schedules: ScheduleEntry[];
}

const dayOptions: ReadonlyArray<readonly [DayOfWeek, string]> = [
  ["MONDAY", "Monday"],
  ["TUESDAY", "Tuesday"],
  ["WEDNESDAY", "Wednesday"],
  ["THURSDAY", "Thursday"],
  ["FRIDAY", "Friday"],
  ["SATURDAY", "Saturday"],
  ["SUNDAY", "Sunday"],
];

const timeOptions = Array.from({ length: 96 }, (_, i) => {
  const hours = Math.floor(i / 4);
  const minutes = (i % 4) * 15;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
});

const timeIndex = (time: string) => timeOptions.indexOf(time);

const newScheduleId = () => crypto.randomUUID();

const getRoomCapacity = (rooms: RoomOption[], roomId: string): number | null =>
  rooms.find((room) => room.id === roomId)?.capacity ?? null;

const TimeCombobox = ({
  ariaLabel,
  items,
  onChange,
  value,
}: {
  ariaLabel: string;
  items: string[];
  onChange: (time: string) => void;
  value: string;
}) => (
  <Combobox
    autoHighlight
    items={items}
    onValueChange={(time) => {
      if (typeof time === "string") {
        onChange(time);
      }
    }}
    value={value}
  >
    <ComboboxTrigger
      aria-label={ariaLabel}
      render={<SelectButton className="w-27 tabular-nums" size="sm" />}
    >
      <ComboboxValue />
    </ComboboxTrigger>
    <ComboboxPopup aria-label={ariaLabel} className="min-w-44">
      <div className="border-b p-2">
        <ComboboxInput
          className="rounded-md before:rounded-[calc(var(--radius-md)-1px)]"
          placeholder="Search time"
          showTrigger={false}
          size="sm"
          startAddon={<SearchIcon />}
        />
      </div>
      <ComboboxEmpty>No times found.</ComboboxEmpty>
      <ComboboxList>
        {(time: string) => (
          <ComboboxItem key={time} value={time}>
            <span className="tabular-nums">{time}</span>
          </ComboboxItem>
        )}
      </ComboboxList>
    </ComboboxPopup>
  </Combobox>
);

export const ScheduleBuilder = ({
  classCapacity,
  errors,
  onSchedulesChange,
  rooms,
  schedules,
}: ScheduleBuilderProperties) => {
  const [pendingRoom, setPendingRoom] = useState<{
    day: DayOfWeek;
    roomId: string;
  } | null>(null);

  const sortByDay = (list: ScheduleEntry[]) =>
    [...list].sort((a, b) => {
      const indexA = dayOptions.findIndex(([value]) => value === a.dayOfWeek);
      const indexB = dayOptions.findIndex(([value]) => value === b.dayOfWeek);
      return indexA - indexB;
    });

  const toggleDay = (day: DayOfWeek, enabled: boolean) => {
    if (enabled) {
      const entry: ScheduleEntry = {
        dayOfWeek: day,
        endsAt: "17:00",
        id: newScheduleId(),
        roomId: "",
        startsAt: "09:00",
      };
      onSchedulesChange(sortByDay([...schedules, entry]));
    } else {
      onSchedulesChange(
        schedules.filter((schedule) => schedule.dayOfWeek !== day)
      );
    }
  };

  const updateSchedule = (day: DayOfWeek, patch: Partial<ScheduleEntry>) => {
    onSchedulesChange(
      schedules.map((schedule) =>
        schedule.dayOfWeek === day ? { ...schedule, ...patch } : schedule
      )
    );
  };

  const handleRoomSelect = (day: DayOfWeek, roomId: string) => {
    const capacity = getRoomCapacity(rooms, roomId);

    if (capacity !== null && classCapacity > 0 && classCapacity > capacity) {
      setPendingRoom({ day, roomId });
    } else {
      updateSchedule(day, { roomId });
    }
  };

  const confirmRoomSelection = () => {
    if (pendingRoom) {
      updateSchedule(pendingRoom.day, { roomId: pendingRoom.roomId });
    }

    setPendingRoom(null);
  };

  const cancelRoomSelection = () => {
    setPendingRoom(null);
  };

  const pendingRoomCapacity = pendingRoom
    ? getRoomCapacity(rooms, pendingRoom.roomId)
    : null;

  return (
    <div className="divide-y">
      {dayOptions.map(([day, label]) => {
        const entry = schedules.find((schedule) => schedule.dayOfWeek === day);
        const index = schedules.findIndex(
          (schedule) => schedule.dayOfWeek === day
        );
        const timeError = entry
          ? errors[`schedule_${index}_start`] ||
            errors[`schedule_${index}_end`] ||
            errors[`schedule_${index}_time`] ||
            undefined
          : undefined;
        const roomError = entry ? errors[`schedule_${index}_room`] : undefined;

        return (
          <div
            className="flex flex-col gap-4 py-3 first:pt-0 last:pb-0 md:flex-row md:flex-wrap md:items-start"
            key={day}
          >
            <Label className="flex h-8 w-30 shrink-0 items-center gap-2.5 sm:h-7">
              <Switch
                checked={Boolean(entry)}
                onCheckedChange={(checked) => toggleDay(day, checked)}
              />
              {label}
            </Label>
            <div className="flex w-full min-w-0 items-start gap-4 md:flex-1">
              {entry ? (
                <div className="flex w-full flex-wrap items-start gap-3 md:flex-nowrap md:items-center">
                  <div className="grid gap-1.5">
                    <div className="flex items-center gap-2">
                      <TimeCombobox
                        ariaLabel={`${label} start time`}
                        items={timeOptions}
                        onChange={(start) =>
                          updateSchedule(day, { startsAt: start })
                        }
                        value={entry.startsAt}
                      />
                      <span
                        aria-hidden="true"
                        className="text-muted-foreground"
                      >
                        –
                      </span>
                      <TimeCombobox
                        ariaLabel={`${label} end time`}
                        items={timeOptions.slice(timeIndex(entry.startsAt) + 1)}
                        onChange={(end) => updateSchedule(day, { endsAt: end })}
                        value={entry.endsAt}
                      />
                    </div>
                    {timeError ? (
                      <p className="text-destructive text-xs">{timeError}</p>
                    ) : null}
                  </div>
                  <div className="grid w-full min-w-0 flex-1 gap-1.5 md:w-auto">
                    <Select
                      onValueChange={(value) =>
                        handleRoomSelect(day, value ?? "")
                      }
                      value={entry.roomId || undefined}
                    >
                      <SelectTrigger
                        className={cn(
                          roomError &&
                            "border-destructive focus-visible:ring-destructive/50"
                        )}
                        id={`schedule-${entry.id}-room`}
                      >
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.name}
                            {room.capacity ? ` (max ${room.capacity})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {roomError ? (
                      <p className="text-destructive text-xs">{roomError}</p>
                    ) : null}
                  </div>
                </div>
              ) : (
                <p className="flex h-8 items-center text-muted-foreground sm:h-7 sm:text-sm">
                  Unavailable
                </p>
              )}
            </div>
          </div>
        );
      })}

      {pendingRoom ? (
        <AlertDialog
          onOpenChange={(open) => {
            if (!open) {
              cancelRoomSelection();
            }
          }}
          open={Boolean(pendingRoom)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Room capacity warning</AlertDialogTitle>
              <AlertDialogDescription>
                The selected room has a maximum capacity of{" "}
                {pendingRoomCapacity ?? "-"} students, but this class allows up
                to {classCapacity} students. Do you want to continue with this
                room?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogClose render={<Button variant="ghost" />}>
                Go back
              </AlertDialogClose>
              <AlertDialogClose
                onClick={confirmRoomSelection}
                render={<Button />}
              >
                Continue anyway
              </AlertDialogClose>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </div>
  );
};
