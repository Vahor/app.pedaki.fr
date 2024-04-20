import { TRPCError } from "@trpc/server";

export class InvalidStateError extends TRPCError {
	constructor() {
		super({
			code: "UNAUTHORIZED",
			message: "INVALID_STATE",
		});
	}
}
