"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@pedaki/design/ui/button";
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
	IconMail,
	IconSpinner,
	IconUser,
} from "@pedaki/design/ui/icons";
import { Input } from "@pedaki/design/ui/input";
import { useWorkspaceFormStore } from "~/store/workspace-form.store.ts";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

const Schema = z.object({
	name: z.string().nonempty({ message: "Vous devez renseigner un nom" }),
	email: z.string().email({ message: "Vous devez renseigner un email valide" }),
});
export type UserInfoFormValues = z.infer<typeof Schema>;

export const UserInfoForm = () => {
	const userData = useWorkspaceFormStore((store) => store.userData);
	const setUserData = useWorkspaceFormStore((store) => store.setUserData);
	const router = useRouter();

	const form = useForm<UserInfoFormValues>({
		resolver: zodResolver(Schema),
		mode: "onChange",
		defaultValues: userData,
	});

	const onSubmit = (values: UserInfoFormValues) => {
		setUserData(values);
		router.push("/new/subscription");
	};

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
							<FormLabel>Nom</FormLabel>
							<FormControl>
								<Input
									icon={IconUser}
									placeholder="Nathan"
									type="text"
									autoComplete="given-name"
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
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input
									icon={IconMail}
									placeholder="hello@pedaki.fr"
									type="email"
									autoComplete="email"
									disabled={isSubmitting}
									{...field}
								/>
							</FormControl>
							<FormMessage className="flex items-center space-x-1">
								<IconInfoCircleFill className="h-4 w-4" />
								<span className="text-p-sm">
									Vos identifiants de connexions vous seront envoyé par mail
								</span>
							</FormMessage>
						</FormItem>
					)}
				/>

				<Button
					variant="filled-primary"
					type="submit"
					disabled={isSubmitting || !isValid}
					className="w-full"
				>
					{isSubmitting && (
						<IconSpinner className="mr-2 h-4 w-4 animate-spin" />
					)}
					Choisir son abonnement
				</Button>
			</form>
		</Form>
	);
};
