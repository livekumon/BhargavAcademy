import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ClipboardList, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireParent } from "@/lib/auth";
import { parentChildPath } from "@/lib/paths";
import { getParentChildren } from "@/lib/queries";

export const metadata: Metadata = {
  title: "My children",
};

export default async function ParentHomePage() {
  const parent = await requireParent();
  const children = await getParentChildren(parent.id);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-primary">Parent dashboard</p>
        <h1 className="font-heading mt-1 text-4xl font-semibold tracking-tight">
          Hello, {parent.name}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Progress for every child linked to this login, shown for each batch
          they are enrolled in.
        </p>
      </div>

      {children.length === 0 ? (
        <Card className="items-center py-16 text-center">
          <CardHeader className="items-center">
            <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
              <Users className="size-5" />
            </div>
            <CardTitle className="font-heading text-2xl">No children linked yet</CardTitle>
            <CardDescription className="max-w-md">
              When a teacher links students to this login, they will appear here.
              Open a child to see their dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {children.map(({ student, batches }) => (
            <Link key={student.id} href={parentChildPath(student.id)}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="font-heading text-2xl">
                        {student.name}
                      </CardTitle>
                      <CardDescription>
                        {batches.length === 1
                          ? batches[0].name
                          : `${batches.length} batches`}
                      </CardDescription>
                    </div>
                    {batches.length === 1 ? (
                      <Badge>
                        {batches[0].progress.classMaterialPercent}% class
                        material
                      </Badge>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {batches.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Not enrolled in a batch yet.
                    </p>
                  ) : (
                    batches.map((batch) => (
                      <div key={batch.id} className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium">{batch.name}</p>
                          <Badge variant="secondary">
                            {batch.progress.classMaterialPercent}%
                          </Badge>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-primary"
                            style={{
                              width: `${batch.progress.classMaterialPercent}%`,
                            }}
                          />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-2">
                            <BookOpen className="size-4" />
                            Revision completed{" "}
                            {batch.progress.classMaterialCompleted} of{" "}
                            {batch.progress.classMaterialAssigned}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <ClipboardList className="size-4" />
                            Assignments {batch.progress.assignmentCompleted} of{" "}
                            {batch.progress.assignmentAssigned}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                  <span className="inline-flex h-8 items-center rounded-lg border border-line px-2.5 text-sm font-medium">
                    View details
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
