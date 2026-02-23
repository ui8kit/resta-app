export { CssStage } from './CssStage';
export { HtmlStage } from './HtmlStage';

// Default generation pipeline stages
export const DEFAULT_STAGES = [
  'css',
  'html',
] as const;
