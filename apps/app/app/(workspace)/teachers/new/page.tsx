import { requireTenantRole } from "@repo/auth/authorization";
import { appName } from "@repo/config/brand";
import { Header } from "../../components/header";
import { getNextTeacherCode } from "../actions";
import { TeacherCreateForm } from "../components/teacher-create-form";

const AddTeacherPage = async () => {
  await requireTenantRole(["ADMIN"]);
  const nextCode = await getNextTeacherCode();

  return (
    <>
      <Header
        page="Add New Teacher"
        pages={[`${appName}`, { href: "/teachers", label: "Teachers" }]}
      />
      <main className="mx-auto grid w-full max-w-6xl gap-5 p-4 pt-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">
            Add New Teacher
          </h1>
          <p className="text-muted-foreground text-sm">
            Add a teacher to your centre and assign their teaching details.
          </p>
        </div>

        <TeacherCreateForm nextCode={nextCode} />
      </main>
    </>
  );
};

export default AddTeacherPage;
