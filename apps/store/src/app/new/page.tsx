import PageHeader from '~/components/page-header';
import { UserInfoForm } from './user-info-form';

export default function BuyerDetailsPage() {
  return (
    <div className="mx-auto mt-16 flex max-w-screen-sm flex-col">
      <PageHeader
        title="Informations personnelles"
        description="Veuillez renseigner vos informations personnelles"
      />
      <UserInfoForm />
    </div>
  );
}
