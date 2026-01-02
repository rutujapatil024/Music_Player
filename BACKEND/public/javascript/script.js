let allMusic = [];
let musicIndex = 1;
let isShuffle = false;
let isLoop = false;

if (!localStorage.getItem("userId")) {
  window.location.href = "/login.html";
}


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
  if (!user) return (window.location.href = "login.html");

  loadUserProfile();
  await loadSongsFromBackend();

  if (!allMusic.length) return;

  musicIndex = 1;
  loadMusic(musicIndex, false);
  generatePlaylist();
  playingNow();
});

/* ================= USER PROFILE ================= */
function loadUserProfile() {
  const user = JSON.parse(localStorage.getItem("user"));
  document.getElementById("profileUsername").innerText = user.username;
  document.getElementById("profileEmail").innerText = user.email;
}

/* ================= LOAD MUSIC ================= */
function loadMusic(index, autoplay = true) {
  const song = allMusic[index - 1];
  if (!song) return;

  musicName.innerText = song.title;
  musicArtist.innerText = song.artist;
  musicImg.src = song.image;
  mainAudio.src = song.audio;
  mainAudio.load();

  if (autoplay) {
    mainAudio.play().catch(() => {});
    playPauseBtn.querySelector("i").innerText = "pause";
    wrapper.classList.add("paused");
  }

  syncLikeIcon();
}

/* ================= AUDIO END ================= */
mainAudio.addEventListener("ended", () => {
  if (isLoop) {
    loadMusic(musicIndex);
  } else if (isShuffle) {
    let next;
    do {
      next = Math.floor(Math.random() * allMusic.length) + 1;
    } while (next === musicIndex);
    musicIndex = next;
    loadMusic(musicIndex);
  } else {
    nextBtn.click();
  }
});

/* ================= PLAY / PAUSE ================= */
function playMusic() {
  mainAudio.play().catch(() => {});
  playPauseBtn.querySelector("i").innerText = "pause";
  wrapper.classList.add("paused");
}

function pauseMusic() {
  mainAudio.pause();
  playPauseBtn.querySelector("i").innerText = "play_arrow";
  wrapper.classList.remove("paused");
}

playPauseBtn.onclick = () =>
  wrapper.classList.contains("paused") ? pauseMusic() : playMusic();

/* ================= NEXT / PREV ================= */
nextBtn.onclick = () => {
  musicIndex = musicIndex >= allMusic.length ? 1 : musicIndex + 1;
  loadMusic(musicIndex);
  playingNow();
};

prevBtn.onclick = () => {
  musicIndex = musicIndex <= 1 ? allMusic.length : musicIndex - 1;
  loadMusic(musicIndex);
  playingNow();
};

/* ================= PROGRESS ================= */
mainAudio.addEventListener("timeupdate", () => {
  if (!mainAudio.duration) return;

  progressBar.style.width =
    (mainAudio.currentTime / mainAudio.duration) * 100 + "%";

  document.querySelector(".current").innerText = formatTime(mainAudio.currentTime);
  document.querySelector(".duration").innerText = formatTime(mainAudio.duration);
});

progressArea.onclick = e => {
  mainAudio.currentTime =
    (e.offsetX / progressArea.clientWidth) * mainAudio.duration;
};

function formatTime(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/* ================= SEARCH ================= */
function searchSong() {
  const q = searchInput.value.toLowerCase().trim();
  if (!q) return (generatePlaylist(), musicList.classList.add("show"));

  const ul = musicList.querySelector("ul");
  ul.innerHTML = "";

  allMusic
    .filter(s => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q))
    .forEach(s => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${s.title}</span><span>${s.duration}</span>`;
      li.onclick = () => {
        musicIndex = allMusic.findIndex(x => x.id === s.id) + 1;
        loadMusic(musicIndex);
        playingNow();
      };
      ul.appendChild(li);
    });

  musicList.classList.add("show");
}

/* ================= SHUFFLE / LOOP ================= */
repeatBtn.onclick = () => {
  if (!isShuffle && !isLoop) {
    isShuffle = true;
    repeatBtn.innerText = "shuffle";
  } else if (isShuffle) {
    isShuffle = false;
    isLoop = true;
    repeatBtn.innerText = "repeat_one";
  } else {
    isLoop = false;
    repeatBtn.innerText = "repeat";
  }
};

/* ================= PLAYLIST ================= */
function generatePlaylist() {
  const ul = musicList.querySelector("ul");
  ul.innerHTML = "";

  allMusic.forEach((song, i) => {
    const li = document.createElement("li");
    li.setAttribute("li-index", i + 1);
    li.innerHTML = `<span>${song.title}</span><span>${song.duration}</span>`;
    li.onclick = () => {
      musicIndex = i + 1;
      loadMusic(musicIndex);
      playingNow();
    };
    ul.appendChild(li);
  });
}

function playingNow() {
  document
    .querySelectorAll(".music-list ul li")
    .forEach(li =>
      li.classList.toggle("playing", li.getAttribute("li-index") == musicIndex)
    );
}

/* ================= UI ================= */
showMoreBtn.onclick = () => {
  generatePlaylist();
  playingNow();
  musicList.classList.add("show");
};

hideMusicBtn.onclick = () => musicList.classList.remove("show");

/* ================= LIKE / UNLIKE ================= */
likeBtn.onclick = async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;

  const songId = allMusic[musicIndex - 1].id;
  const isLiked = likeBtn.innerText === "favorite";

  await fetch(isLiked ? "/api/unlike" : "/api/like", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: user.userId, songId })
  });

  likeBtn.innerText = isLiked ? "favorite_border" : "favorite";
  loadLikedSongs();
};

async function syncLikeIcon() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;

  const res = await fetch(`/api/likes/${user.userId}`);
  const likedSongs = await res.json();
  const songId = allMusic[musicIndex - 1].id;

  likeBtn.innerText = likedSongs.some(s => s._id === songId)
    ? "favorite"
    : "favorite_border";
}

/* ================= ADD TO PLAYLIST ================= */
addToListBtn.onclick = async () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;

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
};

/* ================= SIDEBAR DATA ================= */
async function loadLikedSongs() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;

  const res = await fetch(`/api/likes/${user.userId}`);
  const songs = await res.json();

  const ul = document.getElementById("likedSongsList");
  ul.innerHTML = "";

  songs.length
    ? songs.forEach(s => {
        const li = document.createElement("li");
        li.textContent = `${s.title} - ${s.artist}`;
        li.onclick = () => playFromExternalList(s);
        ul.appendChild(li);
      })
    : (ul.innerHTML = "<li>No liked songs</li>");
}

async function loadPlaylists() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;

  const res = await fetch(`/api/playlists/${user.userId}`);
  const playlists = await res.json();

  const ul = document.getElementById("playlistList");
  ul.innerHTML = "";

  playlists.forEach(pl => {
    // Playlist title
    const title = document.createElement("li");
    title.innerHTML = `<strong>${pl.name}</strong>`;
    ul.appendChild(title);

    if (!pl.songs.length) {
      const empty = document.createElement("li");
      empty.style.marginLeft = "10px";
      empty.innerText = "No songs";
      ul.appendChild(empty);
      return;
    }

    pl.songs.forEach(song => {
      const li = document.createElement("li");
      li.style.marginLeft = "10px";
      li.style.display = "flex";
      li.style.alignItems = "center";
      li.style.justifyContent = "space-between";

      li.innerHTML = `
        <span style="cursor:pointer;">🎵 ${song.title}</span>
        <span 
          style="color:red; cursor:pointer; font-weight:bold;"
          title="Remove from playlist"
        >➖</span>
      `;

      // ▶ play song when clicking title
      li.children[0].onclick = () => playFromExternalList(song);

      // ❌ remove song when clicking minus
      li.children[1].onclick = () =>
        removeFromPlaylist(pl.name, song._id);

      ul.appendChild(li);
    });
  });
}
async function removeFromPlaylist(playlistName, songId) {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;

  await fetch("/api/playlist/remove", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: user.userId,
      playlistName,
      songId
    })
  });

  // refresh playlist UI
  loadPlaylists();
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

/* ================= PLAY FROM SIDEBAR ================= */
function playFromExternalList(song) {
  mainAudio.src = song.audio;
  musicImg.src = song.image;
  musicName.innerText = song.title;
  musicArtist.innerText = song.artist;
  playMusic();
}
/* ================= LIVE SEARCH ================= */
const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", () => {
  searchSong();
});
