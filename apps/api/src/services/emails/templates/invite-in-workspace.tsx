import { FROM_EMAIL_NO_REPLY } from '@pedaki/mailer';
import type { Mail } from '@pedaki/mailer';
import { Head } from '@react-email/head';
import { Html } from '@react-email/html';
import { Link } from '@react-email/link';
import * as React from 'react';

const InviteInWorkflowTemplate: Mail<{
  url: string;
  workspaceName: string;
}> = ({ url = 'https://example.com/confirm-email?token=123', workspaceName = 'workflowName' }) => {
  return (
    <Html>
      <Head />
      <span>Hello, tu as été invité dans {workspaceName},</span>
      <Link href={url} target="_blank">
        {url}
      </Link>
    </Html>
  );
};

InviteInWorkflowTemplate.sender = FROM_EMAIL_NO_REPLY;
InviteInWorkflowTemplate.subject = ({ workspaceName }) => `Invitation dans ${workspaceName}`;

export default InviteInWorkflowTemplate;
