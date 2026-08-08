interface SignResponse {
  error?: string;
  key?: string;
  uploadUrl?: string;
  url?: string;
}

// Builds the authenticated proxy URL that streams a private R2 object.
// Private objects are never publicly addressable, so the browser loads them
// through this app route (which enforces tenant auth).
export const privateFileUrl = (key?: string | null): string | null =>
  key ? `/api/files/${key}` : null;

export interface UploadedFile {
  // The object key within the bucket (always present).
  key: string;
  // The permanent public URL (present only for public-bucket uploads).
  url?: string;
}

/**
 * Two-step direct-to-R2 upload:
 *  1. Ask the server to authenticate + generate a presigned PUT URL.
 *  2. PUT the file bytes straight to Cloudflare R2.
 * Returns the object key and, for public buckets, the public URL.
 */
export const uploadToR2 = async (
  file: File,
  endpoint: string
): Promise<UploadedFile> => {
  const signResponse = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    }),
  });

  const signed = (await signResponse.json()) as SignResponse;

  if (!signResponse.ok) {
    throw new Error(signed.error ?? "Failed to prepare upload.");
  }
  if (!(signed.uploadUrl && signed.key)) {
    throw new Error("Upload was not signed correctly.");
  }

  const putResponse = await fetch(signed.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!putResponse.ok) {
    throw new Error("Failed to upload file to storage.");
  }

  return { key: signed.key, url: signed.url };
};
