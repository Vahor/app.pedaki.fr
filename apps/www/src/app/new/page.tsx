import { CreateForm } from '~/app/new/create-form.tsx';
import OpenOldPayment from '~/app/new/open-old-payment.tsx';

export default function NewWorkspacePage() {
  return (
    <main className="container py-8">
      <p>New</p>
      <OpenOldPayment />
      <CreateForm />
    </main>
  );
}
