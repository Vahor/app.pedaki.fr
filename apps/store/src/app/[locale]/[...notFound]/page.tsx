import { Button } from '@pedaki/design/ui/button';
import { IconSearch } from '@pedaki/design/ui/icons';
import StatusWrapper from '~/app/status-wrapper';
import { getScopedI18n } from '~/locales/server';
import { fallbackLocale, locales } from '~/locales/shared';
import { setStaticParamsLocale } from 'next-international/server';
import Link from 'next/link';

export default async function NotFound({ params }: { params: { locale: string } }) {
  setStaticParamsLocale(locales.includes(params.locale) ? params.locale : fallbackLocale);
  const t = await getScopedI18n('components.notFound');

  return (
    <StatusWrapper
      titleKey={t('title')}
      descriptionKey={t('description')}
      icon={IconSearch}
      buttons={
        <>
          <Button asChild>
            <Link href="/">{t('link')}</Link>
          </Button>
        </>
      }
    />
  );
}
