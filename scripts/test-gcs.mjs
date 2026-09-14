import { createHash } from "node:crypto";
import { Storage } from "@google-cloud/storage";

const EXPECTED_BUCKET = "bhargavacademy";
const EXPECTED_PROJECT = "slapp-478005";
const OBJECT_PREFIX = "pdfs";

function parseServiceAccount() {
  let raw = process.env.GCP_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) {
    throw new Error("GCP_SERVICE_ACCOUNT_JSON is not set");
  }
  if (
    (raw.startsWith("'") && raw.endsWith("'")) ||
    (raw.startsWith('"') && raw.endsWith('"'))
  ) {
    raw = raw.slice(1, -1);
  }
  return JSON.parse(raw);
}

function ok(label, extra) {
  if (extra === undefined) {
    console.log(`ok  ${label}`);
    return;
  }
  console.log(`ok  ${label}`, extra);
}

function fail(label, error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`FAIL  ${label}: ${message}`);
  process.exitCode = 1;
}

async function main() {
  const bucketName = process.env.GCS_BUCKET_NAME?.trim();
  const projectId = process.env.GCP_PROJECT_ID?.trim();
  if (bucketName !== EXPECTED_BUCKET) {
    throw new Error(
      `GCS_BUCKET_NAME must be ${EXPECTED_BUCKET}, got ${JSON.stringify(bucketName)}`,
    );
  }
  if (projectId !== EXPECTED_PROJECT) {
    throw new Error(
      `GCP_PROJECT_ID must be ${EXPECTED_PROJECT}, got ${JSON.stringify(projectId)}`,
    );
  }

  const credentials = parseServiceAccount();
  if (credentials.project_id !== EXPECTED_PROJECT) {
    throw new Error(`service account project_id is ${credentials.project_id}`);
  }
  if (credentials.client_email !== "slapp-715@slapp-478005.iam.gserviceaccount.com") {
    throw new Error(`unexpected service account ${credentials.client_email}`);
  }
  ok("credentials", { projectId, bucketName, email: credentials.client_email });

  const storage = new Storage({ projectId, credentials });
  const bucket = storage.bucket(bucketName);
  const [metadata] = await bucket.getMetadata();
  ok("bucket metadata", {
    name: metadata.name,
    location: metadata.location,
    storageClass: metadata.storageClass,
  });

  const fileName = `_gcs-test-${Date.now()}.pdf`;
  const objectPath = `${OBJECT_PREFIX}/${fileName}`;
  const payload = Buffer.from(
    "%PDF-1.4\n1 0 obj<< /Type /Catalog >>endobj\ntrailer<<>>\n%%EOF\n",
  );
  const digest = createHash("sha256").update(payload).digest("hex");

  const file = bucket.file(objectPath);
  await file.save(payload, {
    contentType: "application/pdf",
    resumable: false,
    metadata: {
      cacheControl: "private, max-age=0, must-revalidate",
    },
  });
  ok("upload", { object: `gs://${bucketName}/${objectPath}` });

  const [downloaded] = await file.download();
  const downloadedDigest = createHash("sha256").update(downloaded).digest("hex");
  if (!downloaded.equals(payload) || downloadedDigest !== digest) {
    throw new Error("downloaded bytes did not match upload");
  }
  const [objectMeta] = await file.getMetadata();
  ok("download", {
    bytes: downloaded.length,
    contentType: objectMeta.contentType,
  });

  await file.delete({ ignoreNotFound: true });
  const [exists] = await file.exists();
  if (exists) {
    throw new Error("object still exists after delete");
  }
  ok("delete");

  console.log("GCS test passed.");
}

main().catch((error) => {
  fail("gcs test", error);
});
