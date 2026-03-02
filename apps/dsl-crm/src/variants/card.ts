import { cva, type VariantProps } from "class-variance-authority";

// Base card variants (style/variant collapses to "card")
export const cardVariants = cva("rounded-lg border bg-card text-card-foreground shadow-sm", {
  variants: {
    variant: {
      default: "border-border",
      outlined: "border-border shadow-none",
      filled: "border-transparent bg-muted/50"
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

// Sub-entity variants → card-header, card-title, etc.
export const cardHeaderVariants = cva("flex flex-col space-y-1.5 p-6");

export const cardTitleVariants = cva("text-2xl font-semibold leading-none tracking-tight");

export const cardDescriptionVariants = cva("text-sm text-muted-foreground");

export const cardContentVariants = cva("p-6 pt-0");

export const cardFooterVariants = cva("flex items-center p-6 pt-0");

export interface CardHeaderVariantProps extends VariantProps<typeof cardHeaderVariants> {}
export interface CardTitleVariantProps extends VariantProps<typeof cardTitleVariants> {}
export interface CardDescriptionVariantProps extends VariantProps<typeof cardDescriptionVariants> {}
export interface CardContentVariantProps extends VariantProps<typeof cardContentVariants> {}
export interface CardFooterVariantProps extends VariantProps<typeof cardFooterVariants> {}
export type CardVariantProps = VariantProps<typeof cardVariants>;
export type CardCompoundVariantProps
  = CardVariantProps &
    CardHeaderVariantProps &
    CardTitleVariantProps &
    CardDescriptionVariantProps &
    CardContentVariantProps &
    CardFooterVariantProps;
