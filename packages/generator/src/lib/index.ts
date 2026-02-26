/**
 * @ui8kit/generator/lib
 *
 * Shared maps and validation utilities for:
 * - HtmlConverterService (validation during HTML→CSS conversion)
 * - Maintain checker (DSL validation)
 * - ui8kit-validate (props + DSL rules, type-level)
 */

export {
  loadComponentTagMap,
  isTagAllowedForComponent,
  getComponentByDataClass,
  getAllowedTags,
  validateComponentTag,
} from './component-tag-map';

export type {
  ComponentTagMap,
  ComponentTagConfig,
} from './component-tag-map';
