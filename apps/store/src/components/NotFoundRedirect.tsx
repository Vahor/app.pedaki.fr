'use client';

import { fallbackLocale } from '~/locales/shared';
import { redirect, usePathname } from 'next/navigation';

const NotFoundRedirectComponent = () => {
  const pathname = usePathname();

  redirect(`/${fallbackLocale}${pathname}`);
  return null;
};

export default NotFoundRedirectComponent;
