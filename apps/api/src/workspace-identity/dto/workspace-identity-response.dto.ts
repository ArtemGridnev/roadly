export class WorkspaceIdentityResponseDto {
  readonly widgetConnected: boolean;
  readonly signedIdentityConnected: boolean;
  readonly hasSecret: boolean;
  readonly requireSignedIdentity: boolean;

  constructor(status: WorkspaceIdentityResponseDto) {
    this.widgetConnected = status.widgetConnected;
    this.signedIdentityConnected = status.signedIdentityConnected;
    this.hasSecret = status.hasSecret;
    this.requireSignedIdentity = status.requireSignedIdentity;
  }
}
