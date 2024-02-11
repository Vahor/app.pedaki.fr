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
  FormSubLabel,
} from '@pedaki/design/ui/form';
import { IconInfoCircleFill, IconUser } from '@pedaki/design/ui/icons';
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

const Schema = CreateWorkspaceInvitationInput.pick({ email: true });

type InviteFormValues = z.infer<typeof Schema>;

export function InviteForm({ rawToken }: InviteFormProps) {
  const form = useForm<InviteFormValues>({
    resolver: zodResolver(Schema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
    },
  });
  const addEmail = useWorkspaceInvitationStore(state => state.addEmail);

  const { isSubmitting, isValid } = form.formState;
  const createInvitationMutation = api.workspace.invitation.create.useMutation();

  function onSubmit(values: InviteFormValues) {
    return wrapWithLoading(
      () =>
        wait(
          createInvitationMutation.mutateAsync({
            email: values.email,
            token: rawToken,
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
        addEmail({ email: values.email });
      })
      .catch(() => {
        // ignore
      });
  }

  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col items-start gap-4 md:flex-row"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>
                  <span>Inviter un membre</span>
                  <FormSubLabel>(Optionnel)</FormSubLabel>
                </FormLabel>
                <FormControl>
                  <Input
                    icon={IconUser}
                    placeholder="tony@example.com"
                    type="email"
                    autoComplete="email"
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage className="flex items-center space-x-1">
                  <IconInfoCircleFill className="h-4 w-4" />
                  <span className="text-p-sm">De base il n&apos;aura aucune permission</span>
                </FormMessage>
              </FormItem>
            )}
          />
          <Button
            disabled={isSubmitting || !isValid || createInvitationMutation.isLoading}
            className="w-full md:mt-6 md:w-[8ch]"
            type="submit"
          >
            {isSubmitting && <IconSpinner className="mr-2 h-4 w-4 animate-spin" />}
            {!isSubmitting && 'Inviter'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
