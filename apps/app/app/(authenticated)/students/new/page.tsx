import { requireTenant } from "@repo/auth/authorization";
import { database } from "@repo/database";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
import { Checkbox } from "@repo/design-system/components/ui/checkbox";
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
import { Textarea } from "@repo/design-system/components/ui/textarea";
import {
  CalendarIcon,
  CloudUploadIcon,
  UserRoundIcon,
  UsersRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { Header } from "../../components/header";
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
                    <Label htmlFor="dateOfBirth">
                      Date of Birth <Required />
                    </Label>
                    <div className="relative">
                      <Input
                        id="dateOfBirth"
                        placeholder="Select date of birth"
                      />
                      <CalendarIcon className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="gender">
                      Gender <Required />
                    </Label>
                    <Select>
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="studentAddress">
                    Address <Required />
                  </Label>
                  <Textarea
                    className="min-h-20"
                    id="studentAddress"
                    placeholder="Enter full address"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="postcode">
                      Postcode <Required />
                    </Label>
                    <Input id="postcode" placeholder="Enter postcode" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="city">
                      City <Required />
                    </Label>
                    <Input id="city" placeholder="Enter city" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="state">
                      State <Required />
                    </Label>
                    <Select>
                      <SelectTrigger id="state">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="selangor">Selangor</SelectItem>
                        <SelectItem value="kuala-lumpur">
                          Kuala Lumpur
                        </SelectItem>
                        <SelectItem value="johor">Johor</SelectItem>
                        <SelectItem value="penang">Penang</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-[1fr_1.5fr]">
                  <div className="grid gap-2">
                    <Label htmlFor="studentPhone">
                      Phone Number <Required />
                    </Label>
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
                      placeholder="Additional notes (optional)"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <aside className="grid content-start gap-5 xl:sticky xl:top-4 xl:self-start">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Profile Photo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border bg-muted/20 p-6 text-center">
                  <div className="relative flex size-24 items-center justify-center rounded-full border bg-background text-muted-foreground">
                    <UserRoundIcon className="size-10" />
                    <div className="absolute right-1 bottom-2 flex size-8 items-center justify-center rounded-full border bg-background">
                      <CloudUploadIcon className="size-4" />
                    </div>
                  </div>
                  <p className="mt-5 font-medium text-sm">
                    Upload student photo
                  </p>
                  <p className="mt-1 text-muted-foreground text-xs">
                    JPG, PNG or up to 2MB
                  </p>
                  <Button className="mt-5" type="button" variant="outline">
                    Choose File
                  </Button>
                </div>
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
                  ["Date Added", "Will be set after saving"],
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-base">
                  <UsersRoundIcon className="size-5 text-muted-foreground" />
                  Guardian Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
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
                <div className="grid gap-2">
                  <Label htmlFor="guardianAddress">Address</Label>
                  <Textarea
                    id="guardianAddress"
                    placeholder="Same as student address"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Checkbox defaultChecked />
                  <span>Same as student address</span>
                </div>
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
