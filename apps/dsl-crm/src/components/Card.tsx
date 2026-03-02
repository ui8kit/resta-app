import type { ReactNode } from "react";
import { forwardRef } from "react";
import { cn } from "../lib/utils";
import { resolveUtilityClassName, ux, type UtilityPropBag, type UtilityPropPrefix } from "../lib/utility-props";
import { cardVariants, cardHeaderVariants, cardTitleVariants, cardDescriptionVariants, cardContentVariants, cardFooterVariants, type CardVariantProps } from "../variants/card";

type CardDomProps = Omit<React.HTMLAttributes<HTMLDivElement>, UtilityPropPrefix>;

// Main Card component interface (CDL utility-props + variant)
interface CardProps extends CardDomProps, UtilityPropBag, CardVariantProps {
  children: ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ 
    children, 
    className,
    variant = "default",
    ...props 
  }, ref) => {
    const { utilityClassName, rest } = resolveUtilityClassName(props);
    const defaultUtilities = ux({
      p: "4",
      rounded: "lg",
      shadow: "sm",
      bg: "card",
      // minimal border baseline (no color enforcement here; color comes from tokens/theme)
      border: "",
    });
    return (
      <div
        ref={ref}
        data-class="card"
        className={cn(
          cardVariants({ variant }),
          defaultUtilities,
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

Card.displayName = "Card";

// Card.Header component
interface CardHeaderProps 
  extends Omit<React.HTMLAttributes<HTMLDivElement>, UtilityPropPrefix>,
    UtilityPropBag {
  children: ReactNode;
}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ 
    children, 
    className,
    ...props 
  }, ref) => {
    const { utilityClassName, rest } = resolveUtilityClassName(props);
    const defaultUtilities = ux({ p: "4" });
    return (
      <div
        ref={ref}
        data-class="card-header"
        className={cn(
          cardHeaderVariants(),
          defaultUtilities,
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

CardHeader.displayName = "CardHeader";

// Card.Title component
interface CardTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  order?: 1 | 2 | 3 | 4 | 5 | 6;
}

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({
    children,
    className,
    order = 3,
    ...props
  }, ref) => {
    // Create props for the heading element
    const headingProps = {
      ref,
      'data-class': 'card-title',
      className: cn(
        cardTitleVariants(),
        className
      ),
      ...props
    };

    // Return the appropriate heading element
    switch (order) {
      case 1:
        return <h1 {...headingProps}>{children}</h1>;
      case 2:
        return <h2 {...headingProps}>{children}</h2>;
      case 3:
        return <h3 {...headingProps}>{children}</h3>;
      case 4:
        return <h4 {...headingProps}>{children}</h4>;
      case 5:
        return <h5 {...headingProps}>{children}</h5>;
      case 6:
        return <h6 {...headingProps}>{children}</h6>;
      default:
        return <h3 {...headingProps}>{children}</h3>;
    }
  }
);

CardTitle.displayName = "CardTitle";

// Card.Description component
interface CardDescriptionProps 
  extends React.HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ children, className, ...props }, ref) => (
    <p
      ref={ref}
      data-class="card-description"
      className={cn(
        cardDescriptionVariants(),
        className
      )}
      {...props}
    >
      {children}
    </p>
  )
);

CardDescription.displayName = "CardDescription";

// Card.Content component
interface CardContentProps 
  extends Omit<React.HTMLAttributes<HTMLDivElement>, UtilityPropPrefix>,
    UtilityPropBag {
  children: ReactNode;
}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ 
    children, 
    className,
    ...props 
  }, ref) => {
    const { utilityClassName, rest } = resolveUtilityClassName(props);
    const defaultUtilities = ux({ p: "4" });
    return (
      <div
        ref={ref}
        data-class="card-content"
        className={cn(
          cardContentVariants(),
          defaultUtilities,
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

CardContent.displayName = "CardContent";

// Card.Footer component
interface CardFooterProps 
  extends Omit<React.HTMLAttributes<HTMLDivElement>, UtilityPropPrefix>,
    UtilityPropBag {
  children: ReactNode;
}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ 
    children, 
    className,
    ...props 
  }, ref) => {
    const { utilityClassName, rest } = resolveUtilityClassName(props);
    const defaultUtilities = ux({ p: "4" });
    return (
      <div
        ref={ref}
        data-class="card-footer"
        className={cn(
          cardFooterVariants(),
          defaultUtilities,
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

CardFooter.displayName = "CardFooter";

// Compound Card component
const CompoundCard = Object.assign(Card, {
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Content: CardContent,
  Footer: CardFooter,
});

// Export types and components
export type {
  CardProps,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps,
  CardFooterProps
};
export { CompoundCard as Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }; 