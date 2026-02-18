import { cva, type VariantProps } from "class-variance-authority";

// Image position variants - only for combinations with multiple classes
// Simple positions (center, top, right, bottom, left) are handled via ux() in component
export const imagePositionVariants = cva("", {
  variants: {
    position: {
      "right-top": "object-top object-right",
      "right-bottom": "object-bottom object-right",
      "left-bottom": "object-bottom object-left",
      "left-top": "object-top object-left"
    }
  }
});

export interface ImagePositionVariantProps extends VariantProps<typeof imagePositionVariants> {}