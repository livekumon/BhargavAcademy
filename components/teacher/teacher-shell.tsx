import { Suspense, type ReactNode } from "react";
import { cookies } from "next/headers";
import { Container } from "@/components/layout/container";
import { Toaster } from "@/components/ui/sonner";
import { readFlash } from "@/lib/flash";
import { listLeads } from "@/lib/leads";
import { getTeacherBatches, getTeacherCourses, getTeacherParents, getTeacherStudents } from "@/lib/queries";
import { CommandPalette } from "./command-palette";
import { FlashToaster } from "./flash-toaster";
import { SIDEBAR_COOKIE, TeacherMobileNav, TeacherSidebar } from "./teacher-navigation";

/**
 * The frame for every signed-in teacher page: sidebar on desktop, top and
 * bottom bars on phones, the ⌘K palette, and toasts. Pages render inside a
 * `Container` and start with a `PageHeader`.
 */
export async function TeacherShell({
  teacher,
  signOut,
  children,
}: {
  teacher: { id: string; name: string; email: string };
  signOut: () => Promise<void>;
  children: ReactNode;
}) {
  const [batches, students, courses, parents, leads, flash, cookieStore] = await Promise.all([
    getTeacherBatches(teacher.id),
    getTeacherStudents(teacher.id),
    getTeacherCourses(teacher.id),
    getTeacherParents(teacher.id),
    listLeads().catch(() => []),
    readFlash(),
    cookies(),
  ]);
  const user = { name: teacher.name, email: teacher.email };
  const badges = { leads: leads.filter((lead) => lead.status === "new").length };

  return (
    <div data-role="teacher" className="flex min-h-dvh flex-1 bg-canvas">
      <TeacherSidebar
        user={user}
        signOut={signOut}
        badges={badges}
        defaultCollapsed={cookieStore.get(SIDEBAR_COOKIE)?.value === "collapsed"}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TeacherMobileNav user={user} signOut={signOut} badges={badges} />
        <main id="main" className="flex-1 pt-6 pb-28 sm:pt-8 lg:pt-10 lg:pb-12">
          <Container width="xl">{children}</Container>
        </main>
      </div>

      <CommandPalette
        index={{
          batches: batches.map((batch) => ({
            id: batch.id,
            name: batch.name,
            courseTitle: batch.course?.title ?? null,
          })),
          students: students.map((student) => ({ id: student.id, name: student.name, email: student.email })),
          courses: courses.map((course) => ({ id: course.id, title: course.title })),
          parents: parents.map((parent) => ({ id: parent.id, name: parent.name, email: parent.email })),
        }}
      />
      <Suspense fallback={null}>
        <FlashToaster initial={flash} />
      </Suspense>
      <Toaster position="bottom-right" offset={{ bottom: 24 }} mobileOffset={{ bottom: 88 }} />
    </div>
  );
}
