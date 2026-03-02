import type { ComponentPropsWithoutRef, Ref } from "react";
import { forwardRef } from "react";
import { cn } from "../../lib/utils";
import {
  resolveUtilityClassName,
  type UtilityPropBag,
  type UtilityPropPrefix,
} from "../../lib/utility-props";
import {
  fieldVariantVariants,
  fieldControlVariants,
  fieldButtonVariants,
  fieldSizeVariants,
  fieldControlSizeVariants,
  fieldTextareaBase,
  type FieldVariantProps,
} from "../../variants/field";

type FieldComponent = "input" | "textarea" | "select" | "button";

/**
 * Base field props — variant (style) + component (element) + utility props.
 */
type FieldBaseProps = UtilityPropBag &
  FieldVariantProps & {
    component?: FieldComponent;
    className?: string;
  };

type FieldInputProps = FieldBaseProps &
  Omit<ComponentPropsWithoutRef<"input">, keyof FieldBaseProps | UtilityPropPrefix>;

type FieldTextareaProps = FieldBaseProps &
  Omit<
    ComponentPropsWithoutRef<"textarea">,
    keyof FieldBaseProps | UtilityPropPrefix
  >;

type FieldSelectProps = FieldBaseProps &
  Omit<
    ComponentPropsWithoutRef<"select">,
    keyof FieldBaseProps | UtilityPropPrefix
  >;

type FieldButtonProps = FieldBaseProps &
  Omit<
    ComponentPropsWithoutRef<"button">,
    keyof FieldBaseProps | UtilityPropPrefix
  >;

export type FieldProps =
  | (FieldInputProps & { component?: "input" })
  | (FieldTextareaProps & { component: "textarea" })
  | (FieldSelectProps & { component: "select" })
  | (FieldButtonProps & { component: "button" });

function isTextareaProps(props: FieldProps): props is FieldTextareaProps & { component: "textarea" } {
  return props.component === "textarea";
}

function isSelectProps(props: FieldProps): props is FieldSelectProps & { component: "select" } {
  return props.component === "select";
}

function isButtonProps(props: FieldProps): props is FieldButtonProps & { component: "button" } {
  return props.component === "button";
}

/**
 * Field — polymorphic form control. Style via variant (default, outline, ghost).
 * Element via component: "input" (default), "textarea", "select", "button".
 *
 * @example
 * ```tsx
 * <Field type="email" placeholder="Email" />
 * <Field component="textarea" rows={4} placeholder="Message" />
 * <Field type="checkbox" />
 * <Field type="radio" name="choice" value="a" />
 * <Field component="select"><option>One</option></Field>
 * <Field component="button" type="submit">Submit</Field>
 * <Field variant="outline" type="email" />
 * <Field variant="ghost" component="textarea" />
 * ```
 */
export const Field = forwardRef<
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLButtonElement,
  FieldProps
>(function Field(props, ref) {
  const {
    component = "input",
    variant = "default",
    size = "default",
    className,
    ...rest
  } = props;

  const { utilityClassName, rest: elementProps } = resolveUtilityClassName(rest);

  const inputType = (elementProps as Record<string, unknown>).type as string | undefined;
  const isCheckbox = component === "input" && inputType === "checkbox";
  const isRadio = component === "input" && inputType === "radio";
  const isControl = isCheckbox || isRadio;
  const isButton = component === "button";

  const styleClasses = isButton
    ? fieldButtonVariants({ variant })
    : isControl
      ? fieldControlVariants({ variant })
      : fieldVariantVariants({ variant });
  const sizeClasses = isControl
    ? fieldControlSizeVariants({ size })
    : isButton
      ? "" // button has its own padding
      : fieldSizeVariants({ size });

  const combinedClassName = cn(
    styleClasses,
    sizeClasses,
    component === "textarea" && fieldTextareaBase,
    isCheckbox && "rounded",
    isRadio && "rounded-full",
    utilityClassName,
    className
  );

  const dataClass = (elementProps as Record<string, unknown>)["data-class"] ?? "field";

  if (isTextareaProps(props)) {
    const textareaProps = elementProps as ComponentPropsWithoutRef<"textarea">;
    return (
      <textarea
        ref={ref as Ref<HTMLTextAreaElement>}
        data-class={dataClass}
        className={combinedClassName}
        {...textareaProps}
      />
    );
  }

  if (isSelectProps(props)) {
    const selectProps = elementProps as ComponentPropsWithoutRef<"select">;
    return (
      <select
        ref={ref as Ref<HTMLSelectElement>}
        data-class={dataClass}
        className={combinedClassName}
        {...selectProps}
      />
    );
  }

  if (isButtonProps(props)) {
    const buttonProps = elementProps as ComponentPropsWithoutRef<"button">;
    const btnType = (buttonProps.type ?? "button") as "button" | "reset" | "submit";
    return (
      <button
        ref={ref as Ref<HTMLButtonElement>}
        data-class={dataClass}
        className={combinedClassName}
        {...buttonProps}
        type={btnType}
      />
    );
  }

  // input: text, email, password, checkbox, radio, etc.
  const inputProps = { ...elementProps } as Record<string, unknown>;
  if (!inputProps.type) {
    inputProps.type = "text";
  }

  return (
    <input
      ref={ref as Ref<HTMLInputElement>}
      data-class={dataClass}
      className={combinedClassName}
      {...inputProps}
    />
  );
});

Field.displayName = "Field";
