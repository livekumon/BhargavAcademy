import fs from "node:fs";
import path from "node:path";

function escapePdfText(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

export function writeDummyPdf(
  uploadsDir: string,
  fileName: string,
  title: string,
  lines: string[],
) {
  const content = [
    "BT",
    "/F1 20 Tf",
    "72 720 Td",
    `(${escapePdfText(title)}) Tj`,
    "/F1 12 Tf",
    ...lines.flatMap((line) => ["0 -22 Td", `(${escapePdfText(line)}) Tj`]),
    "ET",
  ].join("\n");

  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
    `4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
  ];

  let offset = "%PDF-1.4\n".length;
  const xrefEntries = ["0000000000 65535 f "];
  let body = "";

  for (const object of objects) {
    xrefEntries.push(`${String(offset).padStart(10, "0")} 00000 n `);
    body += object;
    offset += object.length;
  }

  const xrefOffset = "%PDF-1.4\n".length + body.length;
  const pdf = [
    "%PDF-1.4\n",
    body,
    `xref\n0 ${objects.length + 1}\n`,
    xrefEntries.join("\n"),
    "\n",
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`,
    `startxref\n${xrefOffset}\n`,
    "%%EOF\n",
  ].join("");

  const filePath = path.join(uploadsDir, fileName);
  fs.writeFileSync(filePath, pdf);
  return fileName;
}
