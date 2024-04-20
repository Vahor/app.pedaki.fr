import { Button } from "@pedaki/design/ui/button";
import { IconArrowRight } from "@pedaki/design/ui/icons";
import { SubscriptionForm } from "~/app/[locale]/new/subscription/subscription-form.tsx";
import PageHeader from "~/components/page-header";
import { setStaticParamsLocale } from "~/locales/utils";
import Link from "next/link";

export default function SubscriptionDetailsPage({
	params,
}: { params: { locale: string } }) {
	setStaticParamsLocale(params.locale);

	return (
		<>
			<Button className="absolute top-8" variant="stroke-primary-main" asChild>
				<Link href="/new">
					<IconArrowRight className="h-3 w-3 rotate-180" />
					<span>Retour</span>
				</Link>
			</Button>

			<div className="mx-auto mt-16 flex max-w-screen-sm flex-col">
				<PageHeader
					title="Workspace"
					description="Informations sur le workspace"
				/>
				<SubscriptionForm locale={params.locale} />
			</div>
		</>
	);
}
