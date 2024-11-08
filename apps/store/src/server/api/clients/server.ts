"use server";

import type { AppRouter } from "@pedaki/api/router/router.js";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { experimental_createTRPCNextAppDirServer } from "@trpc/next/app-dir/server";
import { env } from "~/env.mjs";
import { cookies } from "next/headers.js";
import superjson from "superjson";
import { getUrl } from "./shared";

export const api: ReturnType<
	typeof experimental_createTRPCNextAppDirServer<AppRouter>
> = experimental_createTRPCNextAppDirServer<AppRouter>({
	config() {
		return {
			transformer: superjson,
			links: [
				loggerLink({
					enabled: () => true,
				}),
				httpBatchLink({
					url: getUrl(),
					headers() {
						return {
							cookie: cookies().toString(),
							"x-trpc-source": "rsc-http",
							"internal-secret": env.API_ENCRYPTION_KEY,
						};
					},
				}),
			],
		};
	},
});
