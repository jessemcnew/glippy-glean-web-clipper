// Chrome Extension API types for dashboard
// Allows dashboard to communicate with Glean Web Clipper extension

interface ChromeRuntime {
  sendMessage(
    extensionId: string | undefined,
    message: any,
    responseCallback?: (response: any) => void
  ): void
  id?: string
  lastError?: {
    message: string
  }
}

interface Chrome {
  runtime?: ChromeRuntime
}

declare const chrome: Chrome | undefined
