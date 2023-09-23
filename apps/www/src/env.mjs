import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]),
    NEXTAUTH_SECRET: z.string().min(1).default("secret"),

    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),

    PASSWORD_SALT: z.string().min(1),

    // optional for development
    RESEND_API_KEY: z.string().min(1).optional(),
    MAILER_PREVIEW: z.coerce.boolean().default(false),

    // We only need to have access to the Account table
    DATABASE_URL: z.string().url(),
  },

  client: {
    NEXT_PUBLIC_WWW_URL: z.string().url().default("https://www.pedaki.fr"),
    NEXT_PUBLIC_APP_URL: z.string().url().default("https://app.pedaki.fr"),
    NEXT_PUBLIC_API_URL: z.string().url().default("https://api.pedaki.fr"),
    NEXT_PUBLIC_DOCS_URL: z.string().url().default("https://docs.pedaki.fr"),
  },

  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    PASSWORD_SALT: process.env.PASSWORD_SALT,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    MAILER_PREVIEW: process.env.MAILER_PREVIEW,
    DATABASE_URL: process.env.DATABASE_URL,

    NEXT_PUBLIC_WWW_URL: process.env.NEXT_PUBLIC_WWW_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_DOCS_URL: process.env.NEXT_PUBLIC_DOCS_URL,
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
