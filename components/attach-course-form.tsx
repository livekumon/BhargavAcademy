"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { type CourseState } from "@/lib/actions/courses";

export function AttachCourseForm({
  action,
  courses,
  cancelHref,
}: {
  action: (state: CourseState, formData: FormData) => Promise<CourseState>;
  courses: { id: string; title: string; chapterCount: number }[];
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="courseId">Existing course</Label>
        <select
          id="courseId"
          name="courseId"
          required
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          defaultValue=""
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
      </div>

      {state.error ? (
        <p className="rounded-lg bg-danger-subtle px-3 py-2 text-sm text-danger-subtle-fg">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Attaching..." : "Attach course"}
        </Button>
        <Button asChild variant="outline">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
