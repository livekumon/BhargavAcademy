import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CompleteClassMaterialForm } from "@/components/complete-class-material-form";
import { SubmitAssignmentForm } from "@/components/submit-assignment-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireStudent } from "@/lib/auth";
import { isAssignment, materialKindLabel } from "@/lib/materials";
import { materialPath, studentCoursePath, submissionPath } from "@/lib/paths";
import { getStudentAssignedMaterial } from "@/lib/queries";
import { formatCompletedAt } from "@/lib/submissions";

export const metadata: Metadata = {
  title: "PDF material",
};

export default async function StudentMaterialPage({
  params,
}: {
  params: Promise<{ materialId: string }>;
}) {
  const { materialId } = await params;
  const student = await requireStudent();
  const owned = await getStudentAssignedMaterial(
    student.id,
    decodeURIComponent(materialId),
  );

  if (!owned) {
    notFound();
  }

  const pdfUrl = materialPath(owned.material.id);
  const assignment = owned.assignment;
  const completed = Boolean(assignment.completedAt);
  const completedLabel = formatCompletedAt(assignment.completedAt);
  const workUrl = assignment.submissionFileName
    ? submissionPath(owned.material.id, student.id)
    : null;

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
          <Link href={studentCoursePath(owned.course.id)}>
            Back to {owned.course.title}
          </Link>
        </Button>
        <p className="text-sm font-medium text-primary">
          {owned.course.title} · {owned.chapter.title}
        </p>
        <h1 className="font-heading mt-1 text-4xl font-semibold tracking-tight">
          {owned.material.pdfOriginalName ?? "PDF material"}
        </h1>
      </div>

      {isAssignment(owned.material.kind) && owned.material.instructions ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-2xl">
              Assignment instructions
            </CardTitle>
            <CardDescription>
              Your teacher asked you to complete this work.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-6">
              {owned.material.instructions}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="font-heading text-2xl">
              {isAssignment(owned.material.kind)
                ? "Assignment PDF"
                : "Your class material"}
            </CardTitle>
            <CardDescription>
              This file was assigned to you in {owned.batch?.name}.
            </CardDescription>
          </div>
          <Badge>{materialKindLabel(owned.material.kind)}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {owned.material.pdfFileName ? (
            <>
              <iframe
                title={owned.material.pdfOriginalName ?? "Assigned PDF"}
                src={pdfUrl}
                className="h-[36rem] w-full rounded-xl border bg-background"
              />
              <Button asChild variant="outline">
                <a href={pdfUrl} target="_blank" rel="noreferrer">
                  Open PDF
                </a>
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">This file is missing.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="font-heading text-2xl">
              {isAssignment(owned.material.kind)
                ? "Submit your work"
                : "Progress"}
            </CardTitle>
            <CardDescription>
              {isAssignment(owned.material.kind)
                ? "Upload your completed assignment as a PDF to mark it as done."
                : "Mark this PDF as revision completed after you finish."}
            </CardDescription>
          </div>
          <Badge variant={completed ? "default" : "secondary"}>
            {completed
              ? completedLabel
                ? `Revision completed ${completedLabel}`
                : "Revision completed"
              : "Not completed"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-5">
          {workUrl ? (
            <div className="space-y-3">
              <p className="text-sm">
                Your uploaded file:{" "}
                <span className="font-medium">
                  {assignment.submissionOriginalName ?? "assignment.pdf"}
                </span>
              </p>
              <iframe
                title={assignment.submissionOriginalName ?? "Your assignment"}
                src={workUrl}
                className="h-[20rem] w-full rounded-xl border bg-background"
              />
              <Button asChild variant="outline">
                <a href={workUrl} target="_blank" rel="noreferrer">
                  Open your upload
                </a>
              </Button>
            </div>
          ) : null}

          {isAssignment(owned.material.kind) ? (
            <SubmitAssignmentForm
              materialId={owned.material.id}
              completed={completed}
              submissionName={assignment.submissionOriginalName}
            />
          ) : (
            <CompleteClassMaterialForm
              materialId={owned.material.id}
              completed={completed}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
