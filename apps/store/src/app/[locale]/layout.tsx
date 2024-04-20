import "@pedaki/design/tailwind/index.css";
import "~/styles/index.css";
import Footer from "~/app/[locale]/footer.tsx";
import Header from "~/app/[locale]/header.tsx";
import { Providers } from "~/app/providers";
import type { LocaleCode } from "~/locales/server";
import { locales } from "~/locales/shared";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type React from "react";

export default function Layout({
	children,
	params: { locale },
}: {
	children: React.ReactElement;
	params: { locale: LocaleCode };
}) {
	if (!locales.includes(locale)) {
		notFound();
		return null;
	}

	return (
		<Providers locale={locale}>
			<Header />
			<main className="container relative flex-1 py-8">{children}</main>
			<Footer />
		</Providers>
	);
}

export const viewport = {
	colorScheme: "light",
	themeColor: "#ffffff",
};

export const metadata = {
	metadataBase: new URL("https://store.pedaki.fr"),
	title: {
		template: "%s - Pedaki",
		default: "Pedaki",
	},
	// TODO: add description
	description: "todo",
	openGraph: {
		images: "/og-image.png",
		url: "https://store.pedaki.fr",
	},
	robots: "noindex, nofollow",
	icons: [
		{ rel: "icon", url: "https://static.pedaki.fr/logo/favicon.ico" },
		{
			rel: "apple-touch-icon",
			url: "https://static.pedaki.fr/logo/apple-touch-icon.png",
		},
		{ rel: "mask-icon", url: "https:/static.pedaki.fr/logo/favicon.ico" },
		{ rel: "image/x-icon", url: "https://static.pedaki.fr/logo/favicon.ico" },
	],
} satisfies Metadata;
