"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/design-system/components/ui/avatar";
import { Button } from "@repo/design-system/components/ui/button";
import { Checkbox } from "@repo/design-system/components/ui/checkbox";
import { Input } from "@repo/design-system/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@repo/design-system/components/ui/input-group";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { toastManager } from "@repo/design-system/components/ui/toast";
import { cn } from "@repo/design-system/lib/utils";
import {
  optimizeImageFile,
  privateFileUrl,
  uploadToR2,
} from "@repo/storage/client";
import {
  BriefcaseIcon,
  CameraIcon,
  CheckIcon,
  GraduationCapIcon,
  Loader2Icon,
  MailIcon,
  PhoneIcon,
  UserRoundIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { PreviewCard } from "@repo/design-system/components/preview-card";
import { createTeacher } from "../actions";

interface TeacherCreateFormProperties {
  readonly nextCode: string;
}

const GENDER_OPTIONS: ReadonlyArray<{ label: string; value: string }> = [
  { label: "Female", value: "FEMALE" },
  { label: "Male", value: "MALE" },
  { label: "Prefer not to say", value: "OTHER" },
];

const QUALIFICATION_OPTIONS: ReadonlyArray<{ label: string; value: string }> = [
  { label: "Diploma", value: "DIPLOMA" },
  { label: "Degree", value: "DEGREE" },
  { label: "Masters", value: "MASTERS" },
  { label: "PhD", value: "PHD" },
];

const EMPLOYMENT_OPTIONS: ReadonlyArray<{ label: string; value: string }> = [
  { label: "Full-time", value: "FULL_TIME" },
  { label: "Part-time", value: "PART_TIME" },
  { label: "Freelance", value: "FREELANCE" },
];

const maxPhotoSizeBytes = 2 * 1024 * 1024;

const FieldLabel = ({
  children,
  htmlFor,
  required,
}: {
  readonly children: React.ReactNode;
  readonly htmlFor?: string;
  readonly required?: boolean;
}) => (
  <Label htmlFor={htmlFor}>
    {children}
    {required ? <span className="text-destructive text-xs"> *</span> : null}
  </Label>
);

const SummaryRow = ({
  children,
  icon,
}: {
  readonly children: React.ReactNode;
  readonly icon: React.ReactNode;
}) => (
  <div className="flex items-center gap-2 text-sm">
    <span className="shrink-0 text-muted-foreground">{icon}</span>
    <span className="min-w-0 truncate">{children}</span>
  </div>
);

const PhotoUploadTile = ({
  onPreviewUrlChange,
}: {
  readonly onPreviewUrlChange: (url: string | null) => void;
}) => {
  const [photoKey, setPhotoKey] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    },
    [previewUrl]
  );

  useEffect(() => {
    onPreviewUrlChange(
      previewUrl ?? (photoKey ? privateFileUrl(photoKey) : null)
    );
  }, [onPreviewUrlChange, photoKey, previewUrl]);

  const handleFileChange = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Photo must be an image.");
      return;
    }

    if (file.size > maxPhotoSizeBytes) {
      setError("Photo must be 2MB or smaller.");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const optimized = await optimizeImageFile(file, {
        fileType: "image/webp",
        maxWidthOrHeight: 512,
        maxSizeMB: 0.5,
      });

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const nextPreview = URL.createObjectURL(optimized);
      setPreviewUrl(nextPreview);

      const { key } = await uploadToR2(optimized, "/api/uploads/teacher-photo");
      setPhotoKey(key);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed"
      );
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const hasPhoto = Boolean(previewUrl || photoKey);

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(null);
    setPhotoKey("");
    setError(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="flex shrink-0 flex-col items-center gap-2">
      <div className="relative">
        <button
          aria-label="Upload teacher photo"
          className={cn(
            "group relative flex size-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed bg-muted transition-all hover:border-primary/50 hover:bg-primary/5",
            isUploading && "opacity-60"
          )}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {previewUrl ? (
            <Avatar className="size-full">
              <AvatarImage alt="" src={previewUrl} />
              <AvatarFallback>
                <CameraIcon className="size-5 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
          ) : (
            <CameraIcon className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
          )}
        </button>
        {hasPhoto ? (
          <button
            aria-label="Remove photo"
            className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-sm transition-colors hover:border-destructive/50 hover:bg-destructive hover:text-destructive-foreground"
            onClick={handleRemove}
            type="button"
          >
            <XIcon className="size-3.5" />
          </button>
        ) : null}
      </div>
      <p className="text-center text-[10px] text-muted-foreground leading-tight">
        Photo
        <br />
        (optional)
      </p>
      <input
        accept="image/*"
        className="hidden"
        onChange={(event) => handleFileChange(event.target.files?.[0])}
        ref={inputRef}
        type="file"
      />
      <input name="photoKey" type="hidden" value={photoKey} />
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  );
};

export const TeacherCreateForm = ({
  nextCode,
}: TeacherCreateFormProperties) => {
  const [state, formAction, isPending] = useActionState(
    async (_previous: { error?: string }, formData: FormData) =>
      createTeacher(formData),
    {}
  );
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [icNumber, setIcNumber] = useState("");
  const [gender, setGender] = useState("");
  const [qualification, setQualification] = useState("");
  const [employmentType, setEmploymentType] = useState("FULL_TIME");
  const [hourlyRate, setHourlyRate] = useState("");
  const [salary, setSalary] = useState("");
  const [sendInvite, setSendInvite] = useState(true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (state.error) {
      toastManager.add({ title: state.error, type: "error" });
    }
  }, [state.error]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const findLabel = (
    options: ReadonlyArray<{ label: string; value: string }>,
    value: string
  ) => options.find((option) => option.value === value)?.label ?? "";
  const genderLabel = findLabel(GENDER_OPTIONS, gender);
  const qualificationLabel = findLabel(QUALIFICATION_OPTIONS, qualification);
  const employmentLabel = findLabel(EMPLOYMENT_OPTIONS, employmentType);

  const summaryRows: Array<{
    readonly icon: React.ReactNode;
    readonly label: string;
  }> = [];
  const pushRow = (icon: React.ReactNode, label: string) => {
    if (label) {
      summaryRows.push({ icon, label });
    }
  };
  pushRow(<UserRoundIcon className="size-3.5" />, genderLabel);
  pushRow(<GraduationCapIcon className="size-3.5" />, qualificationLabel);
  pushRow(<BriefcaseIcon className="size-3.5" />, employmentLabel);
  pushRow(<PhoneIcon className="size-3.5" />, phone ? `+60 ${phone}` : "");
  pushRow(<MailIcon className="size-3.5" />, email);
  pushRow(
    <UserRoundIcon className="size-3.5" />,
    salary ? `RM ${salary} / month` : ""
  );
  pushRow(
    <UserRoundIcon className="size-3.5" />,
    hourlyRate ? `RM ${hourlyRate} / hour` : ""
  );

  return (
    <form
      action={formAction}
      className="grid items-start gap-5 xl:grid-cols-[1fr_300px] 2xl:grid-cols-[1fr_360px]"
    >
      <input name="firstName" type="hidden" value={firstName.trim()} />
      <input name="lastName" type="hidden" value={lastName.trim()} />
      <input name="fullName" type="hidden" value={fullName} />
      <input name="email" type="hidden" value={email.trim()} />
      <input name="phone" type="hidden" value={phone.trim()} />
      <input name="icNumber" type="hidden" value={icNumber.trim()} />
      <input name="gender" type="hidden" value={gender} />
      <input name="qualification" type="hidden" value={qualification} />
      <input name="employmentType" type="hidden" value={employmentType} />
      <input name="hourlyRate" type="hidden" value={hourlyRate.trim()} />
      <input name="salary" type="hidden" value={salary.trim()} />
      <input name="sendInvite" type="hidden" value={sendInvite ? "on" : ""} />

      <section className="grid content-start gap-5 xl:col-start-1 xl:row-start-1">
        <PreviewCard
          className="flex flex-col"
          header={
            <span className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <UserRoundIcon className="size-4 text-primary" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="font-medium text-foreground text-sm">Personal Information</span>
                <span className="text-muted-foreground text-xs">
                  Basic details used for the teacher's profile.
                </span>
              </span>
            </span>
          }
          stageClassName="min-h-0 flex-1 flex-col justify-start gap-4 p-4 sm:p-5"
        >
          <div className="flex items-start gap-5">
            <PhotoUploadTile onPreviewUrlChange={setPhotoUrl} />
            <div className="grid flex-1 gap-4 sm:grid-cols-2">
              <div className="grid content-start gap-1.5">
                <FieldLabel htmlFor="firstName" required>
                  First name
                </FieldLabel>
                <Input
                  id="firstName"
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="e.g. Nur Aisyah"
                  value={firstName}
                />
              </div>
              <div className="grid content-start gap-1.5">
                <FieldLabel htmlFor="lastName" required>
                  Last name
                </FieldLabel>
                <Input
                  id="lastName"
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="e.g. Abdullah"
                  value={lastName}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid content-start gap-1.5">
              <FieldLabel htmlFor="email" required>
                Email address
              </FieldLabel>
              <Input
                id="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="teacher@example.com"
                type="email"
                value={email}
              />
              <div className="flex items-start gap-2 text-sm">
                <Checkbox
                  checked={sendInvite}
                  id="sendInvite"
                  onCheckedChange={(checked) => setSendInvite(checked)}
                />
                <label
                  className="text-muted-foreground leading-tight"
                  htmlFor="sendInvite"
                >
                  Send an invitation email with login instructions after
                  creating this teacher.
                </label>
              </div>
            </div>
            <div className="grid content-start gap-1.5">
              <FieldLabel htmlFor="phone" required>
                Mobile number
              </FieldLabel>
              <InputGroup className="h-9 sm:h-8">
                <InputGroupAddon>+60</InputGroupAddon>
                <InputGroupInput
                  id="phone"
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="12 345 6789"
                  type="tel"
                  value={phone}
                />
              </InputGroup>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid content-start gap-1.5">
              <FieldLabel htmlFor="icNumber">NRIC / Passport number</FieldLabel>
              <Input
                id="icNumber"
                onChange={(event) => setIcNumber(event.target.value)}
                placeholder="e.g. 900101-14-5678"
                value={icNumber}
              />
            </div>
            <div className="grid content-start gap-1.5">
              <FieldLabel>Gender</FieldLabel>
              <Select
                items={Object.fromEntries(
                  GENDER_OPTIONS.map((option) => [option.value, option.label])
                )}
                onValueChange={(value) => setGender(value ?? "")}
                value={gender}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </PreviewCard>

        <PreviewCard
          className="flex flex-col"
          header={
            <span className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <GraduationCapIcon className="size-4 text-primary" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="font-medium text-foreground text-sm">Teaching Details</span>
                <span className="text-muted-foreground text-xs">Employment and pay details.</span>
              </span>
            </span>
          }
          stageClassName="min-h-0 flex-1 flex-col justify-start gap-4 p-4 sm:p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid content-start gap-1.5">
              <FieldLabel required>Employment type</FieldLabel>
              <Select
                items={Object.fromEntries(
                  EMPLOYMENT_OPTIONS.map((option) => [
                    option.value,
                    option.label,
                  ])
                )}
                onValueChange={(value) => setEmploymentType(value ?? "")}
                value={employmentType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employment type" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid content-start gap-1.5">
              <FieldLabel htmlFor="hourlyRate">Hourly teaching rate</FieldLabel>
              <InputGroup className="h-9 sm:h-8">
                <InputGroupAddon>RM</InputGroupAddon>
                <InputGroupInput
                  id="hourlyRate"
                  inputMode="decimal"
                  min="0"
                  onChange={(event) => setHourlyRate(event.target.value)}
                  placeholder="e.g. 45.00"
                  step="0.50"
                  type="number"
                  value={hourlyRate}
                />
              </InputGroup>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid content-start gap-1.5">
              <FieldLabel htmlFor="salary">Monthly salary (RM)</FieldLabel>
              <Input
                id="salary"
                inputMode="decimal"
                min="0"
                onChange={(event) => setSalary(event.target.value)}
                placeholder="e.g. 3500.00"
                step="0.01"
                type="number"
                value={salary}
              />
            </div>
            <div className="grid content-start gap-1.5">
              <FieldLabel>Qualification</FieldLabel>
              <Select
                items={Object.fromEntries(
                  QUALIFICATION_OPTIONS.map((option) => [
                    option.value,
                    option.label,
                  ])
                )}
                onValueChange={(value) => setQualification(value ?? "")}
                value={qualification}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select qualification" />
                </SelectTrigger>
                <SelectContent>
                  {QUALIFICATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid content-start gap-1.5">
            <FieldLabel htmlFor="notes">Short introduction</FieldLabel>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Add a short description about this teacher's experience or qualifications..."
              rows={3}
            />
          </div>
        </PreviewCard>
      </section>

      <aside className="order-2 grid content-start gap-4 xl:sticky xl:top-4 xl:col-start-2 xl:row-start-1 xl:self-start">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="p-4">
            <p className="font-semibold text-muted-foreground text-xs uppercase tracking-widest">
              Teacher Summary
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted text-muted-foreground">
                {photoUrl ? (
                  <Avatar className="size-full rounded-full">
                    <AvatarImage alt="" src={photoUrl} />
                    <AvatarFallback>
                      <UserRoundIcon className="size-6" />
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <UserRoundIcon className="size-6" />
                )}
              </div>
              <div className="min-w-0">
                <p
                  className={
                    fullName
                      ? "truncate font-bold leading-tight"
                      : "truncate font-medium text-muted-foreground italic leading-tight"
                  }
                >
                  {fullName || "Teacher name"}
                </p>
                <p className="font-mono text-muted-foreground text-xs">
                  {nextCode}
                </p>
              </div>
            </div>
            <div className="mt-3 grid gap-2">
              {summaryRows.map((row) => (
                <SummaryRow icon={row.icon} key={row.label}>
                  {row.label}
                </SummaryRow>
              ))}
            </div>
          </div>
        </div>

        <div className="hidden rounded-xl border border-primary/10 bg-secondary/40 p-4 sm:block">
          <p className="mb-2 font-semibold text-primary text-xs">Quick Tips</p>
          <ul className="grid gap-1.5 text-muted-foreground text-xs">
            {[
              "The teacher code is assigned automatically.",
              "A photo is optional and can be added later.",
            ].map((tip) => (
              <li className="flex gap-2" key={tip}>
                <span className="shrink-0 text-primary">·</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="order-3 flex flex-col gap-3 sm:flex-row xl:col-start-1 xl:row-start-2">
        <Button className="flex-1" disabled={isPending} size="lg" type="submit">
          {isPending ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckIcon className="size-4" />
              Save Teacher
            </>
          )}
        </Button>
        <Button render={<Link href="/teachers" />} size="lg" variant="outline">
          Cancel
        </Button>
      </div>
    </form>
  );
};
