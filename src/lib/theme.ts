// Theme management for Dark/Light mode support
// Supports system preferences and parent app theme settings

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'ovqat-theme';
const THEME_QUERY_PARAM = 'theme';

// Dark theme colors
const DARK_THEME = {
  '--label-primary': 'rgba(255, 255, 255, 1.00)',
  '--label-secondary': 'rgba(200, 200, 200, 0.64)',
  '--label-opposite': 'rgba(38, 38, 51, 1.00)',
  '--bg-base': 'rgba(20, 20, 30, 1.00)',
  '--bg-underlayer': 'rgba(30, 30, 45, 1.00)',
  '--bg-fill': 'rgba(100, 100, 120, 0.14)',
  '--bg-elevation': 'rgba(30, 30, 45, 1.00)',
  '--stroke-non-opaque': 'rgba(100, 100, 120, 0.28)',
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
 * 2. Parent app message (via postMessage)
 * 3. System preference (prefers-color-scheme)
 * 4. localStorage
 * 5. Default to 'light'
 */
export const getCurrentTheme = (): Theme => {
  // 1. Check URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const themeParam = urlParams.get(THEME_QUERY_PARAM);
  if (themeParam === 'dark' || themeParam === 'light') {
    return themeParam;
  }

  // 2. Check localStorage
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme;
  }

  // 3. Check system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  // 4. Default to light
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

  // Save to localStorage
  localStorage.setItem(THEME_STORAGE_KEY, theme);

  // Add/remove dark class for Tailwind if needed
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  console.log(`✅ Theme applied: ${theme}`);
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
    const theme = e.matches ? 'dark' : 'light';
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
 * Listen for parent app theme changes via postMessage
 * Parent app should send: { type: 'THEME_CHANGE', theme: 'dark' | 'light' }
 */
export const listenForParentTheme = (callback: (theme: Theme) => void): (() => void) => {
  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === 'THEME_CHANGE') {
      const theme = event.data.theme;
      if (theme === 'dark' || theme === 'light') {
        callback(theme);
      }
    }
  };

  window.addEventListener('message', handleMessage);
  
  return () => window.removeEventListener('message', handleMessage);
};

/**
 * Initialize theme system
 * Should be called once on app startup
 */
export const initializeTheme = (): void => {
  const theme = getCurrentTheme();
  applyTheme(theme);

  // Watch for system theme changes (only if no URL param or localStorage)
  const urlParams = new URLSearchParams(window.location.search);
  const hasThemeParam = urlParams.has(THEME_QUERY_PARAM);
  const hasStoredTheme = localStorage.getItem(THEME_STORAGE_KEY);

  if (!hasThemeParam && !hasStoredTheme) {
    watchSystemTheme((newTheme) => {
      applyTheme(newTheme);
    });
  }

  // Listen for parent app theme changes
  listenForParentTheme((newTheme) => {
    applyTheme(newTheme);
  });

  console.log(`🎨 Theme system initialized with theme: ${theme}`);
};
