import { env } from '~/env.mjs';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// replace this with a manual middleware
// when on /auth redirect to / if logged in
const PUBLIC_FILE = /\.(js|json|woff2|png|css|map|ico|xml|txt|svg)$/;

const requireAuthRoutes: string[] = ['/'];

const requireGuestRoutes = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (PUBLIC_FILE.test(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const secret = env.NEXTAUTH_SECRET;

  const token = await getToken({
    req: request,
    secret,
  });

  console.log(request.url);
  const needGuest = requireGuestRoutes.includes(pathname);
  console.log({ needGuest, pathname });

  if (needGuest && token) {
    // Redirect to homepage if logged in
    return NextResponse.redirect(new URL('/?error=ALREADY_LOGGED', request.url));
  }

  const needAuth = requireAuthRoutes.includes(pathname);
  console.log({ needAuth, pathname });

  if (needAuth && !token) {
    return NextResponse.redirect(new URL('/auth/login?error=NEEDS_AUTH', request.url));
  }
}
