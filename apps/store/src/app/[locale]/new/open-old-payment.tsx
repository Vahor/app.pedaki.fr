"use client";

import { safeHistoryReplaceState } from "@pedaki/common/utils/navigation.js";
import { useWorkspaceFormStore } from "~/store/workspace-form.store.ts";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

const OpenOldPayment = () => {
	const searchParams = useSearchParams();
	const getPaymentUrl = useWorkspaceFormStore((store) => store.getPaymentUrl);
	const reset = useWorkspaceFormStore((store) => store.reset);

	const router = useRouter();
	const pathName = usePathname();
	const paymentUrl = getPaymentUrl();

	useEffect(() => {
		if (searchParams.has("cancel")) {
			reset();
			safeHistoryReplaceState(pathName);
		} else if (paymentUrl) {
			toast("Réouvrir la page de paiement ?", {
				id: "reopen-payment",
				action: {
					label: "Oui",
					onClick: () => {
						router.push(paymentUrl);
					},
				},
			});
		}
	}, [paymentUrl, router, pathName, searchParams, reset]);

	return null;
};

export default OpenOldPayment;
