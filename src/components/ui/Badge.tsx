import type { ReactNode } from "react";
import { forwardRef } from "react";
import { cn } from "../../lib/utils";
import { resolveUtilityClassName, type UtilityPropBag, type UtilityPropPrefix } from "../../lib/utility-props";
import { badgeStyleVariants, type BadgeVariantProps } from "../../variants";

type BadgeDomProps = Omit<React.HTMLAttributes<HTMLDivElement>, UtilityPropPrefix>;

export type BadgeProps
  = BadgeDomProps &
    UtilityPropBag &
    BadgeVariantProps & {
  children: ReactNode;
};

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({
    children,
    className,
    variant = 'default',
    ...props
  }, ref) => {
    const { utilityClassName, rest } = resolveUtilityClassName(props);

    return (
      <div
        ref={ref}
        data-class="badge"
        className={cn(
          badgeStyleVariants({ variant }),
          utilityClassName,
          className
        )}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

Badge.displayName = "Badge"; 