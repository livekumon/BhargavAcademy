export function batchPath(batchId: string) {
  return `/dashboard/batches/${batchId}`;
}

export function coursePath(batchId: string, courseId: string) {
  return `/dashboard/batches/${batchId}/courses/${courseId}`;
}

export function chapterPath(
  batchId: string,
  courseId: string,
  chapterId: string,
) {
  return `${coursePath(batchId, courseId)}/chapters/${chapterId}`;
}

export function materialPath(materialId: string) {
  return `/api/materials/${encodeURIComponent(materialId)}`;
}

export function studentsPath() {
  return "/dashboard/students";
}

export function leadsPath() {
  return "/dashboard/leads";
}

export function newStudentPath(batchId?: string) {
  return batchId
    ? `/dashboard/students/new?batchId=${encodeURIComponent(batchId)}`
    : "/dashboard/students/new";
}

export function enrollBatchStudentsPath(batchId: string) {
  return `${batchPath(batchId)}/students/new`;
}

export function studentManagePath(studentId: string) {
  return `/dashboard/students/${studentId}`;
}

export function parentsPath() {
  return "/dashboard/parents";
}

export function newParentPath() {
  return "/dashboard/parents/new";
}

export function parentManagePath(parentId: string) {
  return `/dashboard/parents/${parentId}`;
}

export function libraryCoursePath(courseId: string) {
  return `/dashboard/courses/${courseId}`;
}

export function libraryChapterPath(courseId: string, chapterId: string) {
  return `${libraryCoursePath(courseId)}/chapters/${chapterId}`;
}

export function studentCoursePath(courseId: string) {
  return `/student/courses/${courseId}`;
}

export function studentMaterialPath(materialId: string) {
  return `/student/materials/${encodeURIComponent(materialId)}`;
}

export function submissionPath(materialId: string, studentId: string) {
  return `/api/submissions/${encodeURIComponent(materialId)}/${encodeURIComponent(studentId)}`;
}

export type ParentChildTab = "overview" | "chapters" | "marks";

export function parseParentChildTab(
  value: string | string[] | undefined,
): ParentChildTab {
  const tab = Array.isArray(value) ? value[0] : value;
  return tab === "chapters" || tab === "marks" ? tab : "overview";
}

export function parentChildPath(
  studentId: string,
  query?: { tab?: ParentChildTab; batch?: string; paper?: string },
) {
  const base = `/parent/students/${encodeURIComponent(studentId)}`;
  const params = new URLSearchParams();
  if (query?.tab && query.tab !== "overview") params.set("tab", query.tab);
  if (query?.batch) params.set("batch", query.batch);
  if (query?.paper) params.set("paper", query.paper);
  const search = params.toString();
  return search ? `${base}?${search}` : base;
}

export function studentMarksPath(query?: {
  batchId?: string;
  courseId?: string;
  syllabus?: string;
  examPaper?: string;
}) {
  const params = new URLSearchParams();
  if (query?.batchId) params.set("batchId", query.batchId);
  if (query?.courseId) params.set("courseId", query.courseId);
  if (query?.syllabus) params.set("syllabus", query.syllabus);
  if (query?.examPaper) params.set("examPaper", query.examPaper);
  const search = params.toString();
  return search ? `/student/marks?${search}` : "/student/marks";
}
