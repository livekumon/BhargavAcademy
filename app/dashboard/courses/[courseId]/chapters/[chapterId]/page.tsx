import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { ChapterForm } from "@/components/chapter-form";
import { PageHeader } from "@/components/layout/page-header";
import { MoreMenu } from "@/components/teacher/more-menu";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Surface } from "@/components/ui/surface";
import { deleteLibraryChapter, updateLibraryChapter } from "@/lib/actions/chapters";
import { requireTeacher } from "@/lib/auth";
import { chapterPath, libraryCoursePath } from "@/lib/paths";
import { getCourseBatches, getOwnedLibraryChapter } from "@/lib/queries";
import { plural } from "@/lib/teacher-format";

export const metadata: Metadata = {
  title: "Chapter",
};

export default async function LibraryChapterPage({
  params,
}: {
  params: Promise<{ courseId: string; chapterId: string }>;
}) {
  const { courseId, chapterId } = await params;
  const teacher = await requireTeacher();
  const owned = await getOwnedLibraryChapter(teacher.id, courseId, chapterId);

  if (!owned) {
    notFound();
  }

  const { course, chapter } = owned;
  const usedBy = await getCourseBatches(teacher.id, course.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={
          <Breadcrumb
            items={[
              { label: "Course library", href: "/dashboard/courses" },
              { label: course.title, href: libraryCoursePath(course.id) },
              { label: chapter.title },
            ]}
          />
        }
        eyebrow="Shared chapter"
        title={chapter.title}
        actions={
          <MoreMenu
            label="More chapter actions"
            dangers={[
              {
                label: "Delete chapter",
                icon: <Trash2 aria-hidden="true" />,
                title: `Delete ${chapter.title}?`,
                message: `It's removed from ${course.title} everywhere.`,
                consequences: [
                  usedBy.length > 0
                    ? `${plural(usedBy.length, "batch", "batches")} lose it: ${usedBy.map((batch) => batch.name).join(", ")}.`
                    : "No batch uses this course yet.",
                  "Every PDF in it is deleted along with students' submitted work.",
                ],
                confirmText: chapter.title,
                action: deleteLibraryChapter.bind(null, course.id, chapter.id),
              },
            ]}
          />
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Surface pad="lg">
          <ChapterForm
            action={updateLibraryChapter.bind(null, course.id, chapter.id)}
            defaultValues={{ title: chapter.title, description: chapter.description }}
            submitLabel="Save chapter"
            cancelHref={libraryCoursePath(course.id)}
            showPdf={false}
          />
        </Surface>
        <aside aria-label="Where this chapter is used" className="space-y-3">
          <p className="text-sm text-content-muted text-pretty">
            The title and summary are shared. Upload PDFs from each batch, so every class can have its own notes.
          </p>
          {usedBy.length > 0 ? (
            <ul className="space-y-2">
              {usedBy.map((batch) => (
                <li key={batch.id}>
                  <Link
                    href={chapterPath(batch.id, course.id, chapter.id)}
                    className="flex items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2.5 text-sm font-medium ring-1 ring-line hover:bg-sunken focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    {batch.name}
                    <span className="text-xs font-normal text-brand">Open PDFs</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
