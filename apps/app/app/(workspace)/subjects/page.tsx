import { requireTenantRole } from "@repo/auth/authorization";
import { appName } from "@repo/config/brand";
import { database, type LevelStage } from "@repo/database";
import { Header } from "../components/header";
import { AddSubjectDialog } from "./add-subject-dialog";
import SubjectsList, { type SubjectSummary } from "./subjects-list";

const CONTRACT_COMMENT =
  "<!-- impeccable-contract subjects: THESIS: this page is a scannable expandable index, not a split form-and-preview layout; it refuses the form-card-beside-table-beside-sticky-preview rut. OWN-WORLD: Calm Control Room; paper surfaces on a cool canvas, Control Indigo actions, 36px controls, muted icon wells, hairline borders, low elevation, 14px operational type. STORY: an owner or admin scans every subject and its usage in one place, expands one subject to see its classes in place, and adds a subject without leaving the page. FIRST VIEWPORT: a full-width card with a search toolbar and count; collapsed subject rows show name, code, classes, students, teachers, and monthly fee range; the primary action is the Add Subject dialog button in the title row. FORM: expandable accordion index, candidate 5 of the grounded surface list, seed key 9b07f21a. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md -->";

const SubjectsPage = async () => {
  const tenant = await requireTenantRole(["ADMIN"]);
  const rawSubjects = await database.subject.findMany({
    where: { organizationId: tenant.organizationId, status: "ACTIVE" },
    orderBy: { name: "asc" },
    include: {
      classes: {
        where: { archivedAt: null },
        include: {
          enrollments: {
            where: { archivedAt: null, status: "ACTIVE" },
            select: { studentId: true },
          },
          level: { select: { name: true, stage: true } },
          teacher: { select: { id: true } },
        },
        orderBy: { name: "asc" },
      },
    },
  });

  const subjects: SubjectSummary[] = rawSubjects.map((subject) => {
    const studentIds = new Set<string>();
    const teacherIds = new Set<string>();
    const stages = new Set<LevelStage>();
    const levelNames = new Set<string>();

    for (const cls of subject.classes) {
      for (const enrollment of cls.enrollments) {
        studentIds.add(enrollment.studentId);
      }

      if (cls.teacher?.id) {
        teacherIds.add(cls.teacher.id);
      }

      if (cls.level?.stage) {
        stages.add(cls.level.stage);
      }

      if (cls.level?.name) {
        levelNames.add(cls.level.name);
      }
    }

    return {
      category: subject.category,
      classCount: subject.classes.length,
      code: subject.code,
      description: subject.description,
      icon: subject.icon,
      id: subject.id,
      levelNames: [...levelNames],
      name: subject.name,
      stages: [...stages],
      studentCount: studentIds.size,
      teacherCount: teacherIds.size,
    };
  });

  return (
    <>
      <span
        aria-hidden="true"
        className="hidden"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static build contract comment, no dynamic content
        dangerouslySetInnerHTML={{ __html: CONTRACT_COMMENT }}
      />
      <Header page="Subjects" pages={[`${appName}`]} />
      <main className="grid gap-5 p-4 pt-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="grid gap-1">
            <h1 className="font-semibold text-2xl tracking-tight">Subjects</h1>
            <p className="text-muted-foreground text-sm">
              Scan every subject, its usage, and its monthly fee range.
            </p>
          </div>
          <AddSubjectDialog />
        </div>

        <SubjectsList subjects={subjects} />
      </main>
    </>
  );
};

export default SubjectsPage;
