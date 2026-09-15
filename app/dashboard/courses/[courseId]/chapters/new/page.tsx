import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChapterForm } from "@/components/chapter-form";
import { FormPage } from "@/components/teacher/form-page";
import { createLibraryChapter } from "@/lib/actions/chapters";
import { requireTeacher } from "@/lib/auth";
import { libraryCoursePath } from "@/lib/paths";
import { getOwnedCourseForTeacher } from "@/lib/queries";

export const metadata: Metadata = {
  title: "New chapter",
};

export default async function NewLibraryChapterPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const teacher = await requireTeacher();
  const course = await getOwnedCourseForTeacher(teacher.id, courseId);

  if (!course) {
    notFound();
  }

  return (
    <FormPage
      crumbs={[{ label: "Course library", href: "/dashboard/courses" }, { label: course.title, href: libraryCoursePath(course.id) }, { label: "New chapter" }]}
      title={<>Add a chapter</>}
      description={<>This chapter will appear in every batch that uses {course.title}. Upload PDFs from inside a batch.</>}
    >
        <ChapterForm
          action={createLibraryChapter.bind(null, course.id)}
          submitLabel="Create chapter"
          cancelHref={libraryCoursePath(course.id)}
          showPdf={false}
        />
      </FormPage>
  );
}
