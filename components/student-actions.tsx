"use client";

import Link from "next/link";
import { Award, Trash2, UserRound } from "lucide-react";
import { MoreMenu } from "@/components/teacher/more-menu";
import { Button } from "@/components/ui/button";
import { deleteDirectoryStudent } from "@/lib/actions/students";
import { studentManagePath } from "@/lib/paths";

export function StudentActions({
  student,
}: {
  student: { id: string; name: string; batches?: { id: string; name: string }[] };
}) {
  return (
    <div className="flex items-center gap-1">
      <Button asChild variant="ghost" size="lg">
        <Link href={studentManagePath(student.id)}>
          Open
          <span className="sr-only"> {student.name}</span>
        </Link>
      </Button>
      <MoreMenu
        label={`Actions for ${student.name}`}
        variant="ghost"
        links={[
          { label: "Profile", href: studentManagePath(student.id), icon: <UserRound aria-hidden="true" /> },
          { label: "Marks", href: `${studentManagePath(student.id)}?tab=marks`, icon: <Award aria-hidden="true" /> },
        ]}
        dangers={[
          {
            label: "Delete student",
            icon: <Trash2 aria-hidden="true" />,
            title: `Delete ${student.name}?`,
            message: "They're removed from every batch and can no longer sign in.",
            consequences: [
              student.batches?.length
                ? `Batches: ${student.batches.map((batch) => batch.name).join(", ")}.`
                : "They're removed from all of their batches.",
              "Their progress, submitted work and marks are deleted.",
            ],
            action: deleteDirectoryStudent.bind(null, student.id),
          },
        ]}
      />
    </div>
  );
}
