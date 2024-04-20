import { TRPCError } from "@trpc/server";

export class NotYourWorkspaceError extends TRPCError {
	constructor() {
		super({
			code: "UNAUTHORIZED",
			message: "NOT_YOUR_WORKSPACE",
		});
	}
}
