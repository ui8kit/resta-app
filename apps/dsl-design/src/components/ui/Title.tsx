import type { ElementType, ReactNode } from "react";
import { forwardRef } from "react";
import { cn } from "../../lib/utils";
import { resolveUtilityClassName, type UtilityPropBag, type UtilityPropPrefix } from "../../lib/utility-props";
import { typographyVariants, type TypographyVariantProps } from "../../variants/typography";

type TitleDomProps = Omit<React.HTMLAttributes<HTMLHeadingElement>, UtilityPropPrefix>;

export type TitleProps = TitleDomProps &
  UtilityPropBag &
  TypographyVariantProps & {
    children: ReactNode;
    order?: 1 | 2 | 3 | 4 | 5 | 6;
  };

export const Title = forwardRef<HTMLHeadingElement, TitleProps>(
  (
    {
      children,
      className,
      order = 1,
      // Typography variants with Title-specific defaults
      fontSize = "xl",
      textColor,
      textAlign,
      fontWeight = "bold",
      lineHeight = "normal",
      letterSpacing,
      truncate,
      ...props
    },
    ref
  ) => {
    const { utilityClassName, rest } = resolveUtilityClassName(props);
    const Heading = `h${order}` as ElementType;

    return (
      <Heading
        ref={ref}
        data-class="title"
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
      </Heading>
    );
  }
);

Title.displayName = "Title"; 