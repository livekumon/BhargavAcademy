import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireStudent } from "@/lib/auth";
import { splitMaterials } from "@/lib/materials";
import { studentCoursePath } from "@/lib/paths";
import { getStudentHome } from "@/lib/queries";

export const metadata: Metadata = {
  title: "My courses",
};

export default async function StudentHomePage() {
  const student = await requireStudent();
  const home = await getStudentHome(student.id);

  if (!home) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-primary">
          {home.batches.length > 0
            ? home.batches.map((batch) => batch.name).join(" · ")
            : (home.batch?.name ?? "Your batch")}
        </p>
        <h1 className="font-heading mt-1 text-4xl font-semibold tracking-tight">
          Hello, {home.student.name}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          These are the courses and PDFs assigned to you. Use Marks to log
          chapter scores for a batch and course.
        </p>
      </div>

      {home.courses.length === 0 ? (
        <Card className="items-center py-16 text-center">
          <CardHeader className="items-center">
            <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
              <BookOpen className="size-5" />
            </div>
            <CardTitle className="font-heading text-2xl">Nothing assigned yet</CardTitle>
            <CardDescription className="max-w-md">
              When your teacher uploads a PDF and assigns it to you, it will
              appear here.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {home.courses.map((course) => {
            const allMaterials = course.chapters.flatMap(
              (chapter) => chapter.materials,
            );
            const { classMaterials, assignments } = splitMaterials(allMaterials);
            const completedNotes = classMaterials.filter(
              (material) => material.completedAt,
            ).length;
            const completedAssignments = assignments.filter(
              (material) => material.completedAt,
            ).length;
            return (
              <Link key={course.id} href={studentCoursePath(course.id)}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="font-heading text-2xl">
                        {course.title}
                      </CardTitle>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Badge variant="secondary">
                          {completedNotes}/{classMaterials.length}{" "}
                          {classMaterials.length === 1 ? "note" : "notes"}
                        </Badge>
                        <Badge variant="secondary">
                          {completedAssignments}/{assignments.length}{" "}
                          {assignments.length === 1
                            ? "assignment"
                            : "assignments"}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription className="line-clamp-3">
                      {course.description || "No description yet."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm">
                      Open course
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
