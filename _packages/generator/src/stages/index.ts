export { CssStage } from './CssStage';
export { HtmlStage } from './HtmlStage';
export { PostCssStage } from './PostCssStage';

export const DEFAULT_STAGES = [
  'css',
  'html',
  'postcss',
] as const;
