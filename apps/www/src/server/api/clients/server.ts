'use server';

import { loggerLink } from '@trpc/client';
import { experimental_nextHttpLink } from '@trpc/next/app-dir/links/nextHttp';
import { experimental_createTRPCNextAppDirServer } from '@trpc/next/app-dir/server';
import { cookies } from 'next/headers';
import superjson from 'superjson';
import type {AppRouter} from "@pedaki/api/src/router";
import { getUrl } from './shared';

export const api = experimental_createTRPCNextAppDirServer<AppRouter>({
  config() {
    return {
      transformer: superjson,
      links: [
        loggerLink({
          enabled: (op) => true,
        }),
        experimental_nextHttpLink({
          batch: true,
          url: getUrl(),
          headers() {
            return {
              cookie: cookies().toString(),
              'x-trpc-source': 'rsc-http',
            };
          },
        }),
      ],
    };
  },
});

// export const createAction =