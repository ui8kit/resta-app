import { cva, type VariantProps } from "class-variance-authority";

// Badge size variants
export const badgeSizeVariants = cva("", {
  variants: {
    size: {
      xs: "px-1.5 py-0.5 text-xs",
      sm: "px-2 py-0.5 text-xs",
      default: "px-2.5 py-0.5 text-xs",
      lg: "px-3 py-1 text-sm"
    }
  },
  defaultVariants: {
    size: "default"
  }
});

// Badge style variants
export const badgeStyleVariants = cva("inline-flex items-center font-semibold transition-colors", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground",
      secondary: "bg-secondary text-secondary-foreground",
      destructive: "bg-destructive text-destructive-foreground",
      outline: "text-foreground border-border",
      success: "bg-green-500 text-white",
      warning: "bg-yellow-500 text-white",
      info: "bg-blue-500 text-white"
    }
  },
  defaultVariants: {
    variant: "default"
  }
});

export interface BadgeSizeVariantProps extends VariantProps<typeof badgeSizeVariants> {}
export interface BadgeStyleVariantProps extends VariantProps<typeof badgeStyleVariants> {}
export type BadgeVariantProps = VariantProps<typeof badgeStyleVariants> & VariantProps<typeof badgeSizeVariants>;