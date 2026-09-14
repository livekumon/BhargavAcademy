import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, ArrowUp, ListChecks, Pencil, Plus, Trash2, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MoreMenu } from "@/components/teacher/more-menu";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Surface } from "@/components/ui/surface";
import { moveLibraryChapter } from "@/lib/actions/chapters";
import { deleteCourse } from "@/lib/actions/courses";
import { requireTeacher } from "@/lib/auth";
import { batchPath, libraryChapterPath, libraryCoursePath } from "@/lib/paths";
import { getCourseBatches, getCourseChapters, getOwnedCourseForTeacher } from "@/lib/queries";
import { plural } from "@/lib/teacher-format";

export const metadata: Metadata = {
  title: "Course",
};

export default async function LibraryCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const teacher = await requireTeacher();
  const course = await getOwnedCourseForTeacher(teacher.id, courseId);

  if (!course) {
    notFound();
  }

  const [chapters, usedBy] = await Promise.all([getCourseChapters(course.id), getCourseBatches(teacher.id, course.id)]);
  const base = libraryCoursePath(course.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={<Breadcrumb items={[{ label: "Course library", href: "/dashboard/courses" }, { label: course.title }]} />}
        eyebrow="Shared course"
        title={course.title}
        description={course.description || undefined}
        actions={
          <>
            <Button asChild size="lg">
              <Link href={`${base}/chapters/new`}>
                <Plus data-icon="inline-start" />
                Add chapter
              </Link>
            </Button>
            <MoreMenu
              label="More course actions"
              links={[{ label: "Edit course details", href: `${base}/edit`, icon: <Pencil aria-hidden="true" /> }]}
              dangers={[
                {
                  label: "Delete course",
                  icon: <Trash2 aria-hidden="true" />,
                  title: `Delete ${course.title}?`,
                  message: "The course and all of its chapters are removed from your library.",
                  consequences: [
                    usedBy.length > 0
                      ? `${plural(usedBy.length, "batch", "batches")} lose this course: ${usedBy.map((batch) => batch.name).join(", ")}.`
                      : "No batch uses it right now.",
                    "Every PDF uploaded for it, in any batch, is deleted along with students' submitted work.",
                  ],
                  confirmText: course.title,
                  action: deleteCourse.bind(null, course.id),
                },
              ]}
            />
          </>
        }
      />

      <Surface pad="sm" className="flex flex-wrap items-center gap-2 text-sm">
        <span className="flex items-center gap-1.5 px-1 text-content-muted">
          <Users aria-hidden="true" className="size-4" />
          Used by
        </span>
        {usedBy.length === 0 ? (
          <span className="text-content-subtle">
            no batch yet.{" "}
            <Link href="/dashboard/batches/new" className="font-medium text-brand hover:underline">
              Create a batch with this course
            </Link>
          </span>
        ) : (
          usedBy.map((batch) => (
            <Link
              key={batch.id}
              href={`${batchPath(batch.id)}?tab=chapters`}
              className="inline-flex h-8 items-center rounded-full bg-sunken px-3 font-medium hover:bg-brand-subtle hover:text-brand-subtle-fg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {batch.name}
            </Link>
          ))
        )}
      </Surface>

      <section aria-labelledby="chapters-heading" className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="chapters-heading" className="text-title-1 font-semibold">
            Chapters
          </h2>
          <p className="text-sm text-content-muted">Order and titles are shared by every batch. Upload PDFs from a batch.</p>
        </div>

        {chapters.length === 0 ? (
          <EmptyState
            icon={<ListChecks />}
            title="No chapters yet"
            description="Add the lessons in the order you teach them."
            action={
              <Button asChild size="lg">
                <Link href={`${base}/chapters/new`}>Add the first chapter</Link>
              </Button>
            }
          />
        ) : (
          <ol className="divide-y divide-line overflow-hidden rounded-xl bg-surface ring-1 ring-line">
            {chapters.map((chapter, index) => (
              <li key={chapter.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <span className="tabular flex size-8 shrink-0 items-center justify-center rounded-lg bg-sunken text-xs font-semibold text-content-muted">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={libraryChapterPath(course.id, chapter.id)} className="font-medium hover:underline">
                    {chapter.title}
                  </Link>
                  {chapter.description ? (
                    <p className="truncate text-sm text-content-muted">{chapter.description}</p>
                  ) : null}
                </div>
                <div className="flex items-center">
                  <form action={moveLibraryChapter.bind(null, course.id, chapter.id, "up")}>
                    <Button type="submit" variant="ghost" size="icon-lg" disabled={index === 0} aria-label={`Move ${chapter.title} up`}>
                      <ArrowUp />
                    </Button>
                  </form>
                  <form action={moveLibraryChapter.bind(null, course.id, chapter.id, "down")}>
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon-lg"
                      disabled={index === chapters.length - 1}
                      aria-label={`Move ${chapter.title} down`}
                    >
                      <ArrowDown />
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
