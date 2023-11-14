const REDACTED_PATTERNS = ['PASS', 'AUTH'] as const;

export const REPLACEMENT = '[secret]' as const;

export const redacted = (obj: Record<string, string>): Record<string, string> => {
  return Object.entries(obj).reduce(
    (acc, [key, value]) => {
      if (REDACTED_PATTERNS.some(pattern => key.includes(pattern))) {
        acc[key] = REPLACEMENT;
      }
      else {
          acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, string>,
  );
};

// TODO: add tests
