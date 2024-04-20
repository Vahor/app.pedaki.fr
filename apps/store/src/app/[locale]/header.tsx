import { Button } from "@pedaki/design/ui/button";
import { IconBookText } from "@pedaki/design/ui/icons";
import CurrentPage from "~/components/header/current-page.tsx";
import Logo from "~/components/header/logo.tsx";
import { env } from "~/env.mjs";
import Link from "next/link";
import React from "react";

const Header = () => {
	return (
		<div className="bg-primary relative border-b px-6 py-4 md:px-12">
			<header className="mx-auto max-w-screen-2xl">
				<div className="flex items-center gap-4 lg:justify-between">
					<Logo />
					<CurrentPage />
					<div className="flex-1 lg:hidden"></div>
					<div>
						<Button variant="lighter-primary" asChild>
							<Link href={env.NEXT_PUBLIC_DOCS_URL}>
								<span>Documentation</span>
								<IconBookText className="h-4" />
							</Link>
						</Button>
					</div>
				</div>
			</header>
		</div>
	);
};

export default Header;
