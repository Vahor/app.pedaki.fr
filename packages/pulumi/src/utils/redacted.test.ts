import { expectTypeOf } from 'expect-type';
import { describe, expect, test } from 'vitest';
import { redacted, REPLACEMENT } from './redacted.ts';

describe('redacted', () => {
  test('ignore non sensitive data', () => {
    const result = redacted({ SOME_KEY: 'value' });
    expect(result).toEqual({ SOME_KEY: 'value' });
    expectTypeOf(result).toEqualTypeOf<{ SOME_KEY: string }>();
  });

  test('redact sensitive data', () => {
    const result = redacted({
      PEDAKI_AUTH_TOKEN: 'value',
      NEXTAUTH_SECRET: 'value',
      PASSWORD_SALT: 'value',
      PRISMA_ENCRYPTION_KEY: 'value',
      DATABASE_URL: 'value',
    });
    expect(result).toEqual({
      PEDAKI_AUTH_TOKEN: REPLACEMENT,
      NEXTAUTH_SECRET: REPLACEMENT,
      PASSWORD_SALT: REPLACEMENT,
      PRISMA_ENCRYPTION_KEY: REPLACEMENT,
      DATABASE_URL: REPLACEMENT,
    });
    expectTypeOf(result).toEqualTypeOf<{
      PEDAKI_AUTH_TOKEN: string;
      NEXTAUTH_SECRET: string;
      PASSWORD_SALT: string;
      PRISMA_ENCRYPTION_KEY: string;
      DATABASE_URL: string;
    }>();
  });
});
