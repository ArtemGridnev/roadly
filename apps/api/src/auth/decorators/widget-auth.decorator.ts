import { SetMetadata } from '@nestjs/common';

export const WIDGET_AUTH_KEY = 'isWidgetAuth';
export const WidgetAuth = () => SetMetadata(WIDGET_AUTH_KEY, true);
