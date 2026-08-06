import { requireTenant } from "@repo/auth/authorization";
import { database } from "@repo/database";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Checkbox } from "@repo/design-system/components/ui/checkbox";
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
import { BookOpenIcon, UserRoundIcon, UsersRoundIcon } from "lucide-react";
import Link from "next/link";
import { Header } from "../../components/header";
import { StudentPhotoUpload } from "../../components/student-photo-upload";
import { createStudent, getNextStudentCode } from "../actions";

const Required = () => <span className="text-destructive">*</span>;

const AddStudentPage = async () => {
  const tenant = await requireTenant();
  const nextCode = await getNextStudentCode();
  const levels = await database.level.findMany({
    where: { organizationId: tenant.organizationId, archivedAt: null },
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  });

  return (
    <>
      <Header
        page="Add Student"
        pages={["TLAS.MY", { href: "/students", label: "Students" }]}
      />
      <main className="grid gap-5 p-4 pt-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-semibold text-2xl tracking-tight">
              Add Student
            </h1>
            <p className="text-muted-foreground text-sm">
              Capture student and guardian details in one place.
            </p>
          </div>
        </div>

        <form
          action={createStudent}
          className="grid items-start gap-5 xl:grid-cols-[1fr_300px] 2xl:grid-cols-[1fr_360px]"
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
                      id="fullName"
                      name="fullName"
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <DatePicker
                      className="!justify-center !text-center w-40"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      placeholder="Select date of birth"
                    />
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
                  <div className="grid gap-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select name="gender">
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="studentAddress">Address</Label>
                  <Textarea
                    className="min-h-20"
                    id="studentAddress"
                    name="studentAddress"
                    placeholder="Enter full address"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="postcode">Postcode</Label>
                    <Input
                      id="postcode"
                      name="postcode"
                      placeholder="Enter postcode"
                    />
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

                <div className="grid gap-4 md:grid-cols-[1fr_1.5fr]">
                  <div className="grid gap-2">
                    <Label htmlFor="studentPhone">Phone Number</Label>
                    <div className="grid grid-cols-[96px_1fr] gap-2">
                      <Select defaultValue="60">
                        <SelectTrigger id="studentPhoneCode">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="60">+60</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        id="studentPhone"
                        name="studentPhone"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="studentEmail">
                      Email Address (optional)
                    </Label>
                    <Input
                      id="studentEmail"
                      name="studentEmail"
                      placeholder="Enter email address"
                      type="email"
                    />
                  </div>
                </div>

                <Separator />

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
                      <SelectTrigger id="levelId">
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
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      placeholder="Additional notes (optional)"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

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
                            id="guardianName"
                            name="guardianName"
                            placeholder="Enter guardian full name"
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="relationship">
                            Relationship <Required />
                          </Label>
                          <Select name="relationship">
                            <SelectTrigger id="relationship">
                              <SelectValue placeholder="Select relationship" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="FATHER">Father</SelectItem>
                              <SelectItem value="MOTHER">Mother</SelectItem>
                              <SelectItem value="GUARDIAN">Guardian</SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="guardianPhone">
                            Phone Number <Required />
                          </Label>
                          <div className="grid grid-cols-[82px_1fr] gap-2">
                            <Select defaultValue="60">
                              <SelectTrigger id="guardianPhoneCode">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="60">+60</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              id="guardianPhone"
                              name="guardianPhone"
                              placeholder="Enter phone number"
                            />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="guardianEmail">
                            Email Address (optional)
                          </Label>
                          <Input
                            id="guardianEmail"
                            name="guardianEmail"
                            placeholder="Enter email address (optional)"
                            type="email"
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="guardianAddress">Address</Label>
                        <Textarea
                          id="guardianAddress"
                          name="guardianAddress"
                          placeholder="Enter guardian address"
                        />
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Checkbox defaultChecked name="sameAsStudentAddress" />
                        <span>Same as student address</span>
                      </div>
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
                            You&apos;ll be able to assign this student to
                            classes right after creating their profile.
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
                <StudentPhotoUpload name="photoUrl" />
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
              <Button size="lg" type="submit">
                Save Student
              </Button>
            </div>
          </aside>
        </form>
      </main>
    </>
  );
};

export default AddStudentPage;
