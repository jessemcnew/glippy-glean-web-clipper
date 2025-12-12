// Chrome Extension API types for dashboard
// Allows dashboard to communicate with Glean Web Clipper extension

interface ChromeRuntime {
  sendMessage(message: any, responseCallback?: (response: any) => void): void
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

interface ChromeStorageLocal {
  get(keys: string | string[]): Promise<Record<string, any>>
  set(items: Record<string, any>): Promise<void>
}

interface ChromeStorage {
  local?: ChromeStorageLocal
}

interface Chrome {
  runtime?: ChromeRuntime
  storage?: ChromeStorage
}

declare const chrome: Chrome | undefined
