"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "radix-ui";
import {
  BookMarked,
  CornerDownLeft,
  FileUp,
  GraduationCap,
  HeartHandshake,
  LayoutGrid,
  Plus,
  Search,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { allTeacherNavItems } from "./nav";

export type PaletteIndex = {
  batches: { id: string; name: string; courseTitle: string | null }[];
  students: { id: string; name: string; email: string }[];
  courses: { id: string; title: string }[];
  parents: { id: string; name: string; email: string }[];
};

type Entry = {
  id: string;
  group: string;
  label: string;
  hint?: string;
  href: string;
  icon: LucideIcon;
  keywords: string;
};

export const OPEN_PALETTE_EVENT = "teacher:open-command-palette";

export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_PALETTE_EVENT));
}

const MAX_PER_GROUP = 6;

/**
 * ⌘K / Ctrl+K: jump to any batch, student, course or parent, or start a
 * common task, without clicking through the sidebar.
 */
export function CommandPalette({ index }: { index: PaletteIndex }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const entries = useMemo<Entry[]>(
    () => [
      { id: "new-batch", group: "Actions", label: "Create a batch", href: "/dashboard/batches/new", icon: Plus, keywords: "new batch add" },
      { id: "new-student", group: "Actions", label: "Add a student", href: "/dashboard/students/new", icon: Plus, keywords: "new student enroll admission" },
      { id: "new-parent", group: "Actions", label: "Create a parent login", href: "/dashboard/parents/new", icon: Plus, keywords: "new parent login" },
      { id: "new-course", group: "Actions", label: "Create a course", href: "/dashboard/courses/new", icon: Plus, keywords: "new course library" },
      ...index.batches.map((batch) => ({
        id: `upload-${batch.id}`,
        group: "Actions",
        label: `Upload material to ${batch.name}`,
        href: `/dashboard/batches/${batch.id}?tab=chapters`,
        icon: FileUp,
        keywords: `upload pdf material ${batch.name}`,
      })),
      ...allTeacherNavItems.map((item) => ({
        id: `nav-${item.href}`,
        group: "Go to",
        label: item.label,
        href: item.href,
        icon: item.icon,
        keywords: item.label,
      })),
      ...index.batches.map((batch) => ({
        id: `batch-${batch.id}`,
        group: "Batches",
        label: batch.name,
        hint: batch.courseTitle ?? "No course",
        href: `/dashboard/batches/${batch.id}`,
        icon: LayoutGrid,
        keywords: `${batch.name} ${batch.courseTitle ?? ""}`,
      })),
      ...index.students.map((student) => ({
        id: `student-${student.id}`,
        group: "Students",
        label: student.name,
        hint: student.email,
        href: `/dashboard/students/${student.id}`,
        icon: GraduationCap,
        keywords: `${student.name} ${student.email}`,
      })),
      ...index.courses.map((course) => ({
        id: `course-${course.id}`,
        group: "Courses",
        label: course.title,
        href: `/dashboard/courses/${course.id}`,
        icon: BookMarked,
        keywords: course.title,
      })),
      ...index.parents.map((parent) => ({
        id: `parent-${parent.id}`,
        group: "Parents",
        label: parent.name,
        hint: parent.email,
        href: `/dashboard/parents/${parent.id}`,
        icon: HeartHandshake,
        keywords: `${parent.name} ${parent.email}`,
      })),
    ],
    [index],
  );

  const results = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const matching = entries.filter((entry) => {
      if (terms.length === 0) return entry.group === "Actions" || entry.group === "Go to";
      const haystack = entry.keywords.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
    const counts = new Map<string, number>();
    return matching.filter((entry) => {
      const seen = counts.get(entry.group) ?? 0;
      counts.set(entry.group, seen + 1);
      return seen < (terms.length === 0 && entry.group === "Actions" ? 4 : MAX_PER_GROUP);
    });
  }, [entries, query]);

  const go = useCallback(
    (entry: Entry | undefined) => {
      if (!entry) return;
      setOpen(false);
      router.push(entry.href);
    },
    [router],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  let lastGroup = "";

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setQuery("");
          setActive(0);
        }
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-content/35 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in" />
        <DialogPrimitive.Content
          data-role="teacher"
          className="fixed top-[12vh] left-1/2 z-50 flex max-h-[70vh] w-[min(40rem,calc(100vw-1.5rem))] -translate-x-1/2 flex-col overflow-hidden rounded-2xl bg-raised shadow-elevation-xl ring-1 ring-line data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95"
        >
          <DialogPrimitive.Title className="sr-only">Search and jump</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Type to find a batch, student, course, parent or action. Use the arrow keys and Enter.
          </DialogPrimitive.Description>
          <div className="flex items-center gap-3 border-b border-line px-4">
            <Search aria-hidden="true" className="size-4 shrink-0 text-content-subtle" />
            <input
              autoFocus
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActive((value) => Math.min(value + 1, results.length - 1));
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActive((value) => Math.max(value - 1, 0));
                } else if (event.key === "Enter") {
                  event.preventDefault();
                  go(results[active]);
                }
              }}
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
              placeholder="Search batches, students, courses…"
              className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-content-subtle"
            />
            <kbd className="hidden rounded-md bg-sunken px-1.5 py-0.5 font-mono text-[0.6875rem] text-content-subtle ring-1 ring-line sm:inline">
              Esc
            </kbd>
          </div>

          <ul ref={listRef} id={listId} role="listbox" className="overflow-y-auto p-2">
            {results.length === 0 ? (
              <li className="px-3 py-10 text-center text-sm text-content-muted">
                Nothing matches &ldquo;{query}&rdquo;.
              </li>
            ) : (
              results.map((entry, position) => {
                const header = entry.group !== lastGroup ? entry.group : null;
                lastGroup = entry.group;
                const Icon = entry.icon;
                return (
                  <li key={entry.id} role="presentation">
                    {header ? (
                      <p className="px-3 pt-3 pb-1 text-[0.6875rem] font-medium tracking-wide text-content-subtle uppercase">
                        {header}
                      </p>
                    ) : null}
                    <div
                      id={`${listId}-${position}`}
                      role="option"
                      aria-selected={position === active}
                      data-index={position}
                      onMouseMove={() => setActive(position)}
                      onClick={() => go(entry)}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                        position === active ? "bg-brand-subtle text-brand-subtle-fg" : "text-content",
                      )}
                    >
                      <Icon aria-hidden="true" className="size-4 shrink-0 opacity-70" />
                      <span className="min-w-0 flex-1 truncate font-medium">{entry.label}</span>
                      {entry.hint ? (
                        <span className="hidden truncate text-xs text-content-subtle sm:block">{entry.hint}</span>
                      ) : null}
                      {position === active ? (
                        <CornerDownLeft aria-hidden="true" className="size-3.5 shrink-0 opacity-60" />
                      ) : null}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
