import { Storage, type Bucket } from "@google-cloud/storage";

const OBJECT_PREFIX = "pdfs";
const LEADS_PREFIX = "leads";

type ServiceAccount = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

let storage: Storage | null = null;

function parseServiceAccount(): ServiceAccount | null {
  let raw = process.env.GCP_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  if (
    (raw.startsWith("'") && raw.endsWith("'")) ||
    (raw.startsWith('"') && raw.endsWith('"'))
  ) {
    raw = raw.slice(1, -1);
  }

  try {
    return JSON.parse(raw) as ServiceAccount;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`GCP_SERVICE_ACCOUNT_JSON is not valid JSON: ${message}`);
  }
}

function getStorage() {
  if (storage) return storage;

  const credentials = parseServiceAccount();
  const projectId =
    process.env.GCP_PROJECT_ID?.trim() || credentials?.project_id;

  storage = credentials
    ? new Storage({ projectId, credentials })
    : new Storage({ projectId });

  return storage;
}

export function getGcsBucketName() {
  return process.env.GCS_BUCKET_NAME?.trim() || "";
}

export function isGcsConfigured() {
  return Boolean(
    getGcsBucketName() &&
      (process.env.GCP_SERVICE_ACCOUNT_JSON?.trim() ||
        process.env.GOOGLE_APPLICATION_CREDENTIALS),
  );
}

export function getGcsBucket(): Bucket {
  const bucketName = getGcsBucketName();
  if (!bucketName) {
    throw new Error("GCS_BUCKET_NAME is not configured");
  }
  return getStorage().bucket(bucketName);
}

export function gcsObjectPath(fileName: string) {
  return `${OBJECT_PREFIX}/${fileName}`;
}

export async function uploadPdfToGcs(fileName: string, bytes: Buffer) {
  const file = getGcsBucket().file(gcsObjectPath(fileName));
  await file.save(bytes, {
    contentType: "application/pdf",
    resumable: false,
    metadata: {
      cacheControl: "private, max-age=0, must-revalidate",
    },
  });
}

export async function downloadPdfFromGcs(fileName: string) {
  const file = getGcsBucket().file(gcsObjectPath(fileName));
  const [bytes] = await file.download();
  return Buffer.from(bytes);
}

export async function deletePdfFromGcs(fileName: string) {
  await getGcsBucket()
    .file(gcsObjectPath(fileName))
    .delete({ ignoreNotFound: true });
}

export function gcsLeadPath(leadId: string) {
  return `${LEADS_PREFIX}/${leadId}.json`;
}

export async function saveLeadJsonToGcs(leadId: string, payload: unknown) {
  const file = getGcsBucket().file(gcsLeadPath(leadId));
  await file.save(JSON.stringify(payload), {
    contentType: "application/json",
    resumable: false,
    metadata: {
      cacheControl: "private, max-age=0, must-revalidate",
    },
  });
}

export async function listLeadJsonFromGcs<T>(): Promise<T[]> {
  const [files] = await getGcsBucket().getFiles({ prefix: `${LEADS_PREFIX}/` });
  const records = await Promise.all(
    files
      .filter((file) => file.name.endsWith(".json"))
      .map(async (file) => {
        const [bytes] = await file.download();
        return JSON.parse(bytes.toString("utf8")) as T;
      }),
  );
  return records;
}

export async function verifyGcsConnection() {
  const bucket = getGcsBucket();
  const [metadata] = await bucket.getMetadata();
  return {
    bucketName: metadata.name ?? getGcsBucketName(),
    location: metadata.location,
    storageClass: metadata.storageClass,
  };
}
