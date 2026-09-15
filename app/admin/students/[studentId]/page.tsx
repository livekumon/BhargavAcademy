import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountStatusPill, StudentFlagPills } from "@/components/admin/account-pills";
import { AccountActions, PersonDetailsForm, StudentBatchesForm } from "@/components/admin/profile-forms";
import { CreatedNotice, FactList, ProfileSection } from "@/components/admin/profile-parts";
import { PageHeader } from "@/components/layout/page-header";
import { MarksTimeline } from "@/components/marks-timeline";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ProgressMeter } from "@/components/ui/progress-meter";
import { relativeDay } from "@/lib/admin/format";
import { getStudentProfile } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/auth";
import { getLookupCatalog, lookupChoices } from "@/lib/lookups";
import { getStudentMarkEntries } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Student",
};

function Completion({ label, done, total }: { label: string; done: number; total: number }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-content-muted">{label}</span>
        <span className="tabular font-medium">{total === 0 ? "Nothing assigned" : `${done} of ${total}`}</span>
      </div>
      <ProgressMeter value={pct} label={`${label}: ${done} of ${total}`} tone={pct === 100 ? "success" : "info"} />
    </div>
  );
}

export default async function AdminStudentPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  await requireAdmin();
  const studentId = decodeURIComponent((await params).studentId);
  const { notice } = await searchParams;
  const [profile, catalog, marks] = await Promise.all([
    getStudentProfile(studentId),
    getLookupCatalog(),
    getStudentMarkEntries(studentId),
  ]);
  if (!profile) notFound();

  const { student } = profile;
  const syllabuses = lookupChoices(catalog.syllabus);
  const exams = lookupChoices(catalog.exam);
  const examPapers = lookupChoices(catalog.exam_paper);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={<Breadcrumb items={[{ label: "People", href: "/admin/people?role=student" }, { label: student.name }]} />}
        eyebrow="Student"
        title={student.name}
        description={<span className="font-mono text-sm">{student.email}</span>}
        actions={
          <div className="flex flex-wrap gap-2">
            <StudentFlagPills flags={profile.flags} />
            <AccountStatusPill status={student.status} mustChangePassword={student.mustChangePassword} />
          </div>
        }
      />
      <CreatedNotice notice={notice} email={student.email} />

      <FactList
        facts={[
          { label: "Phone", value: student.contactNumber },
          { label: "Batches", value: profile.batches.length },
          {
            label: "Parent",
            value: profile.parent ? (
              <Link href={`/admin/parents/${profile.parent.id}`} className="hover:underline">{profile.parent.name}</Link>
            ) : (
              "Not linked"
            ),
          },
          { label: "Last sign-in", value: relativeDay(student.lastLoginAt) ?? "Never" },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <ProfileSection title="Progress">
            <div className="grid gap-4 sm:grid-cols-2">
              <Completion label="Class material revised" done={profile.classMaterial.done} total={profile.classMaterial.total} />
              <Completion label="Assignments submitted" done={profile.assignments.done} total={profile.assignments.total} />
            </div>
          </ProfileSection>

          <ProfileSection title="Marks" description="Every mark logged by this student's teachers.">
            <MarksTimeline entries={marks} showContext syllabuses={syllabuses} examPapers={examPapers} />
          </ProfileSection>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <ProfileSection
            title="Batches"
            description={
              profile.batches.length > 0
                ? `Taught by ${[...new Set(profile.batches.map((batch) => batch.teacherName))].join(", ")}.`
                : undefined
            }
          >
            <StudentBatchesForm
              studentId={student.id}
              selected={profile.batches.map((batch) => batch.id)}
              batches={profile.allBatches.map((batch) => ({
                id: batch.id,
                label: batch.name,
                detail: batch.teacherName ? `Teacher: ${batch.teacherName}` : undefined,
              }))}
            />
          </ProfileSection>

          <ProfileSection title="Details">
            <PersonDetailsForm
              role="student"
              id={student.id}
              defaults={{
                name: student.name,
                email: student.email,
                phone: student.contactNumber,
                syllabus: student.syllabus,
                exam: student.exam,
              }}
              syllabuses={syllabuses}
              exams={exams}
            />
          </ProfileSection>

          <ProfileSection title="Account">
            <AccountActions
              role="student"
              id={student.id}
              name={student.name}
              status={student.status}
              canReset
              canChangeStatus
            />
          </ProfileSection>
        </div>
      </div>
    </div>
  );
}
