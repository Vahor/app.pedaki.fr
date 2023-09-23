// providers.ts
'use client';

import type React from 'react';
import {api} from "~/server/api/clients/client";

export const TrpcProvider = api.withTRPC(
  (props: React.PropsWithChildren) => props.children,
) as React.ComponentType<React.PropsWithChildren>;
