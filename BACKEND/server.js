const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const bcrypt = require("bcrypt");
const path = require("path");
const getAudioDurationInSeconds =
  require("get-audio-duration").getAudioDurationInSeconds;

const Song = require("./models/Song");
const User = require("./models/user");

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔒 Disable automatic index.html
app.use(express.static("public", { index: false }));

app.use("/uploads", express.static("uploads"));

/* ================= ROUTES ================= */

// Always go to login first
app.get("/", (req, res) => {
  res.redirect("/login.html");
});

// Serve index.html manually
app.get("/index.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ================= MONGODB ================= */
mongoose
  .connect("mongodb://127.0.0.1:27017/test")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));


/* ================= MULTER ================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "image") cb(null, "uploads/images");
    else cb(null, "uploads/songs");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

/* ================= SONG ROUTES ================= */

// ADD SONG
app.post(
  "/admin/upload",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "audio", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { title, artist } = req.body;
      const imageFile = req.files.image[0];
      const audioFile = req.files.audio[0];

      const audioPath = path.join(__dirname, audioFile.path);
      const seconds = await getAudioDurationInSeconds(audioPath);

      const duration = `${Math.floor(seconds / 60)}:${Math.floor(
        seconds % 60
      ).toString().padStart(2, "0")}`;

      const song = new Song({
        title,
        artist,
        image: `/uploads/images/${imageFile.filename}`,
        audio: `/uploads/songs/${audioFile.filename}`,
        duration
      });

      await song.save();
      res.json({ message: "Song added successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Upload failed" });
    }
  }
);

// GET SONGS
app.get("/api/songs", async (req, res) => {
  const songs = await Song.find();
  res.json(songs);
});

// UPDATE SONG
app.put(
  "/admin/update-full/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "audio", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const data = {
        title: req.body.title,
        artist: req.body.artist
      };

      if (req.files.image) {
        data.image = `/uploads/images/${req.files.image[0].filename}`;
      }

      if (req.files.audio) {
        const audio = req.files.audio[0];
        const seconds = await getAudioDurationInSeconds(
          path.join(__dirname, audio.path)
        );
        data.audio = `/uploads/songs/${audio.filename}`;
        data.duration = `${Math.floor(seconds / 60)}:${Math.floor(
          seconds % 60
        ).toString().padStart(2, "0")}`;
      }

      await Song.findByIdAndUpdate(req.params.id, data);
      res.json({ message: "Song updated" });
    } catch (err) {
      res.status(500).json({ message: "Update failed" });
    }
  }
);

// DELETE SONG
app.delete("/admin/delete/:id", async (req, res) => {
  await Song.findByIdAndDelete(req.params.id);
  res.json({ message: "Song deleted" });
});

/* ================= AUTH ================= */

// REGISTER
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "User exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      likedSongs: [],
      playlists: []
    });

    await user.save();
    res.json({ message: "Registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Register failed" });
  }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid login" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid login" });

    res.json({
      userId: user._id,
      username: user.username,
      email: user.email
    });
  } catch (err) {
    res.status(500).json({ message: "Login error" });
  }
});

/* ================= LIKES ================= */

app.post("/api/like", async (req, res) => {
  await User.findByIdAndUpdate(req.body.userId, {
    $addToSet: { likedSongs: req.body.songId }
  });
  res.json({ message: "Liked" });
});

app.post("/api/unlike", async (req, res) => {
  await User.findByIdAndUpdate(req.body.userId, {
    $pull: { likedSongs: req.body.songId }
  });
  res.json({ message: "Unliked" });
});

app.get("/api/likes/:userId", async (req, res) => {
  const user = await User.findById(req.params.userId).populate("likedSongs");
  res.json(user ? user.likedSongs : []);
});

/* ================= PLAYLIST ================= */

app.post("/api/playlist/create", async (req, res) => {
  const user = await User.findById(req.body.userId);
  if (user.playlists.some(p => p.name === req.body.name)) {
    return res.json({ message: "Playlist exists" });
  }
  user.playlists.push({ name: req.body.name, songs: [] });
  await user.save();
  res.json({ message: "Playlist created" });
});

app.post("/api/playlist/add", async (req, res) => {
  const user = await User.findById(req.body.userId);
  let playlist = user.playlists.find(p => p.name === req.body.playlistName);

  if (!playlist) {
    user.playlists.push({
      name: req.body.playlistName,
      songs: [req.body.songId]
    });
  } else if (!playlist.songs.includes(req.body.songId)) {
    playlist.songs.push(req.body.songId);
  }

  await user.save();
  res.json({ message: "Added to playlist" });
});

app.post("/api/playlist/remove", async (req, res) => {
  await User.updateOne(
    { _id: req.body.userId, "playlists.name": req.body.playlistName },
    { $pull: { "playlists.$.songs": req.body.songId } }
  );
  res.json({ message: "Removed from playlist" });
});

app.get("/api/playlists/:userId", async (req, res) => {
  const user = await User.findById(req.params.userId).populate(
    "playlists.songs"
  );
  res.json(user ? user.playlists : []);
});

/* ================= SEARCH ================= */
app.get("/api/search", async (req, res) => {
  const songs = await Song.find({
    title: { $regex: req.query.q, $options: "i" }
  });
  res.json(songs);
});

/* ================= SERVER ================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

app.get("/favicon.ico", (req, res) => res.status(204));
