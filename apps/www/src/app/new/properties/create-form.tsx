'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { wrapWithLoading } from '@pedaki/common/utils/wrap-with-loading.js';
import { Button } from '@pedaki/design/ui/button.js';
import { Checkbox } from '@pedaki/design/ui/checkbox.js';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@pedaki/design/ui/form.js';
import { IconSpinner } from '@pedaki/design/ui/icons';
import { Input } from '@pedaki/design/ui/input.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@pedaki/design/ui/select.js';
import { StyledLink } from '@pedaki/design/ui/styled-link';
import { RegionMap } from '@pedaki/schema/region.model.js';
import { CreateWorkspaceInput } from '@pedaki/schema/workspace.model.js';
import { api } from '~/server/api/clients/client.ts';
import { useWorkspaceFormStore } from '~/store/workspace-form.store.ts';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const Schema = CreateWorkspaceInput.and(
  z.object({ cgu: z.boolean().refine(v => v, { message: 'Vous devez accepter les CGU' }) }),
);
type CreateWorkspaceFormValues = z.infer<typeof Schema>;

export function CreateForm() {
  const pendingId = useWorkspaceFormStore(store => store.pendingId);
  const setPendingId = useWorkspaceFormStore(store => store.setPendingId);

  const form = useForm<CreateWorkspaceFormValues>({
    resolver: zodResolver(Schema),
    mode: 'onBlur',
    defaultValues: {
      cgu: false,
      provider: 'AWS',
      // TODO: remove this
      email: 'test@email.com',
      identifier: 'mewo',
      name: 'test',
    },
  });
  const { isSubmitting } = form.formState;

  const createReservationMutation = api.workspace.reservation.create.useMutation();
  const { data: reservation } = api.workspace.reservation.getOne.useQuery(
    {
      id: pendingId!,
    },
    {
      enabled: !!pendingId,
    },
  );

  const reset = form.reset;

  useEffect(() => {
    if (reservation) {
      toast('Reprendre la création du workspace ?', {
        action: {
          label: 'Oui',
          onClick: () => {
            reset(reservation);
          },
        },
      });
    }
  }, [reservation, reset]);
  function onSubmit(values: CreateWorkspaceFormValues) {
    return wrapWithLoading(() => createReservationMutation.mutateAsync(values), {
      loadingProps: {
        title: '...',
      },
      successProps: {
        title: '🎉',
      },
      errorProps: error => {
        const title =
          error.message === 'ALREADY_EXISTS'
            ? 'Un compte existe déjà avec cette adresse email'
            : 'Une erreur est survenue lors de la création du compte';
        return {
          title,
        };
      },
      throwOnError: true,
    })
      .then(data => {
        setPendingId(data.id);
      })
      .catch(() => {
        // ignore
      });
  }

  return (
    <div className="grid gap-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
                <FormControl>
                  <Input
                    placeholder="John"
                    type="text"
                    autoComplete="name"
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="identifier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Identifier</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="John"
                      type="text"
                      autoComplete="name"
                      disabled={isSubmitting}
                      {...field}
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center rounded-r-md border bg-secondary px-3 text-sm">
                      <span className="text-gray-500 sm:text-sm">.pedaki.fr</span>
                    </div>
                  </div>
                </FormControl>
                <FormDescription>Sous domaine de votre workspace</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
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
                <FormDescription>
                  You will receive an email with the instructions to activate your account
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
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
                      {Object.entries(RegionMap[form.getValues().provider]).map(
                        ([region, label]) => (
                          <SelectItem value={region} key={region}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription>The region where your workspace will be hosted</FormDescription>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cgu"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    className="mt-1"
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Accept terms and conditions</FormLabel>
                  <FormDescription>
                    You can read them <StyledLink href="/terms">here</StyledLink>.
                  </FormDescription>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <div className="grid gap-2">
            <Button disabled={isSubmitting} className="mt-2" type="submit">
              {isSubmitting && <IconSpinner className="mr-2 h-4 w-4 animate-spin" />}
              Créer
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
