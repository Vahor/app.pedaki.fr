import { create } from 'zustand';

interface EmailInfo {
  name: string;
  email: string;
}

export interface WorkspaceInvitationStore {
  emails: EmailInfo[];
  setEmails: (emails: EmailInfo[]) => void;
  addEmail: (email: EmailInfo) => void;
  removeEmail: (email: EmailInfo['email']) => void;
}

export const useWorkspaceInvitationStore = create<WorkspaceInvitationStore>()(set => ({
  emails: [],
  setEmails: emails => {
    set({ emails });
  },
  addEmail: email => {
    set(state => ({
      emails: [...state.emails, email],
    }));
  },
  removeEmail: email => {
    set(state => ({
      emails: state.emails.filter(e => e.email !== email),
    }));
  },
}));
