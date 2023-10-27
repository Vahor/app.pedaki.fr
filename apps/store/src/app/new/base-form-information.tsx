import { FormField } from '@pedaki/design/ui/form';
import type { FormType } from '~/app/new/form-wrapper.tsx';
import React from 'react';

export function BaseFormInformation({ form }: { form: FormType }) {
  return (
    <div className="max-w-full bg-primary text-sm text-secondary">
      <p>Toutes ces informations pourront être modifiées plus tard.</p>
      <br />
      <FormField
        control={form.control}
        name="identifier"
        render={({ field }) => (
          <p>
            Votre workspace sera accessible à l&apos;adresse{' '}
            <span className="break-words font-bold text-orange-9">{field.value}.pedaki.fr</span>.
          </p>
        )}
      />
      <br />
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <p>
            Vous receverez les identifiants de connexions sur{' '}
            <span className="break-words font-bold text-orange-9">{field.value}</span>.
          </p>
        )}
      />
      <p>
        Cet email sera également utilisé pour vous contacter et servira de liens avec le support.
      </p>
    </div>
  );
}
