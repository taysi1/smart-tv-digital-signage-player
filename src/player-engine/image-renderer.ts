import type { MediaItem } from "../core/domain/media";

export class ImageRenderer {
  render(container: HTMLElement, item: MediaItem): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      var duration = item.duration ?? 5000;

      container.innerHTML = "";

      var img = document.createElement("img");
      img.src = item.url;
      img.style.width = "100vw";
      img.style.height = "100vh";
      img.style.objectFit = "contain";
      img.style.background = "black";

      img.onload = function () {
        setTimeout(function () {
          resolve();
        }, duration);
      };

      img.onerror = function () {
        container.innerHTML =
          "<div class='screen'><h1>Image Load Failed</h1><p>" +
          item.url +
          "</p></div>";
        reject(new Error("Image failed: " + item.url));
      };

      container.appendChild(img);
    });
  }
}
