import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/design-system/components/ui/card";
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
import { CloudUploadIcon, SchoolIcon, UserRoundIcon } from "lucide-react";
import Link from "next/link";
import { Header } from "../../components/header";
import { createTeacher } from "../actions";

const Required = () => <span className="text-destructive">*</span>;

const AddTeacherPage = () => (
  <>
    <Header
      page="Add New Teacher"
      pages={["TLAS.MY", { href: "/teachers", label: "Teachers" }]}
    />
    <main className="grid gap-6 p-4 pt-0 md:p-6 md:pt-0">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight md:text-3xl">
          Add New Teacher
        </h1>
      </div>

      <form
        action={createTeacher}
        className="grid gap-6 xl:grid-cols-[1fr_360px]"
      >
        <section className="grid content-start gap-6">
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
                    placeholder="e.g. Ahmad Hakimi Bin Ali"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dateOfBirth">
                    Date of Birth <Required />
                  </Label>
                  <div className="relative">
                    <Input id="dateOfBirth" placeholder="DD/MM/YYYY" />
                    <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground">
                      <svg
                        aria-hidden="true"
                        fill="none"
                        height="16"
                        viewBox="0 0 24 24"
                        width="16"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
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
                <div className="grid gap-2">
                  <Label htmlFor="nationality">
                    Nationality <Required />
                  </Label>
                  <Select>
                    <SelectTrigger id="nationality">
                      <SelectValue placeholder="Malaysian" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="malaysian">Malaysian</SelectItem>
                      <SelectItem value="non-malaysian">
                        Non-Malaysian
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_1.5fr]">
                <div className="grid gap-2">
                  <Label htmlFor="phone">
                    Phone Number <Required />
                  </Label>
                  <div className="grid grid-cols-[96px_1fr] gap-2">
                    <Select defaultValue="60">
                      <SelectTrigger id="phoneCode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="60">+60</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="e.g. 12-345 6789"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">
                    Email Address <Required />
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    placeholder="e.g. teacher@email.com"
                    type="email"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">
                  Address <Required />
                </Label>
                <Textarea
                  className="min-h-20"
                  id="address"
                  placeholder="e.g. No. 12, Jalan Pendidikan 1, 50100 Kuala Lumpur"
                />
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="qualification">
                    Qualification <Required />
                  </Label>
                  <Select>
                    <SelectTrigger id="qualification">
                      <SelectValue placeholder="Select qualification" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diploma">Diploma</SelectItem>
                      <SelectItem value="degree">Degree</SelectItem>
                      <SelectItem value="masters">Masters</SelectItem>
                      <SelectItem value="phd">PhD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="highestEducation">Highest Education</Label>
                  <Select>
                    <SelectTrigger id="highestEducation">
                      <SelectValue placeholder="Select highest education" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spm">SPM</SelectItem>
                      <SelectItem value="diploma">Diploma</SelectItem>
                      <SelectItem value="degree">Degree</SelectItem>
                      <SelectItem value="masters">Masters</SelectItem>
                      <SelectItem value="phd">PhD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Input id="experience" placeholder="e.g. 5" type="number" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="employmentType">
                    Employment Type <Required />
                  </Label>
                  <Select defaultValue="full-time">
                    <SelectTrigger id="employmentType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full Time</SelectItem>
                      <SelectItem value="part-time">Part Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="salary">Monthly Salary (RM)</Label>
                  <Input
                    id="salary"
                    placeholder="e.g. 3,500.00"
                    type="number"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="joiningDate">
                    Joining Date <Required />
                  </Label>
                  <div className="relative">
                    <Input id="joiningDate" placeholder="DD/MM/YYYY" />
                    <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground">
                      <svg
                        aria-hidden="true"
                        fill="none"
                        height="16"
                        viewBox="0 0 24 24"
                        width="16"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">
                    Status <Required />
                  </Label>
                  <Select defaultValue="active">
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <aside className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-base">
                <CloudUploadIcon className="size-5 text-muted-foreground" />
                Profile Photo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 p-6 text-center">
                <div className="relative flex size-24 items-center justify-center rounded-full border bg-background text-muted-foreground">
                  <UserRoundIcon className="size-10" />
                  <div className="absolute right-1 bottom-2 flex size-8 items-center justify-center rounded-full border bg-background">
                    <CloudUploadIcon className="size-4" />
                  </div>
                </div>
                <p className="mt-5 font-medium text-sm">Upload photo</p>
                <p className="mt-1 text-muted-foreground text-xs">
                  JPG, PNG or GIF. Max size 2MB.
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
                <SchoolIcon className="size-5 text-muted-foreground" />
                Teacher Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {[
                ["Status", "Active"],
                ["Employee ID", "Auto-generated"],
                ["Date Added", "Will be set after saving"],
                ["Added By", "Daniel Naim (Admin)"],
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
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button asChild variant="outline">
                  <Link href="/teachers">Cancel</Link>
                </Button>
                <Button type="submit">Save Teacher</Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </form>
    </main>
  </>
);

export default AddTeacherPage;
