import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Breadcrumb, type Crumb } from "@/components/ui/breadcrumb";
import { Surface } from "@/components/ui/surface";

/** The frame for create and edit pages: where you are, what this does, and the form on a single surface. */
export function FormPage({
  crumbs,
  title,
  description,
  children,
}: {
  crumbs: Crumb[];
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader breadcrumb={<Breadcrumb items={crumbs} />} title={title} description={description} />
      <Surface pad="lg" className="max-w-3xl">
        {children}
      </Surface>
    </div>
  );
}
