'use client';

import { wrapWithLoading } from '@pedaki/common/utils/wrap-with-loading.js';
import { Button } from '@pedaki/design/ui/button.js';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@pedaki/design/ui/form.js';
import {  IconSpinner } from '@pedaki/design/ui/icons';
import { Input } from '@pedaki/design/ui/input.js';
import React from 'react';
import { useForm } from 'react-hook-form';

export function CreateForm() {
    const form = useForm({
        //resolver: zodResolver(LoginFormSchema),
        mode: 'onChange',
        defaultValues: {
            // TODO: remove this
            email: 'test@email.com',
            password: 'test123456789',
            confirm_password: 'test123456789',
            name: 'test',
        },
    });
    const { isSubmitting } = form.formState;

    async function onSubmit(values: unknown) {
        await wrapWithLoading(
            () => new Promise((resolve, reject) => {
                    setTimeout(() => {
                        resolve(undefined);
                    }, 2000);
                }),
            {
                loadingProps: {
                    title: 'Création du workspace...',
                },
                successProps: {
                    title: 'Votre workspace a été créé avec succès',
                },
                errorProps: error => {
                    const title =
                        error.message === 'ALREADY_EXISTS'
                            ? 'Un compte existe déjà avec cette adresse email'
                            : 'Une erreur est survenue lors de la création du compte';
                    return {
                        title,
                    };
                },
                throwOnError: true,
            },
        )
            .then(() => {
                alert('ok')
            })
            .catch(() => {
                // ignore
            });
    }

    return (
        <div className="grid gap-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nom</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="John"
                                        type="text"
                                        autoComplete="name"
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
                                        placeholder="name@example.com"
                                        type="email"
                                        autoCapitalize="none"
                                        autoComplete="email"
                                        autoCorrect="off"
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
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Mot de passe</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="********"
                                        type="password"
                                        autoComplete="current-password"
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
                        name="confirm_password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Confirmer le mot de passe</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="********"
                                        type="password"
                                        autoComplete="current-password"
                                        disabled={isSubmitting}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid gap-2">
                        <Button disabled={isSubmitting} className="mt-2">
                            {isSubmitting && <IconSpinner className="mr-2 h-4 w-4 animate-spin" />}
                            S&apos;inscrire
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}