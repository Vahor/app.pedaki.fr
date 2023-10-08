"use server";
import {decrypt} from '@pedaki/common/utils/hash.js';
import {z} from 'zod';
import {env} from "~/env.mjs";

type ParseTokenOutput = | {
    workspaceId: string;
    expiresAt: string;
    status: 'valid';
} | {
    status: 'invalid' | 'expired';
}

const schema = z.object({
    workspaceId: z.string(),
    expiresAt: z.string(),
});

export const parseToken = (token: unknown): ParseTokenOutput => {
    if (!token || typeof token !== 'string') {
        return {status: 'invalid'};
    }

    try {
        const decoded = decrypt(token, env.API_ENCRYPTION_KEY);
        const parsed = schema.parse(JSON.parse(decoded));
        if (new Date(parsed.expiresAt) < new Date()) {
            return {status: 'expired'};
        }

        return {
            workspaceId: parsed.workspaceId,
            expiresAt: parsed.expiresAt,
            status: 'valid',
        }
    } catch (e) {
        console.log(e)
        return {status: 'expired'};
    }
};
