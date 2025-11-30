const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const getAudioDurationInSeconds = require("get-audio-duration").getAudioDurationInSeconds;
const path = require("path");
const Song = require("./models/Song.js");

const app = express();

// basic middleware
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// connect to database
mongoose
  .connect("mongodb://localhost:27017/")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// storage for upload route
const adminUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === "image") cb(null, "uploads/images");
      else cb(null, "uploads/songs");
    },
    filename: (_, file, cb) => cb(null, Date.now() + "-" + file.originalname)
  })
});

// upload new song
app.post("/admin/upload", adminUpload.fields([
  { name: "image", maxCount: 1 },
  { name: "audio", maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, artist } = req.body;

    const imageFile = req.files["image"][0];
    const audioFile = req.files["audio"][0];

    const audioPath = path.join(__dirname, audioFile.path);

    // calculate duration
    const seconds = await getAudioDurationInSeconds(audioPath);
    const minutes = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60).toString().padStart(2, "0");
    const duration = `${minutes}:${sec}`;

    // save in db
    const song = new Song({
      title,
      artist,
      image: `/uploads/images/${imageFile.filename}`,
      audio: `/uploads/songs/${audioFile.filename}`,
      duration
    });

    await song.save();

    res.send(`
      <h3>Song Uploaded Successfully</h3>
      <p><a href="/admin.html">Upload Another</a></p>
    `);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error uploading song");
  }
});

// get all songs
app.get("/api/songs", async (_, res) => {
  const songs = await Song.find();
  res.json(songs);
});

// update title and artist only
app.put("/admin/update/:id", async (req, res) => {
  try {
    const { title, artist } = req.body;

    await Song.findByIdAndUpdate(req.params.id, {
      title,
      artist
    });

    res.json({ message: "Song updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating song" });
  }
});

// storage for update image/audio
const updateUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === "image") cb(null, "uploads/images");
      else cb(null, "uploads/songs");
    },
    filename: (_, file, cb) => cb(null, Date.now() + "-" + file.originalname)
  })
});

// update only image
app.put("/admin/update-image/:id", updateUpload.single("image"), async (req, res) => {
  try {
    const img = req.file;

    await Song.findByIdAndUpdate(req.params.id, {
      image: `/uploads/images/${img.filename}`
    });

    res.json({ message: "Image updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating image" });
  }
});

// update only audio
app.put("/admin/update-audio/:id", updateUpload.single("audio"), async (req, res) => {
  try {
    const audio = req.file;
    const audioPath = path.join(__dirname, audio.path);

    // calculate new duration
    const seconds = await getAudioDurationInSeconds(audioPath);
    const minutes = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60).toString().padStart(2, "0");

    await Song.findByIdAndUpdate(req.params.id, {
      audio: `/uploads/songs/${audio.filename}`,
      duration: `${minutes}:${sec}`
    });

    res.json({ message: "Audio updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating audio" });
  }
});

// full update (title, artist, image, audio)
app.put("/admin/update-full/:id", updateUpload.fields([
  { name: "image", maxCount: 1 },
  { name: "audio", maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, artist } = req.body;

    const data = { title, artist };

    // update image
    if (req.files["image"]) {
      const img = req.files["image"][0];
      data.image = `/uploads/images/${img.filename}`;
    }

    // update audio
    if (req.files["audio"]) {
      const audio = req.files["audio"][0];
      const audioPath = path.join(__dirname, audio.path);

      const seconds = await getAudioDurationInSeconds(audioPath);
      const minutes = Math.floor(seconds / 60);
      const sec = Math.floor(seconds % 60).toString().padStart(2, "0");

      data.audio = `/uploads/songs/${audio.filename}`;
      data.duration = `${minutes}:${sec}`;
    }

    await Song.findByIdAndUpdate(req.params.id, data);

    res.json({ message: "Song updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating song" });
  }
});

// delete song
app.delete("/admin/delete/:id", async (req, res) => {
  try {
    await Song.findByIdAndDelete(req.params.id);
    res.json({ message: "Song deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting song" });
  }
});

// start server
app.listen(5000, () => console.log("Server running on http://localhost:5000"));
