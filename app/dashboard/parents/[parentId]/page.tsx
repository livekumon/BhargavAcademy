import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ParentForm } from "@/components/parent-form";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { deleteParent, updateParent } from "@/lib/actions/parents";
import { requireTeacher } from "@/lib/auth";
import { parentsPath } from "@/lib/paths";
import {
  getOwnedParentForTeacher,
  getTeacherParentPickerStudents,
} from "@/lib/queries";

export const metadata: Metadata = {
  title: "Edit parent",
};

export default async function EditParentPage({
  params,
}: {
  params: Promise<{ parentId: string }>;
}) {
  const { parentId } = await params;
  const teacher = await requireTeacher();
  const [parent, students] = await Promise.all([
    getOwnedParentForTeacher(teacher.id, parentId),
    getTeacherParentPickerStudents(teacher.id),
  ]);

  if (!parent) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
          <Link href={parentsPath()}>Back to parents</Link>
        </Button>
        <p className="text-sm font-medium text-brand">Parent login</p>
        <h1 className="font-heading mt-1 text-4xl font-semibold tracking-tight">
          {parent.name}
        </h1>
        <p className="mt-2 font-mono text-sm text-content-muted">{parent.email}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Mapping</CardTitle>
          <CardDescription>
            Change who signs in with this login, and which students appear on
            their dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ParentForm
            action={updateParent.bind(null, parent.id)}
            parentId={parent.id}
            students={students}
            defaultValues={{
              name: parent.name,
              email: parent.email,
              studentIds: parent.students.map((student) => student.id),
            }}
            submitLabel="Save parent"
            cancelHref={parentsPath()}
          />
        </CardContent>
      </Card>

      <form action={deleteParent}>
        <input type="hidden" name="parentId" value={parent.id} />
        <ConfirmSubmitButton message={`Delete ${parent.name}'s parent login? Students stay in the academy.`}>
          Delete parent login
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
