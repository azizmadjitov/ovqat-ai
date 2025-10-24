// Theme management for Dark/Light mode support
// Automatically follows system preferences

export type Theme = 'light' | 'dark';

const THEME_QUERY_PARAM = 'theme';

// Dark theme colors
const DARK_THEME = {
  '--label-primary': 'rgba(255, 255, 255, 1.00)',
  '--label-secondary': 'rgba(255, 255, 255, 0.56)',
  '--label-opposite': 'rgba(38, 38, 51, 1.00)',
  '--bg-base': 'rgba(14, 14, 16, 1.00)',
  '--bg-underlayer': 'rgba(0, 0, 0, 1.00)',
  '--bg-fill': 'rgba(39, 39, 43, 1.00)',
  '--bg-elevation': 'rgba(24, 24, 26, 1.00)',
  '--stroke-non-opaque': 'rgba(250, 250, 255, 0.08)',
  '--static-white': 'rgba(255, 255, 255, 1.00)',
  '--static-black': 'rgba(38, 38, 51, 1.00)',
};

// Light theme colors (default)
const LIGHT_THEME = {
  '--label-primary': 'rgba(38, 38, 51, 1.00)',
  '--label-secondary': 'rgba(51, 62, 77, 0.64)',
  '--label-opposite': 'rgba(255, 255, 255, 1.00)',
  '--bg-base': 'rgba(255, 255, 255, 1.00)',
  '--bg-underlayer': 'rgba(239, 241, 245, 1.00)',
  '--bg-fill': 'rgba(180, 184, 204, 0.14)',
  '--bg-elevation': 'rgba(255, 255, 255, 1.00)',
  '--stroke-non-opaque': 'rgba(180, 184, 204, 0.28)',
  '--static-white': 'rgba(255, 255, 255, 1.00)',
  '--static-black': 'rgba(38, 38, 51, 1.00)',
};

/**
 * Get the current theme from multiple sources (in order of priority):
 * 1. URL query parameter (?theme=dark or ?theme=light)
 * 2. System preference (prefers-color-scheme) - always up to date
 * 3. Default to 'light'
 */
export const getCurrentTheme = (): Theme => {
  // 1. Check URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const themeParam = urlParams.get(THEME_QUERY_PARAM);
  if (themeParam === 'dark' || themeParam === 'light') {
    return themeParam;
  }

  // 2. Check system preference (always prioritize current system theme)
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  // 3. Default to light
  return 'light';
};

/**
 * Apply theme to the document
 */
export const applyTheme = (theme: Theme): void => {
  const colors = theme === 'dark' ? DARK_THEME : LIGHT_THEME;
  
  // Apply CSS variables to root
  Object.entries(colors).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });

  // Add/remove dark class for Tailwind if needed
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  console.log(`✅ Theme applied: ${theme} (from system)`);
};

/**
 * Listen for system theme changes
 */
export const watchSystemTheme = (callback: (theme: Theme) => void): (() => void) => {
  if (!window.matchMedia) {
    return () => {};
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
    const theme = (('matches' in e ? e.matches : (e as MediaQueryList).matches)) ? 'dark' : 'light';
    console.log(`🎨 System theme changed to: ${theme}`);
    callback(theme);
  };

  // Modern browsers
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }

  // Older browsers
  mediaQuery.addListener(handleChange);
  return () => mediaQuery.removeListener(handleChange);
};

/**
 * Initialize theme system
 * Should be called once on app startup
 */
export const initializeTheme = (): void => {
  const theme = getCurrentTheme();
  applyTheme(theme);
  
  // Watch system theme changes and apply automatically
  watchSystemTheme(applyTheme);

  console.log(`🎨 Theme system initialized: ${theme} (following system)`);
};
