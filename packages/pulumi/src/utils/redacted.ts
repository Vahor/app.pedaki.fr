const REDACTED_PATTERNS = [
	"PASS",
	"AUTH",
	"DATABASE_URL",
	"PRISMA_ENCRYPTION_KEY",
] as const;

export const REPLACEMENT = "[secret]" as const;

export const redacted = <T extends Record<string, string>>(obj: T): T => {
	return Object.entries(obj).reduce(
		(acc, [key, value]) => {
			if (REDACTED_PATTERNS.some((pattern) => key.includes(pattern))) {
				acc[key] = REPLACEMENT;
			} else {
				acc[key] = value;
			}
			return acc;
		},
		{} as Record<string, string>,
	) as T;
};
