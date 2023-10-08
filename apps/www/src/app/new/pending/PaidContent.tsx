import { Button } from '@pedaki/design/ui/button';
import Link from 'next/link';
import React from 'react';
import {api} from "~/server/api/clients/client.ts";

interface PaidContentProps {
    pendingId: string;
}

const PaidContent : React.FC<PaidContentProps> = ({pendingId}) => {

    const {data} = api.workspace.reservation.generateToken.useQuery({id: pendingId});

    return (
        <div>
            Payment successful!
            <p>Message qui dit que les identifiants de base vont être envoyés par mail</p>
            <p>Et que ça peut prendre quelques minutes avant d'être disponible</p>
            <p>
                Mais que en attendant il peut commencer à configurer son espace de travail, et hop un
                bouton qui fait ça
            </p>
            <Link href={`/new/invitations?token=${encodeURIComponent(data ?? '')}`}>
                <Button variant="neutral" disabled={!data}>Continuer la configuration</Button>
            </Link>
        </div>
    );
};

export default PaidContent;