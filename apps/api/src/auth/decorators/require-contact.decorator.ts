import { SetMetadata } from '@nestjs/common';

export const REQUIRE_CONTACT_KEY = 'requireContact';
export const RequireContact = () => SetMetadata(REQUIRE_CONTACT_KEY, true);
