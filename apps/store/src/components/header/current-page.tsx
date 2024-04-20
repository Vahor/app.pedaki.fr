"use client";

import { Button } from "@pedaki/design/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@pedaki/design/ui/dropdown-menu";
import { IconChevronDown } from "@pedaki/design/ui/icons";
import IconCheck from "@pedaki/design/ui/icons/IconCheck";
import { cn } from "@pedaki/design/utils";
import { StepIndicatorHorizontal } from "~/components/step-indicator/horizontal";
import { StepIndicatorHorizontalItem } from "~/components/step-indicator/horizontal/item.tsx";
import { useWorkspaceFormStore } from "~/store/workspace-form.store.ts";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";

const page_mapping = [
	{
		path: ["/new"],
		translationKey: "Informations",
	},
	{
		path: ["/new/subscription", "/new/pending"],
		translationKey: "Abonnement",
	},
	{
		path: ["/new/invitations"],
		translationKey: "Invitations",
	},
] as const;

// Ex: 404 page
const unknown_page = {
	translationKey: "unknown",
};

const status = (index: number, activeIndex: number) => {
	if (index === activeIndex) {
		return "active";
	}
	if (index < activeIndex) {
		return "completed";
	}
	return "pending";
};

const CurrentPage = () => {
	const pathname = usePathname();
	const router = useRouter();
	const activeIndex = page_mapping.findIndex((page) =>
		page.path.some((path) => pathname.endsWith(path)),
	);
	const currentPage =
		activeIndex !== -1 ? page_mapping[activeIndex]! : unknown_page;

	const getValidStep = useWorkspaceFormStore((store) => store.getValidStep);
	const validStep = getValidStep();

	React.useEffect(() => {
		// Only works for the first two pages as after this we are passing a token in the url
		if (activeIndex !== -1 && activeIndex < 2 && validStep < activeIndex) {
			toast.error("Vous devez suivre les étapes dans l'ordre", {
				id: "current-page",
			});
			router.push("/new");
		}
	}, [validStep, activeIndex, router]);

	return (
		<div>
			<div className="hidden lg:flex">
				<StepIndicatorHorizontal>
					{page_mapping.map((page, index) => (
						<StepIndicatorHorizontalItem
							number={index + 1}
							text={page.translationKey}
							key={page.path.join()}
							status={status(index, activeIndex)}
						/>
					))}
				</StepIndicatorHorizontal>
			</div>
			<div className="flex justify-start lg:hidden">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="transparent"
							size="sm"
							className="flex items-center md:gap-2"
						>
							<div>
								<span className="hidden md:inline">
									{activeIndex !== -1 && `${activeIndex + 1}.`}{" "}
								</span>
								<span>{currentPage.translationKey}</span>
							</div>
							<IconChevronDown className="text-secondary h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" side="top">
						{page_mapping.map((page, index) => {
							const s = status(index, activeIndex);
							const key = page.path.join();
							return (
								<DropdownMenuLabel
									key={key}
									className="flex h-8 items-center justify-start gap-2 font-normal"
								>
									<div className="flex h-5 w-3 items-center text-sub">
										{s === "completed" ? (
											<IconCheck className="h-3 w-3" />
										) : (
											index + 1
										)}
									</div>
									<span
										className={cn(s === "active" ? "text-main" : "text-sub")}
									>
										{page.translationKey}
									</span>
								</DropdownMenuLabel>
							);
						})}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
};

export default CurrentPage;
