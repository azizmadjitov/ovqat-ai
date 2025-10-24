# WebView Navigation Guide: Native Back/Close Button Logic

> **Как реализовать правильную навигацию "Назад" и "Закрыть" в WebView**  
> Проверенное решение для iOS и Android мини-аппов

## 🎯 Проблема

В нативных приложениях с WebView нужно показывать разные кнопки в navbar:
- **"Назад" (←)** - когда можно вернуться на предыдущий экран
- **"Закрыть" (✕)** - когда это первый экран (закрыть WebView)

**Но как WebView сообщает нативному приложению, какую кнопку показывать?**

## ✅ Наше решение

### Архитектура

```
┌─────────────────────────────────────────────────┐
│  Native App (iOS/Android)                       │
│  ┌───────────────────────────────────────────┐  │
│  │  Navbar                                   │  │
│  │  [← Back] или [✕ Close]  ← слушает       │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │  WebView                                  │  │
│  │  ┌─────────────────────────────────────┐ │  │
│  │  │  React SPA                          │ │  │
│  │  │  • Browser History API              │ │  │
│  │  │  • NavigationManager                │ │  │
│  │  │  • postMessage → отправляет         │ │  │
│  │  └─────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Принцип работы

1. **WebView** управляет навигацией через Browser History API
2. При каждом изменении экрана отправляет `postMessage` нативному приложению
3. **Native App** слушает сообщения и показывает нужную кнопку
4. При нажатии кнопки вызывает `window.history.back()` в WebView

## 📱 Реализация

### 1. Frontend (React/TypeScript)

#### NavigationManager (Singleton)

```typescript
// src/lib/navigationManager.ts
import { Screen } from '../types';

export class NavigationManager {
  private stack: Screen[] = [];
  private screenChangeListeners: ((screen: Screen) => void)[] = [];

  constructor() {
    this.initializeStack();
    this.setupHistorySync();
  }

  /**
   * Инициализация стека с Home экраном
   */
  private initializeStack() {
    this.stack = [Screen.Home];
    if (typeof window !== 'undefined') {
      window.history.replaceState({ screen: Screen.Home }, '', '#/home');
    }
    this.notifyNative();
  }

  /**
   * Синхронизация с браузерной историей
   */
  private setupHistorySync() {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('popstate', (event) => {
      const screen = event.state?.screen || Screen.Home;
      console.log(`📍 History back: navigating to ${screen}`);
      
      // Обновляем стек
      if (this.stack.length > 1) {
        this.stack.pop();
      }
      
      // Уведомляем слушателей об изменении экрана
      this.screenChangeListeners.forEach(listener => listener(screen));
      this.notifyNative();
    });
  }

  /**
   * Переход на новый экран (добавляем в историю)
   */
  push(screen: Screen): void {
    console.log(`📍 Navigation: ${this.getCurrentScreen()} → ${screen}`);
    this.stack.push(screen);
    
    if (typeof window !== 'undefined') {
      const path = this.getPathForScreen(screen);
      window.history.pushState({ screen }, '', path);
    }
    
    this.notifyNative();
  }

  /**
   * Замена текущего экрана (без возможности вернуться)
   */
  replace(screen: Screen): void {
    console.log(`📍 Navigation: ${this.getCurrentScreen()} ⇒ ${screen} (replace)`);
    
    if (this.stack.length > 0) {
      this.stack[this.stack.length - 1] = screen;
    } else {
      this.stack = [screen];
    }
    
    if (typeof window !== 'undefined') {
      const path = this.getPathForScreen(screen);
      window.history.replaceState({ screen }, '', path);
    }
    
    // ВАЖНО: replaceState не триггерит popstate, поэтому вызываем вручную
    this.screenChangeListeners.forEach(listener => listener(screen));
    this.notifyNative();
  }

  /**
   * Можно ли вернуться назад?
   */
  canGoBack(): boolean {
    return this.stack.length > 1;
  }

  /**
   * Получить текущий экран
   */
  getCurrentScreen(): Screen {
    return this.stack[this.stack.length - 1] || Screen.Home;
  }

  /**
   * КЛЮЧЕВАЯ ФУНКЦИЯ: Уведомление нативного приложения
   */
  private notifyNative(): void {
    const canGoBack = this.canGoBack();
    const currentScreen = this.getCurrentScreen();

    console.log(`🔔 Notifying native: canGoBack=${canGoBack}, screen=${currentScreen}`);

    // Отправляем сообщение нативному приложению
    window.postMessage(
      {
        type: 'NAVIGATION_CHANGED',
        currentScreen,
        canGoBack,
        stackSize: this.stack.length
      },
      '*'
    );
  }

  /**
   * Подписка на изменения экрана
   */
  onScreenChange(callback: (screen: Screen) => void): () => void {
    this.screenChangeListeners.push(callback);
    return () => {
      const index = this.screenChangeListeners.indexOf(callback);
      if (index > -1) this.screenChangeListeners.splice(index, 1);
    };
  }

  private getPathForScreen(screen: Screen): string {
    const paths: Record<Screen, string> = {
      [Screen.Login]: '#/login',
      [Screen.Home]: '#/home',
      [Screen.Result]: '#/result',
      [Screen.Questionnaire]: '#/questionnaire',
      [Screen.Settings]: '#/settings',
    };
    return paths[screen] || '#/home';
  }
}

// Singleton экземпляр
export const navigationManager = new NavigationManager();
```

#### Использование в App.tsx

```typescript
// App.tsx
import { navigationManager } from './src/lib/navigationManager';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState(Screen.Home);

  // Подписываемся на изменения экрана
  useEffect(() => {
    const unsubscribe = navigationManager.onScreenChange((screen) => {
      console.log(`🔄 Screen changed: ${screen}`);
      setCurrentScreen(screen);
      
      // Очистка состояния при возврате на Home
      if (screen === Screen.Home) {
        setCapturedImage(null);
        setViewingMeal(null);
      }
    });
    
    return unsubscribe;
  }, []);

  // Навигация на новый экран
  const handleOpenCamera = () => {
    navigationManager.push(Screen.Camera);
    setCurrentScreen(Screen.Camera);
  };

  // Замена экрана (без возможности вернуться)
  const handleConfirmMeal = () => {
    navigationManager.replace(Screen.Home); // Back не вернёт на Result
    setCurrentScreen(Screen.Home);
  };

  return (
    <div>
      {currentScreen === Screen.Home && <HomeScreen />}
      {currentScreen === Screen.Camera && <CameraScreen />}
      {/* ... */}
    </div>
  );
};
```

### 2. Native App (iOS - Swift)

```swift
import WebKit

class WebViewController: UIViewController {
    var webView: WKWebView!
    var backButton: UIBarButtonItem!
    var closeButton: UIBarButtonItem!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        setupWebView()
        setupNavigationButtons()
        listenForNavigationChanges()
    }
    
    func setupWebView() {
        let config = WKWebViewConfiguration()
        webView = WKWebView(frame: view.bounds, configuration: config)
        view.addSubview(webView)
        
        // Загружаем WebApp
        if let url = URL(string: "https://your-app.vercel.app") {
            webView.load(URLRequest(url: url))
        }
    }
    
    func setupNavigationButtons() {
        // Кнопка "Назад"
        backButton = UIBarButtonItem(
            image: UIImage(systemName: "chevron.left"),
            style: .plain,
            target: self,
            action: #selector(handleBackPressed)
        )
        
        // Кнопка "Закрыть"
        closeButton = UIBarButtonItem(
            image: UIImage(systemName: "xmark"),
            style: .plain,
            target: self,
            action: #selector(handleClosePressed)
        )
        
        // По умолчанию показываем "Закрыть"
        navigationItem.leftBarButtonItem = closeButton
    }
    
    /**
     * КЛЮЧЕВАЯ ФУНКЦИЯ: Слушаем сообщения от WebView
     */
    func listenForNavigationChanges() {
        let script = """
        window.addEventListener('message', function(event) {
            if (event.data.type === 'NAVIGATION_CHANGED') {
                window.webkit.messageHandlers.navigationHandler.postMessage({
                    canGoBack: event.data.canGoBack,
                    currentScreen: event.data.currentScreen,
                    stackSize: event.data.stackSize
                });
            }
        });
        """
        
        let userScript = WKUserScript(
            source: script,
            injectionTime: .atDocumentEnd,
            forMainFrameOnly: true
        )
        
        webView.configuration.userContentController.addUserScript(userScript)
        webView.configuration.userContentController.add(
            self,
            name: "navigationHandler"
        )
    }
    
    /**
     * Обработка нажатия "Назад"
     */
    @objc func handleBackPressed() {
        print("👈 Back button pressed - calling window.history.back()")
        webView.evaluateJavaScript("window.history.back()") { result, error in
            if let error = error {
                print("❌ Error going back: \(error)")
            }
        }
    }
    
    /**
     * Обработка нажатия "Закрыть"
     */
    @objc func handleClosePressed() {
        print("✕ Close button pressed - dismissing WebView")
        dismiss(animated: true)
    }
}

// MARK: - WKScriptMessageHandler
extension WebViewController: WKScriptMessageHandler {
    /**
     * КЛЮЧЕВАЯ ФУНКЦИЯ: Получаем сообщения от WebView
     */
    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        guard message.name == "navigationHandler",
              let body = message.body as? [String: Any],
              let canGoBack = body["canGoBack"] as? Bool else {
            return
        }
        
        let currentScreen = body["currentScreen"] as? String ?? "unknown"
        let stackSize = body["stackSize"] as? Int ?? 0
        
        print("📱 Navigation changed: canGoBack=\(canGoBack), screen=\(currentScreen), stack=\(stackSize)")
        
        // Обновляем кнопку в navbar
        DispatchQueue.main.async {
            if canGoBack {
                self.navigationItem.leftBarButtonItem = self.backButton
                print("✅ Showing BACK button")
            } else {
                self.navigationItem.leftBarButtonItem = self.closeButton
                print("✅ Showing CLOSE button")
            }
        }
    }
}
```

### 3. Native App (Android - Kotlin)

```kotlin
import android.webkit.WebView
import android.webkit.JavascriptInterface
import androidx.appcompat.app.AppCompatActivity

class WebViewActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var toolbar: androidx.appcompat.widget.Toolbar
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_webview)
        
        setupToolbar()
        setupWebView()
    }
    
    private fun setupToolbar() {
        toolbar = findViewById(R.id.toolbar)
        setSupportActionBar(toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        
        // По умолчанию показываем "Закрыть"
        updateNavigationButton(canGoBack = false)
    }
    
    private fun setupWebView() {
        webView = findViewById(R.id.webView)
        webView.settings.javaScriptEnabled = true
        
        // Добавляем JavaScript интерфейс
        webView.addJavascriptInterface(
            NavigationBridge(),
            "AndroidBridge"
        )
        
        // Слушаем postMessage от WebView
        webView.evaluateJavascript("""
            window.addEventListener('message', function(event) {
                if (event.data.type === 'NAVIGATION_CHANGED') {
                    AndroidBridge.onNavigationChanged(
                        event.data.canGoBack,
                        event.data.currentScreen,
                        event.data.stackSize
                    );
                }
            });
        """.trimIndent(), null)
        
        webView.loadUrl("https://your-app.vercel.app")
    }
    
    /**
     * КЛЮЧЕВАЯ ФУНКЦИЯ: Обновление кнопки навигации
     */
    private fun updateNavigationButton(canGoBack: Boolean) {
        runOnUiThread {
            if (canGoBack) {
                // Показываем стрелку "Назад"
                toolbar.navigationIcon = getDrawable(R.drawable.ic_arrow_back)
                toolbar.setNavigationOnClickListener {
                    handleBackPressed()
                }
                println("✅ Showing BACK button")
            } else {
                // Показываем крестик "Закрыть"
                toolbar.navigationIcon = getDrawable(R.drawable.ic_close)
                toolbar.setNavigationOnClickListener {
                    handleClosePressed()
                }
                println("✅ Showing CLOSE button")
            }
        }
    }
    
    /**
     * Обработка нажатия "Назад"
     */
    private fun handleBackPressed() {
        println("👈 Back button pressed - calling window.history.back()")
        webView.evaluateJavascript("window.history.back()", null)
    }
    
    /**
     * Обработка нажатия "Закрыть"
     */
    private fun handleClosePressed() {
        println("✕ Close button pressed - finishing activity")
        finish()
    }
    
    /**
     * КЛЮЧЕВАЯ ФУНКЦИЯ: JavaScript Bridge
     */
    inner class NavigationBridge {
        @JavascriptInterface
        fun onNavigationChanged(canGoBack: Boolean, currentScreen: String, stackSize: Int) {
            println("📱 Navigation changed: canGoBack=$canGoBack, screen=$currentScreen, stack=$stackSize")
            updateNavigationButton(canGoBack)
        }
    }
}
```

## 🎯 Ключевые моменты

### 1. Browser History API - основа навигации
```typescript
// Добавить в историю
window.history.pushState({ screen: 'Result' }, '', '#/result');

// Заменить текущий экран
window.history.replaceState({ screen: 'Home' }, '', '#/home');

// Вернуться назад (вызывается из нативного приложения)
window.history.back();
```

### 2. postMessage - коммуникация с нативным приложением
```typescript
window.postMessage({
  type: 'NAVIGATION_CHANGED',
  canGoBack: true,  // ← КЛЮЧЕВОЕ ПОЛЕ
  currentScreen: 'Result',
  stackSize: 2
}, '*');
```

### 3. Логика кнопок
```
canGoBack === true  → Показать "Назад" (←)
canGoBack === false → Показать "Закрыть" (✕)
```

### 4. Обработка нажатия
```swift
// iOS
if canGoBack {
    webView.evaluateJavaScript("window.history.back()")
} else {
    dismiss(animated: true)
}
```

```kotlin
// Android
if (canGoBack) {
    webView.evaluateJavascript("window.history.back()", null)
} else {
    finish()
}
```

## 🔍 Отладка

### Логи в WebView (Chrome DevTools)
```javascript
console.log('📍 Navigation:', {
  canGoBack: navigationManager.canGoBack(),
  currentScreen: navigationManager.getCurrentScreen(),
  stackSize: navigationManager.getStack().length
});
```

### Логи в iOS (Xcode Console)
```
📱 Navigation changed: canGoBack=true, screen=Result, stack=2
✅ Showing BACK button
👈 Back button pressed - calling window.history.back()
```

### Логи в Android (Logcat)
```
📱 Navigation changed: canGoBack=false, screen=Home, stack=1
✅ Showing CLOSE button
✕ Close button pressed - finishing activity
```

## ⚡ Преимущества этого подхода

1. ✅ **Нативная навигация** - работает как обычное приложение
2. ✅ **Автоматическая синхронизация** - WebView сам сообщает о состоянии
3. ✅ **Нет костылей** - используем стандартный Browser History API
4. ✅ **Работает на iOS и Android** - универсальное решение
5. ✅ **Простая отладка** - понятные логи на всех уровнях
6. ✅ **Zero config** - нативное приложение просто слушает сообщения

## 🚨 Частые ошибки

### ❌ Ошибка 1: replaceState не триггерит popstate
```typescript
// НЕПРАВИЛЬНО
replace(screen: Screen): void {
  window.history.replaceState({ screen }, '', path);
  this.notifyNative(); // ← Забыли вызвать!
}

// ПРАВИЛЬНО
replace(screen: Screen): void {
  window.history.replaceState({ screen }, '', path);
  this.screenChangeListeners.forEach(listener => listener(screen));
  this.notifyNative(); // ← Вызываем вручную
}
```

### ❌ Ошибка 2: Дублирование очистки состояния
```typescript
// НЕПРАВИЛЬНО
handleConfirm() {
  setCapturedImage(null);  // Очистка вручную
  setViewingMeal(null);    // Очистка вручную
  navigationManager.replace(Screen.Home); // → onScreenChange → очистка снова!
}

// ПРАВИЛЬНО
handleConfirm() {
  // Состояние очистится автоматически в onScreenChange
  navigationManager.replace(Screen.Home);
}
```

### ❌ Ошибка 3: Прямое изменение currentScreen без navigationManager
```typescript
// НЕПРАВИЛЬНО
const handleBack = () => {
  setCurrentScreen(Screen.Home); // ← Стек не обновляется!
}

// ПРАВИЛЬНО
const handleBack = () => {
  window.history.back(); // ← Триггерит popstate → обновляет стек
}
```

## 📚 Дополнительные ресурсы

- [MDN: History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API)
- [MDN: Window.postMessage()](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
- [WKWebView Documentation](https://developer.apple.com/documentation/webkit/wkwebview)
- [Android WebView Guide](https://developer.android.com/develop/ui/views/layout/webapps/webview)

## 🤝 Вопросы?

Если что-то непонятно или нужна помощь с интеграцией:
1. Проверьте логи на всех уровнях (WebView, iOS, Android)
2. Убедитесь что `postMessage` отправляется при каждом изменении экрана
3. Проверьте что нативное приложение правильно слушает сообщения

---

**Проверено в production на iOS и Android** ✅
