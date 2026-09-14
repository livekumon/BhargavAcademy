"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutGrid,
  List,
  Plus,
  Search,
  Table2,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { StudentActions } from "@/components/student-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusPill } from "@/components/ui/status-pill";
import { optionLabel, type LookupChoice } from "@/lib/academics";
import {
  deleteDirectoryStudents,
  enrollDirectoryStudents,
} from "@/lib/actions/students";
import { newStudentPath, studentManagePath, studentsPath } from "@/lib/paths";
import { cn } from "@/lib/utils";

export type DirectoryStudent = {
  id: string;
  name: string;
  email: string;
  contactNumber: string;
  syllabus: string;
  exam: string;
  batches: { id: string; name: string }[];
};

export type DirectoryView = "cards" | "list" | "table";

const CHECK_CLASS =
  "size-4 shrink-0 rounded border-input accent-(--brand) focus-visible:ring-3 focus-visible:ring-ring/50";

const FILTER_SELECT =
  "h-10 min-w-0 rounded-lg border border-input bg-raised px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 lg:w-40";

export function parseDirectoryView(value: string | string[] | undefined): DirectoryView {
  const view = Array.isArray(value) ? value[0] : value;
  return view === "list" || view === "table" ? view : "cards";
}

function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

function AcademicPills({
  student,
  syllabuses,
  exams,
}: {
  student: DirectoryStudent;
  syllabuses: LookupChoice[];
  exams: LookupChoice[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {student.syllabus ? (
        <StatusPill tone="brand">
          {optionLabel(syllabuses, student.syllabus)}
        </StatusPill>
      ) : null}
      {student.exam ? (
        <StatusPill tone="highlight">
          {optionLabel(exams, student.exam)}
        </StatusPill>
      ) : null}
      <StatusPill tone="neutral">
        <Users />
        {plural(student.batches.length, "batch", "batches")}
      </StatusPill>
    </div>
  );
}

export function StudentDirectory({
  students,
  view: initialView,
  syllabuses,
  exams,
  batches,
}: {
  students: DirectoryStudent[];
  view: DirectoryView;
  syllabuses: LookupChoice[];
  exams: LookupChoice[];
  batches: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [view, setView] = useState<DirectoryView>(initialView);
  const [query, setQuery] = useState("");
  const [syllabus, setSyllabus] = useState("");
  const [exam, setExam] = useState("");
  const [batchId, setBatchId] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return students.filter((student) => {
      const haystack = [
        student.name,
        student.email,
        student.contactNumber,
      ]
        .join(" ")
        .toLowerCase();
      if (needle && !haystack.includes(needle)) return false;
      if (syllabus && student.syllabus !== syllabus) return false;
      if (exam && student.exam !== exam) return false;
      if (batchId && !student.batches.some((batch) => batch.id === batchId)) {
        return false;
      }
      return true;
    });
  }, [students, query, syllabus, exam, batchId]);

  const filteredIds = filtered.map((student) => student.id);
  const selectedVisible = selected.filter((id) => filteredIds.includes(id));
  const allVisibleSelected =
    filteredIds.length > 0 && selectedVisible.length === filteredIds.length;
  const filtering = Boolean(query.trim() || syllabus || exam || batchId);

  function changeView(next: DirectoryView) {
    setView(next);
    router.replace(`${studentsPath()}?view=${next}`, { scroll: false });
  }

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function toggleAllVisible() {
    setSelected((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !filteredIds.includes(id));
      }
      return [...new Set([...current, ...filteredIds])];
    });
  }

  function clearFilters() {
    setQuery("");
    setSyllabus("");
    setExam("");
    setBatchId("");
  }

  function clearSelection() {
    setSelected([]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1 lg:min-w-64">
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-content-subtle" />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email or phone"
            aria-label="Search students"
            className="h-10 bg-raised pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex">
          <select
            aria-label="Filter by batch"
            className={FILTER_SELECT}
            value={batchId}
            onChange={(event) => setBatchId(event.target.value)}
          >
            <option value="">All batches</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by syllabus"
            className={FILTER_SELECT}
            value={syllabus}
            onChange={(event) => setSyllabus(event.target.value)}
          >
            <option value="">All syllabuses</option>
            {syllabuses.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by exam"
            className={FILTER_SELECT}
            value={exam}
            onChange={(event) => setExam(event.target.value)}
          >
            <option value="">All exams</option>
            {exams.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          {filtering ? (
            <Button type="button" variant="ghost" size="lg" onClick={clearFilters} className="h-10">
              <X data-icon="inline-start" />
              Clear
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className={CHECK_CLASS}
              checked={allVisibleSelected}
              onChange={toggleAllVisible}
              disabled={filtered.length === 0}
              aria-label="Select all visible students"
            />
            Select all
          </label>
          <p className="text-sm text-content-muted">
            {filtering
              ? `${filtered.length} of ${plural(students.length, "student")}`
              : plural(students.length, "student")}
            {selectedVisible.length > 0
              ? ` · ${selectedVisible.length} selected`
              : ""}
          </p>
        </div>
        <div
          role="tablist"
          aria-label="Student views"
          className="inline-flex items-center gap-1 rounded-full bg-sunken p-1 ring-1 ring-line"
        >
          {(
            [
              { id: "cards", label: "Cards", icon: LayoutGrid },
              { id: "list", label: "List", icon: List },
              { id: "table", label: "Table", icon: Table2 },
            ] as const
          ).map((item) => {
            const active = view === item.id;
            return (
              <Button
                key={item.id}
                type="button"
                variant={active ? "secondary" : "ghost"}
                size="icon-sm"
                aria-label={item.label}
                title={item.label}
                aria-selected={active}
                onClick={() => changeView(item.id)}
              >
                <item.icon />
              </Button>
            );
          })}
        </div>
      </div>

      {selectedVisible.length > 0 ? (
        <div role="region" aria-label="Bulk actions" className="sticky bottom-20 z-30 flex flex-wrap items-end gap-3 rounded-xl bg-raised px-4 py-3 shadow-elevation-lg ring-1 ring-brand-line lg:bottom-4">
          <p className="tabular w-full text-sm font-medium sm:w-auto sm:self-center">
            {selectedVisible.length} selected
          </p>
          <form
            action={enrollDirectoryStudents}
            className="flex flex-wrap items-end gap-2"
          >
            {selectedVisible.map((id) => (
              <input key={id} type="hidden" name="studentIds" value={id} />
            ))}
            <input
              type="hidden"
              name="next"
              value={`${studentsPath()}?view=${view}`}
            />
            <div className="min-w-48 space-y-1.5">
              <Label htmlFor="bulk-batch">Enrol in</Label>
              <select
                id="bulk-batch"
                name="batchId"
                required
                className={FILTER_SELECT}
                defaultValue=""
              >
                <option value="" disabled>
                  Choose a batch
                </option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" size="lg">
              Enrol
            </Button>
          </form>
          <form action={deleteDirectoryStudents}>
            {selectedVisible.map((id) => (
              <input key={id} type="hidden" name="studentIds" value={id} />
            ))}
            <input
              type="hidden"
              name="next"
              value={`${studentsPath()}?view=${view}`}
            />
            <ConfirmSubmitButton
              title={`Delete ${selectedVisible.length} student${selectedVisible.length === 1 ? "" : "s"}?`}
              message="They're removed from every batch and can no longer sign in."
              consequences={["Their progress, submitted work and marks are deleted.", "Parent logins stay, but won't show these students."]}
              confirmLabel="Delete students"
              variant="ghost"
              size="lg"
            >
              <Trash2 data-icon="inline-start" />
              Delete selected
            </ConfirmSubmitButton>
          </form>
          <Button type="button" variant="ghost" size="lg" onClick={clearSelection}>
            Clear selection
          </Button>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <p className="rounded-xl bg-surface px-4 py-8 text-center text-sm text-content-muted ring-1 ring-line">
          No students match these filters.
        </p>
      ) : view === "cards" ? (
        <StudentCards
          students={filtered}
          syllabuses={syllabuses}
          exams={exams}
          selected={selected}
          onToggle={toggle}
        />
      ) : view === "list" ? (
        <StudentList
          students={filtered}
          syllabuses={syllabuses}
          exams={exams}
          selected={selected}
          onToggle={toggle}
        />
      ) : (
        <StudentTable
          students={filtered}
          syllabuses={syllabuses}
          exams={exams}
          selected={selected}
          allVisibleSelected={allVisibleSelected}
          onToggle={toggle}
          onToggleAll={toggleAllVisible}
        />
      )}
    </div>
  );
}

function StudentCards({
  students,
  syllabuses,
  exams,
  selected,
  onToggle,
}: {
  students: DirectoryStudent[];
  syllabuses: LookupChoice[];
  exams: LookupChoice[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {students.map((student) => {
        const isSelected = selected.includes(student.id);
        return (
          <li
            key={student.id}
            className={cn(
              "flex h-full flex-col gap-5 rounded-xl bg-surface p-5 ring-1 transition-colors sm:p-6",
              isSelected ? "ring-brand-line bg-brand-subtle/40" : "ring-line",
            )}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                className={cn(CHECK_CLASS, "mt-1")}
                checked={isSelected}
                onChange={() => onToggle(student.id)}
                aria-label={`Select ${student.name}`}
              />
              <div className="min-w-0">
                <h2 className="font-heading truncate text-title-2 font-semibold">
                  <Link href={studentManagePath(student.id)} className="hover:underline">
                    {student.name}
                  </Link>
                </h2>
                <p className="mt-1 truncate text-sm text-content-muted">
                  {student.email}
                </p>
                <p className="mt-0.5 text-sm text-content-subtle">
                  {student.contactNumber}
                </p>
              </div>
            </div>
            <AcademicPills student={student} syllabuses={syllabuses} exams={exams} />
            <p className="line-clamp-2 text-sm text-content-muted">
              {student.batches.map((batch) => batch.name).join(" · ")}
            </p>
            <div className="mt-auto flex items-center justify-between border-t border-line pt-4">
              <StudentActions student={student} />
            </div>
          </li>
        );
      })}
      <li>
        <AddStudentTile className="min-h-56" />
      </li>
    </ul>
  );
}

function StudentList({
  students,
  syllabuses,
  exams,
  selected,
  onToggle,
}: {
  students: DirectoryStudent[];
  syllabuses: LookupChoice[];
  exams: LookupChoice[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {students.map((student) => {
        const isSelected = selected.includes(student.id);
        return (
          <li
            key={student.id}
            className={cn(
              "flex flex-wrap items-center gap-4 rounded-xl bg-surface px-4 py-3 ring-1 sm:px-5",
              isSelected ? "ring-brand-line bg-brand-subtle/40" : "ring-line",
            )}
          >
            <input
              type="checkbox"
              className={CHECK_CLASS}
              checked={isSelected}
              onChange={() => onToggle(student.id)}
              aria-label={`Select ${student.name}`}
            />
            <div className="min-w-48 flex-1">
              <Link href={studentManagePath(student.id)} className="font-heading font-semibold hover:underline">
                {student.name}
              </Link>
              <p className="truncate text-sm text-content-muted">
                {student.email} · {student.contactNumber}
              </p>
            </div>
            <AcademicPills student={student} syllabuses={syllabuses} exams={exams} />
            <p className="max-w-64 truncate text-sm text-content-muted">
              {student.batches.map((batch) => batch.name).join(" · ")}
            </p>
            <div className="ml-auto">
              <StudentActions student={student} />
            </div>
          </li>
        );
      })}
      <li>
        <AddStudentTile className="min-h-20 flex-row justify-center py-4" compact />
      </li>
    </ul>
  );
}

function StudentTable({
  students,
  syllabuses,
  exams,
  selected,
  allVisibleSelected,
  onToggle,
  onToggleAll,
}: {
  students: DirectoryStudent[];
  syllabuses: LookupChoice[];
  exams: LookupChoice[];
  selected: string[];
  allVisibleSelected: boolean;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl bg-surface ring-1 ring-line">
      <table className="w-full text-sm">
        <thead className="border-b border-line bg-sunken/60 text-left text-xs tracking-wide text-content-subtle uppercase">
          <tr>
            <th className="w-10 px-4 py-3">
              <input
                type="checkbox"
                className={CHECK_CLASS}
                checked={allVisibleSelected}
                onChange={onToggleAll}
                aria-label="Select all visible students"
              />
            </th>
            <th className="px-4 py-3 font-medium">Student</th>
            <th className="hidden px-4 py-3 font-medium sm:table-cell">Contact</th>
            <th className="hidden px-4 py-3 font-medium md:table-cell">Syllabus</th>
            <th className="hidden px-4 py-3 font-medium md:table-cell">Exam</th>
            <th className="hidden px-4 py-3 font-medium lg:table-cell">Batches</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => {
            const isSelected = selected.includes(student.id);
            return (
              <tr
                key={student.id}
                className={cn(
                  "border-t border-line",
                  isSelected && "bg-brand-subtle/40",
                )}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    className={CHECK_CLASS}
                    checked={isSelected}
                    onChange={() => onToggle(student.id)}
                    aria-label={`Select ${student.name}`}
                  />
                </td>
                <td className="px-4 py-3">
                  <Link href={studentManagePath(student.id)} className="font-medium hover:underline">
                    {student.name}
                  </Link>
                  <p className="text-xs text-content-muted sm:hidden">
                    {student.email}
                  </p>
                </td>
                <td className="hidden px-4 py-3 text-content-muted sm:table-cell">
                  <p>{student.email}</p>
                  <p className="text-xs text-content-subtle">
                    {student.contactNumber}
                  </p>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  {optionLabel(syllabuses, student.syllabus) || "—"}
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  {optionLabel(exams, student.exam) || "—"}
                </td>
                <td className="hidden px-4 py-3 text-content-muted lg:table-cell">
                  {student.batches.map((batch) => batch.name).join(", ")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <StudentActions student={student} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AddStudentTile({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={newStudentPath()}
      className={cn(
        "flex h-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-line-strong p-6 text-center text-content-muted transition-colors duration-(--dur-base) hover:border-brand-line hover:bg-brand-subtle/50 hover:text-brand focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        className,
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-sunken">
        <Plus aria-hidden="true" className="size-5" />
      </span>
      <span className="font-medium">Add a student</span>
      {compact ? null : (
        <span className="max-w-56 text-sm text-content-subtle">
          Name, login, syllabus, exam, and the first batch they join.
        </span>
      )}
    </Link>
  );
}
