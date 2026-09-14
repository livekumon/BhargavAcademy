import {
  BookMarked,
  HeartHandshake,
  Inbox,
  LayoutGrid,
  Settings,
  Sun,
  Users,
  type LucideIcon,
} from "lucide-react";

export type TeacherNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
  badge?: "leads";
};

export type TeacherNavGroup = { label: string; items: TeacherNavItem[] };

/*
 * The teacher portal's map. Grouped by the job each area does, so the
 * sidebar reads as "teach, people, grow" rather than a flat list of tables.
 */
export const teacherNav: TeacherNavGroup[] = [
  {
    label: "Teach",
    items: [
      { href: "/dashboard", label: "Today", icon: Sun, isActive: (p) => p === "/dashboard" },
      {
        href: "/dashboard/batches",
        label: "Batches",
        icon: LayoutGrid,
        isActive: (p) => p.startsWith("/dashboard/batches"),
      },
      {
        href: "/dashboard/courses",
        label: "Course library",
        icon: BookMarked,
        isActive: (p) => p.startsWith("/dashboard/courses"),
      },
    ],
  },
  {
    label: "People",
    items: [
      {
        href: "/dashboard/students",
        label: "Students",
        icon: Users,
        isActive: (p) => p.startsWith("/dashboard/students"),
      },
      {
        href: "/dashboard/parents",
        label: "Parents",
        icon: HeartHandshake,
        isActive: (p) => p.startsWith("/dashboard/parents"),
      },
    ],
  },
  {
    label: "Grow",
    items: [
      {
        href: "/dashboard/leads",
        label: "Leads",
        icon: Inbox,
        isActive: (p) => p.startsWith("/dashboard/leads"),
        badge: "leads",
      },
    ],
  },
  {
    label: "Academy",
    items: [
      {
        href: "/dashboard/settings",
        label: "Settings",
        icon: Settings,
        isActive: (p) => p.startsWith("/dashboard/settings"),
      },
    ],
  },
];

export const allTeacherNavItems = teacherNav.flatMap((group) => group.items);
