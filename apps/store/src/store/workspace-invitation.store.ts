import { create } from 'zustand';

export interface WorkspaceInvitationStore {
  emails: string[];
  setEmails: (emails: string[]) => void;
  addEmail: (email: string) => void;
  removeEmail: (email: string) => void;
}

export const useWorkspaceInvitationStore = create<WorkspaceInvitationStore>()(set => ({
  emails: [],
  setEmails: (emails: string[]) => {
    set({ emails });
  },
  addEmail: (email: string) => {
    set(state => ({
      emails: [...state.emails, email],
    }));
  },
  removeEmail: (email: string) => {
    set(state => ({
      emails: state.emails.filter(e => e !== email),
    }));
  },
}));
