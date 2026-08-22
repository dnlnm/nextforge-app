"use client";

import { formatMoney } from "@repo/money";
import { ClockIcon, MailIcon, PhoneIcon, UserRoundIcon } from "lucide-react";
import type { ReactNode } from "react";
import { StudentAvatar } from "../../components/student-avatar";

interface CreateProfilePreviewProperties {
  readonly currency: string;
  readonly enrolledSubjects: ReadonlyArray<{
    readonly feeSen: number;
    readonly name: string;
  }>;
  readonly gender: string;
  readonly genderLabel: string;
  readonly gradeLabel: string;
  readonly guardianEmail: string;
  readonly guardianName: string;
  readonly guardianPhone: string;
  readonly nextCode: string;
  readonly photoUrl: string | null;
  readonly schoolName: string;
  readonly startsOnLabel: string;
  readonly studentName: string;
  readonly totalSen: number;
}

const SidebarLabel = ({ children }: { readonly children: ReactNode }) => (
  <p className="font-semibold text-muted-foreground text-xs uppercase tracking-widest">
    {children}
  </p>
);

const ProfileCard = ({ children }: { readonly children: ReactNode }) => (
  <div className="overflow-hidden rounded-xl border border-border bg-card">
    {children}
  </div>
);

const SummaryRow = ({
  children,
  icon,
}: {
  readonly children: ReactNode;
  readonly icon: ReactNode;
}) => (
  <div className="flex items-center gap-2 text-sm">
    <span className="shrink-0 text-muted-foreground">{icon}</span>
    <span className="min-w-0 truncate">{children}</span>
  </div>
);

const GuardianSummaryCard = ({
  guardianEmail,
  guardianName,
  guardianPhone,
}: Pick<
  CreateProfilePreviewProperties,
  "guardianEmail" | "guardianName" | "guardianPhone"
>) => (
  <ProfileCard>
    <div className="grid gap-3 p-4">
      <SidebarLabel>Parent/Guardian</SidebarLabel>
      <div className="grid gap-2">
        {guardianName ? (
          <SummaryRow icon={<UserRoundIcon className="size-3.5" />}>
            {guardianName}
          </SummaryRow>
        ) : null}
        {guardianPhone ? (
          <SummaryRow icon={<PhoneIcon className="size-3.5" />}>
            +60 {guardianPhone}
          </SummaryRow>
        ) : null}
        {guardianEmail ? (
          <SummaryRow icon={<MailIcon className="size-3.5" />}>
            {guardianEmail}
          </SummaryRow>
        ) : null}
      </div>
    </div>
  </ProfileCard>
);

const EnrollmentSummaryCard = ({
  currency,
  enrolledSubjects,
  startsOnLabel,
  totalSen,
}: Pick<
  CreateProfilePreviewProperties,
  "currency" | "enrolledSubjects" | "startsOnLabel" | "totalSen"
>) => (
  <ProfileCard>
    <div className="grid gap-3 p-4">
      <SidebarLabel>Enrollment</SidebarLabel>
      <div className="grid gap-2">
        {enrolledSubjects.map((subject) => (
          <div
            className="flex items-center justify-between gap-2"
            key={subject.name}
          >
            <span className="truncate text-xs">{subject.name}</span>
            <span className="shrink-0 font-semibold text-primary text-xs">
              {formatMoney(subject.feeSen, { currency })}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-2 border-border border-t pt-2">
          <span className="font-bold text-xs">Monthly total</span>
          <span className="font-bold text-primary text-sm">
            {formatMoney(totalSen, { currency })}
          </span>
        </div>
        {startsOnLabel ? (
          <div className="flex items-center gap-1.5 border-border border-t pt-1.5">
            <ClockIcon className="size-3 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground text-xs">
              Starts {startsOnLabel}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  </ProfileCard>
);

const nameClassName = (studentName: string) =>
  studentName
    ? "font-bold leading-tight"
    : "font-medium text-muted-foreground italic leading-tight";

export const CreateProfilePreview = ({
  currency,
  enrolledSubjects,
  gender,
  genderLabel,
  gradeLabel,
  guardianEmail,
  guardianName,
  guardianPhone,
  nextCode,
  photoUrl,
  schoolName,
  startsOnLabel,
  studentName,
  totalSen,
}: CreateProfilePreviewProperties) => {
  return (
    <div className="grid content-start gap-4">
      <SidebarLabel>Profile Preview</SidebarLabel>

      <ProfileCard>
        <div className="relative h-16 bg-gradient-to-r from-primary to-primary/70">
          <div className="absolute -bottom-8 left-5">
            <div className="relative">
              <StudentAvatar
                className="size-20"
                gender={gender || null}
                name={studentName || "Student"}
                photoUrl={photoUrl}
              />
              {gradeLabel ? (
                <span className="absolute -right-1.5 -bottom-1.5 rounded-full bg-primary px-1.5 py-0.5 font-bold text-[10px] text-primary-foreground">
                  {gradeLabel}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="px-5 pt-12 pb-5">
          <p className={nameClassName(studentName)}>
            {studentName || "Student name"}
          </p>
          <p className="font-mono text-muted-foreground text-xs">
            {nextCode}
          </p>
          {gradeLabel ? (
            <p className="mt-0.5 font-medium text-primary text-sm">
              {gradeLabel}
            </p>
          ) : null}
          {schoolName ? (
            <p className="mt-0.5 text-muted-foreground text-xs">{schoolName}</p>
          ) : null}
          {genderLabel ? (
            <p className="mt-0.5 text-muted-foreground text-xs">
              {genderLabel}
            </p>
          ) : null}
        </div>
      </ProfileCard>

      {guardianName || guardianPhone || guardianEmail ? (
        <GuardianSummaryCard
          guardianEmail={guardianEmail}
          guardianName={guardianName}
          guardianPhone={guardianPhone}
        />
      ) : null}

      {enrolledSubjects.length > 0 ? (
        <EnrollmentSummaryCard
          currency={currency}
          enrolledSubjects={enrolledSubjects}
          startsOnLabel={startsOnLabel}
          totalSen={totalSen}
        />
      ) : null}

      <div className="rounded-xl border border-primary/10 bg-secondary/40 p-4">
        <p className="mb-2 font-semibold text-primary text-xs">Quick Tips</p>
        <ul className="grid gap-1.5 text-muted-foreground text-xs">
          {[
            "Enter the IC number to auto-fill DOB and gender.",
            "Select a grade first, then pick subjects from the list.",
            "You can add up to 3 parent/guardian contacts.",
          ].map((tip) => (
            <li className="flex gap-2" key={tip}>
              <span className="shrink-0 text-primary">·</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
