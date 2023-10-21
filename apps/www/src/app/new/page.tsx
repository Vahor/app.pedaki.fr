import FormWrapper from '~/app/new/form-wrapper.tsx';
import OpenOldPayment from '~/app/new/open-old-payment.tsx';

export default function NewWorkspacePage() {
  return (
    <>
      <OpenOldPayment />
      <h1 className="text-2xl font-bold">Création du workspace</h1>
      <FormWrapper />
    </>
  );
}
