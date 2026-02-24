import { forwardRef } from "react";
import { cn } from "../../lib/utils";
import { resolveUtilityClassName, ux, type UtilityPropBag, type UtilityPropPrefix } from "../../lib/utility-props";
import { imagePositionVariants } from "../../variants/image";

type ImageDomProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, UtilityPropPrefix | 'width' | 'height'>;

export type ImageProps
  = ImageDomProps &
    UtilityPropBag & {
  width?: string | number;
  height?: string | number;
  fallbackSrc?: string;
  withPlaceholder?: boolean;
  fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  position?: 'bottom' | 'center' | 'left' | 'left-bottom' | 'left-top' | 'right' | 'right-bottom' | 'right-top' | 'top';
  aspect?: 'auto' | 'square' | 'video';
};

const defaultProps = ux({
  max: 'w-full',   // max-width: 100%
  h: 'auto'        // height: auto
});

// Simple fit variants - single class each, handled via ux()
const fitProps = {
  contain: ux({ object: 'contain' }),
  cover: ux({ object: 'cover' }),
  fill: ux({ object: 'fill' }),
  none: ux({ object: 'none' }),
  'scale-down': ux({ object: 'scale-down' })
};

// Simple position variants - single class each, handled via ux()
const simplePositionProps = {
  bottom: ux({ object: 'bottom' }),
  center: ux({ object: 'center' }),
  left: ux({ object: 'left' }),
  right: ux({ object: 'right' }),
  top: ux({ object: 'top' })
};

// Aspect ratio variants - single class each, handled via ux()
const aspectProps = {
  auto: ux({ aspect: 'auto' }),
  square: ux({ aspect: 'square' }),
  video: ux({ aspect: 'video' })
};

export const Image = forwardRef<HTMLImageElement, ImageProps>(
  ({
    className,
    src,
    alt,
    width,
    height,
    fit = 'cover',
    position = 'center',
    aspect = 'auto',
    fallbackSrc,
    withPlaceholder = false,
    onError,
    ...props
  }, ref) => {
    const { utilityClassName, rest } = resolveUtilityClassName(props);

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      if (fallbackSrc) {
        e.currentTarget.src = fallbackSrc;
      }
      onError?.(e);
    };

    const fitClasses = fitProps[fit];
    const aspectClasses = aspectProps[aspect];
    const placeholderClasses = withPlaceholder ? ux({ bg: 'muted' }) : '';
    
    // Handle position: use variants for combinations, ux() for simple positions
    const isCombinedPosition = position && ['left-bottom', 'left-top', 'right-bottom', 'right-top'].includes(position);
    const positionClasses = isCombinedPosition 
      ? imagePositionVariants({ position: position as 'left-bottom' | 'left-top' | 'right-bottom' | 'right-top' })
      : simplePositionProps[position as keyof typeof simplePositionProps] || '';

    return (
      <img
        ref={ref}
        data-class="image"
        src={src}
        alt={alt}
        width={width}
        height={height}
        onError={handleError}
        className={cn(
          defaultProps,
          fitClasses,
          positionClasses,
          aspectClasses,
          placeholderClasses,
          utilityClassName,
          className
        )}
        {...rest}
      />
    );
  }
);

Image.displayName = "Image"; 