import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { keys } from "./keys";

const env = keys();

export const r2 = new S3Client({
  // Required by the SDK but not used by R2.
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

export const buckets = {
  public: env.R2_PUBLIC_BUCKET_NAME,
  private: env.R2_PRIVATE_BUCKET_NAME,
} as const;

export type BucketName = keyof typeof buckets;

const defaultUploadExpirySeconds = 60 * 5; // 5 minutes
const defaultDownloadExpirySeconds = 60 * 15; // 15 minutes

export interface PresignedUpload {
  // The object key within the bucket.
  key: string;
  // The temporary URL the browser PUTs the file bytes to.
  uploadUrl: string;
  // The permanent public URL of the object (public buckets only).
  url?: string;
}

export const createPresignedUploadUrl = async ({
  bucket,
  key,
  contentType,
  expiresIn = defaultUploadExpirySeconds,
}: {
  bucket: BucketName;
  key: string;
  contentType: string;
  expiresIn?: number;
}): Promise<PresignedUpload> => {
  const uploadUrl = await getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: buckets[bucket],
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn }
  );

  return {
    key,
    uploadUrl,
    // Only the public bucket has a directly addressable URL.
    url: bucket === "public" ? `${env.R2_PUBLIC_URL}/${key}` : undefined,
  };
};

// Streams a private object out of the private bucket. Used by the app proxy.
export const getPrivateObject = async (key: string) => {
  const object = await r2.send(
    new GetObjectCommand({ Bucket: buckets.private, Key: key })
  );

  return object;
};

// Generates a short-lived signed GET URL for a private object.
export const createSignedDownloadUrl = async ({
  key,
  expiresIn = defaultDownloadExpirySeconds,
}: {
  key: string;
  expiresIn?: number;
}): Promise<string> =>
  getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: buckets.private, Key: key }),
    { expiresIn }
  );
