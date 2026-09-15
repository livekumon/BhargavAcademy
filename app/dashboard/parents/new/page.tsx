import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ParentForm } from "@/components/parent-form";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Surface } from "@/components/ui/surface";
import { createParent } from "@/lib/actions/parents";
import { requireTeacher } from "@/lib/auth";
import { newStudentPath, parentsPath } from "@/lib/paths";
import { getTeacherParentPickerStudents } from "@/lib/queries";

export const metadata: Metadata = {
  title: "New parent",
};

export default async function NewParentPage() {
  const teacher = await requireTeacher();
  const students = await getTeacherParentPickerStudents(teacher.id);

  if (students.length === 0) {
    return (
      <EmptyState
        icon={<Users />}
        title="Add students first"
        description="A parent login shows at least one child. Add a student, then come back to create the parent."
        action={
          <Button asChild size="lg">
            <Link href={newStudentPath()}>Add a student</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={<Breadcrumb items={[{ label: "Parents", href: parentsPath() }, { label: "New parent" }]} />}
        title="Create a parent login"
        description="We generate a unique @bhargavacademy.com email from their name unless you type one. Choose the children they should see."
      />
      <Surface pad="lg" className="max-w-3xl">
        <ParentForm action={createParent} students={students} submitLabel="Create parent" cancelHref={parentsPath()} />
      </Surface>
    </div>
  );
}
