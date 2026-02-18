import type { ElementType, ReactNode } from "react";
import { forwardRef } from "react";
import { cn } from "../../lib/utils";
import { resolveUtilityClassName, ux, type UtilityPropBag, type UtilityPropPrefix } from "../../lib/utility-props";

type IconDomProps = Omit<React.HTMLAttributes<HTMLElement>, UtilityPropPrefix>;

export type IconProps
  = IconDomProps &
    UtilityPropBag & {
  children?: ReactNode;
  component?: ElementType;
  lucideIcon?: any; // For Lucide React icons
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
};

const defaultProps = ux({
  inline: '',      // display: inline (bare token)
  shrink: '0',     // flex-shrink: 0
  w: '4',          // width: 1rem (16px)
  h: '4'           // height: 1rem (16px)
});

const sizeProps = {
  xs: ux({ w: '3', h: '3' }),    // 12px
  sm: ux({ w: '4', h: '4' }),    // 16px
  md: ux({ w: '5', h: '5' }),    // 20px
  lg: ux({ w: '6', h: '6' }),    // 24px
  xl: ux({ w: '8', h: '8' })     // 32px
};

export const Icon = forwardRef<HTMLElement, IconProps>(
  ({
    children,
    className,
    component: Component = 'span',
    size = 'sm',
    lucideIcon: LucideIcon,
    ...props
  }, ref) => {
    const { 'aria-hidden': ariaHidden, role, ...restProps } = props;
    const { utilityClassName, rest } = resolveUtilityClassName(restProps);

    const sizeClasses = sizeProps[size];
    const baseClasses = cn(
      defaultProps,
      sizeClasses,
      utilityClassName,
      className
    );

    const ComponentWithRef = Component as React.ComponentType<any>;

    return (
      <ComponentWithRef
        ref={ref}
        data-class="icon"
        className={baseClasses}
        aria-hidden={ariaHidden}
        role={role}
        {...rest}
      >
        {LucideIcon ? (
          <LucideIcon
            className={cn(
              sizeClasses,
              utilityClassName
            )}
          />
        ) : (
          children
        )}
      </ComponentWithRef>
    );
  }
);

Icon.displayName = "Icon"; 