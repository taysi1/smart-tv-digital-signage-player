import { AppService } from "./services/app-service";
import { Logger } from "./infrastructure/logger";
import {
  ConsoleTransport,
  MockRemoteTransport,
} from "./infrastructure/log-transport";
import { BrowserAdapter } from "./platform-adapter/browser-adapter";
import { TizenAdapter } from "./platform-adapter/tizen-adapter";
import type { PlatformAdapter } from "./platform-adapter/platform-adapter";

function writeScreen(text: string): void {
  var app = document.getElementById("app");
  if (app) {
    app.innerHTML =
      "<div style='width:100vw;height:100vh;background:black;color:white;display:flex;align-items:center;justify-content:center;font-family:Arial,sans-serif;flex-direction:column;padding:20px;text-align:center;'>" +
      text +
      "</div>";
  }
}

window.onerror = function (message) {
  writeScreen("JS ERROR: " + String(message));
  return false;
};

function resolvePlatform(): PlatformAdapter {
  var isTizen =
    typeof window !== "undefined" &&
    typeof (window as Window & { tizen?: unknown }).tizen !== "undefined";

  if (isTizen) {
    return new TizenAdapter();
  }

  return new BrowserAdapter();
}

function bootstrap(): Promise<void> {
  writeScreen("BOOT JS STARTED");

  var logger = new Logger([
    new ConsoleTransport(),
    new MockRemoteTransport("https://mock-log-endpoint.local/logs"),
  ]);

  var platform = resolvePlatform();
  var appService = new AppService(platform, logger);

  return appService.start();
}

bootstrap().catch(function (error: unknown) {
  writeScreen(
    "BOOTSTRAP FAILED: " +
      (error instanceof Error ? error.message : String(error)),
  );
  console.error("Bootstrap failed", error);
});
