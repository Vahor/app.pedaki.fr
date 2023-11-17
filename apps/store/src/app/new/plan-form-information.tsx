import { FormField } from '@pedaki/design/ui/form';
import type { FormType } from '~/app/new/form-wrapper.tsx';
import React from 'react';

const priceMap = {
  monthly: 20,
  yearly: 16 * 12,
};

export function PlanFormInformation({ form }: { form: FormType }) {
  return (
    <div className="bg-primary text-sm text-secondary">
      <p>
        Les règles liées à la sécurité et la RGPD s&apos;appliquent dans toutes nos régions.
        <br />
        Nous vous recommandons de choisir la région la plus proche de vos utilisateurs.
      </p>
      <br />
      <p>Vous ne pourrez changer de plan qu&apos;à la fin de votre période d&apos;engagement.</p>
      <FormField
        control={form.control}
        name="billing.subscriptionInterval"
        render={({ field }) => (
          <p>
            Avec votre abonnement {field.value === 'yearly' ? 'annuel' : 'mensuel'}, vous allez
            payer <span className="font-bold text-orange-9">{priceMap[field.value]}€</span> par{' '}
            {field.value === 'yearly' ? 'an' : 'mois'}.
          </p>
        )}
      />
    </div>
  );
}
