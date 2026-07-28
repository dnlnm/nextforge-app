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
import { Textarea } from "@repo/design-system/components/ui/textarea";
import {
  BookOpenIcon,
  CalendarIcon,
  CloudUploadIcon,
  UserRoundIcon,
  UsersRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { Header } from "../../components/header";
import { createStudent } from "../actions";

const Required = () => <span className="text-destructive">*</span>;

const AddStudentPage = () => (
  <>
    <Header
      page="Add New Student"
      pages={["TLAS.MY", { href: "/students", label: "Students" }]}
    />
    <main className="grid gap-6 p-4 pt-0 md:p-6 md:pt-0">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">
          Add New Student
        </h1>
      </div>

      <form
        action={createStudent}
        className="grid gap-6 xl:grid-cols-[1fr_360px]"
      >
        <section className="grid gap-6">
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
                      <SelectItem value="kuala-lumpur">Kuala Lumpur</SelectItem>
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
                    <Input id="studentPhone" placeholder="Enter phone number" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="studentEmail">Email Address (optional)</Label>
                  <Input
                    id="studentEmail"
                    placeholder="Enter email address"
                    type="email"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-base">
                <BookOpenIcon className="size-5 text-muted-foreground" />
                Additional Information
              </CardTitle>
            </CardHeader>
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
                  <Label htmlFor="academicLevel">
                    Current Grade / Form <Required />
                  </Label>
                  <Select name="academicLevel">
                    <SelectTrigger id="academicLevel">
                      <SelectValue placeholder="Select current grade or form" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Year 1">Year 1</SelectItem>
                      <SelectItem value="Year 2">Year 2</SelectItem>
                      <SelectItem value="Year 3">Year 3</SelectItem>
                      <SelectItem value="Form 1">Form 1</SelectItem>
                      <SelectItem value="Form 2">Form 2</SelectItem>
                      <SelectItem value="Form 3">Form 3</SelectItem>
                      <SelectItem value="Form 4">Form 4</SelectItem>
                      <SelectItem value="Form 5">Form 5</SelectItem>
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

        <aside className="grid content-start gap-6">
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
                <p className="mt-5 font-medium text-sm">Upload student photo</p>
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
                <Label htmlFor="guardianEmail">Email Address (optional)</Label>
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

export default AddStudentPage;
