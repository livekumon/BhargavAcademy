import { getBatchProgressMatrix, getTeacherBatches } from "./queries";

/** Every batch with all-time totals, so a card can say where the batch stands. */
export async function getBatchOverviews(teacherId: string) {
  const batchList = await getTeacherBatches(teacherId);

  return Promise.all(
    batchList.map(async (batch) => {
      const rows = await getBatchProgressMatrix(batch.id, null, null);
      const sum = (pick: (row: (typeof rows)[number]) => number) =>
        rows.reduce((total, row) => total + pick(row), 0);
      return {
        ...batch,
        revised: sum((row) => row.classMaterialCompleted),
        revisable: sum((row) => row.classMaterialAssigned),
        submitted: sum((row) => row.assignmentCompleted),
        submittable: sum((row) => row.assignmentAssigned),
        outstanding: rows.filter(
          (row) =>
            row.classMaterialCompleted < row.classMaterialAssigned ||
            row.assignmentCompleted < row.assignmentAssigned,
        ).length,
      };
    }),
  );
}

export type BatchOverview = Awaited<ReturnType<typeof getBatchOverviews>>[number];
