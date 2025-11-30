const mongoose = require("mongoose");

const SongSchema = new mongoose.Schema({
  title: String,
  artist: String,
  image: String,
  audio: String,
  duration: String, 
});

module.exports = mongoose.model("Song", SongSchema);
