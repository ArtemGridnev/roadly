export class WidgetSessionResponseDto {
  constructor(
    readonly sessionToken: string,
    readonly contactId: string,
  ) {}
}
