class WorkspaceService {
  getHealthStatusUrl(identifier: string) {
    return `https://${identifier}.pedaki.fr/api/_health`;
  }

  getWorkspaceUrl(identifier: string) {
    return `https://${identifier}.pedaki.fr`;
  }
}

const workspaceService = new WorkspaceService();
export { workspaceService };
