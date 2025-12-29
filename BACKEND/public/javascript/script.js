let allMusic = [];
let musicIndex = 1;

/* ================= ELEMENTS ================= */
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

const likeBtn = document.getElementById("like");
const addToListBtn = document.getElementById("addtoplist");

/* ================= AUTH ================= */
function logout() {
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

/* ================= LOAD SONGS ================= */
async function loadSongsFromBackend() {
  const res = await fetch("/api/songs");
  const songs = await res.json();

  allMusic = songs.map(s => ({
    id: s._id,
    title: s.title,
    artist: s.artist,
    image: s.image,
    audio: s.audio,
    duration: s.duration
  }));
}

/* ================= PAGE LOAD ================= */
window.addEventListener("load", async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  loadUserProfile();
  await loadSongsFromBackend();

  if (!allMusic.length) return;

  musicIndex = 1;
  loadMusic(musicIndex);
  generatePlaylist();
  playingNow();
  updateLikeIcon();
});

/* ================= USER PROFILE ================= */
function loadUserProfile() {
  const user = JSON.parse(localStorage.getItem("user"));
  document.getElementById("profileUsername").innerText = user.username;
  document.getElementById("profileEmail").innerText = user.email;
}

/* ================= LOAD MUSIC ================= */
function loadMusic(index) {
  const song = allMusic[index - 1];
  musicName.innerText = song.title;
  musicArtist.innerText = song.artist;
  musicImg.src = song.image;
  mainAudio.src = song.audio;
  updateLikeIcon();
}

/* ================= PLAY / PAUSE ================= */
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

/* ================= NEXT / PREV ================= */
nextBtn.onclick = () => {
  musicIndex = musicIndex >= allMusic.length ? 1 : musicIndex + 1;
  loadMusic(musicIndex);
  playMusic();
  playingNow();
};

prevBtn.onclick = () => {
  musicIndex = musicIndex <= 1 ? allMusic.length : musicIndex - 1;
  loadMusic(musicIndex);
  playMusic();
  playingNow();
};
// ================= PROGRESS BAR UPDATE =================
mainAudio.addEventListener("timeupdate", () => {
  if (!mainAudio.duration) return;

  const progressWidth =
    (mainAudio.currentTime / mainAudio.duration) * 100;
  progressBar.style.width = `${progressWidth}%`;

  // time display
  const current = wrapper.querySelector(".current");
  const duration = wrapper.querySelector(".duration");

  let curMin = Math.floor(mainAudio.currentTime / 60);
  let curSec = Math.floor(mainAudio.currentTime % 60);
  if (curSec < 10) curSec = `0${curSec}`;

  let durMin = Math.floor(mainAudio.duration / 60);
  let durSec = Math.floor(mainAudio.duration % 60);
  if (durSec < 10) durSec = `0${durSec}`;

  current.innerText = `${curMin}:${curSec}`;
  duration.innerText = `${durMin}:${durSec}`;
});
// ================= SEEK / DRAG =================
progressArea.addEventListener("click", e => {
  const width = progressArea.clientWidth;
  const clickX = e.offsetX;
  const duration = mainAudio.duration;

  mainAudio.currentTime = (clickX / width) * duration;
});

/* ================= LIKE / UNLIKE ================= */
likeBtn.addEventListener("click", async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const songId = allMusic[musicIndex - 1].id;

  const isLiked = likeBtn.innerText === "favorite";
  const url = isLiked ? "/api/unlike" : "/api/like";

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: user.userId, songId })
  });

  const data = await res.json();
  alert(data.message);

  likeBtn.innerText = isLiked ? "favorite_border" : "favorite";
  loadLikedSongs();
});

/* ================= LIKED SONGS ================= */
async function loadLikedSongs() {
  const user = JSON.parse(localStorage.getItem("user"));
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

/* ================= PLAYLIST ================= */
addToListBtn.addEventListener("click", async () => {
  const user = JSON.parse(localStorage.getItem("user"));
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

async function loadPlaylists() {
  const user = JSON.parse(localStorage.getItem("user"));
  const res = await fetch(`/api/playlists/${user.userId}`);
  const playlists = await res.json();

  const ul = document.getElementById("playlistList");
  ul.innerHTML = "";

  playlists.forEach(pl => {
    const li = document.createElement("li");
    li.innerText = pl.name;
    ul.appendChild(li);

    pl.songs.forEach(song => {
      const s = document.createElement("li");
      s.innerText = "• " + song.title;
      s.onclick = () => playFromExternalList(song);
      ul.appendChild(s);
    });
  });
}

/* ================= PROFILE SIDEBAR ================= */
function openProfile() {
  document.getElementById("profileSidebar").style.left = "0";
  document.querySelector(".profile-btn").style.display = "none";
  loadLikedSongs();
  loadPlaylists();
}

function closeProfile() {
  document.getElementById("profileSidebar").style.left = "-320px";
  document.querySelector(".profile-btn").style.display = "block";
}

/* ================= PLAY EXTERNAL ================= */
function playFromExternalList(song) {
  mainAudio.src = song.audio;
  musicImg.src = song.image;
  musicName.innerText = song.title;
  musicArtist.innerText = song.artist;
  playMusic();
}

/* ================= PLAYLIST UI ================= */
showMoreBtn.onclick = () => musicList.classList.toggle("show");
hideMusicBtn.onclick = () => showMoreBtn.click();

function generatePlaylist() {
const ul = document.querySelector(".music-list ul");
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

function playingNow() {
  document.querySelectorAll("ul li").forEach(li => {
    li.classList.toggle("playing", li.getAttribute("li-index") == musicIndex);
  });
}
