import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { LookupSettings } from "@/components/lookup-settings";
import { requireTeacher } from "@/lib/auth";
import { getLookupCatalog } from "@/lib/lookups";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  await requireTeacher();
  const catalog = await getLookupCatalog();
  const editable = {
    syllabus: catalog.syllabus.map(toEditable),
    exam: catalog.exam.map(toEditable),
    exam_paper: catalog.exam_paper.map(toEditable),
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-primary">Academy settings</p>
        <h1 className="font-heading mt-1 inline-flex items-center gap-2 text-4xl font-semibold tracking-tight">
          <Settings className="size-8" />
          Dropdowns
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Edit the lists used in teacher, student, and parent screens — syllabus,
          exam, and exam paper. New names show up in every dropdown that uses
          that list.
        </p>
      </div>

      <LookupSettings catalog={editable} />
    </div>
  );
}

function toEditable(option: {
  id: string;
  listKey: string;
  value: string;
  label: string;
  position: number;
}) {
  return {
    id: option.id,
    listKey: option.listKey,
    value: option.value,
    label: option.label,
    position: option.position,
  };
}
