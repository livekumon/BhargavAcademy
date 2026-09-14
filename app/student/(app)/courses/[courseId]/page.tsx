import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireStudent } from "@/lib/auth";
import { isAssignment, splitMaterials } from "@/lib/materials";
import { studentMaterialPath } from "@/lib/paths";
import { getStudentHome } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Course",
};

export default async function StudentCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const student = await requireStudent();
  const home = await getStudentHome(student.id);
  const course = home?.courses.find((item) => item.id === courseId);

  if (!home || !course) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
          <Link href="/student">Back to my courses</Link>
        </Button>
        <p className="text-sm font-medium text-primary">
          {home.batches.length > 0
            ? home.batches.map((batch) => batch.name).join(" · ")
            : (home.batch?.name ?? "Your batch")}
        </p>
        <h1 className="font-heading mt-1 text-4xl font-semibold tracking-tight">
          {course.title}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {course.description || "No description yet."}
        </p>
      </div>

      <div className="space-y-8">
        {course.chapters.map((chapter, index) => {
          const { classMaterials, assignments } = splitMaterials(chapter.materials);
          return (
            <section key={chapter.id} className="space-y-5">
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Chapter {index + 1}
                </p>
                <h2 className="font-heading text-2xl font-semibold">{chapter.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {chapter.description || "No summary yet."}
                </p>
              </div>
              <MaterialList
                title="Class material"
                emptyLabel="No class material assigned to you in this chapter."
                materials={classMaterials}
              />
              <MaterialList
                title="Assignments"
                emptyLabel="No assignments assigned to you in this chapter."
                materials={assignments}
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}

function MaterialList({
  title,
  emptyLabel,
  materials,
}: {
  title: string;
  emptyLabel: string;
  materials: {
    id: string;
    pdfOriginalName: string | null;
    kind: string;
    instructions: string;
    completedAt: Date | null;
    submissionOriginalName: string | null;
    batchName?: string;
  }[];
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-heading text-lg font-semibold">{title}</h3>
      {materials.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="space-y-3">
          {materials.map((material) => (
            <Link key={material.id} href={studentMaterialPath(material.id)}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader className="flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle className="font-heading text-xl">
                      {material.pdfOriginalName ?? "PDF material"}
                    </CardTitle>
                    <CardDescription>
                      {[
                        material.batchName,
                        material.completedAt
                          ? isAssignment(material.kind)
                            ? `Revision completed${material.submissionOriginalName ? ` · ${material.submissionOriginalName}` : ""}`
                            : "Revision completed"
                          : isAssignment(material.kind)
                            ? "Upload your work to complete this assignment"
                            : "Mark as revision completed after you finish",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </CardDescription>
                  </div>
                  <Badge variant={material.completedAt ? "default" : "secondary"}>
                    {isAssignment(material.kind) ? <ClipboardList /> : <FileText />}
                    {material.completedAt
                      ? "Revision completed"
                      : isAssignment(material.kind)
                        ? "Open assignment"
                        : "Open PDF"}
                  </Badge>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
