/**
 * Image Pipeline - Robust image loading with fallbacks for Star Citizen assets
 * Handles: Wiki API thumbnails → originals → Erkul.games → Generated placeholders
 */

export interface ImageSource {
  url: string;
  source: 'wiki' | 'erkul' | 'placeholder';
  width?: number;
  height?: number;
}

export interface ImageFallbackChain {
  primary: string | null;
  fallbacks: string[];
  placeholder: string;
}

// Erkul.games image CDN base
const ERKUL_BASE = "https://erkul.games";
const ERKUL_SHIPS = `${ERKUL_BASE}/ships`;
const ERKUL_COMPONENTS = `${ERKUL_BASE}/components`;

// Special edition patterns to detect variant ships
const SPECIAL_EDITION_PATTERNS = [
  /_Collector_\w+/i,      // Wikelo Collector variants
  /_Exec_\w+/i,            // PYAM Executive variants
  /_BTALA$/i,              // Alliance variants
  /_Showdown$/i,           // Best In Show variants
  /CitizenCon\d*/i,        // CitizenCon editions
  /Heartseeker/i,          // Heartseeker editions
  /_Military$/i,           // Military variants (often Wikelo)
  /_Industrial$/i,         // Industrial variants (often Wikelo)
  /_Stealth$/i,            // Stealth variants
  /_Medic$/i,              // Medic variants
  /_Mod$/i,                // Modified variants
  /_Competition$/i,        // Competition variants
  /_Grad02$/i,             // Grad variants (ATLS Orange Line)
];

export type SpecialEditionType = 'wikelo' | 'pyam' | 'alliance' | 'bis' | 'citizencon' | 'heartseeker' | 'other';

/**
 * Detect if a ship is a special edition and return its type
 */
export function detectSpecialEdition(ship: {
  name?: string;
  class_name?: string;
}): SpecialEditionType | null {
  const name = ship.name || '';
  const className = ship.class_name || '';
  
  if (name.includes('Wikelo') || className.includes('_Collector_')) return 'wikelo';
  if (name.includes('PYAM') || className.includes('_Exec_')) return 'pyam';
  if (name.includes('Alliance') || className.includes('_BTALA')) return 'alliance';
  if (name.includes('Best In Show') || className.includes('_Showdown')) return 'bis';
  if (name.includes('CitizenCon')) return 'citizencon';
  if (name.includes('Heartseeker')) return 'heartseeker';
  
  return null;
}

/**
 * Extract the base ship class_name from a special edition variant
 * e.g., "CRUS_Starlifter_A2_Collector_Military" → "CRUS_Starlifter_A2"
 *        "ANVL_Hornet_F7A_Mk2_Exec_Stealth" → "ANVL_Hornet_F7A_Mk2"
 *        "AEGS_Hammerhead_Showdown" → "AEGS_Hammerhead"
 */
export function resolveBaseShipClassName(className: string): string | null {
  // Try each pattern and strip the suffix
  for (const pattern of SPECIAL_EDITION_PATTERNS) {
    if (pattern.test(className)) {
      const base = className.replace(pattern, '');
      if (base !== className && base.length > 3) {
        return base;
      }
    }
  }
  
  // Manual fallback: find last underscore segment that looks like a variant suffix
  const parts = className.split('_');
  if (parts.length > 2) {
    const last = parts[parts.length - 1].toLowerCase();
    const secondLast = parts[parts.length - 2].toLowerCase();
    
    // Known suffix patterns
    const suffixes = ['military', 'industrial', 'stealth', 'medic', 'mod', 'competition', 'grad02', 'exec', 'collector', 'btala', 'showdown'];
    if (suffixes.some(s => last.includes(s) || secondLast.includes(s))) {
      // Remove last 1-2 parts
      const trimmed = parts.slice(0, -1).join('_');
      if (trimmed.length > 3) return trimmed;
    }
  }
  
  return null;
}

// Placeholder generators
const PLACEHOLDER_SVG = (width: number, height: number, text: string, bgColor = "1E293B", textColor = "64748B") => 
  `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect fill="#${bgColor}" width="${width}" height="${height}"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
            font-family="system-ui, sans-serif" font-size="${Math.min(width, height) * 0.12}" fill="#${textColor}">
        ${text}
      </text>
    </svg>
  `)}`;

/**
 * Get ship image with fallback chain:
 * 1. Wiki API thumbnail_url
 * 2. Erkul.games ship image (by class_name)
 * 3. Erkul.games ship image (by base class_name for special editions)
 * 4. Erkul by manufacturer + name
 * 5. Generated placeholder
 */
export function getShipImageSources(ship: {
  image_url?: string;
  class_name?: string;
  name?: string;
  manufacturer?: { code?: string; name?: string };
}): ImageFallbackChain {
  const fallbacks: string[] = [];
  
  // 1. Wiki thumbnail (already in image_url typically)
  if (ship.image_url) {
    fallbacks.push(ship.image_url);
  }

  // 2. Erkul.games - try by class_name
  if (ship.class_name) {
    const erkulName = ship.class_name
      .replace(/[_\s]+/g, '_')
      .toLowerCase();
    fallbacks.push(`${ERKUL_SHIPS}/${erkulName}.webp`);
    fallbacks.push(`${ERKUL_SHIPS}/${erkulName}.png`);
    fallbacks.push(`${ERKUL_SHIPS}/${erkulName}.jpg`);
  }

  // 3. Special editions: try base ship image as fallback
  if (ship.class_name) {
    const baseClassName = resolveBaseShipClassName(ship.class_name);
    if (baseClassName) {
      const baseErkulName = baseClassName
        .replace(/[_\s]+/g, '_')
        .toLowerCase();
      fallbacks.push(`${ERKUL_SHIPS}/${baseErkulName}.webp`);
      fallbacks.push(`${ERKUL_SHIPS}/${baseErkulName}.png`);
    }
  }

  // 4. Erkul by manufacturer + name
  if (ship.manufacturer?.code && ship.name) {
    const mfg = ship.manufacturer.code.toLowerCase();
    const name = ship.name.toLowerCase().replace(/[_\s]+/g, '_');
    fallbacks.push(`${ERKUL_SHIPS}/${mfg}_${name}.webp`);
    fallbacks.push(`${ERKUL_SHIPS}/${mfg}_${name}.png`);
  }

  // 5. Placeholder
  const placeholder = PLACEHOLDER_SVG(400, 300, ship.name || "SHIP", "0F172A", "3B82F6");

  return {
    primary: fallbacks[0] || null,
    fallbacks: fallbacks.slice(1),
    placeholder,
  };
}

/**
 * Get component image with fallback chain:
 * 1. Wiki API thumbnail_url
 * 2. Wiki API original_url
 * 3. Erkul.games component image (by class_name)
 * 4. Generated placeholder by type
 */
export function getComponentImageSources(comp: {
  image_url?: string;
  class_name?: string;
  name?: string;
  type?: string;
  size?: number;
}): ImageFallbackChain {
  const fallbacks: string[] = [];
  const type = comp.type || "Component";
  const size = comp.size || 1;

  // 1. Wiki thumbnail
  if (comp.image_url) {
    fallbacks.push(comp.image_url);
  }

  // 2. Erkul.games - try by class_name
  if (comp.class_name) {
    const erkulName = comp.class_name
      .replace(/[_\s]+/g, '_')
      .toLowerCase();
    fallbacks.push(`${ERKUL_COMPONENTS}/${erkulName}.webp`);
    fallbacks.push(`${ERKUL_COMPONENTS}/${erkulName}.png`);
    fallbacks.push(`${ERKUL_COMPONENTS}/${erkulName}.jpg`);
  }

  // 3. Type-based placeholder
  const typeColors: Record<string, { bg: string; text: string; label: string }> = {
    Weapon: { bg: "7F1D1D", text: "FCA5A5", label: "WEAPON" },
    Shield: { bg: "1E3A5F", text: "93C5FD", label: "SHIELD" },
    PowerPlant: { bg: "78350F", text: "FDE047", label: "POWER PLANT" },
    Cooler: { bg: "14532D", text: "86EFAC", label: "COOLER" },
    QuantumDrive: { bg: "4C1D95", text: "D8B4FE", label: "QUANTUM DRIVE" },
    Radar: { bg: "1E40AF", text: "93C5FD", label: "RADAR" },
    FlightController: { bg: "374151", text: "D1D5DB", label: "FLIGHT CONTROLLER" },
    LifeSupport: { bg: "065F46", text: "6EE7B7", label: "LIFE SUPPORT" },
    Missile: { bg: "991B1B", text: "FCA5A5", label: "MISSILE" },
    EMP: { bg: "581C87", text: "F0ABFC", label: "EMP" },
    QED: { bg: "831843", text: "F9A8D4", label: "QED" },
  };

  const style = typeColors[type] || { bg: "1E293B", text: "64748B", label: type.toUpperCase() };
  const placeholder = PLACEHOLDER_SVG(200, 200, `${style.label} S${size}`, style.bg, style.text);

  return {
    primary: fallbacks[0] || null,
    fallbacks: fallbacks.slice(1),
    placeholder,
  };
}

/**
 * React hook for progressive image loading with fallbacks
 */
import { useState, useEffect, useRef } from "react";

export function useProgressiveImage(sources: ImageFallbackChain, options?: {
  onLoad?: (source: string) => void;
  onError?: (error: Error) => void;
}) {
  const [currentSrc, setCurrentSrc] = useState<string>(sources.placeholder);
  const [isLoading, setIsLoading] = useState(true);
  const triedRef = useRef<Set<string>>(new Set());
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    let mounted = true;
    const allSources = [sources.primary, ...sources.fallbacks, sources.placeholder].filter(Boolean) as string[];

    const tryLoad = async (index: number) => {
      if (index >= allSources.length || !mounted) return;
      
      const src = allSources[index];
      if (triedRef.current.has(src)) return tryLoad(index + 1);
      triedRef.current.add(src);

      return new Promise<void>((resolve) => {
        const img = new Image();
        imgRef.current = img;
        
        const timeout = setTimeout(() => {
          img.src = ""; // cancel
          resolve();
        }, 5000);

        img.onload = () => {
          clearTimeout(timeout);
          if (mounted) {
            setCurrentSrc(src);
            setIsLoading(false);
            options?.onLoad?.(src);
          }
          resolve();
        };

        img.onerror = () => {
          clearTimeout(timeout);
          if (mounted) {
            tryLoad(index + 1);
          }
          resolve();
        };

        img.src = src;
      });
    };

    tryLoad(0);

    return () => {
      mounted = false;
      if (imgRef.current) {
        imgRef.current.src = "";
      }
    };
  }, [sources.primary, sources.fallbacks, sources.placeholder, options]);

  return { currentSrc, isLoading };
}

/**
 * Preload image for better UX
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

/**
 * Preload multiple images (for ship grid, etc.)
 */
export function preloadImages(sources: string[]): Promise<PromiseSettledResult<void>[]> {
  return Promise.allSettled(sources.map(preloadImage));
}

const imagePipeline = {
  getShipImageSources,
  getComponentImageSources,
  useProgressiveImage,
  preloadImage,
  preloadImages,
  resolveBaseShipClassName,
  detectSpecialEdition,
};

export default imagePipeline;