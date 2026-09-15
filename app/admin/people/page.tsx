import type { Metadata } from "next";
import Link from "next/link";
import { Download, Search, UserPlus, Users, X } from "lucide-react";
import { cn } from "cn";
import { AccountStatusPill, AdminPill, StudentFlagPills } from "@/components/admin/account-pills";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { SELECT_CLASS_NAME } from "@/lib/academics";
import { relativeDay } from "@/lib/admin/format";
import {
  listAllBatches,
  listPeople,
  listTeacherOptions,
  parsePeopleFilter,
  type PeopleFilter,
} from "@/lib/admin/queries";
import { STUDENT_FLAG_LABELS } from "@/lib/admin/signals";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "People",
};

type SearchParams = Record<string, string | string[] | undefined>;

const roleTabs = [
  { value: "all", label: "Everyone" },
  { value: "teacher", label: "Teachers" },
  { value: "student", label: "Students" },
  { value: "parent", label: "Parents" },
  { value: "admin", label: "Admins" },
] as const;

const roleTone = { teacher: "brand", student: "info", parent: "highlight" } as const;

function filterHref(filter: PeopleFilter, patch: Partial<PeopleFilter>) {
  const next = { ...filter, ...patch };
  const params = new URLSearchParams();
  if (next.role && next.role !== "all") params.set("role", next.role);
  if (next.status && next.status !== "all") params.set("status", next.status);
  if (next.q) params.set("q", next.q);
  if (next.teacherId) params.set("teacherId", next.teacherId);
  if (next.batchId) params.set("batchId", next.batchId);
  if (next.flag) params.set("flag", next.flag);
  const search = params.toString();
  return search ? `/admin/people?${search}` : "/admin/people";
}

export default async function PeoplePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const filter = parsePeopleFilter(await searchParams);
  const [{ people, counts }, teacherOptions, batchOptions] = await Promise.all([
    listPeople(filter),
    listTeacherOptions(),
    listAllBatches(),
  ]);

  const exportHref = filterHref(filter, {}).replace("/admin/people", "/api/admin/export/people.csv");
  const narrowed = Boolean(filter.q || filter.teacherId || filter.batchId || filter.flag || filter.status !== "all");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Directory"
        title="People"
        description="Everyone with a login at the academy. Filter to one kind of account, open a profile to change access, or add someone new."
        actions={
          <>
            <Button asChild variant="outline" size="lg">
              <a href={exportHref}>
                <Download data-icon="inline-start" />
                Export CSV
              </a>
            </Button>
            <Button asChild size="lg">
              <Link
                href={
                  filter.role === "teacher" || filter.role === "student" || filter.role === "parent"
                    ? `/admin/people/new?role=${filter.role}`
                    : "/admin/people/new"
                }
              >
                <UserPlus data-icon="inline-start" />
                Add person
              </Link>
            </Button>
          </>
        }
      />

      <nav aria-label="Account type" className="-mx-1 overflow-x-auto px-1">
        <ul className="flex w-fit gap-1 rounded-xl bg-sunken p-1 ring-1 ring-line">
          {roleTabs.map((tab) => {
            const active = (filter.role ?? "all") === tab.value;
            return (
              <li key={tab.value}>
                <Link
                  href={filterHref(filter, { role: tab.value, flag: tab.value === "student" || tab.value === "all" ? filter.flag : undefined })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors duration-(--dur-fast) focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    active
                      ? "bg-surface text-content shadow-elevation-xs ring-1 ring-line"
                      : "text-content-muted hover:text-content",
                  )}
                >
                  {tab.label}
                  <span className="tabular rounded-full bg-sunken px-1.5 text-xs text-content-subtle">
                    {counts[tab.value]}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Surface pad="sm">
        <form method="get" action="/admin/people" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto] lg:items-end">
          {filter.role && filter.role !== "all" ? <input type="hidden" name="role" value={filter.role} /> : null}
          {filter.flag ? <input type="hidden" name="flag" value={filter.flag} /> : null}
          <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="people-q">Search</Label>
            <div className="relative">
              <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-content-subtle" />
              <Input id="people-q" name="q" defaultValue={filter.q} placeholder="Name, email, phone or batch" className="h-9 pl-8" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="people-status">Status</Label>
            <select id="people-status" name="status" defaultValue={filter.status} className={cn(SELECT_CLASS_NAME, "h-9")}>
              <option value="all">Any status</option>
              <option value="active">Active</option>
              <option value="not_signed_in">Not signed in yet</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="people-teacher">Teacher</Label>
            <select id="people-teacher" name="teacherId" defaultValue={filter.teacherId ?? ""} className={cn(SELECT_CLASS_NAME, "h-9")}>
              <option value="">Any teacher</option>
              {teacherOptions.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                  {teacher.active ? "" : " (suspended)"}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="people-batch">Batch</Label>
            <select id="people-batch" name="batchId" defaultValue={filter.batchId ?? ""} className={cn(SELECT_CLASS_NAME, "h-9")}>
              <option value="">Any batch</option>
              {batchOptions.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="secondary" size="lg" className="h-9">
            Apply
          </Button>
        </form>
        {narrowed ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3 text-sm text-content-muted">
            Showing {people.length} of {counts[filter.role ?? "all"]}
            {filter.flag ? (
              <StatusPill tone="warning" size="sm">
                {STUDENT_FLAG_LABELS[filter.flag]}
              </StatusPill>
            ) : null}
            <Link
              href={filterHref({ role: filter.role }, {})}
              className="ml-auto inline-flex items-center gap-1 font-medium text-brand hover:underline"
            >
              <X aria-hidden="true" className="size-3.5" />
              Clear filters
            </Link>
          </div>
        ) : null}
      </Surface>

      {people.length === 0 ? (
        <EmptyState
          icon={<Users />}
          title={narrowed ? "No one matches these filters" : "No one here yet"}
          description={
            narrowed
              ? "Try a different search, or clear the filters to see everyone."
              : "Add a teacher, student, or parent to give them a login."
          }
          action={
            <Button asChild size="lg">
              <Link href={narrowed ? filterHref({ role: filter.role }, {}) : "/admin/people/new"}>
                {narrowed ? "Clear filters" : "Add person"}
              </Link>
            </Button>
          }
        />
      ) : (
        <Surface pad="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-sm">
              <caption className="sr-only">People matching the current filters</caption>
              <thead className="bg-sunken/70">
                <tr className="text-left text-xs tracking-wide text-content-subtle uppercase">
                  <th scope="col" className="px-5 py-3 font-medium">Name</th>
                  <th scope="col" className="px-3 py-3 font-medium">Type</th>
                  <th scope="col" className="px-3 py-3 font-medium">Belongs to</th>
                  <th scope="col" className="px-3 py-3 font-medium">Status</th>
                  <th scope="col" className="px-5 py-3 font-medium">Last sign-in</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {people.map((person) => (
                  <tr key={`${person.role}-${person.id}`} className="align-top transition-colors hover:bg-sunken/50">
                    <td className="px-5 py-3">
                      <Link href={person.href} className="font-medium text-content hover:underline">
                        {person.name}
                      </Link>
                      <span className="block font-mono text-xs text-content-subtle">{person.email}</span>
                      {person.isAdmin || person.flags.length > 0 ? (
                        <span className="mt-1.5 flex flex-wrap gap-1">
                          {person.isAdmin ? <AdminPill isOwner={person.isOwner} until={person.adminUntil} /> : null}
                          <StudentFlagPills flags={person.flags} />
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill tone={roleTone[person.role]} size="sm" className="capitalize">
                        {person.role}
                      </StatusPill>
                    </td>
                    <td className="max-w-64 px-3 py-3 text-content-muted">
                      {person.context.join(" · ")}
                    </td>
                    <td className="px-3 py-3">
                      <AccountStatusPill status={person.status} mustChangePassword={person.mustChangePassword} />
                    </td>
                    <td className="tabular px-5 py-3 whitespace-nowrap text-content-muted">
                      {relativeDay(person.lastLoginAt) ?? "Never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>
      )}
    </div>
  );
}
