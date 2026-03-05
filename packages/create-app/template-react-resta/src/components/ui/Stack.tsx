import type { ElementType, ReactNode } from "react";
import { forwardRef } from "react";
import { cn } from "../../lib/utils";
import { resolveUtilityClassName, ux, type UtilityPropBag, type UtilityPropPrefix } from "../../lib/utility-props";

type StackDomProps = Omit<React.HTMLAttributes<HTMLElement>, UtilityPropPrefix>;

export type StackProps
  = StackDomProps &
    UtilityPropBag & {
  children: ReactNode;
  component?: ElementType;
};

const defaultProps = ux({
  flex: 'col',     // display: flex + flex-direction: column
  gap: '4',        // gap: 1rem
  items: 'start',  // align-items: flex-start
  justify: 'start' // justify-content: flex-start
});

export const Stack = forwardRef<HTMLElement, StackProps>(
  ({
    children,
    className,
    component = 'div',
    ...props
  }, ref) => {
    const { utilityClassName, rest } = resolveUtilityClassName(props);
    const Element = component as ElementType;

    return (
      <Element
        ref={ref}
        data-class="stack"
        className={cn(
          defaultProps,
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

Stack.displayName = "Stack"; 