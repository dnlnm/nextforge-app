import { createTRPCRouter } from "../trpc";
import { accountRouter } from "./account";
import { attendanceRouter } from "./attendance";
import { classesRouter } from "./classes";
import { enrollmentsRouter } from "./enrollments";
import { organizationsRouter } from "./organizations";
import { studentsRouter } from "./students";
import { todayRouter } from "./today";

export const appRouter = createTRPCRouter({
  account: accountRouter,
  attendance: attendanceRouter,
  classes: classesRouter,
  enrollments: enrollmentsRouter,
  organizations: organizationsRouter,
  students: studentsRouter,
  today: todayRouter,
});

export type AppRouter = typeof appRouter;
