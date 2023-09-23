'use client';

import type { AppRouter } from '@pedaki/api/src/router';
import { loggerLink, TRPCClientError } from '@trpc/client';
import { experimental_createTRPCNextAppDirClient } from '@trpc/next/app-dir/client';
import { experimental_nextHttpLink } from '@trpc/next/app-dir/links/nextHttp';
import superjson from 'superjson';
import {getUrl} from "~/server/api/clients/shared";

export const api = experimental_createTRPCNextAppDirClient<AppRouter>({
  config() {
    return {
      transformer: superjson,
      queryClientConfig: {
        defaultOptions: {
          queries: {
            suspense: false,
            staleTime: 10_000,
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            retry: (failureCount: number, error: Error) => {
              if (failureCount > 2) return false;

              if (error instanceof TRPCClientError) {
                const code = (error as TRPCClientError<AppRouter>).data?.code;

                if (
                  code === 'UNAUTHORIZED' ||
                  code === 'FORBIDDEN' ||
                  code === 'NOT_FOUND' ||
                  code === 'BAD_REQUEST' ||
                  code === 'METHOD_NOT_SUPPORTED' ||
                  code === 'INTERNAL_SERVER_ERROR' ||
                  code === 'TOO_MANY_REQUESTS' ||
                  code === 'PAYLOAD_TOO_LARGE'
                ) {
                  return false;
                }
              }
              return true;
            },
          },
        },
      },
      links: [
        loggerLink({
          enabled: opts =>
            process.env.NODE_ENV === 'development' ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        experimental_nextHttpLink({
          batch: true,
          url: getUrl(),
          headers() {
            return {
              'x-trpc-source': 'client',
            };
          },
        }),
      ],
    };
  },
});

