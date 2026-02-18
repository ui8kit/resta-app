import type { ReactNode } from "react";
import { forwardRef } from "react";
import { cn } from "../lib/utils";
import { gridVariants, type GridVariantProps } from "../variants";

import { resolveUtilityClassName, type UtilityPropBag, type UtilityPropPrefix } from "../lib/utility-props";

type GridDomProps = Omit<React.HTMLAttributes<HTMLDivElement>, UtilityPropPrefix>;

type ColsRule = { bp: string; value: number };

type ColsInput =
  | string
  | number
  | ColsRule[]
  | boolean
  | null
  | undefined;

export type GridProps
  = GridDomProps &
    UtilityPropBag &
    Omit<GridVariantProps, "cols"> & {
  children: ReactNode;
  cols?: ColsInput;
};

function resolveColsClassName(cols: ColsInput): string {
  if (cols === null || cols === undefined || cols === false) return "";
  if (typeof cols === "number" && cols >= 1 && cols <= 12) {
    return `grid-cols-${cols}`;
  }
  if (Array.isArray(cols) && cols.length > 0) {
    const parts: string[] = [];
    for (const rule of cols) {
      if (rule == null || rule.value == null) continue;
      const prefix = rule.bp === "base" ? "" : `${rule.bp}:`;
      parts.push(`${prefix}grid-cols-${rule.value}`);
    }
    return parts.join(" ");
  }
  if (typeof cols === "string") {
    return gridVariants({ cols }) ?? "";
  }
  return "";
}

// =============================================================================
// GRID COMPONENT
// =============================================================================

const Grid = forwardRef<HTMLDivElement, GridProps>(
  (
    {
      children,
      className,
      cols = "1-3",
      ...props
    },
    ref
  ) => {
    const { utilityClassName, rest } = resolveUtilityClassName(props);
    const colsClass =
      typeof cols === "string" ? gridVariants({ cols }) : resolveColsClassName(cols);

    return (
      <div
        ref={ref}
        data-class="Grid"
        className={cn("grid", colsClass, utilityClassName, className)}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

Grid.displayName = "Grid";

// =============================================================================
// GRID COL
// =============================================================================

type GridColProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  UtilityPropPrefix
> &
  UtilityPropBag & {
  children?: ReactNode;
  span?: number;
  start?: number;
  end?: number;
  order?: number;
};

const GridCol = forwardRef<HTMLDivElement, GridColProps>(
  (
    {
      children,
      className,
      span,
      start,
      end,
      order,
      ...props
    },
    ref
  ) => {
    const { utilityClassName, rest } = resolveUtilityClassName(props);
    const colClasses: string[] = [];
    if (span != null) colClasses.push(`col-span-${span}`);
    if (start != null) colClasses.push(`col-start-${start}`);
    if (end != null) colClasses.push(`col-end-${end}`);
    if (order != null) colClasses.push(`order-${order}`);

    return (
      <div
        ref={ref}
        data-class="Grid.Col"
        className={cn(colClasses, utilityClassName, className)}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

GridCol.displayName = "Grid.Col";

const GridWithCol = Object.assign(Grid, { Col: GridCol });

export { GridWithCol as Grid, GridCol };
