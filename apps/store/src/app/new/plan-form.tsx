'use client';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@pedaki/design/ui/form.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@pedaki/design/ui/select.js';
import { Switch } from '@pedaki/design/ui/switch';
import { RegionMap } from '@pedaki/schema/region.model.js';
import type { FormType } from '~/app/new/form-wrapper.tsx';
import React from 'react';

export function PlanForm({ form }: { form: FormType }) {
  return (
    <div className="grid gap-8">
      <FormField
        control={form.control}
        name="region"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Region</FormLabel>
            <FormMessage />
            <FormControl>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a region" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RegionMap[form.getValues().provider]).map(([region, label]) => (
                    <SelectItem value={region} key={region}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="subscriptionInterval"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3">
            <div>
              <FormLabel>Abonnement annuel ?</FormLabel>
              <FormDescription>
                En prenant un abonnement annuel, vous bénéficiez d&apos;une réduction de 20% sur le
                prix de votre abonnement.
              </FormDescription>
              <FormMessage />
            </div>
            <FormControl>
              <Switch
                className="mt-1"
                checked={field.value === 'yearly'}
                onCheckedChange={checked => field.onChange(checked ? 'yearly' : 'monthly')}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
