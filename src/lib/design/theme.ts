/**
 * Star Citizen Verse Theme - Design System Tokens
 * Inspired by Star Citizen's in-game UI: quantum blues, engine oranges, hull greys
 */

// Color Palette - Star Citizen Verse Theme
export const colors = {
  // Quantum Blue - Primary brand color
  quantum: {
    50: '#EFF8FF',
    100: '#D9F0FF',
    200: '#B3DFFF',
    300: '#7CC8FF',
    400: '#3BA8FF',
    500: '#00D4FF',  // Primary - Quantum Drive glow
    600: '#00A8CC',
    700: '#007C99',
    800: '#005066',
    900: '#002633',
    950: '#001319',
  },

  // Engine Orange - Secondary/accent
  engine: {
    50: '#FFF4ED',
    100: '#FFE8D0',
    200: '#FFD1A1',
    300: '#FFB362',
    400: '#FF8E23',
    500: '#FF6B00',  // Secondary - Engine thrust
    600: '#CC5500',
    700: '#994000',
    800: '#662A00',
    900: '#331500',
    950: '#1A0A00',
  },

  // Shield Green - Success/positive
  shield: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',  // Success
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
    950: '#022C1E',
  },

  // Hull Red - Danger/error
  hull: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',  // Danger
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
    950: '#450A0A',
  },

  // Amber/Caution - Warning
  caution: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',  // Warning
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
    950: '#451A03',
  },

  // Deep Space - Backgrounds
  space: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',   // Main background
    950: '#0A0E17',   // Deep space
    1000: '#05080D',  // Void
  },

  // Cockpit/Surface - Cards, panels
  cockpit: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',   // Surface elevated
    800: '#1E293B',   // Surface
    900: '#0F172A',   // Deep surface
    950: '#0A0E17',   // Panel
  },

  // Semantic aliases for easy theming
  semantic: {
    // Backgrounds
    bg: {
      primary: '#0A0E17',        // space.950
      secondary: '#0F172A',      // space.900
      tertiary: '#1E293B',       // space.800
      elevated: '#1E293B',       // cockpit.800
      overlay: 'rgba(5, 8, 13, 0.8)',
    },
    // Surfaces
    surface: {
      primary: '#1E293B',        // cockpit.800
      secondary: '#334155',      // cockpit.700
      tertiary: '#475569',       // cockpit.600
      hover: '#334155',          // cockpit.700
      active: '#475569',         // cockpit.600
    },
    // Borders
    border: {
      primary: '#334155',        // cockpit.700
      secondary: '#475569',      // cockpit.600
      focus: '#00D4FF',          // quantum.500
      error: '#EF4444',          // hull.500
    },
    // Text
    text: {
      primary: '#F1F5F9',        // space.100
      secondary: '#94A3B8',      // space.400
      muted: '#64748B',          // space.500
      inverse: '#0A0E17',        // space.950
      link: '#3BA8FF',           // quantum.400
      linkHover: '#00D4FF',      // quantum.500
    },
    // Status colors
    status: {
      success: '#10B981',        // shield.500
      successBg: '#064E3B',      // shield.900
      warning: '#F59E0B',        // caution.500
      warningBg: '#78350F',      // caution.900
      danger: '#EF4444',         // hull.500
      dangerBg: '#7F1D1D',       // hull.900
      info: '#3BA8FF',           // quantum.400
      infoBg: '#002633',         // quantum.900
    },
    // Brand
    brand: {
      primary: '#00D4FF',        // quantum.500
      primaryHover: '#3BA8FF',   // quantum.400
      secondary: '#FF6B00',      // engine.500
      secondaryHover: '#FF8E23', // engine.400
    },
  },
} as const;

// Typography Scale
export const typography = {
  fontFamilies: {
    display: '"Orbitron", "Rajdhani", "JetBrains Mono", monospace',
    mono: '"JetBrains Mono", "Space Mono", "Fira Code", monospace',
    ui: '"Inter", "IBM Plex Sans", system-ui, sans-serif',
    body: '"Inter", "IBM Plex Sans", system-ui, sans-serif',
  },
  fontSizes: {
    xs: '0.625rem',    // 10px
    sm: '0.75rem',     // 12px
    base: '0.875rem',  // 14px
    lg: '1rem',        // 16px
    xl: '1.125rem',    // 18px
    '2xl': '1.25rem',  // 20px
    '3xl': '1.5rem',   // 24px
    '4xl': '1.875rem', // 30px
    '5xl': '2.25rem',  // 36px
    '6xl': '3rem',     // 48px
    '7xl': '3.75rem',  // 60px
  },
  fontWeights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeights: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// Spacing Scale (4px base)
export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  7: '1.75rem',   // 28px
  8: '2rem',      // 32px
  9: '2.25rem',   // 36px
  10: '2.5rem',   // 40px
  11: '2.75rem',  // 44px
  12: '3rem',     // 48px
  14: '3.5rem',   // 56px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  28: '7rem',     // 112px
  32: '8rem',     // 128px
} as const;

// Border Radius
export const borderRadius = {
  none: '0',
  sm: '0.25rem',    // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
  // Custom SC shapes
  panel: '0.75rem',       // 12px - Standard panel
  panelLg: '1rem',        // 16px - Large panel
  card: '1rem',           // 16px - Card
  button: '0.5rem',       // 8px - Button
  pill: '9999px',         // Pill
  hex: '0.5rem',          // 8px - Hexagon-ish
} as const;

// Shadows - Depth with quantum glow
export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  sm: '0 2px 4px 0 rgba(0, 0, 0, 0.4)',
  md: '0 4px 8px 0 rgba(0, 0, 0, 0.5)',
  lg: '0 8px 16px 0 rgba(0, 0, 0, 0.6)',
  xl: '0 16px 32px 0 rgba(0, 0, 0, 0.7)',
  '2xl': '0 32px 64px 0 rgba(0, 0, 0, 0.8)',
  // Quantum glow shadows
  quantum: {
    sm: '0 0 8px rgba(0, 212, 255, 0.15), 0 2px 4px rgba(0, 0, 0, 0.5)',
    md: '0 0 16px rgba(0, 212, 255, 0.2), 0 4px 8px rgba(0, 0, 0, 0.5)',
    lg: '0 0 32px rgba(0, 212, 255, 0.25), 0 8px 16px rgba(0, 0, 0, 0.6)',
    xl: '0 0 64px rgba(0, 212, 255, 0.3), 0 16px 32px rgba(0, 0, 0, 0.7)',
    pulse: '0 0 20px rgba(0, 212, 255, 0.4), 0 0 40px rgba(0, 212, 255, 0.2)',
  },
  engine: {
    sm: '0 0 8px rgba(255, 107, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.5)',
    md: '0 0 16px rgba(255, 107, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.5)',
    lg: '0 0 32px rgba(255, 107, 0, 0.25), 0 8px 16px rgba(0, 0, 0, 0.6)',
  },
  inner: {
    sm: 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.4)',
    lg: 'inset 0 4px 8px 0 rgba(0, 0, 0, 0.5)',
  },
} as const;

// Transitions - Smooth, sci-fi feel
export const transitions = {
  durations: {
    instant: '50ms',
    fast: '100ms',
    normal: '150ms',
    slow: '200ms',
    slower: '300ms',
    slowest: '500ms',
  },
  easings: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    // Custom SC easings
    quantum: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    engine: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
    shield: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    hull: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
  },
} as const;

// Z-Index Scale
export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  toast: 800,
  max: 9999,
} as const;

// Breakpoints
export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1920px',
} as const;

// Animation Keyframes (for CSS-in-JS or Tailwind)
export const keyframes = {
  // Quantum pulse
  quantumPulse: {
    '0%, 100%': { opacity: 1, transform: 'scale(1)' },
    '50%': { opacity: 0.7, transform: 'scale(1.02)' },
  },
  // Engine thrust
  engineThrust: {
    '0%': { transform: 'translateX(0) scaleX(1)', opacity: 1 },
    '50%': { transform: 'translateX(4px) scaleX(1.1)', opacity: 0.8 },
    '100%': { transform: 'translateX(0) scaleX(1)', opacity: 1 },
  },
  // Shield recharge
  shieldRecharge: {
    '0%': { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.4)' },
    '70%': { boxShadow: '0 0 0 16px rgba(16, 185, 129, 0)' },
    '100%': { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0)' },
  },
  // Hull damage flash
  hullDamage: {
    '0%, 100%': { backgroundColor: 'transparent' },
    '50%': { backgroundColor: 'rgba(239, 68, 68, 0.3)' },
  },
  // Scan line
  scanLine: {
    '0%': { transform: 'translateY(-100%)' },
    '100%': { transform: 'translateY(100vh)' },
  },
  // Float
  float: {
    '0%, 100%': { transform: 'translateY(0px)' },
    '50%': { transform: 'translateY(-8px)' },
  },
  // Spin
  spin: {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  },
  // Fade in/out
  fadeIn: {
    '0%': { opacity: 0 },
    '100%': { opacity: 1 },
  },
  fadeOut: {
    '0%': { opacity: 1 },
    '100%': { opacity: 0 },
  },
  // Slide up/down
  slideUp: {
    '0%': { opacity: 0, transform: 'translateY(16px)' },
    '100%': { opacity: 1, transform: 'translateY(0)' },
  },
  slideDown: {
    '0%': { opacity: 0, transform: 'translateY(-16px)' },
    '100%': { opacity: 1, transform: 'translateY(0)' },
  },
  // Scale in/out
  scaleIn: {
    '0%': { opacity: 0, transform: 'scale(0.9)' },
    '100%': { opacity: 1, transform: 'scale(1)' },
  },
  scaleOut: {
    '0%': { opacity: 1, transform: 'scale(1)' },
    '100%': { opacity: 0, transform: 'scale(0.9)' },
  },
} as const;

// Complete theme object
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  breakpoints,
  keyframes,
} as const;

export type Theme = typeof theme;
export type Colors = typeof colors;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type Shadows = typeof shadows;
export type Transitions = typeof transitions;
export type ZIndex = typeof zIndex;
export type Breakpoints = typeof breakpoints;
export type Keyframes = typeof keyframes;