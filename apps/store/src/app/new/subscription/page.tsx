import { Button } from '@pedaki/design/ui/button';
import { IconArrowRight } from '@pedaki/design/ui/icons';
import { SubscriptionForm } from '~/app/new/subscription/subscription-form.tsx';
import PageHeader from '~/components/page-header';
import Link from 'next/link';

export default function SubscriptionDetailsPage() {
  return (
    <>
      <Button className="absolute top-8 text-sub" variant="stroke-primary-gray" asChild>
        <Link href="/new">
          <IconArrowRight className="h-3 w-3 rotate-180" />
          <span>Retour</span>
        </Link>
      </Button>

      <div className="mx-auto mt-16 flex max-w-screen-sm flex-col">
        <PageHeader title="Workspace" description="Informations sur le workspace" />
        <SubscriptionForm />
      </div>
    </>
  );
}
