"use client";

import {
  formatCalendarDate,
  formatNumericShortDate,
  getMalaysiaCalendarDate,
  getMalaysiaToday,
  parseLocalCalendarDate,
} from "@repo/date";
import { Button } from "@repo/design-system/components/ui/fluid-button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/design-system/components/ui/fluid-accordion";
import { InputField, InputGroup } from "@repo/design-system/components/ui/fluid-input-group";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@repo/design-system/components/ui/fluid-select";
import { FluidPanel } from "@repo/design-system/components/fluid-panel";
import {
  TabsSubtle,
  TabsSubtleItem,
  TabsSubtlePanel,
} from "@repo/design-system/components/ui/fluid-tabs-subtle";
import { toastManager } from "@repo/design-system/components/ui/toast";
import { Tooltip } from "@repo/design-system/components/ui/fluid-tooltip";
import { cn } from "@repo/design-system/lib/utils";
import { formatMoney } from "@repo/money";
import type { Gender } from "@repo/schemas/enums";
import {
  optimizeImageFile,
  privateFileUrl,
  uploadToR2,
} from "@repo/storage/client";
import {
  AlertCircleIcon,
  BookOpenIcon,
  CameraIcon,
  CheckIcon,
  GraduationCapIcon,
  InfoIcon,
  MoreHorizontalIcon,
  UserRoundIcon,
  UsersRoundIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { STAGE_OPTIONS } from "../../academic-levels/add-level-dialog";
import { StudentAvatar } from "../../components/student-avatar";
import { createStudent } from "../actions";
import {
  deriveDateOfBirthFromIc,
  deriveGenderFromIc,
  isValidIcNumber,
  normalizeIcNumber,
} from "../lib/ic-number";
import { REFERRAL_SOURCES } from "../lib/options";
import { ClassPicker, type EnrollableClassOption } from "./class-picker";
import { CreateProfilePreview } from "./create-profile-preview";
import { type GuardianDraft, GuardianEditor } from "./guardian-editor";
import { IsoDatePicker } from "./iso-date-picker";

interface LevelOption {
  readonly id: string;
  readonly name: string;
  readonly stage: string;
}

interface StudentCreateFormProperties {
  readonly classes: readonly EnrollableClassOption[];
  readonly currency: string;
  readonly levels: readonly LevelOption[];
  readonly nextCode: string;
}

const GENDER_OPTIONS: ReadonlyArray<{
  readonly label: string;
  readonly value: Gender;
}> = [
  { label: "Male", value: "MALE" },
  { label: "Female", value: "FEMALE" },
];

const maxPhotoSizeBytes = 2 * 1024 * 1024;
const phoneRegex = /^01\d{8,10}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneStripRegex = /[-\s]/g;

const uid = () => Math.random().toString(36).slice(2, 10);

const blankGuardian = (): GuardianDraft => ({
  address: "",
  email: "",
  firstName: "",
  icNumber: "",
  id: uid(),
  lastName: "",
  phone: "",
  relationship: "",
  sameAsStudent: false,
});

const parseMoney = (value: string): number | null => {
  if (value.trim() === "") {
    return null;
  }

  const parsed = Number.parseFloat(value);

  return Number.isNaN(parsed) || parsed <= 0 ? null : Math.round(parsed * 100);
};

const validateGuardians = (
  guardians: readonly GuardianDraft[]
): Record<string, string> => {
  const errors: Record<string, string> = {};

  guardians.forEach((guardian, index) => {
    if (!guardian.firstName.trim()) {
      errors[`guardian${index}firstName`] = "First name is required.";
    }

    if (!guardian.lastName.trim()) {
      errors[`guardian${index}lastName`] = "Last name is required.";
    }

    if (!guardian.relationship) {
      errors[`guardian${index}relationship`] = "Relationship is required.";
    }

    if (!phoneRegex.test(guardian.phone.replace(phoneStripRegex, ""))) {
      errors[`guardian${index}phone`] =
        "Enter a valid Malaysian phone number (e.g. 012-3456789).";
    }

    if (!guardian.email.trim()) {
      errors[`guardian${index}email`] = "Guardian email is required.";
    } else if (!emailRegex.test(guardian.email)) {
      errors[`guardian${index}email`] = "Enter a valid email address.";
    }

    const ic = normalizeIcNumber(guardian.icNumber);

    if (!ic) {
      errors[`guardian${index}ic`] = "Guardian IC number is required.";
    } else if (!isValidIcNumber(ic)) {
      errors[`guardian${index}ic`] =
        "Guardian IC number must be exactly 12 digits.";
    }
  });

  return errors;
};
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

const Hint = ({ children }: { readonly children: React.ReactNode }) => (
  <p className="flex items-center gap-1 text-muted-foreground text-xs">
    <InfoIcon className="size-3" />
    {children}
  </p>
);

const FieldErrorText = ({ message }: { readonly message?: string }) =>
  message ? (
    <p className="flex items-center gap-1 text-destructive text-xs">
      <AlertCircleIcon className="size-3" />
      {message}
    </p>
  ) : null;

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

      const { key } = await uploadToR2(optimized, "/api/uploads/student-photo");
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
          aria-label="Upload student photo"
          className={cn(
            "group relative flex size-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed bg-muted transition-all hover:border-primary/50 hover:bg-primary/5",
            isUploading && "opacity-60"
          )}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {previewUrl ? (
            <>
              <StudentAvatar
                className="size-full"
                name="Student photo"
                photoUrl={previewUrl}
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <CameraIcon className="size-4 text-white" />
              </span>
            </>
          ) : (
            <CameraIcon className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
          )}
        </button>
        {hasPhoto ? (
          <button
            aria-label="Remove photo"
            className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-sm transition-colors hover:border-destructive/50 hover:bg-destructive hover:text-destructive-foreground"
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

const FeeSummaryBar = ({
  currency,
  subjectCount,
  totalSen,
}: {
  readonly currency: string;
  readonly subjectCount: number;
  readonly totalSen: number;
}) => (
  <div className="flex items-center justify-between rounded-lg border border-primary/10 bg-secondary/50 px-3 py-2.5">
    <span className="text-muted-foreground text-xs">
      {subjectCount} subject{subjectCount !== 1 ? "s" : ""} · monthly total
    </span>
    <span className="font-bold text-primary text-sm">
      {formatMoney(totalSen, { currency })}
    </span>
  </div>
);

const CustomFeeField = ({
  customFee,
  error,
  onChange,
  singleSelection,
  subjectTotalSen,
}: {
  readonly customFee: string;
  readonly error?: string;
  readonly onChange: (value: string) => void;
  readonly singleSelection: boolean;
  readonly subjectTotalSen: number;
}) => (
  <div className="grid content-start gap-1.5">
    <FieldLabel htmlFor="customFee">Custom monthly fee (optional)</FieldLabel>
    <InputGroup className="contents">
      <InputField
        disabled={!singleSelection}
        error={error}
        id="customFee"
        index={0}
        inputMode="decimal"
        label="Custom monthly fee (optional)"
        labelHidden
        min="0"
        onChange={onChange}
        placeholder={
          singleSelection && subjectTotalSen > 0
            ? `RM ${(subjectTotalSen / 100).toFixed(2)}`
            : "RM 0.00"
        }
        step="0.01"
        type="number"
        value={customFee}
      />
    </InputGroup>
    {!error && (
      <Hint>
        {singleSelection
          ? "Overrides the subject-based total"
          : "Available when exactly one subject is selected"}
      </Hint>
    )}
  </div>
);

const getStageSelection = (
  levels: readonly LevelOption[],
  selectedStage: string
) => {
  const selectable = levels.filter((level) => level.stage !== "GENERAL");

  return {
    levels: selectable.filter((level) => level.stage === selectedStage),
    options: STAGE_OPTIONS.filter((option) =>
      selectable.some((level) => level.stage === option.value)
    ),
    placeholder: selectedStage ? "Select level..." : "Select a stage first...",
  };
};

export const StudentCreateForm = ({
  classes,
  currency,
  levels,
  nextCode,
}: StudentCreateFormProperties) => {
  const [state, formAction, isPending] = useActionState(
    async (_previous: { error?: string }, formData: FormData) =>
      createStudent(formData),
    {}
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [icDigits, setIcDigits] = useState("");
  const [dobDate, setDobDate] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [selectedStage, setSelectedStage] = useState("");
  const [levelId, setLevelId] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [studentAddress, setStudentAddress] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [guardian, setGuardian] = useState<GuardianDraft>(blankGuardian());
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [customFee, setCustomFee] = useState("");
  const [startDate, setStartDate] = useState(getMalaysiaCalendarDate());
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [notes, setNotes] = useState("");
  const [schoolTab, setSchoolTab] = useState(0);

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

  const clearError = (key: string) =>
    setErrors((previous) => {
      if (!(key in previous)) {
        return previous;
      }

      const next = { ...previous };
      delete next[key];

      return next;
    });

  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const selectedClasses = classes.filter((learningClass) =>
    selectedClassIds.includes(learningClass.id)
  );
  const subjectTotalSen = selectedClasses.reduce(
    (sum, learningClass) => sum + learningClass.monthlyFeeSen,
    0
  );
  const customFeeSen = parseMoney(customFee);
  const singleSelection = selectedClasses.length === 1;
  const effectiveTotalSen =
    singleSelection && customFeeSen !== null ? customFeeSen : subjectTotalSen;
  const {
    levels: stageLevels,
    options: stageOptions,
    placeholder: levelPlaceholder,
  } = getStageSelection(levels, selectedStage);
  const gradeLabel = levels.find((level) => level.id === levelId)?.name ?? "";
  const primaryGuardian = guardian;
  const guardianFullName = [guardian.firstName, guardian.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const genderLabel =
    gender === ""
      ? ""
      : (GENDER_OPTIONS.find((option) => option.value === gender)?.label ?? "");

  const handleIcChange = (value: string) => {
    const digits = normalizeIcNumber(value);

    setIcDigits(digits);
    clearError("icNumber");

    if (digits.length >= 6) {
      const iso = deriveDateOfBirthFromIc(digits);

      if (iso) {
        setDobDate(iso);
      }
    }

    if (digits.length === 12) {
      setGender(deriveGenderFromIc(digits) ?? "");
    }
  };

  const updateGuardian = (id: string, patch: Partial<GuardianDraft>) =>
    setGuardian((previous) =>
      previous.id === id ? { ...previous, ...patch } : previous
    );

  const toggleClass = (classId: string) => {
    setSelectedClassIds((previous) =>
      previous.includes(classId)
        ? previous.filter((id) => id !== classId)
        : [...previous, classId]
    );
    clearError("subjects");
  };

  const handleStageChange = (value: string | null) => {
    setSelectedStage(value ?? "");
    setLevelId("");
    setSelectedClassIds([]);
    clearError("levelId");
    clearError("subjects");
  };

  const handleLevelChange = (value: string | null) => {
    setLevelId(value ?? "");
    setSelectedClassIds([]);
    clearError("levelId");
    clearError("subjects");
  };

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {};

    if (!firstName.trim()) {
      next.firstName = "First name is required.";
    }

    if (!lastName.trim()) {
      next.lastName = "Last name is required.";
    }

    if (!gender) {
      next.gender = "Please select a gender.";
    }

    if (!levelId) {
      next.levelId = "Please select the current level.";
    }

    if (!icDigits) {
      next.icNumber = "IC / MyKid number is required.";
    } else if (!isValidIcNumber(icDigits)) {
      next.icNumber = "IC / MyKid number must be exactly 12 digits.";
    }

    if (!dobDate) {
      next.dateOfBirth = "Date of birth is required.";
    }

    if (!schoolName.trim()) {
      next.schoolName = "School name is required.";
    }

    if (studentEmail && !emailRegex.test(studentEmail)) {
      next.studentEmail = "Enter a valid email address.";
    }

    if (
      studentPhone &&
      !phoneRegex.test(studentPhone.replace(phoneStripRegex, ""))
    ) {
      next.studentPhone =
        "Enter a valid Malaysian phone number (e.g. 012-3456789).";
    }

    if (customFee.trim() !== "" && customFeeSen === null) {
      next.customFee = "Enter a valid amount greater than zero.";
    }

    Object.assign(next, validateGuardians([guardian]));

    return next;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const validationErrors = validate();

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      event.preventDefault();
    }
  };

  const guardiansPayload = [
    {
      address:
        (guardian.sameAsStudent ? studentAddress : guardian.address).trim() ||
        undefined,
      email: guardian.email.trim() || undefined,
      fullName: guardianFullName,
      icNumber: normalizeIcNumber(guardian.icNumber) || undefined,
      phone: guardian.phone.trim(),
      relationship: guardian.relationship || undefined,
      whatsapp: guardian.phone.trim() || undefined,
    },
  ];

  const enrollmentsPayload = selectedClasses.map((learningClass) => ({
    classId: learningClass.id,
    ...(singleSelection && customFeeSen !== null ? { customFeeSen } : {}),
  }));

  return (
    <form
      action={formAction}
      className="grid items-start gap-5 xl:grid-cols-[1fr_300px] 2xl:grid-cols-[1fr_360px]"
      onSubmit={handleSubmit}
    >
      <input name="fullName" type="hidden" value={fullName} />
      <input name="firstName" type="hidden" value={firstName.trim()} />
      <input name="lastName" type="hidden" value={lastName.trim()} />
      <input name="icNumber" type="hidden" value={icDigits} />
      <input
        name="guardiansJson"
        type="hidden"
        value={JSON.stringify(guardiansPayload)}
      />
      <input
        name="enrollmentsJson"
        type="hidden"
        value={JSON.stringify(enrollmentsPayload)}
      />

      <section className="grid content-start gap-5 xl:col-start-1 xl:row-start-1">
        <FluidPanel
          className="flex flex-col"
          header={
            <span className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <UserRoundIcon className="size-4 text-primary" />
              </span>
              <span className="font-medium text-foreground text-sm">
                Student Information
              </span>
            </span>
          }
          stageClassName="min-h-0 flex-1 flex-col justify-start gap-4 p-4 sm:p-5"
        >
          <p className="text-muted-foreground text-xs">
            Legal name as per IC / birth certificate
          </p>
          <div className="grid gap-4">
          <div className="flex items-start gap-5">
            <PhotoUploadTile onPreviewUrlChange={setPhotoUrl} />
            <div className="grid flex-1 gap-4 sm:grid-cols-2">
              <div className="grid content-start gap-1.5">
                <FieldLabel htmlFor="firstName" required>
                  First name
                </FieldLabel>
                <InputGroup className="contents">
                  <InputField
                    error={errors.firstName}
                    id="firstName"
                    index={0}
                    label="First name"
                    labelHidden
                    onChange={(value) => {
                      setFirstName(value);
                      clearError("firstName");
                    }}
                    placeholder="e.g. Nurul Aisyah / Wei Jie / Priya"
                    value={firstName}
                  />
                </InputGroup>
              </div>
              <div className="grid content-start gap-1.5">
                <FieldLabel htmlFor="lastName" required>
                  Last name / Family name
                </FieldLabel>
                <InputGroup className="contents">
                  <InputField
                    error={errors.lastName}
                    id="lastName"
                    index={0}
                    label="Last name / Family name"
                    labelHidden
                    onChange={(value) => {
                      setLastName(value);
                      clearError("lastName");
                    }}
                    placeholder="e.g. binti Ahmad / Tan / a/p Kumar"
                    value={lastName}
                  />
                </InputGroup>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid content-start gap-1.5">
              <FieldLabel htmlFor="icNumber" required>
                IC / MyKid number
              </FieldLabel>
              {/* Info button + field share the control rhythm (both h-9). */}
              <div className="flex items-center gap-2">
                <Tooltip content="12 digits — auto-detects date of birth and gender">
                  <Button
                    aria-label="About IC / MyKid number"
                    size="icon"
                    variant="ghost"
                  >
                    <InfoIcon className="size-4" />
                  </Button>
                </Tooltip>
                <InputGroup className="min-w-0 flex-1 contents">
                  <InputField
                    error={errors.icNumber}
                    id="icNumber"
                    index={0}
                    inputMode="numeric"
                    label="IC / MyKid number"
                    labelHidden
                    maxLength={12}
                    onChange={handleIcChange}
                    placeholder="e.g. 120304145678"
                    value={icDigits}
                  />
                </InputGroup>
              </div>
            </div>
            <div className="grid content-start gap-1.5">
              <FieldLabel required>Date of birth</FieldLabel>
              <IsoDatePicker
                endMonth={getMalaysiaToday()}
                name="dateOfBirth"
                onChange={(iso) => setDobDate(iso)}
                placeholder="Select date of birth"
                startMonth={new Date(1900, 0)}
                toDisplay={(selected) => formatNumericShortDate(selected)}
                value={dobDate}
              />
              <FieldErrorText message={errors.dateOfBirth} />
            </div>
            <div className="grid content-start gap-1.5">
                <FieldLabel required>Gender</FieldLabel>
                <Select
                  name="gender"
                  onValueChange={(value) => {
                    setGender((value as Gender) || "");
                    clearError("gender");
                  }}
                  value={gender}
                >
                  <SelectTrigger
                    aria-invalid={errors.gender ? true : undefined}
                    error={errors.gender}
                    placeholder="Select gender"
                  />
                  <SelectContent>
                    {GENDER_OPTIONS.map((option, itemIndex) => (
                      <SelectItem
                        index={itemIndex}
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid content-start gap-1.5">
                <FieldLabel htmlFor="studentEmail">Email address</FieldLabel>
                <InputGroup className="contents">
                  <InputField
                    error={errors.studentEmail}
                    id="studentEmail"
                    index={0}
                    label="Email address"
                    labelHidden
                    name="studentEmail"
                    onChange={(value) => {
                      setStudentEmail(value);
                      clearError("studentEmail");
                    }}
                    placeholder="e.g. student@email.com"
                    type="email"
                    value={studentEmail}
                  />
                </InputGroup>
              </div>
              <div className="grid content-start gap-1.5">
                <FieldLabel htmlFor="studentPhone">Phone number</FieldLabel>
                <InputGroup className="contents">
                  <InputField
                    error={errors.studentPhone}
                    id="studentPhone"
                    index={0}
                    label="Phone number"
                    labelHidden
                    name="studentPhone"
                    onChange={(value) => {
                      setStudentPhone(value);
                      clearError("studentPhone");
                    }}
                    placeholder="e.g. 0123456789"
                    value={studentPhone}
                  />
                </InputGroup>
              </div>
          </div>

          <div className="grid content-start gap-1.5">
            <FieldLabel htmlFor="addressLine1">Address</FieldLabel>
            <textarea
              className="w-full rounded-lg px-2.5 py-2 text-[13px] text-foreground ring-1 ring-border transition-all duration-80 outline-none placeholder:text-muted-foreground focus:bg-card"
              id="addressLine1"
              name="addressLine1"
              onChange={(event) => setStudentAddress(event.target.value)}
              placeholder="House number, street, city, state, postcode"
              rows={2}
              value={studentAddress}
            />
            <Hint>Student&apos;s home address</Hint>
          </div>
          </div>
        </FluidPanel>

        <FluidPanel
          className="flex flex-col"
          header={
            <span className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <UsersRoundIcon className="size-4 text-primary" />
              </span>
              <span className="font-medium text-foreground text-sm">Parent / Guardian</span>
            </span>
          }
          stageClassName="min-h-0 flex-1 flex-col justify-start gap-4 p-4 sm:p-5"
        >
          <GuardianEditor
            errors={errors}
            guardian={guardian}
            onUpdate={updateGuardian}
            studentAddress={studentAddress}
          />
        </FluidPanel>

        <FluidPanel
          className="flex flex-col"
          header={
            <span className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <GraduationCapIcon className="size-4 text-primary" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="font-medium text-foreground text-sm">School &amp; Enrollment</span>
                <span className="text-muted-foreground text-xs">
                  Academic placement, subjects, fees, and start date
                </span>
              </span>
            </span>
          }
          stageClassName="min-h-0 flex-1 flex-col justify-start gap-4 p-4 sm:p-5"
        >
          <TabsSubtle
            idPrefix="school-enrollment"
            onSelect={setSchoolTab}
            selectedIndex={schoolTab}
          >
            <TabsSubtleItem
              icon={GraduationCapIcon}
              index={0}
              label="School & Level"
            />
            <TabsSubtleItem
              icon={BookOpenIcon}
              index={1}
              label="Enrollment"
            />
          </TabsSubtle>
          <TabsSubtlePanel
            className="grid content-start gap-4 pt-2"
            idPrefix="school-enrollment"
            index={0}
            selectedIndex={schoolTab}
          >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid content-start gap-1.5">
                  <FieldLabel required>Stage</FieldLabel>
                  <Select onValueChange={handleStageChange} value={selectedStage}>
                    <SelectTrigger placeholder="Select stage..." />
                    <SelectContent>
                      {stageOptions.map((option, itemIndex) => (
                        <SelectItem
                          index={itemIndex}
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid content-start gap-1.5">
                  <FieldLabel required>Level</FieldLabel>
                  <Select
                    disabled={!selectedStage}
                    name="levelId"
                    onValueChange={handleLevelChange}
                    value={levelId}
                  >
                    <SelectTrigger
                      aria-invalid={errors.levelId ? true : undefined}
                      error={errors.levelId}
                      placeholder={levelPlaceholder}
                    />
                    <SelectContent>
                      {stageLevels.map((level, itemIndex) => (
                        <SelectItem
                          index={itemIndex}
                          key={level.id}
                          value={level.id}
                        >
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid content-start gap-1.5 sm:col-span-2">
                  <FieldLabel htmlFor="schoolName" required>
                    School name
                  </FieldLabel>
                  <InputGroup className="contents">
                    <InputField
                      error={errors.schoolName}
                      id="schoolName"
                      index={0}
                      label="School name"
                      labelHidden
                      name="schoolName"
                      onChange={(value) => {
                        setSchoolName(value);
                        clearError("schoolName");
                      }}
                      placeholder="e.g. SMK Kajang, SJKC Chong Hwa..."
                      value={schoolName}
                    />
                  </InputGroup>
                </div>
              </div>
            </TabsSubtlePanel>
            <TabsSubtlePanel
              className="grid content-start gap-4 pt-2"
              idPrefix="school-enrollment"
              index={1}
              selectedIndex={schoolTab}
            >
              <div className="grid gap-4">
                <div className="grid content-start gap-1.5">
                  <FieldLabel>Start date</FieldLabel>
                  <IsoDatePicker
                    name="enrolledAt"
                    onChange={setStartDate}
                    placeholder="Select date"
                    value={startDate}
                  />
                </div>
              </div>

              <div className="grid content-start gap-1.5">
                <FieldLabel>Subjects / programmes enrolled</FieldLabel>
                <ClassPicker
                  classes={classes}
                  currency={currency}
                  error={errors.subjects}
                  filterLevelId={levelId}
                  onToggle={toggleClass}
                  selectedIds={selectedClassIds}
                />
              </div>

              {selectedClasses.length > 0 ? (
                <FeeSummaryBar
                  currency={currency}
                  subjectCount={selectedClasses.length}
                  totalSen={effectiveTotalSen}
                />
              ) : null}

              <CustomFeeField
                customFee={customFee}
                error={errors.customFee}
                onChange={(value) => {
                  setCustomFee(value);
                  clearError("customFee");
                }}
                singleSelection={singleSelection}
                subjectTotalSen={subjectTotalSen}
              />
            </TabsSubtlePanel>
        </FluidPanel>

        <FluidPanel
          className="flex flex-col"
          stageClassName="min-h-0 flex-1 flex-col justify-start gap-4 p-4 sm:p-5"
        >
          <Accordion>
            <AccordionItem value="additional">
              <AccordionTrigger>
                <span className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <MoreHorizontalIcon className="size-4 text-primary" />
                  </span>
                  <span className="flex min-w-0 flex-col text-left">
                    <span className="font-semibold text-foreground text-sm">
                      Additional Information
                    </span>
                    <span className="text-muted-foreground text-xs">
                      Medical notes, emergency contact, referral — optional
                    </span>
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid content-start gap-1.5">
                    <FieldLabel htmlFor="emergencyContactName">
                      Emergency contact name
                    </FieldLabel>
                    <InputGroup className="contents">
                      <InputField
                        id="emergencyContactName"
                        index={0}
                        label="Emergency contact name"
                        labelHidden
                        name="emergencyContactName"
                        onChange={setEmergencyContactName}
                        placeholder="Name of emergency contact"
                        value={emergencyContactName}
                      />
                    </InputGroup>
                  </div>
                  <div className="grid content-start gap-1.5">
                    <FieldLabel htmlFor="emergencyContactPhone">
                      Emergency contact phone
                    </FieldLabel>
                    <InputGroup className="contents">
                      <InputField
                        id="emergencyContactPhone"
                        index={0}
                        label="Emergency contact phone"
                        labelHidden
                        name="emergencyContactPhone"
                        onChange={setEmergencyContactPhone}
                        placeholder="0123456789"
                        value={emergencyContactPhone}
                      />
                    </InputGroup>
                  </div>
                </div>

                <div className="grid content-start gap-1.5">
                  <FieldLabel htmlFor="medicalNotes">
                    Medical conditions / allergies
                  </FieldLabel>
                  <textarea
                    className="w-full rounded-lg px-2.5 py-2 text-[13px] text-foreground ring-1 ring-border transition-all duration-80 outline-none placeholder:text-muted-foreground focus:bg-card"
                    id="medicalNotes"
                    name="medicalNotes"
                    onChange={(event) => setMedicalNotes(event.target.value)}
                    placeholder="e.g. Peanut allergy, asthma inhaler required, wears glasses..."
                    rows={2}
                    value={medicalNotes}
                  />
                </div>

                <div className="grid content-start gap-1.5">
                  <FieldLabel>How did they find us?</FieldLabel>
                  <Select name="referralSource">
                    <SelectTrigger placeholder="Select source..." />
                    <SelectContent>
                      {REFERRAL_SOURCES.map((source, itemIndex) => (
                        <SelectItem index={itemIndex} key={source} value={source}>
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid content-start gap-1.5">
                  <FieldLabel htmlFor="notes">Internal notes</FieldLabel>
                  <textarea
                    className="w-full rounded-lg px-2.5 py-2 text-[13px] text-foreground ring-1 ring-border transition-all duration-80 outline-none placeholder:text-muted-foreground focus:bg-card"
                    id="notes"
                    name="notes"
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="e.g. Sibling of existing student, requires extra attention in Maths..."
                    rows={2}
                    value={notes}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </FluidPanel>

        {Object.keys(errors).length > 0 ? (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-destructive text-sm">
            <AlertCircleIcon className="size-4 shrink-0" />
            Please complete all required fields before saving.
          </div>
        ) : null}
      </section>

      <aside className="order-2 grid content-start gap-4 xl:sticky xl:top-4 xl:col-start-2 xl:row-start-1 xl:self-start">
        <CreateProfilePreview
          currency={currency}
          enrolledSubjects={selectedClasses.map((learningClass) => ({
            feeSen: learningClass.monthlyFeeSen,
            name: learningClass.subjectName,
          }))}
          gender={gender}
          genderLabel={genderLabel}
          gradeLabel={gradeLabel}
          guardianEmail={primaryGuardian?.email ?? ""}
          guardianName={guardianFullName}
          guardianPhone={primaryGuardian?.phone ?? ""}
          nextCode={nextCode}
          photoUrl={photoUrl}
          schoolName={schoolName}
          startsOnLabel={formatCalendarDate(
            parseLocalCalendarDate(startDate) ?? getMalaysiaToday()
          )}
          studentName={fullName}
          totalSen={effectiveTotalSen}
        />
      </aside>

      <div className="order-3 flex flex-col gap-3 sm:flex-row xl:col-start-1 xl:row-start-2">
        <Button
          className="flex-1"
          loading={isPending}
          size="lg"
          type="submit"
        >
          <CheckIcon className="size-4" />
          Save Student
        </Button>
        <Button asChild size="lg" variant="tertiary">
          <Link href="/students">Cancel</Link>
        </Button>
      </div>
    </form>
  );
};
