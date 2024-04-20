import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	server: {
		NODE_ENV: z.enum(["development", "test", "production"]),

		API_ENCRYPTION_KEY: z.string().length(32),
	},

	client: {
		NEXT_PUBLIC_WWW_URL: z.string().url().default("https://www.pedaki.fr"),
		NEXT_PUBLIC_STORE_URL: z.string().url().default("https://app.pedaki.fr"),
		NEXT_PUBLIC_API_URL: z.string().url().default("https://api.pedaki.fr"),
		NEXT_PUBLIC_DOCS_URL: z.string().url().default("https://docs.pedaki.fr"),
	},

	runtimeEnv: {
		NODE_ENV: process.env.NODE_ENV,

		NEXT_PUBLIC_WWW_URL: process.env.NEXT_PUBLIC_WWW_URL,
		NEXT_PUBLIC_STORE_URL: process.env.NEXT_PUBLIC_STORE_URL,
		NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
		NEXT_PUBLIC_DOCS_URL: process.env.NEXT_PUBLIC_DOCS_URL,

		API_ENCRYPTION_KEY: process.env.API_ENCRYPTION_KEY,
	},

	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
