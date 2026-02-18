import type { ElementType, ReactNode } from "react";
import { forwardRef } from "react";
import { cn } from "../../lib/utils";
import { resolveUtilityClassName, type UtilityPropBag, type UtilityPropPrefix } from "../../lib/utility-props";
import { typographyVariants, type TypographyVariantProps } from "../../variants/typography";

type TextDomProps = Omit<React.HTMLAttributes<HTMLElement>, UtilityPropPrefix>;

export type TextProps = TextDomProps &
  UtilityPropBag &
  TypographyVariantProps & {
    children: ReactNode;
    component?: ElementType;
  };

export const Text = forwardRef<HTMLElement, TextProps>(
  (
    {
      children,
      className,
      component = "p",
      // Typography variants
      fontSize = "base",
      textColor,
      textAlign,
      fontWeight = "normal",
      lineHeight = "normal",
      letterSpacing,
      truncate,
      ...props
    },
    ref
  ) => {
    const { utilityClassName, rest } = resolveUtilityClassName(props);
    const Element = component as ElementType;

    return (
      <Element
        ref={ref}
        data-class="text"
        className={cn(
          typographyVariants({
            fontSize,
            textColor,
            textAlign,
            fontWeight,
            lineHeight,
            letterSpacing,
            truncate,
          }),
          utilityClassName,
          className
        )}
        {...rest}
      >
        {children}
      </Element>
    );
  }
);

Text.displayName = "Text"; 