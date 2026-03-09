import type { MediaItem } from "../core/domain/media";

export class VideoRenderer {
  render(container: HTMLElement, item: MediaItem): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      container.innerHTML = "";

      var video = document.createElement("video");
      video.src = item.url;
      video.autoplay = true;
      video.muted = true;
      video.controls = false;
      video.playsInline = true;
      video.setAttribute("playsinline", "true");
      video.style.width = "100vw";
      video.style.height = "100vh";
      video.style.objectFit = "contain";
      video.style.background = "black";

      video.onended = function () {
        resolve();
      };

      video.onerror = function () {
        container.innerHTML =
          "<div class='screen'><h1>Video Load Failed</h1><p>" +
          item.url +
          "</p></div>";
        reject(new Error("Video failed: " + item.url));
      };

      container.appendChild(video);

      var playPromise = video.play();

      if (playPromise && typeof playPromise.then === "function") {
        playPromise.catch(function (error: unknown) {
          console.warn("[VideoRenderer] play interrupted", error);
          container.innerHTML =
            "<div class='screen'><h1>Video Play Failed</h1><p>" +
            item.url +
            "</p></div>";
          resolve();
        });
      }
    });
  }
}
