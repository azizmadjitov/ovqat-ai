# Native App Integration Guide

## Overview
Ovqat AI WebView uses browser history for navigation. The native app only needs to:
1. Listen for `canGoBack` status
2. Show Back or Close button accordingly
3. Call `history.back()` when Back is pressed
4. (Optional) Handle haptic feedback requests

## Implementation (Super Simple)

### 1. Listen for Navigation Changes

The WebView sends messages with this format:
```json
{
  "type": "NAVIGATION_CHANGED",
  "canGoBack": true,  // or false
  "currentScreen": "HOME",
  "stack": ["HOME", "RESULT"]
}
```

### 2. Update Navbar

```swift
// iOS Example
func handleWebViewMessage(_ message: [String: Any]) {
    if message["type"] as? String == "NAVIGATION_CHANGED" {
        let canGoBack = message["canGoBack"] as? Bool ?? false
        
        if canGoBack {
            // Show Back button (chevron)
            navigationItem.leftBarButtonItem = backButton
        } else {
            // Show Close button
            navigationItem.leftBarButtonItem = closeButton
        }
    }
}
```

```kotlin
// Android Example
webView.addJavascriptInterface(object : Any() {
    @JavascriptInterface
    fun postMessage(json: String) {
        val data = JSONObject(json)
        if (data.getString("type") == "NAVIGATION_CHANGED") {
            val canGoBack = data.getBoolean("canGoBack")
            
            runOnUiThread {
                if (canGoBack) {
                    // Show back button
                    supportActionBar?.setDisplayHomeAsUpEnabled(true)
                } else {
                    // Show close button
                    supportActionBar?.setDisplayHomeAsUpEnabled(false)
                }
            }
        }
    }
}, "ReactNativeWebView")
```

### 3. Handle Back Button Press

When user presses Back button, just call browser's back:

```swift
// iOS
@objc func backButtonPressed() {
    webView.evaluateJavaScript("history.back()")
}
```

```kotlin
// Android
override fun onOptionsItemSelected(item: MenuItem): Boolean {
    if (item.itemId == android.R.id.home) {
        webView.evaluateJavaScript("history.back()", null)
        return true
    }
    return super.onOptionsItemSelected(item)
}

// Also handle system back button
override fun onBackPressed() {
    webView.evaluateJavaScript("history.back()", null)
}
```

### 4. Handle Close Button

When `canGoBack` is false and user presses Close:
```swift
// iOS
@objc func closeButtonPressed() {
    dismiss(animated: true)
}
```

```kotlin
// Android
finish()
```

## 5. Handle Theme Changes

When user changes theme in your app, send it to WebView:

```swift
// iOS
let themeData = ["type": "THEME_CHANGE", "theme": isDarkMode ? "dark" : "light"]
let jsonData = try! JSONSerialization.data(withJSONObject: themeData)
let jsonString = String(data: jsonData, encoding: .utf8)!
webView.evaluateJavaScript("window.postMessage(\(jsonString), '*')")
```

```kotlin
// Android
val theme = if (isDarkMode) "dark" else "light"
webView.evaluateJavaScript("window.postMessage({type:'THEME_CHANGE',theme:'$theme'},'*')", null)
```

### Respond to Theme Requests

WebView will ask for current theme when it becomes visible:

```swift
// iOS - Listen for REQUEST_THEME
func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
    if message.name == "REQUEST_THEME" {
        let theme = isDarkMode ? "dark" : "light"
        sendThemeToWebView(theme)
    }
}
```

```kotlin
// Android - Listen for REQUEST_THEME
webView.addJavascriptInterface(object : Any() {
    @JavascriptInterface
    fun postMessage(json: String) {
        val data = JSONObject(json)
        if (data.getString("type") == "REQUEST_THEME") {
            val theme = if (isDarkMode) "dark" else "light"
            sendThemeToWebView(theme)
        }
    }
}, "ReactNativeWebView")
```

## That's It!

No complex routing, no message passing for back navigation. The WebView handles everything internally using browser history.

## Testing Scenarios

1. **Home → Result → Done**
   - On Result: `canGoBack = true` → Show Back
   - After Done: `canGoBack = false` → Show Close
   - Back button should NOT return to Result (we use replace)

2. **Questionnaire Steps**
   - Each step: `canGoBack = true` → Show Back
   - Back button navigates to previous step

3. **System Back Button (Android)**
   - Should work the same as navbar Back button
   - Calls `history.back()` in WebView

## Haptic Feedback (Optional)

The WebView may request haptic feedback for better UX:

```json
{
  "type": "HAPTIC_FEEDBACK",
  "style": "selection"  // light, medium, heavy, selection, success, warning, error
}
```

### iOS Implementation

```swift
func handleWebViewMessage(_ message: [String: Any]) {
    if message["type"] as? String == "HAPTIC_FEEDBACK" {
        let style = message["style"] as? String ?? "light"
        
        switch style {
        case "light":
            let generator = UIImpactFeedbackGenerator(style: .light)
            generator.impactOccurred()
        case "medium":
            let generator = UIImpactFeedbackGenerator(style: .medium)
            generator.impactOccurred()
        case "heavy":
            let generator = UIImpactFeedbackGenerator(style: .heavy)
            generator.impactOccurred()
        case "selection":
            let generator = UISelectionFeedbackGenerator()
            generator.selectionChanged()
        case "success":
            let generator = UINotificationFeedbackGenerator()
            generator.notificationOccurred(.success)
        case "warning":
            let generator = UINotificationFeedbackGenerator()
            generator.notificationOccurred(.warning)
        case "error":
            let generator = UINotificationFeedbackGenerator()
            generator.notificationOccurred(.error)
        default:
            break
        }
    }
}
```

### Android Implementation

```kotlin
fun handleWebViewMessage(json: String) {
    val data = JSONObject(json)
    if (data.getString("type") == "HAPTIC_FEEDBACK") {
        val style = data.optString("style", "light")
        val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        
        when (style) {
            "light" -> vibrator.vibrate(VibrationEffect.createOneShot(10, VibrationEffect.DEFAULT_AMPLITUDE))
            "medium" -> vibrator.vibrate(VibrationEffect.createOneShot(20, VibrationEffect.DEFAULT_AMPLITUDE))
            "heavy" -> vibrator.vibrate(VibrationEffect.createOneShot(30, VibrationEffect.DEFAULT_AMPLITUDE))
            "selection" -> vibrator.vibrate(VibrationEffect.createOneShot(10, VibrationEffect.DEFAULT_AMPLITUDE))
            "success" -> vibrator.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 10, 50, 10), -1))
            "warning" -> vibrator.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 10, 100, 10), -1))
            "error" -> vibrator.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 10, 50, 10, 50, 10), -1))
        }
    }
}
```

**Note:** Haptic feedback also works via browser Vibration API on supported devices, so native implementation is optional.

## Debug

Check browser console for navigation logs:
```
📍 Navigation: HOME → RESULT
🔔 Notifying native app: canGoBack=true, screen=RESULT
📍 History back: navigating to HOME
```
