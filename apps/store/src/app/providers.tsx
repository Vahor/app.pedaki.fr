"use client";

import { I18nProviderClient } from "~/locales/client";
import { TrpcProvider } from "~/server/api/providers";
import type React from "react";
import { Provider as BalancerProvider } from "react-wrap-balancer";
import { Toaster } from "sonner";

interface Props {
	children: React.ReactElement | React.ReactElement[];
	locale: string;
}

export const Providers = ({ children, locale }: Props) => {
	return (
		<>
			<Toaster closeButton />
			<TrpcProvider>
				<BalancerProvider>
					<I18nProviderClient locale={locale}>{children}</I18nProviderClient>
				</BalancerProvider>
			</TrpcProvider>
		</>
	);
};
