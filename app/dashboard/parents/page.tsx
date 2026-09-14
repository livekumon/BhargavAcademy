import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { deleteParent } from "@/lib/actions/parents";
import { requireTeacher } from "@/lib/auth";
import { newParentPath, parentManagePath, studentManagePath } from "@/lib/paths";
import { getTeacherParents } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Parents",
};

export default async function ParentsPage() {
  const teacher = await requireTeacher();
  const parents = await getTeacherParents(teacher.id);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Directory"
        title="Parents"
        description="Create a parent login, generate their email from their name, and assign the students they should see after they sign in."
        actions={
          <Button asChild size="lg">
            <Link href={newParentPath()}>
              <Plus data-icon="inline-start" />
              New parent
            </Link>
          </Button>
        }
      />

      {parents.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title="No parent logins yet"
          description="Add a parent, pick the students they should follow, and they will see those children on their dashboard after they sign in."
          action={
            <Button asChild size="lg">
              <Link href={newParentPath()}>Create a parent login</Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {parents.map((parent) => (
            <Surface
              key={parent.id}
              className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-heading text-lg font-semibold">
                    {parent.name}
                  </p>
                  {parent.mustChangePassword ? (
                    <StatusPill tone="highlight">Needs first login</StatusPill>
                  ) : null}
                </div>
                <p className="mt-0.5 font-mono text-sm text-content-muted">
                  {parent.email}
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {parent.students.map((student) => (
                    <li key={student.id}>
                      <Link
                        href={studentManagePath(student.id)}
                        className="inline-flex rounded-full bg-sunken px-2.5 py-1 text-xs font-medium hover:bg-brand-subtle"
                      >
                        {student.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button asChild variant="outline">
                  <Link href={parentManagePath(parent.id)}>Edit mapping</Link>
                </Button>
                <form action={deleteParent}>
                  <input type="hidden" name="parentId" value={parent.id} />
                  <ConfirmSubmitButton message={`Delete ${parent.name}'s parent login? Students stay in the academy; they just will not show up for this parent.`}>
                    Delete
                  </ConfirmSubmitButton>
                </form>
              </div>
            </Surface>
          ))}
        </div>
      )}
    </div>
  );
}
