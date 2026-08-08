import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
    server: {
      R2_ACCOUNT_ID: z.string().min(1),
      R2_ACCESS_KEY_ID: z.string().min(1),
      R2_SECRET_ACCESS_KEY: z.string().min(1),
      // Public bucket: served directly from the custom domain (public access on).
      R2_PUBLIC_BUCKET_NAME: z.string().min(1),
      // Public base URL for the public bucket, e.g. your custom domain attached
      // to the bucket ("https://cdn.klio.my"). No trailing slash.
      R2_PUBLIC_URL: z.string().url(),
      // Private bucket: no public access; read via signed URLs / the app proxy.
      R2_PRIVATE_BUCKET_NAME: z.string().min(1),
    },
    runtimeEnv: {
      R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
      R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
      R2_PUBLIC_BUCKET_NAME: process.env.R2_PUBLIC_BUCKET_NAME,
      R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
      R2_PRIVATE_BUCKET_NAME: process.env.R2_PRIVATE_BUCKET_NAME,
    },
  });
