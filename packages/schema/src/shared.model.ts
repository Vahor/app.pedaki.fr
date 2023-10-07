import { z } from 'zod';

export const IdModel = z.string().cuid().length(25);
export const DateModel = z.date().refine(date => !isNaN(date.getTime()));
