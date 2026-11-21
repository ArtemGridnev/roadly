export interface WorkspaceIdentity {
  widgetConnected: boolean;
  signedIdentityConnected: boolean;
  hasSecret: boolean;
  requireSignedIdentity: boolean;
}

export interface WorkspaceIdentitySecret {
  secret: string;
}
