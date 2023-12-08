import {
  DatabaseResourceSchema,
  DnsResourceSchema,
  ServerResourceSchema,
} from '@pedaki/models/resource/resource.model.js';
import type { Output } from '@pulumi/pulumi';
import { z } from 'zod';

export const StackOutputsSchema = z.array(
  ServerResourceSchema.or(DnsResourceSchema).or(DatabaseResourceSchema),
);

export type StackOutputs = z.infer<typeof StackOutputsSchema>;

type ToOutput<T> = {
  [K in keyof T]: T[K] extends Record<any, any>
    ? ToOutput<T[K]>
    : T[K] extends (infer U)[]
      ? ToOutput<U>[]
      : T[K] extends string
        ? Output<T[K]> | T[K]
        : T[K];
};
export type StackOutputsLike = ToOutput<StackOutputs>;
