'use client';

import type { IconProps } from '@pedaki/design/ui/icons';
import React, { useEffect } from 'react';

const opacity = [0.2, 0.4, 0.6, 0.8, 1];
const loadingOpacity = [0.8, 0.6, 0.4, 0.2, 0, 0, 0];

const getOpacity = (index: number, isLoading: boolean | undefined) => {
  if (isLoading) {
    return loadingOpacity[index % loadingOpacity.length];
  }
  return opacity[index % opacity.length];
};

const CircleOpacityEffect = ({
  loadingIndicator,
  ...props
}: IconProps & { loadingIndicator?: boolean }) => {
  const [index, setIndex] = React.useState(0);

  useEffect(() => {
    if (loadingIndicator) {
      const interval = setInterval(() => {
        setIndex(index => index + 1);
      }, 250);
      return () => clearInterval(interval);
    }
  }, [loadingIndicator]);

  return (
    <svg viewBox="0 0 1650 1650" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle
        cx="825"
        cy="825"
        r="224.5"
        stroke="currentColor"
        strokeOpacity={getOpacity(index + 3, loadingIndicator)}
      />
      <circle
        cx="825"
        cy="825"
        r="374.5"
        stroke="currentColor"
        strokeOpacity={getOpacity(index + 2, loadingIndicator)}
      />
      <circle
        cx="825"
        cy="825"
        r="524.5"
        stroke="currentColor"
        strokeOpacity={getOpacity(index + 1, loadingIndicator)}
      />
      <circle
        cx="825"
        cy="825"
        r="674.5"
        stroke="currentColor"
        strokeOpacity={getOpacity(index, loadingIndicator)}
      />
    </svg>
  );
};

export default CircleOpacityEffect;
