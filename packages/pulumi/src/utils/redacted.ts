const REDACTED_PATTERNS = ['PASS'] as const;

const REPLACEMENT = '[secret]';

export const redacted = (obj: Record<string, string>): Record<string, string> => {
  return Object.entries(obj).reduce(
    (acc, [key, value]) => {
      if (REDACTED_PATTERNS.some(pattern => key.includes(pattern))) {
        acc[key] = REPLACEMENT;
      }
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>,
  );
};

// TODO: add tests
