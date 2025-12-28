const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const getAudioDurationInSeconds = require("get-audio-duration").getAudioDurationInSeconds;
const path = require("path");
const Song = require("./models/Song.js");
const User = require("./models/user.js");


const app = express();

// basic middleware
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// ---------- MULTER STORAGE (IMAGE + AUDIO) ----------
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

// ---------- ADD NEW SONG ----------
app.post("/admin/upload", upload.fields([
  { name: "image", maxCount: 1 },
  { name: "audio", maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, artist } = req.body;

    const imageFile = req.files["image"][0];
    const audioFile = req.files["audio"][0];

    const audioPath = path.join(__dirname, audioFile.path);

    // calculate audio duration
    const seconds = await getAudioDurationInSeconds(audioPath);
    const minutes = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60).toString().padStart(2, "0");
    const duration = `${minutes}:${sec}`;

    // save to database
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
    res.status(500).json({ message: "Error uploading song" });
  }
});

// ---------- GET ALL SONGS ----------
app.get("/api/songs", async (req, res) => {
  const songs = await Song.find();
  res.json(songs);
});

// ---------- FULL UPDATE ----------
app.put("/admin/update-full/:id", upload.fields([
  { name: "image", maxCount: 1 },
  { name: "audio", maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, artist } = req.body;

    const data = { title, artist };

    // update image if new one uploaded
    if (req.files["image"]) {
      const img = req.files["image"][0];
      data.image = `/uploads/images/${img.filename}`;
    }

    // update audio if new one uploaded
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

// ---------- DELETE SONG ----------
app.delete("/admin/delete/:id", async (req, res) => {
  try {
    await Song.findByIdAndDelete(req.params.id);
    res.json({ message: "Song deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting song" });
  }
});



// ---------- USER REGISTRATION (EXAMPLE) ----------
app.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const user = new User({
    username,
    email,
    password,
    likedSongs: [],
    playlists: []
  });

  await user.save();
  res.json({ message: "User registered successfully" });
});
// ---------- USER LOGIN (EXAMPLE) ----------
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, password });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  res.json({
    message: "Login successful",
    userId: user._id,
    username: user.username,
    email: user.email
  });
});

//liked songs
app.post("/api/like", async (req, res) => {
  const { userId, songId } = req.body;

  await User.findByIdAndUpdate(
    userId,
    { $addToSet: { likedSongs: songId } }
  );

  res.json({ message: "Song liked" });
});
app.post("/api/unlike", async (req, res) => {
  const { userId, songId } = req.body;

  await User.findByIdAndUpdate(
    userId,
    { $pull: { likedSongs: songId } }
  );    

  res.json({ message: "Song unliked" });
});
//get liked songs
app.get("/api/likes/:userId", async (req, res) => {
  const user = await User.findById(req.params.userId)
    .populate("likedSongs");

  res.json(user.likedSongs);
});
// create playlist
app.post("/api/playlist/create", async (req, res) => {
  const { userId, name } = req.body;

  await User.findByIdAndUpdate(userId, {
    $push: { playlists: { name, songs: [] } }
  });

  res.json({ message: "Playlist created" });
});
// add song to playlist
app.post("/api/playlist/add", async (req, res) => {
  const { userId, playlistName, songId } = req.body;

  await User.updateOne(
    { _id: userId, "playlists.name": playlistName },
    { $addToSet: { "playlists.$.songs": songId } }
  );

  res.json({ message: "Song added to playlist" });
});
// get playlists
app.get("/api/playlists/:userId", async (req, res) => {
  const user = await User.findById(req.params.userId)
    .populate("playlists.songs");

  res.json(user.playlists);
});
// remove song from playlist
app.post("/api/playlist/remove", async (req, res) => {
  const { userId, playlistName, songId } = req.body;  
  await User.updateOne(
    { _id: userId, "playlists.name": playlistName },
    { $pull: { "playlists.$.songs": songId } }
  );  
  res.json({ message: "Song removed from playlist" });
});

//search songs
app.get("/api/search", async (req, res) => {
  const query = req.query.q;

  const songs = await Song.find({
    title: { $regex: query, $options: "i" }
  });

  res.json(songs);
});

// ---------- START SERVER ----------
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});