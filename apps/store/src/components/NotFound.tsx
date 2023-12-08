import { Button } from '@pedaki/design/ui/button';
import { IconSearch } from '@pedaki/design/ui/icons';
import StatusWrapper from '~/app/status-wrapper';
import { getScopedI18n } from '~/locales/server';
import Link from 'next/link';
import React from 'react';

const NotFoundComponent = async () => {
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
};

export default NotFoundComponent;
