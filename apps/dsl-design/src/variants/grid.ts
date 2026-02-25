import { cva, type VariantProps } from "class-variance-authority";

export const gridVariants = cva("", {
  variants: {
    // Responsive patterns
    cols: {
      "1-2": "grid-cols-1 md:grid-cols-2",
      "1-3": "grid-cols-1 lg:grid-cols-3",
      "1-4": "grid-cols-1 lg:grid-cols-4",
      "1-5": "grid-cols-1 lg:grid-cols-5",
      "1-6": "grid-cols-1 lg:grid-cols-6",
      "2-3": "grid-cols-2 lg:grid-cols-3",
      "2-4": "grid-cols-2 lg:grid-cols-4",
      "2-5": "grid-cols-2 lg:grid-cols-5",
      "2-6": "grid-cols-2 lg:grid-cols-6",
      "3-4": "grid-cols-3 lg:grid-cols-4",
      "3-5": "grid-cols-3 lg:grid-cols-5",
      "3-6": "grid-cols-3 lg:grid-cols-6",
      "4-5": "grid-cols-4 lg:grid-cols-5",
      "4-6": "grid-cols-4 lg:grid-cols-6",
      "5-6": "grid-cols-5 lg:grid-cols-6",
      "1-2-3": "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      "1-2-4": "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
      "1-2-6": "grid-cols-1 md:grid-cols-2 lg:grid-cols-6",
      "1-3-4": "grid-cols-1 md:grid-cols-3 lg:grid-cols-4",
      "1-3-6": "grid-cols-1 md:grid-cols-3 lg:grid-cols-6",
      "2-3-4": "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
      "1-2-3-4": "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    }
  }
});

// Types for grid props
export interface GridVariantProps extends VariantProps<typeof gridVariants> {}