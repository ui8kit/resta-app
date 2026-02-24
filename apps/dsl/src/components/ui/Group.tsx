import type { ElementType, ReactNode } from "react";
import { forwardRef } from "react";
import { cn } from "../../lib/utils";
import { resolveUtilityClassName, ux, type UtilityPropBag, type UtilityPropPrefix } from "../../lib/utility-props";

type GroupDomProps = Omit<React.HTMLAttributes<HTMLElement>, UtilityPropPrefix>;

export type GroupProps
  = GroupDomProps &
    UtilityPropBag & {
  children: ReactNode;
  component?: ElementType;
  grow?: boolean;
};

const defaultProps = ux({
  flex: '',        // display: flex (bare token)
  gap: '4',        // default gap
  items: 'center', // default align
  justify: 'start', // default justify
  min: 'w-0'      // prevent overflow by default (preventGrowOverflow=true)
});

export const Group = forwardRef<HTMLElement, GroupProps>(
  ({
    children,
    className,
    component = 'div',
    grow = false,
    ...props
  }, ref) => {
    const { utilityClassName, rest } = resolveUtilityClassName(props);
    const Element = component as ElementType;

    // Handle grow prop that maps to utility class
    const specificUtilities = ux({
      ...(grow && { flex: '1' }) // flex-1 when grow=true
    });

    return (
      <Element
        ref={ref}
        data-class="group"
        className={cn(
          defaultProps,
          specificUtilities,
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

Group.displayName = "Group"; 