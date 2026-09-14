"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ParentState } from "@/lib/actions/parents";
import { ACADEMY_EMAIL_DOMAIN, academyEmailLocalPart } from "@/lib/identity";
import type { ParentDirectoryStudent } from "@/lib/queries";

const CHECK_CLASS =
  "size-4 shrink-0 rounded border-input accent-primary focus-visible:ring-3 focus-visible:ring-ring/50";

export function ParentForm({
  action,
  students,
  parentId,
  defaultValues,
  submitLabel,
  cancelHref,
}: {
  action: (state: ParentState, formData: FormData) => Promise<ParentState>;
  students: ParentDirectoryStudent[];
  parentId?: string;
  defaultValues?: {
    name: string;
    email: string;
    studentIds: string[];
  };
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const isEdit = Boolean(defaultValues);
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(defaultValues?.studentIds ?? []),
  );

  const previewLocal = academyEmailLocalPart(name || "parent");
  const emailPreview = `${previewLocal}@${ACADEMY_EMAIL_DOMAIN}`;

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return students;
    return students.filter((student) => {
      const haystack = [
        student.name,
        student.email,
        ...student.batches.map((batch) => batch.name),
        student.currentParent?.name ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [query, students]);

  return (
    <form action={formAction} className="space-y-6">
      {[...selected].map((studentId) => (
        <input key={studentId} type="hidden" name="studentIds" value={studentId} />
      ))}
      <div className="space-y-2">
        <Label htmlFor="name">Parent name</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Priya Sharma"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Login email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={defaultValues?.email}
          placeholder={emailPreview}
          required={isEdit}
        />
        <p className="text-xs text-content-muted">
          {isEdit
            ? "This is the email they use to sign in."
            : `Leave blank to generate a unique @${ACADEMY_EMAIL_DOMAIN} email from the name, like ${emailPreview}.`}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">
          {isEdit ? "New password" : "Password"}
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder={
            isEdit
              ? "Leave blank to keep the current password"
              : "Leave blank to use 123456. They must change it on first login."
          }
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">
          Students
          {selected.size > 0 ? ` · ${selected.size} selected` : ""}
        </legend>
        <p className="text-xs text-content-muted">
          A student can only belong to one parent login. Assigning them here
          moves them from any other parent.
        </p>
        {students.length === 0 ? (
          <p className="rounded-lg bg-sunken px-3 py-2 text-sm text-content-muted">
            Add students first, then come back to link them to a parent.
          </p>
        ) : (
          <>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-content-subtle"
              />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search students"
                className="pl-9"
              />
            </div>
            <div className="max-h-80 space-y-1 overflow-y-auto rounded-xl ring-1 ring-line">
              {filtered.length === 0 ? (
                <p className="px-3 py-4 text-sm text-content-muted">
                  No students match that search.
                </p>
              ) : (
                filtered.map((student) => {
                  const otherParent =
                    student.currentParent &&
                    student.currentParent.id !== parentId
                      ? student.currentParent
                      : null;
                  return (
                    <label
                      key={student.id}
                      className="flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-sunken"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(student.id)}
                        onChange={(event) => {
                          setSelected((current) => {
                            const next = new Set(current);
                            if (event.target.checked) next.add(student.id);
                            else next.delete(student.id);
                            return next;
                          });
                        }}
                        className={`mt-1 ${CHECK_CLASS}`}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">
                          {student.name}
                        </span>
                        <span className="block text-xs text-content-muted">
                          {student.email}
                          {student.batches.length > 0
                            ? ` · ${student.batches.map((batch) => batch.name).join(", ")}`
                            : ""}
                        </span>
                        {otherParent ? (
                          <span className="mt-1 block text-xs text-warning-subtle-fg">
                            Currently linked to {otherParent.name}. Saving will
                            move them here.
                          </span>
                        ) : null}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </>
        )}
      </fieldset>

      {state.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending || students.length === 0}>
          {pending ? "Saving..." : submitLabel}
        </Button>
        <Button asChild variant="outline">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
