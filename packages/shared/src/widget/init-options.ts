export interface WidgetUser {
  id: string;
  name: string;
  email: string;
}

export type WidgetTheme = 'light' | 'dark' | 'auto';

export interface RoadlyInitOptions {
  container: HTMLElement | string;
  widgetKey: string;
  user: WidgetUser;
  theme?: WidgetTheme;
}
