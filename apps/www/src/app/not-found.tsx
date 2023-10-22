import { Button } from '@pedaki/design/ui/button';
import { IconSearch } from '@pedaki/design/ui/icons';
import StatusWrapper from '~/app/status-wrapper.tsx';
import Link from 'next/link';

export default function NotFound() {
  return (
    <StatusWrapper
      titleKey="Page introuvable"
      descriptionKey={'Une erreur est survenue.'}
      icon={IconSearch}
      buttons={
        <>
          <Button asChild>
            <Link href="/">Retour à l&apos;accueil</Link>
          </Button>
        </>
      }
    />
  );
}
