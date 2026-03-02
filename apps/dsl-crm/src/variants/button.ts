import { cva, type VariantProps } from "class-variance-authority";

// Button size variants
export const buttonSizeVariants = cva("", {
  variants: {
    size: {
      xs: "h-6 px-2 text-xs",
      sm: "h-9 px-3 text-sm", 
      default: "h-10 px-4 py-2",
      md: "h-10 px-4 py-2",
      lg: "h-11 px-8",
      xl: "h-12 px-10 text-base",
      icon: "h-10 w-10"
    }
  },
  defaultVariants: {
    size: "default"
  }
});

// Button style variants
export const buttonStyleVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium rounded transition-colors shrink-0 outline-none", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground",
      primary: "bg-primary text-primary-foreground",
      destructive: "bg-destructive text-destructive-foreground",
      outline: "border border-input bg-background",
      secondary: "bg-secondary text-secondary-foreground",
      ghost: "bg-accent text-accent-foreground",
      link: "text-primary underline-offset-4"
    }
  },
  defaultVariants: {
    variant: "default"
  }
});

export interface ButtonSizeVariantProps extends VariantProps<typeof buttonSizeVariants> {}
export interface ButtonStyleVariantProps extends VariantProps<typeof buttonStyleVariants> {}
export type ButtonVariantProps = VariantProps<typeof buttonStyleVariants> & VariantProps<typeof buttonSizeVariants>;