import { cn } from "./utils";
import { utilityPropsMap } from "./utility-props.map";

export type UtilityPropPrefix = keyof typeof utilityPropsMap;

type UtilityMap = typeof utilityPropsMap;

type UtilityAllowed<P extends UtilityPropPrefix> = UtilityMap[P][number];

type NumericFromString<S> = S extends `${infer N extends number}` ? N : never;
type UtilityNumeric<P extends UtilityPropPrefix> = NumericFromString<UtilityAllowed<P>>;

type HasBareToken<P extends UtilityPropPrefix> = "" extends UtilityAllowed<P> ? true : false;

/**
 * Strict utility-prop value:
 * - allows only values listed in `utilityPropsMap` for the given prefix
 * - additionally allows numeric literals when the map contains numeric strings (e.g. "8" -> 8)
 * - allows `true` / "" only when the map contains a bare token "" (e.g. flex, block, absolute)
 * - allows false/null/undefined to omit the class
 */
export type UtilityPropInput<P extends UtilityPropPrefix> =
  | Exclude<UtilityAllowed<P>, "">
  | UtilityNumeric<P>
  | (HasBareToken<P> extends true ? "" | true : never);

export type UtilityPropBag = {
  [P in UtilityPropPrefix]?: UtilityPropInput<P> | false | null | undefined;
};

export type UtilityPropValue<P extends UtilityPropPrefix> =
  | UtilityPropInput<P>
  | null
  | undefined;

/**
 * Fast utility props -> className resolver (NO runtime validation).
 *
 * Use this when whitelist checks are enforced by scripts/guards and you want
 * the runtime to be as cheap as simple `cn(...)`.
 */
const FLEX_DIR_VALUES = ['col', 'row', 'col-reverse', 'row-reverse'] as const;

const GAP_SEMANTIC: Record<string, string> = {
  xs: "1",
  sm: "2",
  md: "4",
  lg: "6",
  xl: "8",
};

export function ux(props: UtilityPropBag): string {
  const tokens: string[] = [];

  for (const [k, raw] of Object.entries(props)) {
    if (raw === null || raw === undefined || raw === false) continue;

    if (raw === true) {
      tokens.push(k);
      continue;
    }

    const value = String(raw).trim();
    if (!value) {
      tokens.push(k);
      continue;
    }

    // Bare-token alias: italic="italic" → "italic" (when map allows "")
    const allowed = (utilityPropsMap as Record<string, string[] | undefined>)[k];
    if (allowed?.includes("") && value === k) {
      tokens.push(k);
      continue;
    }

    // flex="col"|"row"|... → "flex" + "flex-col" (direction implies display: flex)
    if (k === 'flex' && (FLEX_DIR_VALUES as readonly string[]).includes(value)) {
      tokens.push('flex', `flex-${value}`);
      continue;
    }

    // gap="md"|"lg"|... → "gap-4"|"gap-6"|... (semantic spacing)
    if (k === 'gap' && value in GAP_SEMANTIC) {
      tokens.push(`gap-${GAP_SEMANTIC[value as keyof typeof GAP_SEMANTIC]}`);
      continue;
    }

    tokens.push(`${k}-${value}`);
  }

  return tokens.join(" ");
}

export function uxcn(props: UtilityPropBag, ...rest: Parameters<typeof cn>) {
  return cn(ux(props), ...rest);
}

/**
 * Split any props object into:
 * - `utility`: keys that match the generated `utilityProps` map
 * - `rest`: everything else (safe to spread on DOM elements)
 *
 * This allows components to support `grid="cols-12"` / `gap="2"` etc. without
 * listing keys manually per component.
 *
 * Note: this function does NOT validate values at runtime. Whitelist validation
 * is expected to be enforced by scripts/guards in the workflow.
 */
export function splitUtilityProps<T extends Record<string, any>>(props: T): {
  utility: UtilityPropBag;
  rest: Omit<T, UtilityPropPrefix>;
} {
  const utility: UtilityPropBag = {};
  const rest: Record<string, any> = {};

  for (const [k, v] of Object.entries(props)) {
    if (k in utilityPropsMap) {
      (utility as any)[k] = v;
      continue;
    }
    rest[k] = v;
  }

  return { utility, rest: rest as any };
}

export function resolveUtilityClassName<T extends Record<string, any>>(props: T): {
  utilityClassName: string;
  rest: Omit<T, UtilityPropPrefix>;
} {
  const { utility, rest } = splitUtilityProps(props);
  return { utilityClassName: ux(utility), rest };
}

export { utilityPropsMap };

// =============================================================================
// MISSING UTILITY CLASSES (to be added to CDL whitelist)
// =============================================================================
// These classes were discovered during component refactoring but are not yet
// in the utility-props.generated.ts map. Add them to CDL whitelist and regenerate.
//
// FOUND IN Group.tsx:
// - min-w-0 (for preventGrowOverflow prop - now always enabled by default)
//
// FOUND HARDCODED VARIANTS (need proper CDL variants):
// - Icon.tsx: size variants (xs, sm, md, lg, xl) - currently hardcoded sizeProps object
// - Image.tsx: fit variants (contain, cover, fill, none, scale-down) - currently hardcoded fitProps object
// - Image.tsx: position variants (bottom, center, left, left-bottom, etc.) - currently hardcoded positionProps object
// - Image.tsx: aspect variants (auto, square, video) - currently hardcoded aspectProps object
// - Text.tsx: typography variants (size, weight, align, leading, tracking, modifiers) - currently removed, use utility props
// - Title.tsx: typography variants (size, weight, align, leading, tracking, truncate) - currently removed, use utility props
//
// COMPONENTS PLANNED FOR CDL UTILITY PROPS MIGRATION:
// - Grid.tsx: Currently uses gridVariants CVA, planned for utility props migration
//   * MISSING GRID CLASSES TO ADD TO WHITELIST:
//     - grid-cols-7, grid-cols-8, grid-cols-9, grid-cols-10, grid-cols-11
//     - gap-3, gap-5, gap-md, gap-lg, gap-xl, gap-xs, gap-sm (currently only 0,1,2,4,6,8,10,12)
//     - items-baseline (already exists), items-stretch (already exists)
//     - justify-items-* variants
//     - content-* (content-start, content-center, etc.)
//     - col-span-*, col-start-*, col-end-* (currently missing col-span entirely)
//     - order-* (currently missing entirely)
//   * Complex responsive patterns (cols rule lists like "1-2", "1-3") need special CDL handling
//   * Auto-rows/cols classes need verification
//   * STEP 1: Add missing grid classes to CDL whitelist
//   * STEP 2: Regenerate utility-props.generated.ts
//   * STEP 3: Migrate Grid.tsx from gridVariants to utility props
//   * STEP 4: Update Grid.Col to use utility props instead of gridVariants
//
// SOLUTION: Create CDL variant generation for component-specific variants
// 1. Add variant definitions to .project/cdl/variants.json:
//    {
//      "icon": {
//        "size": {
//          "xs": { "w": "3", "h": "3" },
//          "sm": { "w": "4", "h": "4" },
//          ...
//        }
//      },
//      "image": {
//        "fit": { "contain": { "object": "contain" }, ... },
//        "position": { "center": { "object": "center" }, ... },
//        "aspect": { "square": { "aspect": "square" }, ... }
//      }
//    }
// 2. Generate variant functions via scripts/cdl-emit-component-variants.mjs
// 3. Replace hardcoded objects with generated functions:
//    const sizeClasses = iconVariants({ size });
//    const fitClasses = imageVariants({ fit });
//
// POTENTIAL FUTURE NEEDS (anticipate based on common UI patterns):
// - min-w-full, min-w-max, min-w-min, min-w-fit
// - max-w-0, max-w-none, max-w-xs, max-w-sm, max-w-md, etc.
// - flex-auto, flex-initial, flex-none
// - grow-0, shrink-0, shrink
// - basis-auto, basis-full, basis-0
// - aspect-square, aspect-video, aspect-auto
// - object-contain, object-cover, object-fill, object-none, object-scale-down
// - mix-blend-multiply, mix-blend-screen, etc.
// - backdrop-blur, backdrop-brightness, backdrop-contrast, etc.
//
// ADD TO CDL WHITELIST: scripts/cdl-whitelist.mjs or .project/cdl/whitelist.json
// THEN REGENERATE: bun run cdl:utilities:emit
// =============================================================================


