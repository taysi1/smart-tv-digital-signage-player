const express = require("express");
const app = express();
const port = 3000;

app.get("/playlist.json", (req, res) => {
  res.json({
    version: "1.0.0",
    hash: "playlist-hash-v100",
    playlist: [
      {
        type: "image",
        url: "http://192.168.1.103:3000/assets/image1.jpg",
        duration: 10,
      },
      {
        type: "image",
        url: "http://192.168.1.103:3000/assets/image2.jpg",
        duration: 8,
      },
      {
        type: "video",
        url: "http://192.168.1.103:3000/assets/video1.mp4",
      },
    ],
  });
});

app.use("/assets", express.static("assets"));

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});
