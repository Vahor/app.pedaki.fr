import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		DELETE_OLD_STACK: z.coerce.boolean().default(false),
	},
	runtimeEnv: process.env,
});
