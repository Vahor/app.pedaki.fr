'use client';

import { Button } from '@pedaki/design/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@pedaki/design/ui/dropdown-menu';
import { IconChevronDown, IconChevronRight } from '@pedaki/design/ui/icons';
import { usePathname } from 'next/navigation';
import React from 'react';

const page_mapping = [
  {
    path: '/new',
    translationKey: 'step_1',
  },
  {
    path: '/new/pending',
    translationKey: 'step_2',
  },
] as const;

const CurrentPage = () => {
  const pathname = usePathname();
  const activeIndex = page_mapping.findIndex(page => page.path === pathname);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="transparent" size="sm" className="flex items-center md:gap-2">
          <span>{page_mapping[activeIndex]!.translationKey}.large</span>
          <IconChevronDown className="h-4 w-4 text-secondary" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top">
        {page_mapping.map((page, index) => {
          const isCurrent = index === activeIndex;
          return (
            <DropdownMenuLabel key={page.path} className="flex items-center gap-2 font-normal">
              {isCurrent ? <IconChevronRight className="h-4 w-4" /> : <span className="h-4 w-4" />}
              <span>{page.translationKey}.small</span>
            </DropdownMenuLabel>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CurrentPage;
