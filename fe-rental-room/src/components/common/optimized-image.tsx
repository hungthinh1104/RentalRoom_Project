"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import { ImageOff } from "lucide-react";

interface OptimizedImageProps extends Omit<ImageProps, 'onError' | 'onLoad'> {
  fallbackSrc?: string;
  showLoadingSpinner?: boolean;
  containerClassName?: string;
}

/**
 * Optimized Image Component
 * - Handles loading states with blur placeholder
 * - Automatic error handling with fallback
 * - Supports both internal and external images
 * - Optimized for Next.js Image component
 */
export function OptimizedImage({
  src,
  alt,
  fallbackSrc = "/placeholder-room.jpg",
  showLoadingSpinner = false,
  className,
  containerClassName,
  fill,
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    console.warn(`[OptimizedImage] Failed to load: ${imgSrc}`);
    
    // Try fallback if available and not already using it
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
      setHasError(false); // Reset error state to try fallback
    } else {
      setHasError(true);
    }
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // If error and no fallback, show error state
  if (hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted",
          fill && "absolute inset-0",
          containerClassName
        )}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <ImageOff className="size-8" />
          <span className="text-xs">Không thể tải ảnh</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", fill && "w-full h-full", containerClassName)}>
      {/* Loading State */}
      {isLoading && showLoadingSpinner && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-muted z-10",
            fill && "absolute inset-0"
          )}
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}

      {/* Image */}
      <Image
        src={imgSrc}
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          isLoading && "opacity-0",
          !isLoading && "opacity-100",
          className
        )}
        onError={handleError}
        onLoad={handleLoad}
        fill={fill}
        placeholder={fill ? "blur" : undefined}
        blurDataURL={
          fill
            ? "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4="
            : undefined
        }
        {...props}
      />
    </div>
  );
}
