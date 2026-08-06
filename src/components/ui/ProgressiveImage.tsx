"use client";

import { useState, useEffect, useRef } from "react";
import { getShipImageSources, getComponentImageSources, type ImageFallbackChain } from "@/lib/utils/imagePipeline";

interface ProgressiveImageProps {
  sources: ImageFallbackChain;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  fill?: boolean;
  priority?: boolean;
}

export function ProgressiveImage({ 
  sources, 
  alt, 
  className = "",
  onLoad,
  onError,
  fill = false,
  priority = false
}: ProgressiveImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string>(sources.placeholder);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const triedRef = useRef<Set<string>>(new Set());
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    let mounted = true;
    const allSources = [sources.primary, ...sources.fallbacks, sources.placeholder].filter(Boolean) as string[];

    const tryLoad = (index: number) => {
      if (index >= allSources.length || !mounted) {
        if (index >= allSources.length && mounted) {
          setHasError(true);
          setIsLoading(false);
        }
        return;
      }
      
      const src = allSources[index];
      if (triedRef.current.has(src)) return tryLoad(index + 1);
      triedRef.current.add(src);

      const img = new Image();
      imgRef.current = img;
      
      const timeout = setTimeout(() => {
        img.src = "";
        if (mounted) tryLoad(index + 1);
      }, priority ? 10000 : 5000);

      img.onload = () => {
        clearTimeout(timeout);
        if (mounted) {
          setCurrentSrc(src);
          setIsLoading(false);
          setHasError(false);
          onLoad?.();
        }
      };

      img.onerror = () => {
        clearTimeout(timeout);
        if (mounted) {
          tryLoad(index + 1);
        }
      };

      img.src = src;
    };

    if (priority) {
      tryLoad(0);
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              tryLoad(0);
              observer.disconnect();
            }
          });
        },
        { rootMargin: "100px" }
      );

      const el = imgRef.current;
      if (el) observer.observe(el);
      
      return () => observer.disconnect();
    }

    return () => {
      mounted = false;
      if (imgRef.current) {
        imgRef.current.src = "";
      }
    };
  }, [sources.primary, sources.fallbacks, sources.placeholder, priority, onLoad]);

  // Render the image
  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={fill ? { width: "100%", height: "100%" } : undefined}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-muted/30 animate-pulse" aria-hidden="true" />
      )}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={`
          transition-opacity duration-300 ease-out
          ${isLoading ? "opacity-0" : "opacity-100"}
          ${fill ? "absolute inset-0 w-full h-full object-cover" : ""}
        `}
        loading={priority ? "eager" : "lazy"}
        onLoad={onLoad}
        onError={onError}
      />
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 text-muted-foreground text-xs">
          Imagen no disponible
        </div>
      )}
    </div>
  );
}

// Ship-specific wrapper
interface ShipImageProps {
  ship: {
    image_url?: string;
    class_name?: string;
    name?: string;
    manufacturer?: { code?: string; name?: string };
  };
  alt?: string;
  className?: string;
  fill?: boolean;
  priority?: boolean;
}

export function ShipImage({ ship, alt, className = "", fill = false, priority = false }: ShipImageProps) {
  const sources = getShipImageSources(ship);
  return (
    <ProgressiveImage
      sources={sources}
      alt={alt || ship.name || "Ship"}
      className={className}
      fill={fill}
      priority={priority}
    />
  );
}

// Component-specific wrapper
interface ComponentImageProps {
  component: {
    image_url?: string;
    class_name?: string;
    name?: string;
    type?: string;
    size?: number;
  };
  alt?: string;
  className?: string;
  fill?: boolean;
  priority?: boolean;
}

export function ComponentImage({ component, alt, className = "", fill = false, priority = false }: ComponentImageProps) {
  const sources = getComponentImageSources(component);
  return (
    <ProgressiveImage
      sources={sources}
      alt={alt || component.name || "Component"}
      className={className}
      fill={fill}
      priority={priority}
    />
  );
}

export default ProgressiveImage;