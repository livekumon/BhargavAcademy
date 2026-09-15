"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { optionLabel, type LookupChoice } from "@/lib/academics";
import { enrollDirectoryStudents } from "@/lib/actions/students";
import { batchPath } from "@/lib/paths";
import { cn } from "@/lib/utils";

const CHECK_CLASS =
  "size-4 shrink-0 rounded border-input accent-(--brand) focus-visible:ring-3 focus-visible:ring-ring/50";

export type EnrollableStudent = {
  id: string;
  name: string;
  email: string;
  contactNumber: string;
  syllabus: string;
  exam: string;
  batches: { id: string; name: string }[];
};

export function EnrollBatchStudentsForm({
  students,
  batchId,
  syllabuses,
  exams,
  cancelHref,
}: {
  students: EnrollableStudent[];
  batchId: string;
  syllabuses: LookupChoice[];
  exams: LookupChoice[];
  cancelHref: string;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return students;
    return students.filter((student) =>
      [student.name, student.email, student.contactNumber]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [query, students]);

  const selectedVisible = selected.filter((id) =>
    filtered.some((student) => student.id === id),
  );
  const allVisibleSelected =
    filtered.length > 0 &&
    filtered.every((student) => selected.includes(student.id));

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
        return current.filter(
          (id) => !filtered.some((student) => student.id === id),
        );
      }
      const next = new Set(current);
      for (const student of filtered) next.add(student.id);
      return [...next];
    });
  }

  return (
    <form action={enrollDirectoryStudents} className="space-y-5">
      <input type="hidden" name="batchId" value={batchId} />
      <input type="hidden" name="next" value={batchPath(batchId)} />
      {selectedVisible.map((id) => (
        <input key={id} type="hidden" name="studentIds" value={id} />
      ))}

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-content-subtle" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name, email, or phone"
          className="pl-8"
          aria-label="Search students"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className={CHECK_CLASS}
            checked={allVisibleSelected}
            onChange={toggleAllVisible}
          />
          Select all
        </label>
        <p className="text-sm text-content-muted">
          {filtered.length} of {students.length}{" "}
          {students.length === 1 ? "student" : "students"}
          {selectedVisible.length > 0
            ? ` · ${selectedVisible.length} selected`
            : ""}
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl bg-surface px-4 py-8 text-center text-sm text-content-muted ring-1 ring-line">
          No students match this search.
        </p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl bg-surface ring-1 ring-line">
          {filtered.map((student) => {
            const isSelected = selected.includes(student.id);
            return (
              <li key={student.id}>
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 px-4 py-3",
                    isSelected && "bg-brand-subtle/40",
                  )}
                >
                  <input
                    type="checkbox"
                    className={cn(CHECK_CLASS, "mt-1")}
                    checked={isSelected}
                    onChange={() => toggle(student.id)}
                    aria-label={`Select ${student.name}`}
                  />
                  <span className="min-w-0">
                    <span className="block font-medium">{student.name}</span>
                    <span className="mt-0.5 block text-sm text-content-muted">
                      {student.email}
                      {student.syllabus || student.exam
                        ? ` · ${optionLabel(syllabuses, student.syllabus) || "No syllabus"} · ${optionLabel(exams, student.exam) || "No exam"}`
                        : ""}
                    </span>
                    {student.batches.length > 0 ? (
                      <span className="mt-0.5 block text-xs text-content-subtle">
                        Already in {student.batches.map((batch) => batch.name).join(", ")}
                      </span>
                    ) : null}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={selectedVisible.length === 0}>
          {selectedVisible.length === 0
            ? "Add selected students"
            : `Add ${selectedVisible.length} ${selectedVisible.length === 1 ? "student" : "students"}`}
        </Button>
        <Button asChild variant="outline">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
