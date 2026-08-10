import { createTRPCRouter } from "../trpc";
import { attendanceRouter } from "./attendance";
import { organizationsRouter } from "./organizations";
import { studentsRouter } from "./students";
import { todayRouter } from "./today";

export const appRouter = createTRPCRouter({
  attendance: attendanceRouter,
  organizations: organizationsRouter,
  students: studentsRouter,
  today: todayRouter,
});

export type AppRouter = typeof appRouter;
