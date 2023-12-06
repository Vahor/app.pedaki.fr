import PageHeader from "~/components/page-header";
import { IconAccountPin } from "@pedaki/design/ui/icons";

export default function BuyerDetailsPage() {
  return (
    <>
      <PageHeader
        icon={IconAccountPin}
        title="Informations personnelles"
        description="Veuillez renseigner vos informations personnelles"
        />
    </>
  );
}
