export { ReactSsrStage } from './ReactSsrStage';
export { CssStage } from './CssStage';
export { HtmlStage } from './HtmlStage';
export { PostCssStage } from './PostCssStage';

export const DEFAULT_STAGES = [
  'react-ssr',
  'css',
  'html',
  'postcss',
] as const;
