import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { ParentForm } from "@/components/parent-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { createParent } from "@/lib/actions/parents";
import { requireTeacher } from "@/lib/auth";
import { newStudentPath, parentsPath } from "@/lib/paths";
import { getTeacherParentPickerStudents } from "@/lib/queries";

export const metadata: Metadata = {
  title: "New parent",
};

export default async function NewParentPage() {
  const teacher = await requireTeacher();
  const students = await getTeacherParentPickerStudents(teacher.id);

  if (students.length === 0) {
    return (
      <EmptyState
        icon={<Users />}
        title="Add students first"
        description="A parent login needs at least one student assigned. Add a student, then come back to create the parent."
        action={
          <Button asChild size="lg">
            <Link href={newStudentPath()}>Add a student</Link>
          </Button>
        }
      />
    );
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="font-heading text-3xl">Create a parent</CardTitle>
        <CardDescription>
          We generate a unique @bhargavacademy.com login from their name unless
          you type a different email. Assign the students they should see after
          they sign in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ParentForm
          action={createParent}
          students={students}
          submitLabel="Create parent"
          cancelHref={parentsPath()}
        />
      </CardContent>
    </Card>
  );
}
