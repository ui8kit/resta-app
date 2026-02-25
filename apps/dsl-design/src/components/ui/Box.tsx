import type { ElementType, ReactNode } from "react";
import { forwardRef } from "react";
import { cn } from "../../lib/utils";
import { resolveUtilityClassName, type UtilityPropBag, type UtilityPropPrefix } from "../../lib/utility-props";

type BoxDomProps = Omit<React.HTMLAttributes<HTMLElement>, UtilityPropPrefix>;

export type BoxProps
  = BoxDomProps &
  UtilityPropBag & {
    component?: ElementType;
    className?: string;
    children?: ReactNode;
  };

export const Box = forwardRef<HTMLElement, BoxProps>(
  ({
    component = "div",
    className,
    children,
    ...props
  }, ref) => {
    const { utilityClassName, rest } = resolveUtilityClassName(props);
    const Element = component as ElementType;

    return (
      <Element
        ref={ref}
        data-class="box"
        className={cn(
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

Box.displayName = "Box";