import { z } from "zod";

export const WithTimestamps = z.object({
    createdAt: z.date(),
    updatedAt: z.date(),
});