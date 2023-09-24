'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

export function HandleErrorCode() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error');

  const shown = useRef<boolean>();

  useEffect(() => {
    if (error && !shown.current) {
      toast.error(error);
      shown.current = true;
    }
  }, [error]);

  return null;
}
