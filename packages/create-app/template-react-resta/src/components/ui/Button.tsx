import type { ReactNode, ElementType, ComponentPropsWithoutRef } from "react";
import { forwardRef } from "react";
import { cn } from "../../lib/utils";
import { resolveUtilityClassName, type UtilityPropBag, type UtilityPropPrefix } from "../../lib/utility-props";
import { buttonStyleVariants, buttonSizeVariants, type ButtonVariantProps } from "../../variants";

/**
 * Base props shared between button and anchor variants
 */
type ButtonBaseProps = UtilityPropBag & ButtonVariantProps & {
  children: ReactNode;
  /** Custom element to render (overrides href detection) */
  as?: ElementType;
};

/**
 * Props when rendering as a button element (no href)
 */
type ButtonAsButtonProps = ButtonBaseProps & 
  Omit<ComponentPropsWithoutRef<'button'>, keyof ButtonBaseProps | UtilityPropPrefix> & {
  href?: never;
};

/**
 * Props when rendering as an anchor element (with href)
 */
type ButtonAsAnchorProps = ButtonBaseProps &
  Omit<ComponentPropsWithoutRef<'a'>, keyof ButtonBaseProps | UtilityPropPrefix> & {
  href: string;
};

/**
 * Union type for Button props - automatically infers button vs anchor based on href
 */
export type ButtonProps = ButtonAsButtonProps | ButtonAsAnchorProps;

/**
 * Type guard to check if props contain href (anchor variant)
 */
function isAnchorProps(props: ButtonProps): props is ButtonAsAnchorProps {
  return 'href' in props && props.href !== undefined;
}

/**
 * Button component with polymorphic rendering
 * 
 * Automatically renders as:
 * - `<a>` when `href` is provided
 * - `<button>` when `href` is not provided
 * - Custom element when `as` prop is specified
 * 
 * @example
 * ```tsx
 * // Renders as <button>
 * <Button onClick={handleClick}>Click me</Button>
 * 
 * // Renders as <a>
 * <Button href="/about">About</Button>
 * 
 * // Renders as <a> with external link attributes
 * <Button href="https://example.com" target="_blank" rel="noopener noreferrer">
 *   External Link
 * </Button>
 * 
 * // Renders as custom element
 * <Button as={Link} to="/dashboard">Dashboard</Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (props, ref) => {
    const {
      children,
      className,
      variant = 'default',
      size = 'default',
      as,
      ...restProps
    } = props;

    const { utilityClassName, rest } = resolveUtilityClassName(restProps);

    const combinedClassName = cn(
      buttonStyleVariants({ variant }),
      buttonSizeVariants({ size }),
      utilityClassName,
      className
    );

    // Determine which element to render
    const Component: ElementType = as ?? (isAnchorProps(props) ? 'a' : 'button');

    // Build element-specific props
    const elementProps = {
      ref,
      'data-class': 'button',
      className: combinedClassName,
      ...rest,
    };

    // Add button-specific defaults when rendering as button
    if (Component === 'button' && !('type' in rest)) {
      (elementProps as Record<string, unknown>).type = 'button';
    }

    // Add accessibility for disabled anchor links
    if (Component === 'a' && 'disabled' in rest && rest.disabled) {
      (elementProps as Record<string, unknown>)['aria-disabled'] = true;
      (elementProps as Record<string, unknown>).tabIndex = -1;
      (elementProps as Record<string, unknown>).role = 'link';
    }

    return (
      <Component {...elementProps}>
        {children}
      </Component>
    );
  }
);

Button.displayName = "Button"; 