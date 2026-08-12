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
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { cn } from "@repo/design-system/lib/utils";
import { PlusIcon, Trash2Icon } from "lucide-react";
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

const newScheduleId = () => crypto.randomUUID();

const emptySchedule = (): ScheduleEntry => ({
  dayOfWeek: "",
  endsAt: "",
  id: newScheduleId(),
  roomId: "",
  startsAt: "",
});

const getRoomCapacity = (rooms: RoomOption[], roomId: string): number | null =>
  rooms.find((room) => room.id === roomId)?.capacity ?? null;

export const ScheduleBuilder = ({
  classCapacity,
  errors,
  onSchedulesChange,
  rooms,
  schedules,
}: ScheduleBuilderProperties) => {
  const [pendingRoom, setPendingRoom] = useState<{
    scheduleId: string;
    roomId: string;
  } | null>(null);

  const updateSchedule = (
    scheduleId: string,
    patch: Partial<ScheduleEntry>
  ) => {
    onSchedulesChange(
      schedules.map((schedule) =>
        schedule.id === scheduleId ? { ...schedule, ...patch } : schedule
      )
    );
  };

  const addSchedule = () => {
    onSchedulesChange([...schedules, emptySchedule()]);
  };

  const removeSchedule = (scheduleId: string) => {
    if (schedules.length <= 1) {
      return;
    }

    onSchedulesChange(
      schedules.filter((schedule) => schedule.id !== scheduleId)
    );
  };

  const usedDays = new Set(
    schedules
      .map((schedule) => schedule.dayOfWeek)
      .filter((day): day is DayOfWeek => Boolean(day))
  );

  const handleRoomSelect = (scheduleId: string, roomId: string) => {
    const capacity = getRoomCapacity(rooms, roomId);

    if (capacity !== null && classCapacity > 0 && classCapacity > capacity) {
      setPendingRoom({ roomId, scheduleId });
    } else {
      updateSchedule(scheduleId, { roomId });
    }
  };

  const confirmRoomSelection = () => {
    if (pendingRoom) {
      updateSchedule(pendingRoom.scheduleId, { roomId: pendingRoom.roomId });
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
    <div className="grid gap-3">
      {schedules.map((schedule, index) => {
        const availableDays = dayOptions.filter(
          ([value]) => value === schedule.dayOfWeek || !usedDays.has(value)
        );

        return (
          <div
            className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1.2fr_1fr_1fr_1.2fr_auto]"
            key={schedule.id}
          >
            <div className="grid gap-1.5">
              <Label htmlFor={`schedule-${schedule.id}-day`}>
                Day {index + 1}
              </Label>
              <Select
                onValueChange={(value) =>
                  updateSchedule(schedule.id, {
                    dayOfWeek: value as DayOfWeek,
                  })
                }
                value={schedule.dayOfWeek || undefined}
              >
                <SelectTrigger
                  className={cn(
                    Boolean(errors[`schedule_${index}_day`]) &&
                      "border-destructive focus-visible:ring-destructive/50"
                  )}
                  id={`schedule-${schedule.id}-day`}
                >
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {availableDays.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`schedule-${schedule.id}-start`}>
                Start time
              </Label>
              <Input
                id={`schedule-${schedule.id}-start`}
                onChange={(event) =>
                  updateSchedule(schedule.id, {
                    startsAt: event.target.value,
                  })
                }
                type="time"
                value={schedule.startsAt}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`schedule-${schedule.id}-end`}>End time</Label>
              <Input
                id={`schedule-${schedule.id}-end`}
                onChange={(event) =>
                  updateSchedule(schedule.id, { endsAt: event.target.value })
                }
                type="time"
                value={schedule.endsAt}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`schedule-${schedule.id}-room`}>Room</Label>
              <Select
                onValueChange={(value) =>
                  handleRoomSelect(schedule.id, value ?? "")
                }
                value={schedule.roomId || undefined}
              >
                <SelectTrigger
                  className={cn(
                    Boolean(errors[`schedule_${index}_room`]) &&
                      "border-destructive focus-visible:ring-destructive/50"
                  )}
                  id={`schedule-${schedule.id}-room`}
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
            </div>
            <div className="flex items-end">
              <Button
                aria-label="Remove schedule"
                disabled={schedules.length <= 1}
                onClick={() => removeSchedule(schedule.id)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          </div>
        );
      })}

      <Button
        disabled={schedules.length >= dayOptions.length}
        onClick={addSchedule}
        type="button"
        variant="outline"
      >
        <PlusIcon className="size-4" />
        Add Another Schedule
      </Button>

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
                render={<Button />}
                onClick={confirmRoomSelection}
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
