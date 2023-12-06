import { type IconType } from '@pedaki/design/ui/icons';
import { cn } from '@pedaki/design/utils';
import React from 'react';

interface PageHeaderProps {
  icon: IconType;
  title: string;
  description: string;
}

const PageHeader = ({ icon: Icon, title, description }: PageHeaderProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-gradient-to-b from-neutral-200/50 to-white flex items-center justify-center p-4 w-max border-t rounded-full  mx-auto">
        <div className="rounded-full border p-3.5 bg-white shadow-sm">
          <Icon className={cn('h-8 w-8 text-sub ')} />
        </div>
      </div>
      <div>
      <h1 className="text-main text-title-5">
        {title}
      </h1>
        <p className="text-sub">
            {description}
        </p>
      </div>
    </div>
  );
};

export default PageHeader;
