"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SELECT_CLASS_NAME } from "@/lib/academics";
import { createBatch, type BatchState } from "@/lib/actions/batches";
import { cn } from "@/lib/utils";
import type { EnrollableStudent } from "@/components/enroll-batch-students-form";

const CHECK_CLASS =
  "size-4 shrink-0 rounded border-input accent-(--brand) focus-visible:ring-3 focus-visible:ring-ring/50";

export function CreateBatchWizard({
  courses,
  students,
  cancelHref,
}: {
  courses: { id: string; title: string; chapterCount: number }[];
  students: EnrollableStudent[];
  cancelHref: string;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [courseId, setCourseId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [state, formAction, pending] = useActionState(createBatch, {});

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

  function goToStudents(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim().length < 2) return;
    if (!courseId) return;
    setStep(2);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-content-muted">
        Step {step} of 2 · {step === 1 ? "Course and name" : "Students (optional)"}
      </p>

      {step === 1 ? (
        <form onSubmit={goToStudents} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="courseId">Course</Label>
            <select
              id="courseId"
              required
              className={SELECT_CLASS_NAME}
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
            >
              <option value="" disabled>
                Choose a course
              </option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title} · {course.chapterCount}{" "}
                  {course.chapterCount === 1 ? "chapter" : "chapters"}
                </option>
              ))}
            </select>
            <p className="text-xs text-content-subtle">
              Required. A batch can only be linked to one course.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Batch name</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Grade 10 Morning"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="When this batch meets, and who it is for."
              rows={4}
            />
          </div>

          {state.error ? (
            <p className="rounded-lg bg-danger-subtle px-3 py-2 text-sm text-danger-subtle-fg">
              {state.error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit">Continue</Button>
            <Button asChild variant="outline">
              <Link href={cancelHref}>Cancel</Link>
            </Button>
          </div>
        </form>
      ) : (
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="courseId" value={courseId} />
          <input type="hidden" name="name" value={name} />
          <input type="hidden" name="description" value={description} />
          {selected.map((id) => (
            <input key={id} type="hidden" name="studentIds" value={id} />
          ))}

          {students.length === 0 ? (
            <p className="rounded-xl bg-surface px-4 py-6 text-sm text-content-muted ring-1 ring-line">
              No students in your directory yet. Create the batch now, then add
              people from the Students tab.
            </p>
          ) : (
            <>
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
                  {selectedVisible.length} selected · optional
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
                            <span className="block font-medium">
                              {student.name}
                            </span>
                            <span className="mt-0.5 block text-sm text-content-muted">
                              {student.email}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}

          {state.error ? (
            <p className="rounded-lg bg-danger-subtle px-3 py-2 text-sm text-danger-subtle-fg">
              {state.error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Creating..." : "Create batch"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
          </div>
          <p className="text-xs text-content-subtle">
            You can skip students and enroll them later from the batch.
          </p>
        </form>
      )}
    </div>
  );
}
