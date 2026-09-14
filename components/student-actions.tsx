"use client";

import Link from "next/link";
import { Pencil, PenLine, Trash2 } from "lucide-react";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Button } from "@/components/ui/button";
import { deleteDirectoryStudent } from "@/lib/actions/students";
import { studentManagePath } from "@/lib/paths";

export function StudentActions({
  student,
}: {
  student: { id: string; name: string };
}) {
  return (
    <div className="flex items-center gap-0.5">
      <Button asChild variant="ghost" size="icon-sm">
        <Link
          href={studentManagePath(student.id)}
          aria-label={`Edit ${student.name}`}
          title="Edit"
        >
          <Pencil />
        </Link>
      </Button>
      <Button asChild variant="ghost" size="icon-sm">
        <Link
          href={`${studentManagePath(student.id)}#marks`}
          aria-label={`Marks for ${student.name}`}
          title="Marks"
        >
          <PenLine />
        </Link>
      </Button>
      <form action={deleteDirectoryStudent.bind(null, student.id)}>
        <ConfirmSubmitButton
          message={`Remove ${student.name} from every batch? Their profile is deleted if they are not enrolled anywhere else.`}
          variant="ghost"
          size="icon-sm"
        >
          <Trash2 />
          <span className="sr-only">Delete {student.name}</span>
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
