import { memberService } from "@pedaki/services/member/member.service.js";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router, workspaceProcedure } from "../../trpc.ts";

export const workspaceMembersRouter = router({
	delete: publicProcedure
		.input(z.object({ id: z.string().cuid().length(25) }))
		.output(z.undefined())
		.meta({ openapi: { method: "DELETE", path: "/workspace/{id}/member" } })
		.mutation(() => {
			throw new TRPCError({
				code: "NOT_IMPLEMENTED",
				message: "NOT_IMPLEMENTED",
			});
		}),

	register: workspaceProcedure
		.input(
			z.object({
				email: z.string().email(),
			}),
		)
		.output(z.undefined())
		.meta({ openapi: { method: "POST", path: "/workspace/member" } })
		.mutation(async ({ input, ctx }) => {
			const { email } = input;
			await memberService.register(ctx.workspace.subdomain, email);
		}),
});
