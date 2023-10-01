import { baseAuthOptions } from '@pedaki/auth';
import { env } from '~/env.ts';
// eslint-disable-next-line
import { getToken } from 'next-auth/jwt';
// eslint-disable-next-line
import type { GetTokenParams, JWT } from 'next-auth/jwt';

export const authFromRequest = async (
  req: Partial<Pick<GetTokenParams['req'], 'headers' | 'cookies'>>,
): Promise<JWT | null> => {
  return await getToken({
    // @ts-expect-error I know what I'm doing
    req: req,
    secret: env.NEXTAUTH_SECRET,
    secureCookie: baseAuthOptions.useSecureCookies,
    cookieName: baseAuthOptions.cookies.sessionToken.name,
  });
};
