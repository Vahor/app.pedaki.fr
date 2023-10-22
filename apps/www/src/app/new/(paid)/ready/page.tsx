import { Button } from '@pedaki/design/ui/button';
import IconCheck from '@pedaki/design/ui/icons/IconCheck';
import StatusWrapper from '~/app/status-wrapper.tsx';
import Link from 'next/link';
import React from 'react';

export default function ReadyPage({ searchParams }: { searchParams: Record<string, string> }) {
  const url = searchParams.url;
  const validUrl = new URL(url ?? '');

  return (
    <StatusWrapper
      titleKey="Votre workspace est prêt&nbsp;&nbsp;🎉"
      descriptionKey="Les identifiants de connexions vous ont été envoyé par mail. Merci blablabla"
      icon={IconCheck}
      supportLink={false}
      buttons={
        <>
          <Button asChild>
            <Link href={validUrl.href}>Accéder au workspace</Link>
          </Button>
        </>
      }
    />
  );
}
