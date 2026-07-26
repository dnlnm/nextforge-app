import type { DayOfWeek } from "@repo/database";

export const getMalaysiaDateParts = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Kuala_Lumpur",
    weekday: "long",
    year: "numeric",
  }).formatToParts(new Date());
  const getPart = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    date: new Date(
      `${getPart("year")}-${getPart("month")}-${getPart("day")}T00:00:00.000Z`
    ),
    dayOfWeek: getPart("weekday").toUpperCase() as DayOfWeek,
  };
};
