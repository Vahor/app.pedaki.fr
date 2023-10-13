'use client';

import { useWorkspaceInvitationStore } from '~/store/workspace-invitation.store.ts';
import { useEffect } from 'react';

interface InvitedEmailsProps {
  initialEmails: string[];
}

export function InvitedEmails({ initialEmails }: InvitedEmailsProps) {
  const emails = useWorkspaceInvitationStore(state => state.emails);
  const setEmails = useWorkspaceInvitationStore(state => state.setEmails);

  useEffect(() => {
    setEmails(initialEmails);
  }, [initialEmails, setEmails]);

  return (
    <div>
      <ul>
        {emails.map(email => (
          <li key={email}>{email}</li>
        ))}
      </ul>
    </div>
  );
}
