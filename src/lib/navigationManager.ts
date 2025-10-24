// Navigation manager for WebView in native app
// Manages screen stack and communicates with native navbar

import { Screen } from '../../types';

export class NavigationManager {
  private stack: Screen[] = [];
  private listeners: ((canGoBack: boolean) => void)[] = [];
  private screenChangeListeners: ((screen: Screen) => void)[] = [];

  constructor() {
    this.initializeStack();
    this.setupHistorySync();
  }

  /**
   * Initialize stack from current screen
   */
  private initializeStack() {
    // Start with Home screen
    this.stack = [Screen.Home];
    // Initialize browser history
    if (typeof window !== 'undefined' && window.history.state?.screen !== Screen.Home) {
      window.history.replaceState({ screen: Screen.Home }, '', '#/home');
    }
    this.notifyNative();
  }

  /**
   * Setup browser history synchronization
   */
  private setupHistorySync() {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('popstate', (event) => {
      const screen = event.state?.screen || Screen.Home;
      console.log(`📍 History back: navigating to ${screen}`);
      
      // Update stack to match history
      if (this.stack.length > 1) {
        this.stack.pop();
      }
      
      // Notify listeners about screen change
      this.screenChangeListeners.forEach(listener => listener(screen));
      this.notifyNative();
    });
  }

  /**
   * Push a new screen to the stack
   */
  push(screen: Screen): void {
    console.log(`📍 Navigation: ${this.getCurrentScreen()} → ${screen}`);
    this.stack.push(screen);
    
    // Sync with browser history
    if (typeof window !== 'undefined') {
      const path = this.getPathForScreen(screen);
      window.history.pushState({ screen }, '', path);
    }
    
    this.notifyNative();
  }

  /**
   * Replace current screen (no back to previous)
   */
  replace(screen: Screen): void {
    console.log(`📍 Navigation: ${this.getCurrentScreen()} ⇒ ${screen} (replace)`);
    
    if (this.stack.length > 0) {
      this.stack[this.stack.length - 1] = screen;
    } else {
      this.stack = [screen];
    }
    
    // Sync with browser history
    if (typeof window !== 'undefined') {
      const path = this.getPathForScreen(screen);
      window.history.replaceState({ screen }, '', path);
    }
    
    this.notifyNative();
  }

  /**
   * Get URL path for screen
   */
  private getPathForScreen(screen: Screen): string {
    const paths: Record<Screen, string> = {
      [Screen.Login]: '#/login',
      [Screen.Home]: '#/home',
      [Screen.Camera]: '#/camera',
      [Screen.Result]: '#/result',
      [Screen.Questionnaire]: '#/questionnaire',
      [Screen.Settings]: '#/settings',
    };
    return paths[screen] || '#/home';
  }

  /**
   * Pop to previous screen
   * Returns true if there's a previous screen, false if WebView should close
   */
  pop(): boolean {
    if (this.stack.length > 1) {
      const previousScreen = this.stack[this.stack.length - 2];
      console.log(`📍 Navigation: ${this.getCurrentScreen()} ← ${previousScreen}`);
      this.stack.pop();
      this.notifyNative();
      return true; // Successfully went back
    } else {
      console.log('📍 Navigation: No previous screen - closing WebView');
      this.closeWebView();
      return false; // Should close WebView
    }
  }

  /**
   * Get current screen
   */
  getCurrentScreen(): Screen {
    return this.stack[this.stack.length - 1] || Screen.Home;
  }

  /**
   * Check if we can go back
   */
  canGoBack(): boolean {
    return this.stack.length > 1;
  }

  /**
   * Get full stack (for debugging)
   */
  getStack(): Screen[] {
    return [...this.stack];
  }

  /**
   * Reset to home screen
   */
  reset(): void {
    console.log('📍 Navigation: Reset to Home');
    this.stack = [Screen.Home];
    this.notifyNative();
  }

  /**
   * Notify native app about navigation changes
   */
  private notifyNative(): void {
    const canGoBack = this.canGoBack();
    const currentScreen = this.getCurrentScreen();

    console.log(`🔔 Notifying native app: canGoBack=${canGoBack}, screen=${currentScreen}`);

    window.postMessage(
      {
        type: 'NAVIGATION_CHANGED',
        currentScreen,
        canGoBack,
        stack: this.stack,
      },
      '*'
    );

    // Notify local listeners
    this.listeners.forEach((listener) => listener(canGoBack));
  }

  /**
   * Request native app to close WebView
   */
  private closeWebView(): void {
    console.log('🔔 Requesting native app to close WebView');
    window.postMessage(
      {
        type: 'CLOSE_WEBVIEW',
      },
      '*'
    );
  }

  /**
   * Subscribe to navigation changes
   */
  subscribe(callback: (canGoBack: boolean) => void): () => void {
    this.listeners.push(callback);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  /**
   * Subscribe to screen changes (from history back/forward)
   */
  onScreenChange(callback: (screen: Screen) => void): () => void {
    this.screenChangeListeners.push(callback);
    // Return unsubscribe function
    return () => {
      this.screenChangeListeners = this.screenChangeListeners.filter((l) => l !== callback);
    };
  }
}

// Singleton instance
export const navigationManager = new NavigationManager();
