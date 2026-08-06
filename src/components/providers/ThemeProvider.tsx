"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useState, ReactNode } from "react";
import { theme, type Theme } from "@/lib/design/theme";

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (dark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getInitialIsDark(storageKey: string, defaultDark: boolean): boolean {
  if (typeof window === "undefined") return defaultDark;
  
  const stored = localStorage.getItem(storageKey);
  if (stored !== null) {
    return JSON.parse(stored);
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ 
  children, 
  defaultDark = true,
  storageKey = "sc-loadout-theme"
}: { 
  children: ReactNode; 
  defaultDark?: boolean;
  storageKey?: string;
}) {
  const [isDark, setIsDark] = useState(() => getInitialIsDark(storageKey, defaultDark));
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    // Save to localStorage
    localStorage.setItem(storageKey, JSON.stringify(isDark));
  }, [isDark, storageKey, mounted]);

  const toggleTheme = () => setIsDark(prev => !prev);
  const setTheme = (dark: boolean) => setIsDark(dark);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ 
        theme, 
        isDark: defaultDark, 
        toggleTheme: () => {}, 
        setTheme: () => {} 
      }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Hook for accessing theme tokens directly
export function useThemeTokens() {
  const { theme } = useTheme();
  return theme;
}

// Hook for semantic colors
export function useSemanticColors() {
  const { theme } = useTheme();
  return theme.colors.semantic;
}

// Hook for component-specific color schemes
export function useColorScheme(scheme: keyof typeof theme.colors.semantic.status) {
  const { theme } = useTheme();
  return theme.colors.semantic.status[scheme];
}

// CSS-in-JS helper for dynamic styles
export function cssVars(prefix = "sc") {
  const vars: Record<string, string> = {};
  
  // Colors
  Object.entries(theme.colors.semantic.bg).forEach(([key, value]) => {
    vars[`--${prefix}-bg-${key}`] = value;
  });
  Object.entries(theme.colors.semantic.surface).forEach(([key, value]) => {
    vars[`--${prefix}-surface-${key}`] = value;
  });
  Object.entries(theme.colors.semantic.border).forEach(([key, value]) => {
    vars[`--${prefix}-border-${key}`] = value;
  });
  Object.entries(theme.colors.semantic.text).forEach(([key, value]) => {
    vars[`--${prefix}-text-${key}`] = value;
  });
  Object.entries(theme.colors.semantic.status).forEach(([key, value]) => {
    if (typeof value === 'string' && !key.endsWith('Bg')) {
      vars[`--${prefix}-status-${key}`] = value;
    }
  });
  Object.entries(theme.colors.semantic.brand).forEach(([key, value]) => {
    vars[`--${prefix}-brand-${key}`] = value;
  });

  // Spacing
  Object.entries(theme.spacing).forEach(([key, value]) => {
    vars[`--${prefix}-space-${key}`] = value;
  });

  // Border radius
  Object.entries(theme.borderRadius).forEach(([key, value]) => {
    vars[`--${prefix}-radius-${key}`] = value;
  });

  // Shadows
  Object.entries(theme.shadows).forEach(([key, value]) => {
    if (typeof value === 'string') {
      vars[`--${prefix}-shadow-${key}`] = value;
    }
  });

  // Transitions
  Object.entries(theme.transitions.durations).forEach(([key, value]) => {
    vars[`--${prefix}-duration-${key}`] = value;
  });
  Object.entries(theme.transitions.easings).forEach(([key, value]) => {
    vars[`--${prefix}-easing-${key}`] = value;
  });

  return vars;
}

// Inject CSS variables into document (call once in layout)
export function injectThemeCSS(prefix = "sc") {
  if (typeof document === "undefined") return;
  
  const vars = cssVars(prefix);
  const root = document.documentElement;
  
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

export default ThemeProvider;