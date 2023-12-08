import NotFoundComponent from '~/components/NotFound';
import { fallbackLocale } from '~/locales/shared';
import { setStaticParamsLocale } from 'next-international/server';

export default function NotFound() {
  setStaticParamsLocale(fallbackLocale);

  return <NotFoundComponent />;
}
