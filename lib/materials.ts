export const MATERIAL_KINDS = ["class_material", "assignment"] as const;

export type MaterialKind = (typeof MATERIAL_KINDS)[number];

export function asMaterialKind(value: string | null | undefined): MaterialKind {
  return value === "assignment" ? "assignment" : "class_material";
}

export function parseMaterialKind(value: FormDataEntryValue | null): MaterialKind {
  return asMaterialKind(typeof value === "string" ? value : null);
}

export function materialKindLabel(kind: string | null | undefined) {
  return kind === "assignment" ? "Assignment" : "Class material";
}

export function isAssignment(kind: string | null | undefined) {
  return kind === "assignment";
}

export function splitMaterials<T extends { kind?: string | null }>(materials: T[]) {
  const classMaterials: T[] = [];
  const assignments: T[] = [];

  for (const material of materials) {
    if (isAssignment(material.kind)) {
      assignments.push(material);
    } else {
      classMaterials.push(material);
    }
  }

  return { classMaterials, assignments };
}
