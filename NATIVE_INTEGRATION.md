# Native App Integration Guide

## Overview
Ovqat AI WebView uses browser history for navigation. The native app only needs to:
1. Listen for `canGoBack` status
2. Show Back or Close button accordingly
3. Call `history.back()` when Back is pressed

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

## Debug

Check browser console for navigation logs:
```
📍 Navigation: HOME → RESULT
🔔 Notifying native app: canGoBack=true, screen=RESULT
📍 History back: navigating to HOME
```
