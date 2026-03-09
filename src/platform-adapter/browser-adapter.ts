import type { PlatformAdapter, ScreenshotResult } from "./platform-adapter";

export class BrowserAdapter implements PlatformAdapter {
  private visibilityHandler: ((visible: boolean) => void) | null;
  private boundListener: (() => void) | null;

  constructor() {
    this.visibilityHandler = null;
    this.boundListener = null;
  }

  getPlatformName(): string {
    return "browser";
  }

  getDeviceId(): string {
    return "browser-device";
  }

  init(): Promise<void> {
    console.log("[BrowserAdapter] init");
    return Promise.resolve();
  }

  restartApp(): Promise<void> {
    window.location.reload();
    return Promise.resolve();
  }

  setVolume(value: number): Promise<void> {
    console.log("[BrowserAdapter] setVolume", value);
    return Promise.resolve();
  }

  captureScreenshot(): Promise<ScreenshotResult> {
    return Promise.resolve({
      format: "image/png",
      base64: "MOCK_BASE64_SCREENSHOT_DATA",
    });
  }

  onVisibilityChange(handler: (visible: boolean) => void): void {
    this.visibilityHandler = handler;

    this.boundListener = () => {
      var visible = document.visibilityState === "visible";
      if (this.visibilityHandler) {
        this.visibilityHandler(visible);
      }
    };

    document.addEventListener("visibilitychange", this.boundListener);
  }

  dispose(): void {
    if (this.boundListener) {
      document.removeEventListener("visibilitychange", this.boundListener);
      this.boundListener = null;
    }

    this.visibilityHandler = null;
  }
}
