import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { buildDummyPdf } from "./dummy-pdf";
import {
  deletePdfFromGcs,
  downloadPdfFromGcs,
  isGcsConfigured,
  uploadPdfToGcs,
} from "./gcs";

const MAX_PDF_BYTES = 20 * 1024 * 1024;

function getDataDir() {
  return process.env.VERCEL
    ? path.join("/tmp", "bhargav-academy-data")
    : path.join(process.cwd(), "data");
}

export function getUploadsDir() {
  const uploadsDir = path.join(getDataDir(), "uploads");
  fs.mkdirSync(uploadsDir, { recursive: true });
  return uploadsDir;
}

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

async function writePdfBytes(fileName: string, bytes: Buffer) {
  if (isGcsConfigured()) {
    await uploadPdfToGcs(fileName, bytes);
    return;
  }

  await fsPromises.writeFile(path.join(getUploadsDir(), fileName), bytes);
}

export async function savePdf(file: File) {
  assertPdfFile(file);
  const fileName = `${crypto.randomUUID()}.pdf`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writePdfBytes(fileName, bytes);
  return fileName;
}

export async function saveDummyPdf(
  fileName: string,
  title: string,
  lines: string[],
) {
  const bytes = buildDummyPdf(title, lines);
  await writePdfBytes(fileName, bytes);
  return fileName;
}

export async function readPdf(fileName: string) {
  if (isGcsConfigured()) {
    return downloadPdfFromGcs(fileName);
  }

  return fsPromises.readFile(path.join(getUploadsDir(), fileName));
}

export async function deletePdf(fileName: string | null | undefined) {
  if (!fileName) return;

  if (isGcsConfigured()) {
    await deletePdfFromGcs(fileName);
    return;
  }

  await fsPromises
    .unlink(path.join(getUploadsDir(), fileName))
    .catch(() => undefined);
}

export function getPdfPath(fileName: string) {
  return path.join(getUploadsDir(), fileName);
}
