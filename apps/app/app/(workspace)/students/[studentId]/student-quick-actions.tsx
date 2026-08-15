"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { ArrowLeftRightIcon, PrinterIcon, UserPlusIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  type EnrollableClass,
  EnrollStudentDialog,
} from "./enroll-student-dialog";
import {
  type ActiveEnrollmentOption,
  TransferStudentDialog,
} from "./transfer-student-dialog";

export const StudentQuickActions = ({
  activeEnrollments,
  classes,
  currency,
  studentId,
}: {
  readonly activeEnrollments: ActiveEnrollmentOption[];
  readonly classes: EnrollableClass[];
  readonly currency: string;
  readonly studentId: string;
}) => {
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const hasActiveEnrollment = activeEnrollments.length > 0;

  return (
    <>
      <div className="grid gap-2 sm:grid-cols-3">
        <Button onClick={() => setIsEnrollOpen(true)}>
          <UserPlusIcon className="size-4" />
          Enroll
        </Button>
        <Button
          disabled={!hasActiveEnrollment}
          onClick={() => setIsTransferOpen(true)}
          variant="outline"
        >
          <ArrowLeftRightIcon className="size-4" />
          Transfer
        </Button>
        <Button
          variant="outline"
          render={<Link href={`/students/${studentId}/print`} />}
        >
          <PrinterIcon className="size-4" />
          Print profile
        </Button>
      </div>
      <EnrollStudentDialog
        classes={classes}
        currency={currency}
        onOpenChange={setIsEnrollOpen}
        open={isEnrollOpen}
        studentId={studentId}
      />
      <TransferStudentDialog
        activeEnrollments={activeEnrollments}
        classes={classes}
        onOpenChange={setIsTransferOpen}
        open={isTransferOpen}
      />
    </>
  );
};
