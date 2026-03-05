import { cva, type VariantProps } from "class-variance-authority";

/**
 * Typography Variants
 * 
 * Semantic variants for text styling. Separates concerns:
 * - fontSize: text size (xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl)
 * - textColor: text color (foreground, muted-foreground, primary, etc.)
 * - textAlign: text alignment (left, center, right, justify)
 * - fontWeight: font weight (normal, medium, semibold, bold)
 * - lineHeight: line height (tight, normal, relaxed)
 * - letterSpacing: letter spacing (tight, normal, wide)
 */

// Font size variants
export const fontSizeVariants = cva("", {
  variants: {
    fontSize: {
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl",
      "3xl": "text-3xl",
      "4xl": "text-4xl",
      "5xl": "text-5xl",
    },
  },
  defaultVariants: {
    fontSize: "base",
  },
});

// Text color variants (semantic colors from design system)
export const textColorVariants = cva("", {
  variants: {
    textColor: {
      foreground: "text-foreground",
      "muted-foreground": "text-muted-foreground",
      primary: "text-primary",
      "primary-foreground": "text-primary-foreground",
      secondary: "text-secondary",
      "secondary-foreground": "text-secondary-foreground",
      destructive: "text-destructive",
      "destructive-foreground": "text-destructive-foreground",
      "accent-foreground": "text-accent-foreground",
    },
  },
});

// Text alignment variants
export const textAlignVariants = cva("", {
  variants: {
    textAlign: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
      justify: "text-justify",
    },
  },
});

// Font weight variants
export const fontWeightVariants = cva("", {
  variants: {
    fontWeight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
  },
  defaultVariants: {
    fontWeight: "normal",
  },
});

// Line height variants
export const lineHeightVariants = cva("", {
  variants: {
    lineHeight: {
      tight: "leading-tight",
      normal: "leading-normal",
      relaxed: "leading-relaxed",
    },
  },
  defaultVariants: {
    lineHeight: "normal",
  },
});

// Letter spacing variants
export const letterSpacingVariants = cva("", {
  variants: {
    letterSpacing: {
      tighter: "tracking-tighter",
      tight: "tracking-tight",
      normal: "tracking-normal",
      wide: "tracking-wide",
      wider: "tracking-wider",
      widest: "tracking-widest",
    },
  },
});

// Text decoration variants
export const textDecorationVariants = cva("", {
  variants: {
    textDecoration: {
      underline: "underline",
      none: "",
    },
  },
});

// Text transform variants
export const textTransformVariants = cva("", {
  variants: {
    textTransform: {
      uppercase: "uppercase",
      lowercase: "lowercase",
      capitalize: "capitalize",
      normal: "normal-case",
    },
  },
});

// Truncate variant
export const truncateVariants = cva("", {
  variants: {
    truncate: {
      true: "truncate",
      "truncate": "truncate",
      false: "",
    },
  },
});

// Combined typography variants for convenience
export const typographyVariants = cva("", {
  variants: {
    fontSize: {
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl",
      "3xl": "text-3xl",
      "4xl": "text-4xl",
      "5xl": "text-5xl",
    },
    textColor: {
      foreground: "text-foreground",
      "muted-foreground": "text-muted-foreground",
      primary: "text-primary",
      "primary-foreground": "text-primary-foreground",
      secondary: "text-secondary",
      "secondary-foreground": "text-secondary-foreground",
      destructive: "text-destructive",
      "destructive-foreground": "text-destructive-foreground",
      "accent-foreground": "text-accent-foreground",
    },
    textAlign: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
      justify: "text-justify",
    },
    fontWeight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
    lineHeight: {
      tight: "leading-tight",
      normal: "leading-normal",
      relaxed: "leading-relaxed",
    },
    letterSpacing: {
      tighter: "tracking-tighter",
      tight: "tracking-tight",
      normal: "tracking-normal",
      wide: "tracking-wide",
      wider: "tracking-wider",
      widest: "tracking-widest",
    },
    truncate: {
      true: "truncate",
      "truncate": "truncate",
      false: "",
    },
  },
  defaultVariants: {
    fontSize: "base",
    fontWeight: "normal",
    lineHeight: "normal",
  },
});

// Type exports
export interface FontSizeVariantProps extends VariantProps<typeof fontSizeVariants> {}
export interface TextColorVariantProps extends VariantProps<typeof textColorVariants> {}
export interface TextAlignVariantProps extends VariantProps<typeof textAlignVariants> {}
export interface FontWeightVariantProps extends VariantProps<typeof fontWeightVariants> {}
export interface LineHeightVariantProps extends VariantProps<typeof lineHeightVariants> {}
export interface LetterSpacingVariantProps extends VariantProps<typeof letterSpacingVariants> {}
export interface TextDecorationVariantProps extends VariantProps<typeof textDecorationVariants> {}
export interface TextTransformVariantProps extends VariantProps<typeof textTransformVariants> {}
export interface TruncateVariantProps extends VariantProps<typeof truncateVariants> {}
export interface TypographyVariantProps extends VariantProps<typeof typographyVariants> {}
