"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export type StudentOption = {
  id: string;
  name: string;
};

export function StudentAssignmentFields({
  students,
  selectedIds,
  onChange,
}: {
  students: StudentOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const selected = new Set(selectedIds);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>Assign to students</Label>
        {students.length > 0 ? (
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onChange(students.map((student) => student.id))}
            >
              Select all
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange([])}>
              Clear
            </Button>
          </div>
        ) : null}
      </div>
      <div className="rounded-xl bg-surface p-3 ring-1 ring-line">
        {students.length === 0 ? (
          <p className="text-sm text-content-muted">
            Add students to this batch first. Then you can choose who should
            see this PDF when they log in.
          </p>
        ) : (
          <ul className="space-y-2">
            {students.map((student) => (
              <li key={student.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-sunken">
                  <input
                    type="checkbox"
                    name="studentIds"
                    value={student.id}
                    checked={selected.has(student.id)}
                    onChange={(event) => {
                      if (event.target.checked) {
                        onChange([...selectedIds, student.id]);
                        return;
                      }
                      onChange(selectedIds.filter((id) => id !== student.id));
                    }}
                    className="size-4 accent-(--brand)"
                  />
                  <span>{student.name}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-content-muted">
          Only selected students will see this PDF in the student module.
          {students.length > 0
            ? ` ${selectedIds.length} of ${students.length} selected.`
            : null}
        </p>
      </div>
    </div>
  );
}
