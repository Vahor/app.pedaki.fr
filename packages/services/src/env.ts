import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),

		STRIPE_SECRET_KEY: z.string(),
		STORE_URL: z.string().url().default("https://store.pedaki.fr"),
		STRIPE_PRODUCT_HOSTED_MONTHLY_PRICE_ID: z.string(),
		STRIPE_PRODUCT_HOSTED_YEARLY_PRICE_ID: z.string(),

		JWT_PRIVATE_KEY: z.string(),

		API_ENCRYPTION_KEY: z.string().length(32),
	},
	runtimeEnv: process.env,
});
