import { cn } from '@pedaki/design/utils/cn';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import * as React from 'react';


const stepIndicatorVariants = cva('w-5 h-5 items-center flex justify-center rounded-full p-0.5 font-medium text-xs leading-[16px]', {
  variants: {
    status: {
      active: 'bg-primary-base text-white',
      completed: '',
      pending: 'border text-soft bg-white',
    }
  },
  defaultVariants: {
    status: 'pending',
  },
});

export interface StepIndicatorHorizontalProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stepIndicatorVariants> {
  number: number;
  text: string;
}

const StepIndicatorHorizontalItem = ({ className, status, number, text, ...props }: StepIndicatorHorizontalProps) => (
  <div className="gap-2 flex items-center">
    <div className={cn(stepIndicatorVariants({ status }), className)} {...props}>
      {number}
    </div>
    <span className={cn(status === 'active' ? 'text-primary' : 'text-gray-400')}>
      {text}
    </span>
  </div>
);
StepIndicatorHorizontalItem.displayName = 'StepIndicatorHorizontalItem';

export { StepIndicatorHorizontalItem };