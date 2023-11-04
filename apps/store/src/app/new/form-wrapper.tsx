'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import wait from '@pedaki/common/utils/wait';
import { wrapWithLoading } from '@pedaki/common/utils/wrap-with-loading';
import { Button } from '@pedaki/design/ui/button';
import { Form } from '@pedaki/design/ui/form';
import { IconSpinner } from '@pedaki/design/ui/icons';
import { CreateWorkspaceInput } from '@pedaki/schema/workspace.model.js';
import { BaseFormInformation } from '~/app/new/base-form-information.tsx';
import { PlanFormInformation } from '~/app/new/plan-form-information.tsx';
import { PlanForm } from '~/app/new/plan-form.tsx';
import { TermsForm } from '~/app/new/terms-form.tsx';
import { api } from '~/server/api/clients/client';
import { useWorkspaceFormStore } from '~/store/workspace-form.store.ts';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { BaseForm } from './base-form.tsx';

export type FormType = ReturnType<typeof useForm<CreateWorkspaceFormValues>>;
const Schema = CreateWorkspaceInput.and(
  z.object({ cgu: z.boolean().refine(v => v, { message: 'Vous devez accepter les CGU' }) }),
);
export type CreateWorkspaceFormValues = z.infer<typeof Schema>;

const FormWrapper = () => {
  const setPaymentUrl = useWorkspaceFormStore(store => store.setPaymentUrl);

  const form = useForm<CreateWorkspaceFormValues>({
    resolver: zodResolver(Schema),
    mode: 'onChange',
    defaultValues: {
      cgu: false,
      provider: 'AWS',
      subscriptionInterval: 'yearly',
      // TODO: remove this
      email: 'test@email.com',
      identifier: 'mewo',
      name: 'test',
    },
  });

  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { push } = useRouter();
  const createReservationMutation = api.workspace.reservation.create.useMutation();

  function onSubmit(values: CreateWorkspaceFormValues) {
    return wrapWithLoading(() => wait(createReservationMutation.mutateAsync(values), 500), {
      loadingProps: {
        title: '...',
      },
      successProps: {
        title: '🎉',
      },
      errorProps: error => {
        const title =
          error.message === 'ALREADY_EXISTS'
            ? 'Un compte existe déjà avec cet URL de workspace'
            : 'Une erreur est survenue lors de la création du compte';
        return {
          title,
        };
      },
      throwOnError: true,
    })
      .then(data => {
        push(data.stripeUrl);
        setPaymentUrl(data.stripeUrl);
      })
      .catch(() => {
        // ignore
      });
  }

  const { isSubmitting } = form.formState;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <section className="mt-8">
          <h2 className="text-lg font-bold">Informations de base</h2>
          <div className="mt-4 grid gap-8 lg:grid-cols-[2fr,minmax(0,1.5fr)]">
            <BaseForm form={form} />
            <BaseFormInformation form={form} />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-bold">Informations sur l&apos;abonnement</h2>
          <div className="mt-4 grid gap-8 lg:grid-cols-[2fr,minmax(0,1.5fr)]">
            <PlanForm form={form} />
            <PlanFormInformation form={form} />
          </div>
        </section>

        <section className="mt-12">
          <TermsForm form={form} />
        </section>

        <div className="mt-12 flex justify-end">
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting && <IconSpinner className="mr-2 h-4 w-4 animate-spin" />}
            Aller à la page de paiement
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default FormWrapper;
