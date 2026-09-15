import type { Metadata } from "next";
import Link from "next/link";
import { HeartHandshake, KeyRound, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CopyButton } from "@/components/teacher/copy-button";
import { MoreMenu } from "@/components/teacher/more-menu";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { deleteParentById, resetParentPassword } from "@/lib/actions/parents";
import { requireTeacher } from "@/lib/auth";
import { DEFAULT_PASSWORD } from "@/lib/identity";
import { parentLoginMessage } from "@/lib/login-details";
import { newParentPath, parentManagePath, studentManagePath } from "@/lib/paths";
import { getTeacherParents } from "@/lib/queries";
import { initials } from "@/lib/teacher-format";

export const metadata: Metadata = {
  title: "Parents",
};

export default async function ParentsPage() {
  const teacher = await requireTeacher();
  const parents = await getTeacherParents(teacher.id);
  const invited = parents.filter((parent) => parent.mustChangePassword).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="People"
        title="Parents"
        description={
          parents.length === 0
            ? "Give families a login so they can follow their children's progress."
            : `${parents.length} parent ${parents.length === 1 ? "login" : "logins"}${invited > 0 ? ` · ${invited} haven't signed in yet` : ""}. Copy a login and send it on WhatsApp.`
        }
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
          icon={<HeartHandshake />}
          title="No parent logins yet"
          description="Create a parent, choose their children, and they'll see those children's progress when they sign in."
          action={
            <Button asChild size="lg">
              <Link href={newParentPath()}>Create a parent login</Link>
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl bg-surface ring-1 ring-line">
          {parents.map((parent) => (
            <li key={parent.id} className="flex flex-col gap-3 px-4 py-4 sm:px-5 md:flex-row md:items-center md:gap-5">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-sm font-semibold text-brand-subtle-fg"
                >
                  {initials(parent.name)}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={parentManagePath(parent.id)} className="font-medium hover:underline">
                      {parent.name}
                    </Link>
                    {parent.mustChangePassword ? (
                      <StatusPill tone="highlight" size="sm">
                        Not signed in yet
                      </StatusPill>
                    ) : (
                      <StatusPill tone="success" size="sm">
                        Active
                      </StatusPill>
                    )}
                  </div>
                  <p className="truncate font-mono text-xs text-content-subtle">{parent.email}</p>
                </div>
              </div>

              <ul className="flex flex-wrap gap-1.5 md:w-72">
                {parent.students.map((student) => (
                  <li key={student.id}>
                    <Link
                      href={studentManagePath(student.id)}
                      className="inline-flex h-7 items-center rounded-full bg-sunken px-2.5 text-xs font-medium hover:bg-brand-subtle hover:text-brand-subtle-fg"
                    >
                      {student.name}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-1">
                <CopyButton
                  text={parentLoginMessage(parent)}
                  label="Copy login"
                  copiedMessage={`${parent.name}'s login copied. Paste it into WhatsApp.`}
                  size="default"
                />
                <MoreMenu
                  label={`Actions for ${parent.name}`}
                  variant="ghost"
                  links={[{ label: "Edit parent", href: parentManagePath(parent.id), icon: <Pencil aria-hidden="true" /> }]}
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
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
