import {  describe, expect, test } from 'vitest';
import { redacted, REPLACEMENT } from './redacted.ts';

describe('redacted', () => {
    test('ignore non sensitive data', () => {
        const result = redacted({ SOME_KEY: 'value' });
        expect(result).toEqual({ SOME_KEY: 'value' });
    });

    test('redact sensitive data', () => {
        const result = redacted({  AUTH_TOKEN: 'value' });
        expect(result).toEqual({ AUTH_TOKEN: REPLACEMENT });
    });
});
