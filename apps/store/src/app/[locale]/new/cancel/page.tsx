"use server";

import { setStaticParamsLocale } from "~/locales/utils";
import { api } from "~/server/api/clients/server.ts";
import { redirect } from "next/navigation";

export default async function NewWorkspaceCancelPage({
	searchParams,
	params,
}: {
	searchParams: Record<string, string>;
	params: { locale: string };
}) {
	setStaticParamsLocale(params.locale);
	const token = searchParams.token;

	if (token) {
		await api.stripe.cancelCheckoutSession.mutate({ token });
	}

	redirect("/new?cancel=true");
}
