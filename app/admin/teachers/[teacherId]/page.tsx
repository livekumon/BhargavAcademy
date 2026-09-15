import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountStatusPill, AdminPill, StudentFlagPills } from "@/components/admin/account-pills";
import { ActivityFeed } from "@/components/admin/activity-feed";
import {
  AccountActions,
  AdminAccessForm,
  PersonDetailsForm,
  TransferTeachingForm,
} from "@/components/admin/profile-forms";
import { CreatedNotice, FactList, ProfileSection } from "@/components/admin/profile-parts";
import { PageHeader } from "@/components/layout/page-header";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ProgressMeter } from "@/components/ui/progress-meter";
import { StatusPill } from "@/components/ui/status-pill";
import { formatDate, relativeDay, toDateInputValue } from "@/lib/admin/format";
import { isOwner } from "@/lib/admin/policy";
import { getTeacherProfile, listTeacherOptions } from "@/lib/admin/queries";
import { listAuditEvents } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import { LEAD_STATUS_LABELS } from "@/lib/leads";

export const metadata: Metadata = {
  title: "Teacher",
};

export default async function AdminTeacherPage({
  params,
  searchParams,
}: {
  params: Promise<{ teacherId: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const admin = await requireAdmin();
  const { teacherId } = await params;
  const { notice } = await searchParams;
  const [profile, teacherOptions, activity, subjectActivity] = await Promise.all([
    getTeacherProfile(decodeURIComponent(teacherId)),
    listTeacherOptions(),
    listAuditEvents({ actorId: decodeURIComponent(teacherId), limit: 10, excludeLogins: true }),
    listAuditEvents({ entityId: decodeURIComponent(teacherId), limit: 10 }),
  ]);
  if (!profile) notFound();

  const { teacher } = profile;
  const self = teacher.id === admin.id;
  const ownerLocked = profile.isOwner && !isOwner(admin);
  const history = [...activity.events, ...subjectActivity.events]
    .filter((event, index, all) => all.findIndex((other) => other.id === event.id) === index)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);

  const accessValue = profile.role === "admin" ? (teacher.roleExpiresAt ? "until" : "permanent") : "teacher";
  const totalAssigned = profile.batches.reduce((sum, batch) => sum + batch.assigned, 0);
  const totalCompleted = profile.batches.reduce((sum, batch) => sum + batch.completed, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "People", href: "/admin/people?role=teacher" },
              { label: teacher.name },
            ]}
          />
        }
        eyebrow="Teacher"
        title={teacher.name}
        description={<span className="font-mono text-sm">{teacher.email}</span>}
        actions={
          <div className="flex flex-wrap gap-2">
            {profile.role === "admin" ? (
              <AdminPill isOwner={profile.isOwner} until={teacher.roleExpiresAt} />
            ) : null}
            <AccountStatusPill status={teacher.status} mustChangePassword={teacher.mustChangePassword} />
          </div>
        }
      />
      <CreatedNotice notice={notice} email={teacher.email} />

      <FactList
        facts={[
          { label: "Batches", value: profile.batches.length },
          { label: "Students", value: profile.students.length },
          { label: "Course library", value: profile.courseCount },
          { label: "Last sign-in", value: relativeDay(teacher.lastLoginAt) ?? "Never" },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <ProfileSection
            title="Workspace"
            description={
              totalAssigned > 0
                ? `${totalCompleted} of ${totalAssigned} assigned items completed across ${teacher.name.split(" ")[0]}'s batches. This is a read-only view of what they see.`
                : "A read-only view of the batches this teacher runs."
            }
          >
            {profile.batches.length === 0 ? (
              <p className="text-sm text-content-muted">No batches yet.</p>
            ) : (
              <ul className="divide-y divide-line rounded-lg ring-1 ring-line">
                {profile.batches.map((batch) => {
                  const pct = batch.assigned ? Math.round((batch.completed / batch.assigned) * 100) : 0;
                  return (
                    <li key={batch.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <Link href={`/admin/people?batchId=${batch.id}&role=student`} className="font-medium hover:underline">
                          {batch.name}
                        </Link>
                        <p className="text-xs text-content-subtle">
                          {batch.courseTitle ?? "No course attached"} · {batch.studentCount} students ·{" "}
                          {batch.materialCount} files
                        </p>
                      </div>
                      <div className="flex items-center gap-2 sm:w-44">
                        {batch.assigned === 0 ? (
                          <StatusPill size="sm">Nothing assigned</StatusPill>
                        ) : (
                          <>
                            <ProgressMeter value={pct} label={`${batch.name}: ${pct}% complete`} size="sm" tone={pct >= 75 ? "success" : pct >= 50 ? "info" : "warning"} />
                            <span className="tabular w-9 text-right text-xs">{pct}%</span>
                          </>
                        )}
                      </div>
                      {batch.stale ? <StatusPill tone="warning" size="sm">No new material 14+ days</StatusPill> : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </ProfileSection>

          <ProfileSection title="Students" description="Everyone enrolled in this teacher's batches.">
            {profile.students.length === 0 ? (
              <p className="text-sm text-content-muted">No students yet.</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {profile.students.map((student) => (
                  <li key={student.id} className="flex flex-col gap-1 rounded-lg p-3 ring-1 ring-line">
                    <Link href={student.href} className="font-medium hover:underline">{student.name}</Link>
                    <span className="truncate text-xs text-content-subtle">{student.context.join(" · ")}</span>
                    {student.flags.length > 0 ? (
                      <span className="flex flex-wrap gap-1"><StudentFlagPills flags={student.flags} /></span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </ProfileSection>

          <ProfileSection title="Recent activity" description="Changes this teacher made, and changes made to their account.">
            <div className="-mx-5 -mb-5 border-t border-line sm:-mx-6 sm:-mb-6">
              <ActivityFeed events={history} />
            </div>
          </ProfileSection>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <ProfileSection
            title="Access"
            description={
              profile.isOwner
                ? "The academy owner is always a permanent admin."
                : "Admins see and manage every teacher, student, and parent."
            }
          >
            {profile.isOwner ? (
              <AdminPill isOwner />
            ) : teacher.status !== "active" ? (
              <p className="text-sm text-content-muted">Reactivate this account before changing access.</p>
            ) : (
              <AdminAccessForm
                teacherId={teacher.id}
                current={accessValue}
                until={toDateInputValue(teacher.roleExpiresAt)}
              />
            )}
            {teacher.roleExpiresAt && profile.role === "admin" ? (
              <p className="text-xs text-content-subtle">Admin access ends {formatDate(teacher.roleExpiresAt)}.</p>
            ) : null}
          </ProfileSection>

          <ProfileSection title="Details">
            <PersonDetailsForm
              role="teacher"
              id={teacher.id}
              defaults={{ name: teacher.name, email: teacher.email }}
              lockEmail={profile.isOwner}
              disabled={ownerLocked}
            />
          </ProfileSection>

          <ProfileSection
            title="Hand over teaching"
            description="Moves batches with their students, material and marks. Use this before suspending a teacher who is leaving."
          >
            <TransferTeachingForm
              fromTeacherId={teacher.id}
              fromName={teacher.name}
              batches={profile.batches.map((batch) => ({
                id: batch.id,
                label: batch.name,
                detail: `${batch.studentCount} students`,
              }))}
              teachers={teacherOptions.filter((option) => option.active && option.id !== teacher.id)}
            />
          </ProfileSection>

          {profile.assignedLeads.length > 0 ? (
            <ProfileSection title="Assigned leads">
              <ul className="flex flex-col gap-2 text-sm">
                {profile.assignedLeads.map((lead) => (
                  <li key={lead.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">{lead.studentName} · {lead.className}</span>
                    <StatusPill size="sm" tone={lead.status === "new" ? "highlight" : "success"}>
                      {LEAD_STATUS_LABELS[lead.status]}
                    </StatusPill>
                  </li>
                ))}
              </ul>
            </ProfileSection>
          ) : null}

          <ProfileSection title="Account">
            <AccountActions
              role="teacher"
              id={teacher.id}
              name={teacher.name}
              status={teacher.status}
              canReset={!self && !ownerLocked}
              canChangeStatus={!self && !profile.isOwner}
              lockedReason={
                self
                  ? "This is your own account. Another admin can suspend or reset it."
                  : profile.isOwner
                    ? "The academy owner's account can't be suspended."
                    : undefined
              }
            />
          </ProfileSection>
        </div>
      </div>
    </div>
  );
}
