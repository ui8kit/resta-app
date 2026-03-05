import { cva, type VariantProps } from "class-variance-authority";

/**
 * Base input styles (shadcn classic) — shared by input, textarea, select.
 */
const fieldBase =
  "flex w-full rounded-md px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

/** Textarea adds min-height. */
export const fieldTextareaBase = "min-h-[80px]";

/**
 * Field style variants — default, outline, ghost (like Button).
 */
export const fieldVariantVariants = cva(fieldBase, {
  variants: {
    variant: {
      default: "border border-input bg-background",
      outline: "border-2 border-input bg-background",
      ghost: "border-0 bg-muted/50 hover:bg-muted focus-visible:bg-background",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

/**
 * Checkbox/radio base — shape-specific styles.
 * Variant (default, outline, ghost) still applies for border.
 */
const controlBase =
  "rounded border border-primary text-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export const fieldControlVariants = cva(controlBase, {
  variants: {
    variant: {
      default: "border-primary",
      outline: "border-2 border-primary",
      ghost: "border-primary/50 bg-muted/30",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

/**
 * Field size variants — height for input/textarea/select.
 */
export const fieldSizeVariants = cva("", {
  variants: {
    size: {
      sm: "h-8 text-sm",
      default: "h-10 text-sm",
      lg: "h-11 text-base",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

/**
 * Checkbox/radio size — separate because they use w/h together.
 */
export const fieldControlSizeVariants = cva("", {
  variants: {
    size: {
      sm: "h-3 w-3",
      default: "h-4 w-4",
      lg: "h-5 w-5",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

/**
 * Button (submit) style variants — same keys as input, button-appropriate styles.
 */
export const fieldButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-input bg-background hover:bg-accent",
        ghost: "bg-muted/50 hover:bg-muted",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface FieldVariantVariantProps extends VariantProps<typeof fieldVariantVariants> {}
export interface FieldControlVariantProps extends VariantProps<typeof fieldControlVariants> {}
export interface FieldSizeVariantProps extends VariantProps<typeof fieldSizeVariants> {}
export interface FieldControlSizeVariantProps extends VariantProps<typeof fieldControlSizeVariants> {}
export type FieldVariantProps = VariantProps<typeof fieldVariantVariants> &
  VariantProps<typeof fieldSizeVariants>;
