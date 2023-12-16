import PageHeader from '~/components/page-header';
import { getScopedI18n } from '~/locales/server';
import { fallbackLocale, locales } from '~/locales/shared';
import { setStaticParamsLocale } from 'next-international/server';
import OpenOldPayment from './open-old-payment';
import { UserInfoForm } from './user-info-form';

export const generateMetadata = async ({ params }: { params: { locale: string } }) => {
  setStaticParamsLocale(locales.includes(params.locale) ? params.locale : fallbackLocale);
  const homeT = await getScopedI18n('pages.new.home');

  return {
    title: { absolute: homeT('metadata.title') },
    description: homeT('metadata.description'),
  };
};

export default function BuyerDetailsPage({ params }: { params: { locale: string } }) {
  setStaticParamsLocale(params.locale);

  return (
    <div className="mx-auto mt-16 flex max-w-screen-sm flex-col">
      <PageHeader
        title="Informations personnelles"
        description="Veuillez renseigner vos informations personnelles"
      />
      <UserInfoForm />
      <OpenOldPayment />
    </div>
  );
}
