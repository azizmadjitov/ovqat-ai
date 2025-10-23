// Native event listeners for communication with native app

import { navigationManager } from './navigationManager';

export type NativeEventCallback = (data: any) => void;

class NativeEventManager {
  private listeners: Map<string, NativeEventCallback[]> = new Map();
  private isInitialized = false;

  /**
   * Initialize native event listeners
   */
  initialize(): void {
    if (this.isInitialized) {
      console.log('⚠️ Native events already initialized');
      return;
    }

    console.log('🔌 Initializing native event listeners');

    window.addEventListener('message', (event) => {
      this.handleMessage(event);
    });

    // Expose global bridge for WKWebView and other hosts without window.postMessage plumbing
    (window as any).OvqatNative = {
      postMessage: (data: any) => this.receiveFromNative(data),
    };

    this.isInitialized = true;
    console.log('✅ Native events initialized');
  }

  /**
   * Handle messages from native app
   */
  private handleMessage(event: MessageEvent): void {
    const data = event.data;

    if (!data || !data.type) {
      return;
    }

    console.log(`📨 Received message from native app:`, data.type, data);

    // Handle BACK_PRESSED event
    if (data.type === 'BACK_PRESSED') {
      this.handleBackPressed();
      return;
    }

    // Handle THEME_CHANGE event
    if (data.type === 'THEME_CHANGE') {
      this.emit('THEME_CHANGE', data);
      return;
    }

    // Emit custom events
    this.emit(data.type, data);
  }

  /**
   * Public bridge for native apps to push messages into the web app.
   * Example (iOS WKWebView): webView.evaluateJavaScript("window.OvqatNative.postMessage({type:'THEME_CHANGE', theme:'dark'})")
   */
  receiveFromNative(data: any): void {
    if (!data || !data.type) return;
    this.emit(data.type, data);
  }

  /**
   * Handle back button press from native navbar
   */
  private handleBackPressed(): void {
    console.log('👈 Back button pressed in native navbar');
    const canGoBack = navigationManager.pop();

    if (!canGoBack) {
      console.log('❌ No previous screen - WebView will be closed by native app');
    }
  }

  /**
   * Subscribe to native events
   */
  on(eventType: string, callback: NativeEventCallback): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    this.listeners.get(eventType)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        this.listeners.set(
          eventType,
          callbacks.filter((cb) => cb !== callback)
        );
      }
    };
  }

  /**
   * Emit event to all listeners
   */
  private emit(eventType: string, data: any): void {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Send message to native app
   */
  sendToNative(data: any): void {
    console.log('📤 Sending message to native app:', data.type, data);
    window.postMessage(data, '*');
  }
}

// Singleton instance
export const nativeEventManager = new NativeEventManager();

/**
 * Initialize native events (call once on app startup)
 */
export const initializeNativeEvents = (): void => {
  nativeEventManager.initialize();
};
