import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, ClipboardList, PenLine } from "lucide-react";
import { MarksTimeline } from "@/components/marks-timeline";
import { optionLabel } from "@/lib/academics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireParent } from "@/lib/auth";
import { getLookupCatalog, lookupChoices } from "@/lib/lookups";
import { getParentChildDetails } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Child progress",
};

export default async function ParentChildPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const parent = await requireParent();
  const [details, catalog] = await Promise.all([
    getParentChildDetails(parent.id, decodeURIComponent(studentId)),
    getLookupCatalog(),
  ]);

  if (!details) {
    notFound();
  }

  const syllabuses = lookupChoices(catalog.syllabus);
  const exams = lookupChoices(catalog.exam);
  const examPapers = lookupChoices(catalog.exam_paper);

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
          <Link href="/parent">Back to my children</Link>
        </Button>
        <p className="text-sm font-medium text-primary">
          {details.batches.length === 1
            ? details.batches[0].name
            : details.batches.map((batch) => batch.name).join(" · ") ||
              "No batches yet"}
        </p>
        <h1 className="font-heading mt-1 text-4xl font-semibold tracking-tight">
          {details.student.name}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Completion for each batch {details.student.name} is enrolled in,
          chapter marks they logged, and class material progress.
        </p>
        {details.student.syllabus || details.student.exam ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {optionLabel(syllabuses, details.student.syllabus) || "Syllabus not set"} ·{" "}
            {optionLabel(exams, details.student.exam) || "Exam not set"}
          </p>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading inline-flex items-center gap-2 text-2xl">
            <PenLine className="size-5" />
            Chapter marks
          </CardTitle>
          <CardDescription>
            Every score {details.student.name} saved, with the exam date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MarksTimeline
            entries={details.marks}
            showContext
            syllabuses={syllabuses}
            examPapers={examPapers}
          />
        </CardContent>
      </Card>

      {details.batches.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No batches yet</CardTitle>
            <CardDescription>
              When the teacher enrolls {details.student.name} in a batch,
              progress will appear here.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-10">
          {details.batches.map((batch) => (
            <section key={batch.id} className="space-y-5">
              <div>
                <h2 className="font-heading text-3xl font-semibold">
                  {batch.name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Completion for this batch only.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardDescription>Class material</CardDescription>
                    <CardTitle className="font-heading text-3xl">
                      {batch.progress.classMaterialPercent}%
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardDescription>Revision completed</CardDescription>
                    <CardTitle className="font-heading text-3xl">
                      {batch.progress.classMaterialCompleted}/
                      {batch.progress.classMaterialAssigned}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardDescription>Assignments revision completed</CardDescription>
                    <CardTitle className="font-heading text-3xl">
                      {batch.progress.assignmentCompleted}/
                      {batch.progress.assignmentAssigned}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {batch.courses.length === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Nothing assigned yet</CardTitle>
                    <CardDescription>
                      When the teacher assigns class material or assignments in
                      this batch, they will appear here by chapter.
                    </CardDescription>
                  </CardHeader>
                </Card>
              ) : (
                <div className="space-y-8">
                  {batch.courses.map((course) => (
                    <section key={course.id} className="space-y-3">
                      <h3 className="font-heading text-2xl font-semibold">
                        {course.title}
                      </h3>
                      <div className="space-y-3">
                        {course.chapters.map((chapter, index) => (
                          <Card key={chapter.id}>
                            <CardHeader className="flex-row items-start justify-between gap-4">
                              <div>
                                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                  Chapter {index + 1}
                                </p>
                                <CardTitle className="font-heading mt-1 text-xl">
                                  {chapter.title}
                                </CardTitle>
                                <CardDescription className="mt-1">
                                  {chapter.description || "No summary yet."}
                                </CardDescription>
                              </div>
                              <Badge variant="secondary">
                                {chapter.progress.classMaterialPercent}% revision
                                completed
                              </Badge>
                            </CardHeader>
                            <CardContent className="grid gap-3 sm:grid-cols-2">
                              <div className="rounded-xl border bg-muted/40 p-3">
                                <p className="inline-flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                  <BookOpen className="size-3.5" />
                                  Class material
                                </p>
                                <p className="mt-1 text-lg font-semibold">
                                  {chapter.progress.classMaterialCompleted} of{" "}
                                  {chapter.progress.classMaterialAssigned}{" "}
                                  revision completed
                                </p>
                              </div>
                              <div className="rounded-xl border bg-muted/40 p-3">
                                <p className="inline-flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                  <ClipboardList className="size-3.5" />
                                  Assignments
                                </p>
                                <p className="mt-1 text-lg font-semibold">
                                  {chapter.progress.assignmentCompleted} of{" "}
                                  {chapter.progress.assignmentAssigned}{" "}
                                  revision completed
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
