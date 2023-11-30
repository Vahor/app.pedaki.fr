'use client';

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

const CurrentPage = () => {
  const pathname = usePathname();
  const activeIndex = page_mapping.findIndex(page => page.path === pathname);

  return (
    <StepIndicatorHorizontal>
      {page_mapping.map((page, index) => (
        <StepIndicatorHorizontalItem
          number={index + 1}
          text={page.translationKey}
          key={index}
          status={index === activeIndex ? 'active' : index < activeIndex ? 'completed' : 'pending'}
        />
      ))}
    </StepIndicatorHorizontal>
  );
};

export default CurrentPage;