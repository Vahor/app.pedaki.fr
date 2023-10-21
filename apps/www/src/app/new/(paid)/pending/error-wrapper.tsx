import React from 'react';
import {Button} from "@pedaki/design/ui/button";
import Link from 'next/link';
import {env} from "~/env.mjs";
import {Balancer} from 'react-wrap-balancer';
import CircleOpacityEffect from "~/components/CircleOpacityEffect.tsx";
import type {IconType} from "@pedaki/design/ui/icons";
import DotsAnimation from "~/components/DotsAnimation.tsx";

interface ErrorWrapperProps {
    titleKey: string;
    descriptionKey: string;
    icon: IconType;
    loadingIndicator?: boolean;
}

const ErrorWrapper = ({titleKey, descriptionKey, icon: Icon, loadingIndicator}: ErrorWrapperProps) => {
    return (
        <div className="flex items-center flex-col h-full relative">

            <div className="relative h-[400px] w-full flex items-center justify-center -mb-32 -z-10">
                <CircleOpacityEffect className="absolute text-grayA-12 h-[400px] w-full inset-0"/>
                <div className="border rounded-md">
                    <Icon className="h-12 w-12 text-grayA-11 p-3 "/>
                </div>
            </div>

            <h1 className="text-2xl font-bold">
                {titleKey}
                {loadingIndicator && <DotsAnimation/>}
            </h1>

            <Balancer className="max-w-3xl mb-8 mt-4 text-secondary">
                {descriptionKey} {' '}
                Si vous pensez qu'il s'agit d'une erreur, veuillez contacter le support.
            </Balancer>

            <Button variant="outline" asChild>
                <Link href={env.NEXT_PUBLIC_WWW_URL + "/support"}>
                    Contacter le support
                </Link>
            </Button>

        </div>
    );
};

export default ErrorWrapper;