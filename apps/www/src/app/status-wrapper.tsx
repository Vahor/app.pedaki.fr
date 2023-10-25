import { Button } from '@pedaki/design/ui/button';
import type { IconType } from '@pedaki/design/ui/icons';
import { cn } from '@pedaki/design/utils';
import CircleOpacityEffect from '~/components/CircleOpacityEffect.tsx';
import { env } from '~/env.mjs';
import Link from 'next/link';
import React from 'react';
import { Balancer } from 'react-wrap-balancer';

interface StatusWrapperProps {
  titleKey: string;
  descriptionKey: string;
  icon: IconType;
  loadingIndicator?: boolean;
  iconClassName?: string;
  supportLink?: boolean;
  buttons?: React.ReactNode;
}

const StatusWrapper = ({
  titleKey,
  descriptionKey,
  icon: Icon,
  loadingIndicator,
  iconClassName,
  supportLink = true,
  buttons,
}: StatusWrapperProps) => {
  return (
    <div className="relative flex h-full flex-col items-center md:pt-16">
      <div className="relative -z-10 -mb-28 flex h-[400px] w-full items-center justify-center">
        <CircleOpacityEffect
          className="absolute inset-0 h-[400px] w-full text-grayA-12"
          loadingIndicator={loadingIndicator}
        />
        <div className="rounded-md border">
          <Icon className={cn('h-12 w-12 p-3 text-grayA-11 ', iconClassName)} />
        </div>
      </div>

      <h1 className="text-2xl font-bold">{titleKey}</h1>

      <Balancer className="mb-8 mt-4 max-w-screen-sm text-center text-secondary">
        {descriptionKey}
        {supportLink && " Si vous pensez qu'il s'agit d'une erreur, veuillez contacter le support."}
      </Balancer>

      <div className="flex items-center justify-center gap-4">
        {supportLink && (
          <Button variant="outline" asChild>
            <Link href={env.NEXT_PUBLIC_WWW_URL + '/support'}>Contacter le support</Link>
          </Button>
        )}
        {buttons}
      </div>
    </div>
  );
};

export default StatusWrapper;
