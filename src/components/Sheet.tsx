import type { ReactNode, HTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "../lib/utils";
import { resolveUtilityClassName, type UtilityPropBag, type UtilityPropPrefix } from "../lib/utility-props";
import { buttonSizeVariants, buttonStyleVariants } from "../variants";
import type { ButtonProps } from "./ui/Button";
import { Icon } from "./ui/Icon";
import { Menu } from "lucide-react";

type SheetDomProps = Omit<HTMLAttributes<HTMLDivElement>, UtilityPropPrefix>;

export interface SheetProps extends SheetDomProps, UtilityPropBag {
  id?: string;
  side?: "left" | "right";
  openLabel?: string;
  closeLabel?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  title?: string;
  showTrigger?: boolean;
  triggerIcon?: any;
  triggerVariant?: ButtonProps["variant"];
  triggerSize?: ButtonProps["size"];
  children?: ReactNode;
}

type SheetTriggerDomProps = Omit<ButtonProps, UtilityPropPrefix>;

export interface SheetTriggerProps extends SheetTriggerDomProps, UtilityPropBag {
  htmlFor?: string;
}

export const SheetTrigger = forwardRef<HTMLButtonElement, SheetTriggerProps>(

  (
    {
      htmlFor,
      className,
      size = "sm",
      variant = "ghost",
      ...props
    },
    ref
  ) => {
    const { utilityClassName, rest } = resolveUtilityClassName(props);

    return (
      <label
        ref={ref as any}
        htmlFor={htmlFor}
        data-class="sheet-trigger"
        className={cn(
          // Base button-like styles
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer",
          // Apply CVA variants
          buttonSizeVariants({ size }),
          buttonStyleVariants({ variant }),
          utilityClassName,
          className
        )}
        aria-label={rest["aria-label"]}
      >
        {props.children}
      </label>
    );
  }
);

export const Sheet = forwardRef<HTMLDivElement, SheetProps>(
  (
    {
      id = "sheet",
      side = "right",
      openLabel = "Open",
      closeLabel = "Close",
      size = "md",
      title,
      showTrigger = true,
      triggerIcon,
      triggerVariant = "ghost",
      triggerSize = "sm",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const sidePosition = side === "left" ? "left-0" : "right-0";
    const sideBorder = side === "left" ? "border-r" : "border-l";
    const sizeClass =
      size === "sm"
        ? "w-64"
        : size === "md"
        ? "w-80"
        : size === "lg"
        ? "w-96"
        : size === "xl"
        ? "w-[28rem]"
        : size === "2xl"
        ? "w-[32rem]"
        : "w-full";

    const { utilityClassName, rest } = resolveUtilityClassName(props);

    return (
      <div ref={ref} className={cn("relative", utilityClassName, className)} data-class="sheet" {...rest}>
        <input id={id} type="checkbox" className="peer hidden" />

        {showTrigger && (
          <SheetTrigger htmlFor={id} variant={triggerVariant} size={triggerSize} aria-label={openLabel}>
            <Icon component="span" lucideIcon={triggerIcon || Menu} />
          </SheetTrigger>
        )}

        <div className="fixed inset-0 z-50 hidden peer-checked:block" data-class="sheet-portal">
          <label
            htmlFor={id}
            aria-label="Close overlay"
            data-class="sheet-overlay"
            className="absolute inset-0 bg-card/50 cursor-pointer"
          />

          <div
            role="dialog"
            aria-modal="true"
            data-class="sheet-panel"
            className={cn(
              "absolute top-0 h-full max-w-full p-4 bg-card",
              sidePosition,
              sideBorder,
              "border-border",
              sizeClass
            )}
          >
            <div className="flex items-center justify-between" data-class="sheet-header">
              {title ? (
                <span className="text-sm text-muted-foreground" data-class="sheet-title">
                  {title}
                </span>
              ) : (
                <span />
              )}
              <label
                htmlFor={id}
                aria-label={closeLabel}
                data-class="sheet-close-button"
                className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border text-muted-foreground cursor-pointer"
              >
                ✕
              </label>
            </div>
            <div className="mt-4" data-class="sheet-content">
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

Sheet.displayName = "Sheet";
