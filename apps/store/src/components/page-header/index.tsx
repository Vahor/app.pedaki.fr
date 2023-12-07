import { Separator } from '@pedaki/design/ui/separator';
import React from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
}

const PageHeader = ({ title, description }: PageHeaderProps) => {
  return (
    <div className="flex flex-col items-center">
      <div>
        <h1 className="text-center text-title-5 text-main">{title}</h1>
        <p className="text-center text-sub">{description}</p>
      </div>
      <Separator orientation="horizontal" className="my-6 bg-stroke-soft" />
    </div>
  );
};

export default PageHeader;
