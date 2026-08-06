import { requireTenantRole } from "@repo/auth/authorization";
import { database } from "@repo/database";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Card,
  CardContent,
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
import { Textarea } from "@repo/design-system/components/ui/textarea";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "../../../components/header";
import { StudentPhotoUpload } from "../../../components/student-photo-upload";
import { updateStudent } from "../../actions";

interface StudentEditPageProperties {
  readonly params: Promise<{ studentId: string }>;
}

const StudentEditPage = async ({ params }: StudentEditPageProperties) => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const { studentId } = await params;
  const [student, levels] = await Promise.all([
    database.student.findFirst({
      where: { id: studentId, organizationId: tenant.organizationId },
      include: {
        guardians: {
          where: { isPrimary: true },
          include: { guardian: true },
          take: 1,
        },
        level: true,
      },
    }),
    database.level.findMany({
      where: { organizationId: tenant.organizationId, archivedAt: null },
      orderBy: { order: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!student) {
    notFound();
  }

  const guardian = student.guardians.at(0)?.guardian;

  if (!guardian) {
    notFound();
  }

  return (
    <>
      <Header page="Edit Student" pages={["Students", student.fullName]} />
      <main className="p-4 pt-0">
        <div className="grid items-start gap-5 xl:grid-cols-[1fr_300px] 2xl:grid-cols-[1fr_360px]">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Edit student</CardTitle>
            </CardHeader>
          <CardContent>
            <form action={updateStudent} className="grid gap-4">
              <input name="studentId" type="hidden" value={student.id} />
              <input name="guardianId" type="hidden" value={guardian.id} />
              <div className="grid gap-2">
                <Label htmlFor="fullName">Student full name</Label>
                <Input
                  defaultValue={student.fullName}
                  id="fullName"
                  name="fullName"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="preferredName">Preferred name</Label>
                <Input
                  defaultValue={student.preferredName ?? ""}
                  id="preferredName"
                  name="preferredName"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="schoolName">School</Label>
                  <Input
                    defaultValue={student.schoolName ?? ""}
                    id="schoolName"
                    name="schoolName"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="levelId">Academic level</Label>
                  <Select
                    defaultValue={student.levelId ?? "none"}
                    name="levelId"
                  >
                    <SelectTrigger id="levelId">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No level</SelectItem>
                      {levels.map((level) => (
                        <SelectItem key={level.id} value={level.id}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="dateOfBirth">Date of birth</Label>
                  <DatePicker
                    className="!justify-center !text-center w-40"
                    defaultValue={
                      student.dateOfBirth
                        ? student.dateOfBirth.toISOString().slice(0, 10)
                        : ""
                    }
                    id="dateOfBirth"
                    name="dateOfBirth"
                    placeholder="Select date of birth"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="enrolledAt">Enrollment date</Label>
                  <DatePicker
                    className="!justify-center !text-center w-40"
                    defaultValue={student.enrolledAt.toISOString().slice(0, 10)}
                    id="enrolledAt"
                    name="enrolledAt"
                    placeholder="Select enrollment date"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select defaultValue={student.gender ?? "none"} name="gender">
                    <SelectTrigger id="gender">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not specified</SelectItem>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="studentPhone">Phone</Label>
                  <Input
                    defaultValue={student.phone ?? ""}
                    id="studentPhone"
                    name="studentPhone"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="studentEmail">Email</Label>
                  <Input
                    defaultValue={student.email ?? ""}
                    id="studentEmail"
                    name="studentEmail"
                    type="email"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    defaultValue={student.city ?? ""}
                    id="city"
                    name="city"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="state">State</Label>
                  <Select defaultValue={student.state ?? "none"} name="state">
                    <SelectTrigger id="state">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not specified</SelectItem>
                      <SelectItem value="Johor">Johor</SelectItem>
                      <SelectItem value="Kedah">Kedah</SelectItem>
                      <SelectItem value="Kelantan">Kelantan</SelectItem>
                      <SelectItem value="Kuala Lumpur">Kuala Lumpur</SelectItem>
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
              <div className="grid gap-2">
                <Label htmlFor="studentAddress">Address</Label>
                <Textarea
                  className="min-h-20"
                  defaultValue={[student.addressLine1, student.addressLine2]
                    .filter(Boolean)
                    .join("\n")}
                  id="studentAddress"
                  name="studentAddress"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="postcode">Postcode</Label>
                <Input
                  defaultValue={student.postcode ?? ""}
                  id="postcode"
                  name="postcode"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  defaultValue={student.notes ?? ""}
                  id="notes"
                  name="notes"
                />
              </div>
              <div className="border-t pt-4">
                <h2 className="mb-3 font-medium">Primary guardian</h2>
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="guardianName">Guardian name</Label>
                    <Input
                      defaultValue={guardian.fullName}
                      id="guardianName"
                      name="guardianName"
                      required
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="guardianPhone">Phone</Label>
                      <Input
                        defaultValue={guardian.phone ?? ""}
                        id="guardianPhone"
                        name="guardianPhone"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="guardianEmail">Email</Label>
                      <Input
                        defaultValue={guardian.email ?? ""}
                        id="guardianEmail"
                        name="guardianEmail"
                        type="email"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="guardianAddress">Address</Label>
                    <Textarea
                      className="min-h-20"
                      defaultValue={[
                        guardian.addressLine1,
                        guardian.addressLine2,
                      ]
                        .filter(Boolean)
                        .join("\n")}
                      id="guardianAddress"
                      name="guardianAddress"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Checkbox
                      defaultChecked={
                        !(
                          guardian.addressLine1 ||
                          guardian.addressLine2 ||
                          guardian.city ||
                          guardian.state ||
                          guardian.postcode
                        )
                      }
                      name="sameAsStudentAddress"
                    />
                    <span>Same as student address</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Save changes</Button>
                <Button asChild variant="outline">
                  <Link href={`/students/${student.id}`}>Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
          </Card>
          <aside className="grid content-start gap-5 xl:sticky xl:top-4 xl:self-start">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Profile Photo</CardTitle>
              </CardHeader>
              <CardContent>
                <StudentPhotoUpload
                  defaultValue={student.photoUrl ?? ""}
                  gender={student.gender}
                  name="photoUrl"
                />
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </>
  );
};

export default StudentEditPage;
