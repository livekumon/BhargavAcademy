import fs from "node:fs/promises";
import path from "node:path";
import { getUploadsDir } from "./db";

const MAX_PDF_BYTES = 20 * 1024 * 1024;

export function assertPdfFile(file: File) {
  const isPdf =
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    throw new Error("Only PDF files can be uploaded.");
  }

  if (file.size > MAX_PDF_BYTES) {
    throw new Error("PDF files must be 20 MB or smaller.");
  }
}

export async function savePdf(file: File) {
  assertPdfFile(file);
  const fileName = `${crypto.randomUUID()}.pdf`;
  const filePath = path.join(getUploadsDir(), fileName);
  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, bytes);
  return fileName;
}

export async function deletePdf(fileName: string | null | undefined) {
  if (!fileName) return;
  const filePath = path.join(getUploadsDir(), fileName);
  await fs.unlink(filePath).catch(() => undefined);
}

export function getPdfPath(fileName: string) {
  return path.join(getUploadsDir(), fileName);
}
