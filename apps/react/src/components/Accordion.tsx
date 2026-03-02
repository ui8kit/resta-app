"use client"

import * as React from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "../lib/utils";
import { resolveUtilityClassName,  ux, type UtilityPropBag, type UtilityPropPrefix } from "../lib/utility-props";
import { Icon } from "./ui/Icon";
import { Button, type ButtonProps } from "./ui/Button";

type AccordionContextValue = {
  value: string | string[];
  onItemClick: (value: string) => void;
  type: "single" | "multiple";
  collapsible: boolean;
};

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

function useAccordionContext() {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error("Accordion components must be used within an <Accordion />");
  }
  return context;
}

type AccordionDomProps = Omit<React.HTMLAttributes<HTMLDivElement>, UtilityPropPrefix>;

export interface AccordionProps extends AccordionDomProps, UtilityPropBag {
  type?: "single" | "multiple";
  collapsible?: boolean;
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  defaultValue?: string | string[];
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ type = "single", collapsible = false, value: controlledValue, onValueChange, defaultValue, className, ...props }, ref) => {
    const [uncontrolledValue, setUncontrolledValue] = React.useState<string | string[]>(
      defaultValue ?? (type === "multiple" ? [] : "")
    );

    const value = controlledValue ?? uncontrolledValue;
    const isMultiple = type === "multiple";

    const onItemClick = React.useCallback((itemValue: string) => {
      let newValue: string | string[];
      if (isMultiple) {
        newValue = Array.isArray(value) ? [...value] : [];
        const itemIndex = newValue.indexOf(itemValue);
        if (itemIndex > -1) {
          newValue.splice(itemIndex, 1);
        } else {
          newValue.push(itemValue);
        }
      } else {
        newValue = value === itemValue && collapsible ? "" : itemValue;
      }
      onValueChange?.(newValue);
      if (controlledValue === undefined) {
        setUncontrolledValue(newValue);
      }
    }, [value, onValueChange, isMultiple, collapsible, controlledValue]);

    const { utilityClassName, rest } = resolveUtilityClassName(props);
    const defaultUtilities = ux({ flex: "col", gap: "2" });

    return (
      <AccordionContext.Provider value={{ value, onItemClick, type, collapsible }}>
        <div
          ref={ref}
          data-accordion
          data-class="accordion"
          className={cn(defaultUtilities, utilityClassName, className)}
          {...rest}
        />
      </AccordionContext.Provider>
    );
  }
);
Accordion.displayName = "Accordion";

type AccordionItemContextValue = {
  value: string;
};

const AccordionItemContext = React.createContext<AccordionItemContextValue | null>(null);

function useAccordionItemContext() {
  const context = React.useContext(AccordionItemContext);
  if (!context) {
    throw new Error("AccordionItem components must be used within an <AccordionItem />");
  }
  return context;
}

type AccordionItemDomProps = Omit<React.HTMLAttributes<HTMLDivElement>, UtilityPropPrefix>;

export interface AccordionItemProps extends AccordionItemDomProps, UtilityPropBag {
  value: string;
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, className, ...props }, ref) => {
    const { value: contextValue, type } = useAccordionContext();
    const isOpen = Array.isArray(contextValue)
      ? contextValue.includes(value)
      : contextValue === value;

    const { utilityClassName, rest } = resolveUtilityClassName(props);
    const dataState = isOpen ? "open" : "closed";

    return (
      <AccordionItemContext.Provider value={{ value }}>
        <div
          ref={ref}
          data-state={dataState}
          data-type={type}
          data-class="accordion-item"
          className={cn(
            "flex flex-col",
            utilityClassName,
            className
          )}
          {...rest}
        />
      </AccordionItemContext.Provider>
    );
  }
);
AccordionItem.displayName = "AccordionItem";

type AccordionTriggerDomProps = Omit<ButtonProps, UtilityPropPrefix>;

export interface AccordionTriggerProps extends AccordionTriggerDomProps, UtilityPropBag {}

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ rounded, className, ...props }, ref) => {
    const { onItemClick } = useAccordionContext();
    const { value } = useAccordionItemContext();
    const { value: contextValue } = useAccordionContext();
    const isOpen = Array.isArray(contextValue)
      ? contextValue.includes(value)
      : contextValue === value;

    const { utilityClassName, rest } = resolveUtilityClassName(props);

    const defaultUtilities = ux({
      rounded: rounded || "lg",
    });
    const passedProps = {
      ref,
      variant: "ghost" as const,
      size: "sm" as const,
      onClick: () => onItemClick(value),
      "data-class": "accordion-trigger",
      className: cn(defaultUtilities, utilityClassName, className),
      ...rest,
    };
    const ChevronIcon = isOpen ? ChevronUp : ChevronDown;
    return (
      <Button {...(passedProps as ButtonProps)}>
        {props.children}
        <Icon component="span" lucideIcon={ChevronIcon} />
      </Button>
    );
  }
);
AccordionTrigger.displayName = "AccordionTrigger";

type AccordionContentDomProps = Omit<React.HTMLAttributes<HTMLDivElement>, UtilityPropPrefix>;

export interface AccordionContentProps extends AccordionContentDomProps, UtilityPropBag {}

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, ...props }, ref) => {
    const { value } = useAccordionItemContext();
    const { value: contextValue } = useAccordionContext();
    const isOpen = Array.isArray(contextValue)
      ? contextValue.includes(value)
      : contextValue === value;

    const { utilityClassName, rest } = resolveUtilityClassName(props);
    const dataState = isOpen ? "open" : "closed";

    return (
      <div
        ref={ref}
        data-state={dataState}
        data-class="accordion-content"
        className={cn(
          "overflow-hidden text-sm transition-all data-[state=closed]:h-0 data-[state=closed]:opacity-0 data-[state=open]:h-auto data-[state=open]:opacity-100 data-[state=closed]:ms-0 data-[state=open]:ms-4",
          utilityClassName,
          className
        )}
        {...rest}
      >
        <div className="pt-2 pb-4">{props.children}</div>
      </div>
    );
  }
);
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };