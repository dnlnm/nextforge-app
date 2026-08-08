import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = () =>
  createEnv({
    skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
    server: {
      STRIPE_SECRET_KEY: z.string().startsWith("sk_").optional(),
      STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
      KLIO_STRIPE_PRO_PRICE_ID: z.string().startsWith("price_").optional(),
      KLIO_STRIPE_STARTER_PRICE_ID: z.string().startsWith("price_").optional(),
      TLAS_STRIPE_PRO_PRICE_ID: z.string().startsWith("price_").optional(),
      TLAS_STRIPE_STARTER_PRICE_ID: z.string().startsWith("price_").optional(),
    },
    runtimeEnv: {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      KLIO_STRIPE_PRO_PRICE_ID: process.env.KLIO_STRIPE_PRO_PRICE_ID,
      KLIO_STRIPE_STARTER_PRICE_ID: process.env.KLIO_STRIPE_STARTER_PRICE_ID,
      TLAS_STRIPE_PRO_PRICE_ID: process.env.TLAS_STRIPE_PRO_PRICE_ID,
      TLAS_STRIPE_STARTER_PRICE_ID: process.env.TLAS_STRIPE_STARTER_PRICE_ID,
    },
  });
