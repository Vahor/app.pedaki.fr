'use client';

import { Checkbox } from '@pedaki/design/ui/checkbox.js';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@pedaki/design/ui/form.js';
import { StyledLink } from '@pedaki/design/ui/styled-link';
import type { FormType } from '~/app/new/form-wrapper.tsx';
import { env } from '~/env.mjs';
import React from 'react';

export function TermsForm({ form }: { form: FormType }) {
  return (
    <div className="grid gap-8">
      <FormField
        control={form.control}
        name="cgu"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <div className="space-y-1 leading-none">
              <FormLabel>Accept terms and conditions</FormLabel>
              <FormDescription>
                You can read them{' '}
                <StyledLink
                  href={env.NEXT_PUBLIC_WWW_URL + '/legal/terms-of-service'}
                  target="_blank"
                >
                  here
                </StyledLink>
                .
              </FormDescription>
              <FormMessage />
            </div>
            <FormControl>
              <Checkbox className="mt-1" checked={!!field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
