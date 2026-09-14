import {
  ADMIN_EMAIL,
  DEFAULT_PASSWORD,
  uniqueAcademyEmail,
} from "./identity";

export const PROTOTYPE_EVENING_BATCH_ID = "batch-grade-10-evening";
export const PROTOTYPE_ENGLISH_BATCH_ID = "batch-grade-10-english";
export const SAMPLE_TEACHER_EMAIL = ADMIN_EMAIL;
export const SAMPLE_TEACHER_PASSWORD = DEFAULT_PASSWORD;
export const SAMPLE_STUDENT_PASSWORD = DEFAULT_PASSWORD;
export const SAMPLE_PARENT_PASSWORD = DEFAULT_PASSWORD;

const dummyEmailTaken = new Set<string>([ADMIN_EMAIL]);

function dummyEmail(name: string) {
  return uniqueAcademyEmail(name, dummyEmailTaken);
}

export function dummyMaterialId(batchId: string, pdf: string) {
  return `${batchId}-${pdf.replace(/\.pdf$/i, "")}`;
}

export const dummyCourses = [
  {
    id: "course-physics",
    title: "Grade 10 Physics",
    description:
      "Shared course. Chapters stay the same across batches; each batch can upload its own PDFs.",
    chapters: [
      {
        id: "chapter-physics-1",
        title: "Motion in a Straight Line",
        description: "Displacement, velocity, and acceleration with sample graphs.",
      },
      {
        id: "chapter-physics-2",
        title: "Laws of Motion",
        description: "Newton's three laws with classroom examples.",
      },
      {
        id: "chapter-physics-3",
        title: "Work, Energy and Power",
        description: "Work-energy theorem and simple numericals.",
      },
    ],
  },
  {
    id: "course-english",
    title: "English Literature",
    description: "Shared reading course. Attach it to any batch, then upload batch-specific notes.",
    chapters: [
      {
        id: "chapter-english-1",
        title: "The Last Leaf",
        description: "Summary, characters, and three discussion questions.",
      },
      {
        id: "chapter-english-2",
        title: "The Road Not Taken",
        description: "Line-by-line meaning and poetic devices.",
      },
    ],
  },
  {
    id: "course-math",
    title: "Grade 8 Mathematics",
    description: "Shared algebra and geometry course for Grade 8 batches.",
    chapters: [
      {
        id: "chapter-math-1",
        title: "Linear Equations",
        description: "Solving equations in one variable.",
      },
      {
        id: "chapter-math-2",
        title: "Quadrilaterals",
        description: "Properties of parallelograms, rectangles, and rhombuses.",
      },
      {
        id: "chapter-math-3",
        title: "Data Handling",
        description: "Bar graphs and mean, median, mode.",
      },
    ],
  },
] as const;

export const dummyBatches = [
  {
    id: "batch-grade-10",
    name: "Grade 10 Morning",
    description: "Weekday morning batch. Uses the shared Physics course.",
    students: [
      {
        id: "student-ananya",
        name: "Ananya Sharma",
        contactNumber: "9876543210",
        email: dummyEmail("Ananya Sharma"),
      },
      {
        id: "student-rohan",
        name: "Rohan Patel",
        contactNumber: "9876501234",
        email: dummyEmail("Rohan Patel"),
      },
      {
        id: "student-meera",
        name: "Meera Iyer",
        contactNumber: "9988776655",
        email: dummyEmail("Meera Iyer"),
      },
    ],
    courseIds: ["course-physics"],
    materials: [
      {
        chapterId: "chapter-physics-1",
        pdf: "morning-motion-notes.pdf",
        title: "Motion — Grade 10 Morning",
        lines: [
          "Dummy PDF for the morning batch only.",
          "1. Distance is the total path covered.",
          "2. Displacement is the shortest path from start to finish.",
        ],
        studentIds: ["student-ananya", "student-rohan", "student-meera"],
      },
      {
        chapterId: "chapter-physics-1",
        pdf: "morning-motion-worksheet.pdf",
        title: "Motion worksheet — Grade 10 Morning",
        lines: [
          "A second dummy PDF for the same morning chapter.",
          "Practice: a bus travels 60 km in 1.5 hours. Find average speed.",
        ],
        studentIds: ["student-ananya"],
        kind: "assignment",
        instructions:
          "Solve the average-speed problems in the worksheet. Show every step, and write the final answers for questions 1 to 3.",
      },
      {
        chapterId: "chapter-physics-2",
        pdf: "morning-laws-of-motion.pdf",
        title: "Laws of Motion — Grade 10 Morning",
        lines: [
          "Dummy PDF for the morning batch only.",
          "First law: a body stays at rest or in uniform motion unless a force acts.",
          "Second law: F = ma.",
        ],
        studentIds: ["student-ananya", "student-rohan"],
      },
    ],
  },
  {
    id: PROTOTYPE_ENGLISH_BATCH_ID,
    name: "Grade 10 English",
    description:
      "English literature for the morning class. Uses the shared English course.",
    students: [],
    courseIds: ["course-english"],
    materials: [
      {
        chapterId: "chapter-english-1",
        pdf: "morning-the-last-leaf.pdf",
        title: "The Last Leaf — Grade 10 English",
        lines: [
          "Dummy reading notes for the English batch.",
          "Theme: hope can keep a person going.",
        ],
        studentIds: ["student-ananya", "student-rohan", "student-meera"],
      },
    ],
  },
  {
    id: PROTOTYPE_EVENING_BATCH_ID,
    name: "Grade 10 Evening",
    description:
      "Same Physics course as the morning batch, with different PDFs so you can compare the two.",
    students: [
      {
        id: "student-ishaan",
        name: "Ishaan Kapoor",
        contactNumber: "9876511111",
        email: dummyEmail("Ishaan Kapoor"),
      },
      {
        id: "student-zara",
        name: "Zara Khan",
        contactNumber: "9876522222",
        email: dummyEmail("Zara Khan"),
      },
    ],
    courseIds: ["course-physics"],
    materials: [
      {
        chapterId: "chapter-physics-1",
        pdf: "evening-motion-notes.pdf",
        title: "Motion — Grade 10 Evening",
        lines: [
          "Dummy PDF for the evening batch only.",
          "This is a different worksheet from the morning batch.",
          "Practice: a car travels 80 km in 2 hours. Find average speed.",
        ],
        studentIds: ["student-ishaan", "student-zara", "student-ananya"],
      },
      {
        chapterId: "chapter-physics-3",
        pdf: "evening-work-energy.pdf",
        title: "Work and Energy — Grade 10 Evening",
        lines: [
          "Dummy PDF for the evening batch only.",
          "Work = force x displacement.",
          "Power = work / time.",
        ],
        studentIds: ["student-zara"],
      },
    ],
  },
  {
    id: "batch-grade-8",
    name: "Grade 8 Afternoon",
    description: "After-school batch using the shared Mathematics course.",
    students: [
      {
        id: "student-kabir",
        name: "Kabir Singh",
        contactNumber: "9123456780",
        email: dummyEmail("Kabir Singh"),
      },
      {
        id: "student-diya",
        name: "Diya Nair",
        contactNumber: "9000011122",
        email: dummyEmail("Diya Nair"),
      },
      {
        id: "student-aarav",
        name: "Aarav Sharma",
        contactNumber: "9876532100",
        email: dummyEmail("Aarav Sharma"),
      },
    ],
    courseIds: ["course-math"],
    materials: [
      {
        chapterId: "chapter-math-1",
        pdf: "grade8-linear-equations.pdf",
        title: "Linear Equations — Grade 8 Afternoon",
        lines: ["Dummy worksheet for this batch.", "Solve: 2x + 5 = 17"],
        studentIds: ["student-kabir", "student-diya", "student-aarav"],
      },
      {
        chapterId: "chapter-math-2",
        pdf: "grade8-quadrilaterals.pdf",
        title: "Quadrilaterals — Grade 8 Afternoon",
        lines: ["Dummy notes for this batch.", "A parallelogram has opposite sides equal and parallel."],
        studentIds: ["student-kabir"],
      },
    ],
  },
] as const;

export const dummyExtraEnrollments = [
  {
    studentId: "student-ananya",
    batchId: PROTOTYPE_EVENING_BATCH_ID,
  },
  {
    studentId: "student-ananya",
    batchId: PROTOTYPE_ENGLISH_BATCH_ID,
  },
  {
    studentId: "student-rohan",
    batchId: PROTOTYPE_ENGLISH_BATCH_ID,
  },
  {
    studentId: "student-meera",
    batchId: PROTOTYPE_ENGLISH_BATCH_ID,
  },
] as const;

export const dummyParents = [
  {
    id: "parent-priya",
    name: "Priya Sharma",
    email: dummyEmail("Priya Sharma"),
    studentIds: ["student-ananya", "student-aarav"],
  },
] as const;

export const SAMPLE_STUDENT_EMAIL = dummyBatches[0].students[0].email;
export const SAMPLE_PARENT_EMAIL = dummyParents[0].email;

export function dummyStudentEmail(studentId: string) {
  for (const batch of dummyBatches) {
    const student = batch.students.find((item) => item.id === studentId);
    if (student) return student.email;
  }
  return uniqueAcademyEmail(studentId.replace(/^student-/, ""), new Set([ADMIN_EMAIL]));
}
