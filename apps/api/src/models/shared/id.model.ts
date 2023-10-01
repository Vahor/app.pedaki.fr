import { z } from 'zod';

export const WithId = z.object({
  id: z.string().cuid().length(25),
});
