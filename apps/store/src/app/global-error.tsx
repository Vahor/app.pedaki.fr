"use client";

import { Button } from "@pedaki/design/ui/button";
import { IconX } from "@pedaki/design/ui/icons";
import StatusWrapper from "~/app/status-wrapper.tsx";
import Link from "next/link";

export const metadata = {
	description: "error description",
	title: "Error - Pedaki",
};

export default function ErrorPage() {
	return (
		<StatusWrapper
			titleKey="Une erreur est survenue"
			icon={IconX}
			buttons={
				<>
					<Button asChild>
						<Link href="/">Retour à l&apos;accueil</Link>
					</Button>
				</>
			}
		/>
	);
}
