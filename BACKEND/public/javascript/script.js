let allMusic = []; 

const wrapper = document.querySelector(".wrapper"),
musicImg = wrapper.querySelector(".img-area img"),
musicName = wrapper.querySelector(".song-details .name"),
musicArtist = wrapper.querySelector(".song-details .artist"),
mainAudio = wrapper.querySelector("#main-audio"),
playPauseBtn = wrapper.querySelector(".play-pause"),
prevBtn = wrapper.querySelector("#prev"),
nextBtn = wrapper.querySelector("#next"),
progressArea = wrapper.querySelector(".progress-area"),
progressBar = wrapper.querySelector(".progress-bar"),
musicList = wrapper.querySelector(".music-list"),
showMoreBtn = wrapper.querySelector("#more-music"),
hideMusicBtn = musicList.querySelector("#close"),
repeatBtn = wrapper.querySelector("#repeat-plist");

let musicIndex = 1;

// FETCH SONGS FROM BACKEND
async function loadSongsFromBackend() {
    const res = await fetch("http://localhost:5000/api/songs");
    const songs = await res.json();

    allMusic = songs.map((s) => ({
        name: s.title,
        artist: s.artist,
        img: s.image,      
        src: s.audio,      
        duration: s.duration
    }));
}

window.addEventListener("load", async () => {
    await loadSongsFromBackend();
    musicIndex = Math.floor((Math.random()*allMusic.length)+1);
    loadMusic(musicIndex);
    generatePlaylist();
    playingNow();
});

//LOAD MUSIC FUNCTION
function loadMusic(indexNumb){
    musicName.innerText = allMusic[indexNumb -1].name;
    musicArtist.innerText = allMusic[indexNumb -1].artist;
    musicImg.src = allMusic[indexNumb - 1].img;
    mainAudio.src = allMusic[indexNumb - 1].src;
}

//PLAY / PAUSE CONTROLS
function playMusic(){
    wrapper.classList.add("paused");
    playPauseBtn.querySelector("i").innerText = "pause";
    mainAudio.play();
}
function pauseMusic(){
    wrapper.classList.remove("paused");
    playPauseBtn.querySelector("i").innerText = "play_arrow";
    mainAudio.pause();
}
function nextMusic(){
    musicIndex++;
    if (musicIndex > allMusic.length) musicIndex = 1;
    loadMusic(musicIndex);
    playMusic();
    playingNow();
}
function prevMusic(){
    musicIndex--;
    if (musicIndex < 1) musicIndex = allMusic.length;
    loadMusic(musicIndex);
    playMusic();
    playingNow();
}

playPauseBtn.addEventListener("click", ()=>{
    const isMusicPaused = wrapper.classList.contains("paused");
    isMusicPaused ? pauseMusic() : playMusic();
    playingNow();
});
nextBtn.addEventListener("click", nextMusic);
prevBtn.addEventListener("click", prevMusic);

//PROGRESS BAR UPDATE
mainAudio.addEventListener("timeupdate",(e)=>{
    const currentTime = e.target.currentTime;
    const duration = e.target.duration;
    progressBar.style.width = `${(currentTime/duration)*100}%`;

    let currentMin = Math.floor(currentTime/60);
    let currentSec = Math.floor(currentTime%60).toString().padStart(2,"0");
    wrapper.querySelector(".current").innerText = `${currentMin}:${currentSec}`;

    let totalMin = Math.floor(duration/60);
    let totalSec = Math.floor(duration%60).toString().padStart(2,"0");
    wrapper.querySelector(".duration").innerText = `${totalMin}:${totalSec}`;
});

// SEEK BAR
progressArea.addEventListener("click",(e)=>{
    let clickedX = e.offsetX;
    let width = progressArea.clientWidth;
    mainAudio.currentTime = (clickedX/width) * mainAudio.duration;
    playMusic();
});

//REPEAT / SHUFFLE
repeatBtn.addEventListener("click", ()=>{
    let text = repeatBtn.innerText;
    if (text === "repeat") {
        repeatBtn.innerText = "repeat_one";
    } else if (text === "repeat_one") {
        repeatBtn.innerText = "shuffle";
    } else {
        repeatBtn.innerText = "repeat";
    }
});

mainAudio.addEventListener("ended",()=>{
    if (repeatBtn.innerText === "repeat") nextMusic();
    else if (repeatBtn.innerText === "repeat_one") {
        mainAudio.currentTime = 0;
        playMusic();
    }
    else if (repeatBtn.innerText === "shuffle") {
        let rand;
        do { rand = Math.floor((Math.random() * allMusic.length) + 1); }
        while(rand === musicIndex);
        musicIndex = rand;
        loadMusic(musicIndex);
        playMusic();
        playingNow();
    }
});

//SHOW PLAYLIST
showMoreBtn.addEventListener("click",()=> musicList.classList.toggle("show"));
hideMusicBtn.addEventListener("click",()=> showMoreBtn.click());

//GENERATE PLAYLIST FROM BACKEND DATA
function generatePlaylist() {
    const ulTag = wrapper.querySelector("ul");
    ulTag.innerHTML = "";

    for (let i = 0; i < allMusic.length; i++) {
        let li = document.createElement("li");
        li.setAttribute("li-index", i + 1);

        li.innerHTML = `
            <div class="row">
                <span>${allMusic[i].name}</span>
                <p>${allMusic[i].artist}</p>
            </div>
            <span class="audio-duration">${allMusic[i].duration}</span>
        `;

        li.onclick = () => {
            musicIndex = i + 1;
            loadMusic(musicIndex);
            playMusic();
            playingNow();
        };

        ulTag.appendChild(li);
    }
}

//PLAYING NOW HIGHLIGHT
function playingNow(){
    const allLiTags = wrapper.querySelectorAll("ul li");

    allLiTags.forEach(li => {
        li.classList.remove("playing");
        if (li.getAttribute("li-index") == musicIndex) {
            li.classList.add("playing");
        }
    });
}
