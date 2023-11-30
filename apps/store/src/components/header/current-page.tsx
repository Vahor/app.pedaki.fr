'use client';

import { Button } from '@pedaki/design/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@pedaki/design/ui/dropdown-menu';
import { IconChevronDown } from '@pedaki/design/ui/icons';
import IconCheck from '@pedaki/design/ui/icons/IconCheck';
import { cn } from '@pedaki/design/utils';
import { StepIndicatorHorizontal } from '~/components/step-indicator/horizontal';
import { StepIndicatorHorizontalItem } from '~/components/step-indicator/horizontal/item.tsx';
import { usePathname } from 'next/navigation';
import React from 'react';

const page_mapping = [
  {
    path: '/new',
    translationKey: 'Informations',
  },
  {
    path: '/new/pending',
    translationKey: 'Abonnement',
  },
  {
    path: '/new/invitations',
    translationKey: 'Invitations',
  },
  {
    path: '/new/ready',
    translationKey: 'Ready',
  },
] as const;

// Ex: 404 page
const unknown_page = {
  translationKey: 'unknown',
};

const status = (index: number, activeIndex: number) => {
  if (index === activeIndex) {
    return 'active';
  } else if (index < activeIndex) {
    return 'completed';
  } else {
    return 'pending';
  }
};

const CurrentPage = () => {
  const pathname = usePathname();
  const activeIndex = page_mapping.findIndex(page => page.path === pathname);
  const currentPage = activeIndex !== -1 ? page_mapping[activeIndex]! : unknown_page;

  return (
    <div>
      <div className="hidden lg:flex">
        <StepIndicatorHorizontal>
          {page_mapping.map((page, index) => (
            <StepIndicatorHorizontalItem
              number={index + 1}
              text={page.translationKey}
              key={index}
              status={status(index, activeIndex)}
            />
          ))}
        </StepIndicatorHorizontal>
      </div>
      <div className="flex justify-start lg:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="transparent" size="sm" className="flex items-center md:gap-2">
              <div>
                <span className="hidden md:inline">
                  {activeIndex !== -1 && `${activeIndex + 1}.`}{' '}
                </span>
                <span>{currentPage.translationKey}</span>
              </div>
              <IconChevronDown className="text-secondary h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top">
            {page_mapping.map((page, index) => {
              const s = status(index, activeIndex);
              return (
                <DropdownMenuLabel
                  key={page.path}
                  className="flex h-8 items-center justify-start gap-2 font-normal"
                >
                  <div className="flex h-5 w-3 items-center text-sub">
                    {s === 'completed' ? <IconCheck className="h-3 w-3" /> : index + 1}
                  </div>
                  <span className={cn(s === 'active' ? 'text-main' : 'text-sub')}>
                    {page.translationKey}
                  </span>
                </DropdownMenuLabel>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default CurrentPage;