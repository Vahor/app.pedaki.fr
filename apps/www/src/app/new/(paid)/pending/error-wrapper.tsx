import { Button } from '@pedaki/design/ui/button';
import type { IconType } from '@pedaki/design/ui/icons';
import CircleOpacityEffect from '~/components/CircleOpacityEffect.tsx';
import { env } from '~/env.mjs';
import Link from 'next/link';
import React from 'react';
import { Balancer } from 'react-wrap-balancer';
import {cn} from "@pedaki/design/utils";

interface ErrorWrapperProps {
  titleKey: string;
  descriptionKey: string;
  icon: IconType;
  loadingIndicator?: boolean;
  iconClassName?: string;
}

const ErrorWrapper = ({
  titleKey,
  descriptionKey,
  icon: Icon,
  loadingIndicator,
                          iconClassName,
}: ErrorWrapperProps) => {
  return (
    <div className="relative flex h-full flex-col items-center">
      <div className="relative -z-10 -mb-32 flex h-[400px] w-full items-center justify-center">
        <CircleOpacityEffect
          className="absolute inset-0 h-[400px] w-full text-grayA-12"
          loadingIndicator={loadingIndicator}
        />
        <div className="rounded-md border">
          <Icon className={cn("h-12 w-12 p-3 text-grayA-11 ", iconClassName)} />
        </div>
      </div>

      <h1 className="text-2xl font-bold">{titleKey}</h1>

      <Balancer className="mb-8 mt-4 max-w-3xl text-secondary">
        {descriptionKey} Si vous pensez qu'il s'agit d'une erreur, veuillez contacter le support.
      </Balancer>

      <Button variant="outline" asChild>
        <Link href={env.NEXT_PUBLIC_WWW_URL + '/support'}>Contacter le support</Link>
      </Button>
    </div>
  );
};

export default ErrorWrapper;
