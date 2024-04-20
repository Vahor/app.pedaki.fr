import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../../trpc.ts";

export const versionRouter = router({
	getMany: publicProcedure
		.input(
			z.object({
				product: z.enum(["pedaki-community", "pedaki-premium"]),
			}),
		)
		.output(
			z.array(
				z.object({
					version: z.string(),
				}),
			),
		)
		.meta({ method: "GET", path: "/versions" })
		.query(() => {
			throw new TRPCError({
				code: "NOT_IMPLEMENTED",
				message: "Not implemented",
			});
		}),
});
