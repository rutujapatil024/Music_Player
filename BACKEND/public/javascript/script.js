let allMusic = [];
let musicIndex = 1;

// MAIN ELEMENTS
const wrapper = document.querySelector(".wrapper");
const musicImg = wrapper.querySelector(".img-area img");
const musicName = wrapper.querySelector(".song-details .name");
const musicArtist = wrapper.querySelector(".song-details .artist");
const mainAudio = wrapper.querySelector("#main-audio");

const playPauseBtn = wrapper.querySelector(".play-pause");
const prevBtn = wrapper.querySelector("#prev");
const nextBtn = wrapper.querySelector("#next");
const progressArea = wrapper.querySelector(".progress-area");
const progressBar = wrapper.querySelector(".progress-bar");
const musicList = wrapper.querySelector(".music-list");

const showMoreBtn = wrapper.querySelector("#more-music");
const hideMusicBtn = musicList.querySelector("#close");
const repeatBtn = wrapper.querySelector("#repeat-plist");

const likeBtn = wrapper.querySelector("#like");
const addToListBtn = wrapper.querySelector("#addtoplist");

// ---------------- LOAD SONGS ----------------
async function loadSongsFromBackend() {
  const res = await fetch("/api/songs");
  const songs = await res.json();

  // keep MongoDB _id
  allMusic = songs.map(s => ({
    id: s._id,
    title: s.title,
    artist: s.artist,
    image: s.image,
    audio: s.audio,
    duration: s.duration
  }));
}

// ---------------- PAGE LOAD ----------------
window.addEventListener("load", async () => {
  loadUserProfile();
  await loadSongsFromBackend();

  if (allMusic.length === 0) return;

  musicIndex = Math.floor(Math.random() * allMusic.length) + 1;
  loadMusic(musicIndex);
  generatePlaylist();
  playingNow();
  updateLikeIcon();
});

// ---------------- USER PROFILE ----------------
function loadUserProfile() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;

  document.getElementById("profileUsername").innerText = user.username;
  document.getElementById("profileEmail").innerText = user.email;
}

// ---------------- LOGOUT ----------------
function logout() {
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

// ---------------- LOAD MUSIC ----------------
function loadMusic(index) {
  const song = allMusic[index - 1];

  musicName.innerText = song.title;
  musicArtist.innerText = song.artist;
  musicImg.src = song.image;
  mainAudio.src = song.audio;

  updateLikeIcon();
}

// ---------------- PLAY / PAUSE ----------------
function playMusic() {
  wrapper.classList.add("paused");
  playPauseBtn.querySelector("i").innerText = "pause";
  mainAudio.play();
}

function pauseMusic() {
  wrapper.classList.remove("paused");
  playPauseBtn.querySelector("i").innerText = "play_arrow";
  mainAudio.pause();
}

playPauseBtn.addEventListener("click", () => {
  wrapper.classList.contains("paused") ? pauseMusic() : playMusic();
});

// ---------------- NEXT / PREV ----------------
nextBtn.addEventListener("click", () => {
  musicIndex++;
  if (musicIndex > allMusic.length) musicIndex = 1;
  loadMusic(musicIndex);
  playMusic();
  playingNow();
});

prevBtn.addEventListener("click", () => {
  musicIndex--;
  if (musicIndex < 1) musicIndex = allMusic.length;
  loadMusic(musicIndex);
  playMusic();
  playingNow();
});

// ---------------- LIKE BUTTON ----------------
likeBtn.addEventListener("click", async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    alert("Please login first");
    return;
  }

  const songId = allMusic[musicIndex - 1].id;

  const res = await fetch("/api/like", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: user.userId,
      songId
    })
  });

  const data = await res.json();
  alert(data.message);

  likeBtn.innerText = "favorite";
  loadLikedSongs();
});

// ---------------- UPDATE LIKE ICON ----------------
async function updateLikeIcon() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    likeBtn.innerText = "favorite_border";
    return;
  }

  const res = await fetch(`/api/likes/${user.userId}`);
  const likedSongs = await res.json();

  const currentSongId = allMusic[musicIndex - 1].id;
  const liked = likedSongs.some(s => s._id === currentSongId);

  likeBtn.innerText = liked ? "favorite" : "favorite_border";
}

// ---------------- PLAY FROM PROFILE ----------------
function playFromExternalList(song) {
  mainAudio.src = song.audio;
  musicImg.src = song.image;
  musicName.innerText = song.title;
  musicArtist.innerText = song.artist;
  playMusic();
}

// ---------------- LOAD LIKED SONGS ----------------
async function loadLikedSongs() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;

  const res = await fetch(`/api/likes/${user.userId}`);
  const songs = await res.json();

  const ul = document.getElementById("likedSongsList");
  ul.innerHTML = "";

  songs.forEach(song => {
    const li = document.createElement("li");
    li.innerText = `${song.title} - ${song.artist}`;
    li.onclick = () => playFromExternalList(song);
    ul.appendChild(li);
  });
}

// ---------------- ADD TO PLAYLIST ----------------
addToListBtn.addEventListener("click", async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    alert("Please login first");
    return;
  }

  const songId = allMusic[musicIndex - 1].id;

  const res = await fetch("/api/playlist/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: user.userId,
      playlistName: "My Playlist",
      songId
    })
  });

  const data = await res.json();
  alert(data.message);

  loadPlaylists();
});

// ---------------- PLAYLIST UI ----------------
showMoreBtn.addEventListener("click", () => musicList.classList.toggle("show"));
hideMusicBtn.addEventListener("click", () => showMoreBtn.click());

// ---------------- GENERATE PLAYLIST ----------------
function generatePlaylist() {
  const ul = wrapper.querySelector("ul");
  ul.innerHTML = "";

  allMusic.forEach((song, i) => {
    const li = document.createElement("li");
    li.setAttribute("li-index", i + 1);

    li.innerHTML = `
      <div class="row">
        <span>${song.title}</span>
        <p>${song.artist}</p>
      </div>
      <span>${song.duration}</span>
    `;

    li.onclick = () => {
      musicIndex = i + 1;
      loadMusic(musicIndex);
      playMusic();
      playingNow();
    };

    ul.appendChild(li);
  });
}

// ---------------- PLAYING NOW ----------------
function playingNow() {
  const lis = wrapper.querySelectorAll("ul li");

  lis.forEach(li => {
    li.classList.remove("playing");
    if (li.getAttribute("li-index") == musicIndex) {
      li.classList.add("playing");
    }
  });
}
