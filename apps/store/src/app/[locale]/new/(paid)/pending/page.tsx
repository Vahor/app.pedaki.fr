import { IconCalendarX, IconX } from "@pedaki/design/ui/icons";
import { loadInitialIsPaid } from "~/app/[locale]/new/(paid)/pending/load-initial-is-paid.ts";
import WaitingForPayment from "~/app/[locale]/new/(paid)/pending/WaitingForPayment.tsx";
import StatusWrapper from "~/app/status-wrapper.tsx";
import { setStaticParamsLocale } from "~/locales/utils";
import React from "react";

export default async function PendingPaymentPage({
	searchParams,
	params,
}: {
	searchParams: Record<string, string>;
	params: { locale: string };
}) {
	setStaticParamsLocale(params.locale);

	const token = searchParams.token;
	const initialIsPaid = await loadInitialIsPaid(token);
	// TODO: faire les textes (trads)

	if (initialIsPaid.status === "invalid") {
		return (
			<StatusWrapper
				titleKey="Identifiant invalide"
				icon={IconX}
				iconClassName="text-red-9"
			/>
		);
	}

	if (initialIsPaid.status === "expired") {
		return (
			<StatusWrapper
				titleKey="Identifiant expiré"
				icon={IconCalendarX}
				iconClassName="text-red-9"
			/>
		);
	}

	return <WaitingForPayment status={initialIsPaid.status} token={token!} />;
}
