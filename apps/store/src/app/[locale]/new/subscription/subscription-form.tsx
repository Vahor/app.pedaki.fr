"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import wait from "@pedaki/common/utils/wait";
import { wrapWithLoading } from "@pedaki/common/utils/wrap-with-loading";
import { Button } from "@pedaki/design/ui/button";
import { CheckboxCard } from "@pedaki/design/ui/checkbox-card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@pedaki/design/ui/form";
import {
	IconInfoCircleFill,
	IconLink,
	IconSchool,
	IconSpinner,
} from "@pedaki/design/ui/icons";
import { Input } from "@pedaki/design/ui/input";
import { Separator } from "@pedaki/design/ui/separator";
import { StyledLink } from "@pedaki/design/ui/styled-link";
import { env } from "~/env.mjs";
import { api } from "~/server/api/clients/client.ts";
import {
	DEFAULT_SUBSCRIPTION_DATA,
	useWorkspaceFormStore,
} from "~/store/workspace-form.store.ts";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const Schema = z.object({
	name: z.string().nonempty({ message: "Vous devez renseigner un nom" }),
	subdomain: z
		.string()
		.min(3)
		.nonempty({ message: "Vous devez renseigner un nom de domaine" }),
	yearly: z.boolean(),
});
export type SubscriptionFormValues = z.infer<typeof Schema>;

const priceMap = {
	monthly: 30,
	yearly: (30 * 0.8) * 12,
};

export const SubscriptionForm = ({ locale }: { locale: string }) => {
	const userData = useWorkspaceFormStore((store) => store.userData);
	const subscriptionData = useWorkspaceFormStore(
		(store) => store.subscriptionData,
	);
	const setSubscriptionData = useWorkspaceFormStore(
		(store) => store.setSubscriptionData,
	);
	const setPaymentUrl = useWorkspaceFormStore((store) => store.setPaymentUrl);

	const form = useForm<SubscriptionFormValues>({
		resolver: zodResolver(Schema),
		mode: "onChange",
		defaultValues: DEFAULT_SUBSCRIPTION_DATA,
	});

	useEffect(() => {
		if (subscriptionData) {
			form.reset(subscriptionData);
		}
	}, [form, subscriptionData]);

	const createReservationMutation =
		api.workspace.reservation.create.useMutation();
	const router = useRouter();

	function onSubmit(values: SubscriptionFormValues) {
		setSubscriptionData(values);

		const finalValues = {
			name: values.name,
			subdomain: values.subdomain,
			billing: {
				email: userData.email,
				name: userData.name,
				subscriptionInterval: values.yearly ? "yearly" : "monthly",
			},
			defaultLanguage: locale,

			server: {
				provider: "aws",
				size: "small",
				region: "eu-west-3",
			},
		} as const;

		return wrapWithLoading(
			() => wait(createReservationMutation.mutateAsync(finalValues), 500),
			{
				loadingProps: {
					title: "Création de la page de paiement en cours",
				},
				successProps: {
					title: "🎉 Redirection vers la page de paiement en cours",
				},
				errorProps: (error) => {
					const description =
						error.message === "ALREADY_EXISTS"
							? "Un workspace existe déjà avec cet URL de workspace"
							: "Une erreur est survenue lors de la création de la page de paiement";
					return {
						title: "Creation de paiement",
						description,
					};
				},
				throwOnError: true,
			},
		)
			.then((data) => {
				router.push(data.stripeUrl);
				setPaymentUrl(data.stripeUrl);
			})
			.catch(() => {
				// ignore
			});
	}

	const { isSubmitting, isValid } = form.formState;

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="flex flex-col gap-4"
			>
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Nom du Workspace</FormLabel>
							<FormControl>
								<Input
									suppressHydrationWarning
									icon={IconSchool}
									placeholder="Mewo"
									type="text"
									autoComplete="organization"
									disabled={isSubmitting}
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="subdomain"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Sous domaine</FormLabel>
							<FormControl>
								<Input
									suppressHydrationWarning
									icon={IconLink}
									placeholder="hello"
									type="text"
									autoComplete="subdomain"
									disabled={isSubmitting}
									{...field}
								/>
							</FormControl>
							<FormMessage>
								<IconInfoCircleFill className="h-4 w-4" />
								<span className="text-p-sm" suppressHydrationWarning>
									{field.value?.length > 0 ? (
										<>
											Votre workspace sera accessible sur{" "}
											<span
												suppressHydrationWarning={true}
												className="text-main"
											>
												{field.value}.pedaki.fr
											</span>
										</>
									) : (
										<>Vous devez renseigner un nom de domaine</>
									)}
								</span>
							</FormMessage>
						</FormItem>
					)}
				/>

				<Separator orientation="horizontal" className="bg-stroke-soft" />

				<FormField
					control={form.control}
					name="yearly"
					render={({ field }) => (
						<FormItem>
							<CheckboxCard
								title="Abonnement annuel"
								description="En prenant un abonnement annuel, vous bénéficiez d'une réduction de 20% sur le prix de votre abonnement."
								disabled={isSubmitting}
								{...field}
								value={String(field.value)}
								checked={!!field.value}
								onCheckedChange={field.onChange}
							/>
						</FormItem>
					)}
				/>

				<p className="text-label-xs text-sub">
					En cliquant sur le bouton ci-dessous, vous acceptez les{" "}
					<StyledLink
						target="_blank"
						rel="noopener noreferrer"
						decoration="none"
						href={`${env.NEXT_PUBLIC_WWW_URL}/legal/terms-of-service`}
					>
						conditions générales d&apos;utilisation
					</StyledLink>{" "}
					.
				</p>

				<FormField
					control={form.control}
					name="yearly"
					render={({ field }) => (
						<Button
							variant="filled-primary"
							type="submit"
							disabled={
								isSubmitting || !isValid || createReservationMutation.isLoading
							}
							className="w-full"
							suppressHydrationWarning
						>
							{isSubmitting && (
								<IconSpinner className="mr-2 h-4 w-4 animate-spin" />
							)}
							Aller au paiement ({priceMap[field.value ? "yearly" : "monthly"]}€
							par {field.value ? "an" : "mois"})
						</Button>
					)}
				/>
			</form>
		</Form>
	);
};
