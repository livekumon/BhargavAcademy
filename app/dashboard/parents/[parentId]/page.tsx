import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KeyRound, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ParentForm } from "@/components/parent-form";
import { CopyButton } from "@/components/teacher/copy-button";
import { MoreMenu } from "@/components/teacher/more-menu";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { deleteParentById, resetParentPassword, updateParent } from "@/lib/actions/parents";
import { requireTeacher } from "@/lib/auth";
import { DEFAULT_PASSWORD } from "@/lib/identity";
import { parentLoginMessage } from "@/lib/login-details";
import { parentsPath } from "@/lib/paths";
import { getOwnedParentForTeacher, getTeacherParentPickerStudents } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Edit parent",
};

export default async function EditParentPage({ params }: { params: Promise<{ parentId: string }> }) {
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
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={<Breadcrumb items={[{ label: "Parents", href: parentsPath() }, { label: parent.name }]} />}
        eyebrow="Parent login"
        title={parent.name}
        description={parent.email}
        actions={
          <>
            <StatusPill tone={parent.mustChangePassword ? "highlight" : "success"}>
              {parent.mustChangePassword ? "Not signed in yet" : "Active"}
            </StatusPill>
            <CopyButton text={parentLoginMessage(parent)} label="Copy login" copiedMessage="Login copied. Paste it into WhatsApp." />
            <MoreMenu
              label={`More actions for ${parent.name}`}
              dangers={[
                {
                  label: "Reset password",
                  icon: <KeyRound aria-hidden="true" />,
                  title: `Reset ${parent.name}'s password?`,
                  message: `Their password goes back to ${DEFAULT_PASSWORD} and they'll choose a new one at their next sign-in.`,
                  action: resetParentPassword.bind(null, parent.id),
                },
                {
                  label: "Delete login",
                  icon: <Trash2 aria-hidden="true" />,
                  title: `Delete ${parent.name}'s login?`,
                  message: "They won't be able to sign in any more.",
                  consequences: ["Their children stay enrolled and keep all their progress."],
                  action: deleteParentById.bind(null, parent.id),
                },
              ]}
            />
          </>
        }
      />
      <Surface pad="lg" className="max-w-3xl">
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
      </Surface>
    </div>
  );
}
