"use client";

import {
  Stat,
  StatDescription,
  StatFooter,
  StatIndicator,
  StatLabel,
  StatPanel,
  StatValue,
} from "@repo/design-system/components/ui/stat";
import { DoorOpenIcon, ClockIcon, AlertTriangleIcon, BarChart3Icon } from "lucide-react";

interface RoomStatsProps {
  readonly totalRooms: number;
  readonly totalSeats: number;
  readonly weeklyHours: number;
  readonly overflowCount: number;
}

export const RoomStats = ({ totalRooms, totalSeats, weeklyHours, overflowCount }: RoomStatsProps) => (
  <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <Stat>
      <StatPanel>
        <StatLabel>Active rooms</StatLabel>
        <StatIndicator color="info" variant="icon"><DoorOpenIcon /></StatIndicator>
        <StatValue>{totalRooms}</StatValue>
      </StatPanel>
      <StatFooter><StatDescription>{totalSeats} total seats</StatDescription></StatFooter>
    </Stat>
    <Stat>
      <StatPanel>
        <StatLabel>Total seats</StatLabel>
        <StatIndicator color="success" variant="icon"><BarChart3Icon /></StatIndicator>
        <StatValue>{totalSeats}</StatValue>
      </StatPanel>
      <StatFooter><StatDescription>Across {totalRooms} rooms</StatDescription></StatFooter>
    </Stat>
    <Stat>
      <StatPanel>
        <StatLabel>Weekly hours</StatLabel>
        <StatIndicator color="default" variant="icon"><ClockIcon /></StatIndicator>
        <StatValue>{weeklyHours}h</StatValue>
      </StatPanel>
      <StatFooter><StatDescription>Scheduled time / week</StatDescription></StatFooter>
    </Stat>
    <Stat>
      <StatPanel>
        <StatLabel>Capacity alerts</StatLabel>
        <StatIndicator color={overflowCount ? "warning" : "success"} variant="icon"><AlertTriangleIcon /></StatIndicator>
        <StatValue>{overflowCount}</StatValue>
      </StatPanel>
      <StatFooter><StatDescription>{overflowCount ? "Rooms over capacity" : "No overflows"}</StatDescription></StatFooter>
    </Stat>
  </section>
);
