export interface ScreenshotResult {
  format: string;
  base64: string;
}

export interface PlatformAdapter {
  getPlatformName(): string;
  getDeviceId(): string;
  init(): Promise<void>;
  restartApp(): Promise<void>;
  setVolume?(value: number): Promise<void>;
  captureScreenshot?(): Promise<ScreenshotResult>;
  onVisibilityChange?(handler: (visible: boolean) => void): void;
  dispose?(): void;
}
