"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Checkbox } from "@repo/design-system/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/design-system/components/ui/collapsible";
import { DatePicker } from "@repo/design-system/components/ui/date-picker";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { Separator } from "@repo/design-system/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/design-system/components/ui/tabs";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import {
  BookOpenIcon,
  ChevronDownIcon,
  Loader2Icon,
  UserRoundIcon,
  UsersRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { StudentPhotoUpload } from "../../components/student-photo-upload";
import { createStudent } from "../actions";

interface LevelOption {
  readonly id: string;
  readonly name: string;
}

interface StudentCreateFormProperties {
  readonly levels: LevelOption[];
  readonly nextCode: string;
}

const Required = () => <span className="text-destructive">*</span>;

const HelperText = ({ children }: { children: React.ReactNode }) => (
  <p className="text-muted-foreground text-xs">{children}</p>
);

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="text-destructive text-xs">{message}</p> : null;

const getValue = (formData: FormData, key: string) => {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneStripRegex = /[-\s]/g;
const phoneRegex = /^01\d{8,10}$/;
const postcodeRegex = /^\d{5}$/;

const isValidEmail = (email: string) => emailRegex.test(email);

const isValidPhone = (phone: string) =>
  phoneRegex.test(phone.replace(phoneStripRegex, ""));

const isValidPostcode = (postcode: string) => postcodeRegex.test(postcode);

const validate = (formData: FormData): Record<string, string> => {
  const errors: Record<string, string> = {};
  const fullName = getValue(formData, "fullName");
  const gender = getValue(formData, "gender");
  const levelId = getValue(formData, "levelId");
  const studentPhone = getValue(formData, "studentPhone");
  const studentEmail = getValue(formData, "studentEmail");
  const postcode = getValue(formData, "postcode");
  const guardianName = getValue(formData, "guardianName");
  const relationship = getValue(formData, "relationship");
  const guardianPhone = getValue(formData, "guardianPhone");
  const guardianEmail = getValue(formData, "guardianEmail");

  if (!fullName) {
    errors.fullName = "Full name is required.";
  }

  if (!gender) {
    errors.gender = "Please select a gender.";
  }

  if (!levelId) {
    errors.levelId = "Please select the current grade or form.";
  }

  if (studentPhone && !isValidPhone(studentPhone)) {
    errors.studentPhone =
      "Enter a valid Malaysian phone number (e.g. 012-3456789).";
  }

  if (studentEmail && !isValidEmail(studentEmail)) {
    errors.studentEmail = "Enter a valid email address.";
  }

  if (postcode && !isValidPostcode(postcode)) {
    errors.postcode = "Enter a 5-digit postcode.";
  }

  if (!guardianName) {
    errors.guardianName = "Guardian name is required.";
  }

  if (!relationship) {
    errors.relationship = "Please select a relationship.";
  }

  if (!guardianPhone) {
    errors.guardianPhone = "Guardian phone number is required.";
  } else if (!isValidPhone(guardianPhone)) {
    errors.guardianPhone =
      "Enter a valid Malaysian phone number (e.g. 012-3456789).";
  }

  if (guardianEmail && !isValidEmail(guardianEmail)) {
    errors.guardianEmail = "Enter a valid email address.";
  }

  if (!(studentEmail || guardianEmail)) {
    errors.guardianEmail =
      "At least one email address is required (student or guardian).";
  }

  return errors;
};

export const StudentCreateForm = ({
  levels,
  nextCode,
}: StudentCreateFormProperties) => {
  const [state, formAction, isPending] = useActionState(
    async (_state: { error?: string }, formData: FormData) =>
      createStudent(formData),
    {}
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sameAsStudentAddress, setSameAsStudentAddress] = useState(true);

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    const validationErrors = validate(formData);

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      event.preventDefault();
    }
  };

  const errorClassName = (hasError: boolean) =>
    hasError ? "border-destructive focus-visible:ring-destructive/50" : "";

  return (
    <form
      action={formAction}
      className="grid items-start gap-5 xl:grid-cols-[1fr_300px] 2xl:grid-cols-[1fr_360px]"
      onSubmit={handleSubmit}
    >
      <section className="grid content-start gap-5">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-base">
              <UserRoundIcon className="size-5 text-muted-foreground" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="fullName">
                  Full Name <Required />
                </Label>
                <Input
                  aria-invalid={Boolean(errors.fullName)}
                  className={errorClassName(Boolean(errors.fullName))}
                  id="fullName"
                  name="fullName"
                  placeholder="Enter full name"
                  required
                />
                <FieldError message={errors.fullName} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <DatePicker
                  className="!justify-center !text-center w-40"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  placeholder="Select date of birth"
                />
                <HelperText>Optional</HelperText>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="enrolledAt">
                  Enrollment Date <Required />
                </Label>
                <DatePicker
                  className="!justify-center !text-center w-40"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  id="enrolledAt"
                  name="enrolledAt"
                  placeholder="Select enrollment date"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="gender">
                  Gender <Required />
                </Label>
                <Select name="gender">
                  <SelectTrigger
                    aria-invalid={Boolean(errors.gender)}
                    className={errorClassName(Boolean(errors.gender))}
                    id="gender"
                  >
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError message={errors.gender} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Collapsible defaultOpen>
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">
                  Contact &amp; Address
                </CardTitle>
                <CardDescription className="mt-1">
                  Optional contact details and home address.
                </CardDescription>
              </div>
              <CollapsibleTrigger asChild>
                <Button size="icon" type="button" variant="ghost">
                  <ChevronDownIcon className="size-4 transition-transform group-data-[state=open]:rotate-180" />
                  <span className="sr-only">Toggle contact and address</span>
                </Button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="grid gap-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="studentPhone">Phone Number</Label>
                    <div className="grid grid-cols-[96px_1fr] gap-2">
                      <Select defaultValue="60" name="studentPhoneCode">
                        <SelectTrigger id="studentPhoneCode">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="60">+60</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        aria-invalid={Boolean(errors.studentPhone)}
                        className={errorClassName(Boolean(errors.studentPhone))}
                        id="studentPhone"
                        name="studentPhone"
                        placeholder="012-3456789"
                      />
                    </div>
                    <FieldError message={errors.studentPhone} />
                    <HelperText>Format: 012-3456789 or 0123456789</HelperText>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="studentEmail">Email Address</Label>
                    <Input
                      aria-invalid={Boolean(errors.studentEmail)}
                      className={errorClassName(Boolean(errors.studentEmail))}
                      id="studentEmail"
                      name="studentEmail"
                      placeholder="Enter email address"
                      type="email"
                    />
                    <FieldError message={errors.studentEmail} />
                    <HelperText>
                      Student or guardian email is required.
                    </HelperText>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="addressLine1">Address Line 1</Label>
                    <Input
                      id="addressLine1"
                      name="addressLine1"
                      placeholder="Unit/building and street name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="addressLine2">Address Line 2</Label>
                    <Input
                      id="addressLine2"
                      name="addressLine2"
                      placeholder="Area, neighbourhood (optional)"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="postcode">Postcode</Label>
                    <Input
                      aria-invalid={Boolean(errors.postcode)}
                      className={errorClassName(Boolean(errors.postcode))}
                      id="postcode"
                      name="postcode"
                      placeholder="50000"
                    />
                    <FieldError message={errors.postcode} />
                    <HelperText>5-digit postcode</HelperText>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" placeholder="Enter city" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="state">State</Label>
                    <Select name="state">
                      <SelectTrigger id="state">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Johor">Johor</SelectItem>
                        <SelectItem value="Kedah">Kedah</SelectItem>
                        <SelectItem value="Kelantan">Kelantan</SelectItem>
                        <SelectItem value="Kuala Lumpur">
                          Kuala Lumpur
                        </SelectItem>
                        <SelectItem value="Labuan">Labuan</SelectItem>
                        <SelectItem value="Melaka">Melaka</SelectItem>
                        <SelectItem value="Negeri Sembilan">
                          Negeri Sembilan
                        </SelectItem>
                        <SelectItem value="Pahang">Pahang</SelectItem>
                        <SelectItem value="Penang">Penang</SelectItem>
                        <SelectItem value="Perak">Perak</SelectItem>
                        <SelectItem value="Perlis">Perlis</SelectItem>
                        <SelectItem value="Putrajaya">Putrajaya</SelectItem>
                        <SelectItem value="Sabah">Sabah</SelectItem>
                        <SelectItem value="Sarawak">Sarawak</SelectItem>
                        <SelectItem value="Selangor">Selangor</SelectItem>
                        <SelectItem value="Terengganu">Terengganu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <Collapsible defaultOpen>
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">
                  Academic Information
                </CardTitle>
                <CardDescription className="mt-1">
                  School and current academic level.
                </CardDescription>
              </div>
              <CollapsibleTrigger asChild>
                <Button size="icon" type="button" variant="ghost">
                  <ChevronDownIcon className="size-4 transition-transform group-data-[state=open]:rotate-180" />
                  <span className="sr-only">Toggle academic information</span>
                </Button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="grid gap-5">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.2fr]">
                  <div className="grid gap-2">
                    <Label htmlFor="schoolName">School Name</Label>
                    <Input
                      id="schoolName"
                      name="schoolName"
                      placeholder="Enter school name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="levelId">
                      Current Grade / Form <Required />
                    </Label>
                    <Select name="levelId">
                      <SelectTrigger
                        aria-invalid={Boolean(errors.levelId)}
                        className={errorClassName(Boolean(errors.levelId))}
                        id="levelId"
                      >
                        <SelectValue placeholder="Select current grade or form" />
                      </SelectTrigger>
                      <SelectContent>
                        {levels
                          .filter((level) => level.name !== "General")
                          .map((level) => (
                            <SelectItem key={level.id} value={level.id}>
                              {level.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FieldError message={errors.levelId} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      placeholder="Additional notes (optional)"
                    />
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <Card>
          <Tabs className="gap-0" defaultValue="guardian">
            <CardHeader>
              <TabsList className="grid h-auto w-full grid-cols-2">
                <TabsTrigger value="guardian">
                  <UsersRoundIcon />
                  Guardian
                </TabsTrigger>
                <TabsTrigger value="classes">
                  <BookOpenIcon />
                  Classes
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="p-0">
              <TabsContent
                className="p-4 data-[state=inactive]:hidden"
                forceMount
                value="guardian"
              >
                <div className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="guardianName">
                        Guardian Name <Required />
                      </Label>
                      <Input
                        aria-invalid={Boolean(errors.guardianName)}
                        className={errorClassName(Boolean(errors.guardianName))}
                        id="guardianName"
                        name="guardianName"
                        placeholder="Enter guardian full name"
                        required
                      />
                      <FieldError message={errors.guardianName} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="relationship">
                        Relationship <Required />
                      </Label>
                      <Select defaultValue="GUARDIAN" name="relationship">
                        <SelectTrigger
                          aria-invalid={Boolean(errors.relationship)}
                          className={errorClassName(
                            Boolean(errors.relationship)
                          )}
                          id="relationship"
                        >
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FATHER">Father</SelectItem>
                          <SelectItem value="MOTHER">Mother</SelectItem>
                          <SelectItem value="GUARDIAN">Guardian</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldError message={errors.relationship} />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="guardianPhone">
                        Phone Number <Required />
                      </Label>
                      <div className="grid grid-cols-[82px_1fr] gap-2">
                        <Select defaultValue="60" name="guardianPhoneCode">
                          <SelectTrigger id="guardianPhoneCode">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="60">+60</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          aria-invalid={Boolean(errors.guardianPhone)}
                          className={errorClassName(
                            Boolean(errors.guardianPhone)
                          )}
                          id="guardianPhone"
                          name="guardianPhone"
                          placeholder="012-3456789"
                        />
                      </div>
                      <FieldError message={errors.guardianPhone} />
                      <HelperText>Format: 012-3456789 or 0123456789</HelperText>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="guardianEmail">Email Address</Label>
                    <Input
                      aria-invalid={Boolean(errors.guardianEmail)}
                      className={errorClassName(Boolean(errors.guardianEmail))}
                      id="guardianEmail"
                      name="guardianEmail"
                      placeholder="Enter email address"
                      type="email"
                    />
                    <FieldError message={errors.guardianEmail} />
                    <HelperText>
                      Student or guardian email is required.
                    </HelperText>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={sameAsStudentAddress}
                      name="sameAsStudentAddress"
                      onCheckedChange={(checked) =>
                        setSameAsStudentAddress(checked === true)
                      }
                    />
                    <span>Same as student address</span>
                  </div>
                  {!sameAsStudentAddress && (
                    <div className="fade-in-50 grid animate-in gap-4 duration-200 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="guardianAddressLine1">
                          Address Line 1
                        </Label>
                        <Input
                          id="guardianAddressLine1"
                          name="guardianAddressLine1"
                          placeholder="Unit/building and street name"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="guardianAddressLine2">
                          Address Line 2
                        </Label>
                        <Input
                          id="guardianAddressLine2"
                          name="guardianAddressLine2"
                          placeholder="Area, neighbourhood (optional)"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent
                className="p-4 data-[state=inactive]:hidden"
                forceMount
                value="classes"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Class Enrollment
                    </CardTitle>
                    <CardDescription>
                      Assign this student to their classes.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 p-6 text-center">
                      <BookOpenIcon className="size-8 text-muted-foreground" />
                      <p className="mt-3 font-medium text-sm">
                        Class enrollment coming soon
                      </p>
                      <p className="mt-1 max-w-sm text-muted-foreground text-xs">
                        You&apos;ll be able to assign this student to classes
                        right after creating their profile.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </section>

      <aside className="grid content-start gap-5 xl:sticky xl:top-4 xl:self-start">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile Photo</CardTitle>
          </CardHeader>
          <CardContent>
            <StudentPhotoUpload name="photoKey" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Student Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {[
              ["Status", "Active"],
              ["Student ID", nextCode],
              ["Enrollment Date", "Set in personal information"],
            ].map(([label, value]) => (
              <div
                className="grid grid-cols-[6rem_1fr] gap-3 text-sm"
                key={label}
              >
                <span className="text-muted-foreground">{label}</span>
                <span>{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
          <Button asChild size="lg" variant="outline">
            <Link href="/students">Cancel</Link>
          </Button>
          <Button disabled={isPending} size="lg" type="submit">
            {isPending ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Student"
            )}
          </Button>
        </div>
      </aside>
    </form>
  );
};
