import NotFoundComponent from '~/components/NotFound';
import { setStaticParamsLocale } from 'next-international/server';

export default async function NotFound({ params }: { params: { locale: string } }) {
  setStaticParamsLocale(params.locale);

  return <NotFoundComponent />;
}
