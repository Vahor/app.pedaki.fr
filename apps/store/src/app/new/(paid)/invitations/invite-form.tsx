'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import wait from '@pedaki/common/utils/wait';
import { wrapWithLoading } from '@pedaki/common/utils/wrap-with-loading';
import { Button } from '@pedaki/design/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@pedaki/design/ui/form';
import IconSpinner from '@pedaki/design/ui/icons/IconSpinner';
import { Input } from '@pedaki/design/ui/input';
import { CreateWorkspaceInvitationInput } from '@pedaki/models/pending-workspace/api-invitation.model';
import { api } from '~/server/api/clients/client.ts';
import { useWorkspaceInvitationStore } from '~/store/workspace-invitation.store.ts';
import React from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

interface InviteFormProps {
  rawToken: string;
}

const Schema = CreateWorkspaceInvitationInput.pick({ email: true, name: true });

type InviteFormValues = z.infer<typeof Schema>;

export function InviteForm({ rawToken }: InviteFormProps) {
  const form = useForm<InviteFormValues>({
    resolver: zodResolver(Schema),
    mode: 'onBlur',
    defaultValues: {
      name: 'bidule',
      email: 'test@email.com',
    },
  });
  const addEmail = useWorkspaceInvitationStore(state => state.addEmail);

  const { isSubmitting } = form.formState;
  const createInvitationMutation = api.workspace.invitation.create.useMutation();

  function onSubmit(values: InviteFormValues) {
    return wrapWithLoading(
      () =>
        wait(
          createInvitationMutation.mutateAsync({
            email: values.email,
            token: rawToken,
            name: values.name,
          }),
          200,
        ),
      {
        loadingProps: {
          title: "Création de l'invitation en cours",
        },
        successProps: {
          title: '🎉 Invitation créée avec succès',
        },
        errorProps: error => {
          const title =
            error.message === 'ALREADY_EXISTS'
              ? 'Une invitation existe déjà avec cette adresse email'
              : "Une erreur est survenue lors de la création de l'invitation";
          return {
            title,
          };
        },
        throwOnError: true,
      },
    )
      .then(() => {
        addEmail({ name: values.name, email: values.email });
      })
      .catch(() => {
        // ignore
      });
  }

  return (
    <div>
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
                    placeholder="john@example.com"
                    type="text"
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adresse mail</FormLabel>
                <FormControl>
                  <Input
                    placeholder="john@example.com"
                    type="email"
                    autoComplete="email"
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-2">
            <Button disabled={isSubmitting} className="mt-2" type="submit">
              {isSubmitting && <IconSpinner className="mr-2 h-4 w-4 animate-spin" />}
              Inviter
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
