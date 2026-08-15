import type { SubscriptionPlan } from "@repo/database";
import {
  differenceInMalaysiaCalendarDays,
  formatMediumDate,
} from "@repo/date";

export const paidPlanRank: Record<SubscriptionPlan, number> = {
  PRO: 2,
  STARTER: 1,
  TRIAL: 0,
};

export const formatDate = (date?: Date | null) =>
  date ? formatMediumDate(date) : "-";

export const daysUntil = (date?: Date | null, now = new Date()) => {
  if (!date) {
    return null;
  }

  return differenceInMalaysiaCalendarDays(date, now);
};

export const getUsagePercentage = (value: number, limit: number) => {
  return Math.round((value / limit) * 100);
};

export const getUsageStatus = (percentage: number) => {
  if (percentage >= 90) {
    return "danger";
  }
  if (percentage >= 70) {
    return "warning";
  }
  return "safe";
};

export const getProgressClasses = (percentage: number) => {
  if (percentage >= 90) {
    return "bg-red-500/20 [&>div]:bg-red-500";
  }
  if (percentage >= 70) {
    return "bg-yellow-500/20 [&>div]:bg-yellow-500";
  }
  return "bg-green-500/20 [&>div]:bg-green-500";
};

export const getUsageTextColor = (percentage: number) => {
  if (percentage >= 90) {
    return "text-red-600 dark:text-red-400 font-semibold";
  }
  if (percentage >= 70) {
    return "text-yellow-600 dark:text-yellow-400 font-medium";
  }
  return "text-muted-foreground";
};
