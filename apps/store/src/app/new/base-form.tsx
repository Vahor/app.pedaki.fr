'use client';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@pedaki/design/ui/form.js';
import { Input } from '@pedaki/design/ui/input.js';
import type { FormType } from '~/app/new/form-wrapper.tsx';
import React from 'react';

export function BaseForm({ form }: { form: FormType }) {
  const { isSubmitting } = form.formState;

  return (
    <div className="grid gap-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Workspace Name</FormLabel>
            <FormMessage />
            <FormControl>
              <Input
                placeholder="Mewo"
                type="text"
                autoComplete="name"
                disabled={isSubmitting}
                {...field}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="subdomain"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Workspace URL</FormLabel>
            <FormMessage />
            <FormControl>
              <div className="relative">
                <Input
                  placeholder="mewo"
                  type="text"
                  autoComplete="name"
                  className="pr-[11ch]"
                  disabled={isSubmitting}
                  {...field}
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center rounded-r-md border bg-gray-2 px-3 text-sm">
                  <span className="text-gray-11 sm:text-sm">.pedaki.fr</span>
                </div>
              </div>
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="billing.email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormMessage />
            <FormControl>
              <Input
                placeholder="name@example.com"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                disabled={isSubmitting}
                {...field}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="billing.name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormMessage />
            <FormControl>
              <Input
                placeholder="name@example.com"
                type="text"
                autoCapitalize="none"
                autoComplete="username"
                autoCorrect="off"
                disabled={isSubmitting}
                {...field}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
