import { isAssignment } from "./materials";

export type ProgressRow = {
  kind: string;
  completedAt: Date | string | null;
};

export function summarizeProgress(rows: ProgressRow[]) {
  const classMaterials = rows.filter((row) => !isAssignment(row.kind));
  const assignments = rows.filter((row) => isAssignment(row.kind));
  const classMaterialCompleted = classMaterials.filter((row) =>
    Boolean(row.completedAt),
  ).length;
  const assignmentCompleted = assignments.filter((row) =>
    Boolean(row.completedAt),
  ).length;

  return {
    classMaterialAssigned: classMaterials.length,
    classMaterialCompleted,
    classMaterialPercent:
      classMaterials.length === 0
        ? 0
        : Math.round((classMaterialCompleted / classMaterials.length) * 100),
    assignmentAssigned: assignments.length,
    assignmentCompleted,
  };
}
