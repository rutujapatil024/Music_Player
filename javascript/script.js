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


let musicIndex = Math.floor((Math.random()*allMusic.length)+1);

window.addEventListener("load",()=>{
    loadMusic(musicIndex); //calling load music function once window loaded
    playingNow();
})

//load music func
function loadMusic(indexNumb){
    musicName.innerText = allMusic[indexNumb -1].name;
    musicArtist.innerText = allMusic[indexNumb -1].artist;
    musicImg.src =`images/${ allMusic[indexNumb - 1].img}.jpg`;
    mainAudio.src = `songs/${allMusic[indexNumb - 1].src}.mp3`;
}

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
    musicIndex > allMusic.length ? musicIndex = 1 : musicIndex = musicIndex;
    loadMusic(musicIndex);
    playMusic();
    playingNow();
}
function prevMusic(){
    musicIndex--;
    musicIndex < 1 ? musicIndex = allMusic.length : musicIndex = musicIndex;
    loadMusic(musicIndex);
    playMusic();
    playingNow();
}






playPauseBtn.addEventListener("click", ()=>{
    const isMusicPaused = wrapper.classList.contains("paused");
    // if isMusicPaused is true then call pauseMusic else call playMusic
    isMusicPaused ? pauseMusic():playMusic();
    playingNow();
});
nextBtn.addEventListener("click",()=>{
    nextMusic();
})
prevBtn.addEventListener("click",()=>{
    prevMusic();
})

//update progress bar
mainAudio.addEventListener("timeupdate",(e)=>{
    const currentTime = e.target.currentTime;
    const duration = e.target.duration;
    let progressWidth = (currentTime/duration)*100;
    progressBar.style.width = `${progressWidth}%`;

    let musicCurrentTime = wrapper.querySelector(".current"),
    musicDuration = wrapper.querySelector(".duration");

    mainAudio.addEventListener("loadeddata",()=>{
        //update song total durtion 
        let audioDuration = mainAudio.duration;
        let totalMin = Math.floor(audioDuration/60);
        let totalSec = Math.floor(audioDuration%60);
        if (totalSec<10){
            totalSec = `0${totalSec}`;
        }
        musicDuration.innerText = `${totalMin}:${totalSec}`;
    });
         //update song current time 
        let currentMin = Math.floor(currentTime/60);
        let currentSec = Math.floor(currentTime%60);
        if (currentSec<10){
            currentSec = `0${currentSec}`;
        }
        musicCurrentTime.innerText = `${currentMin}:${currentSec}`;
    });

        // progress bar acc to song
    progressArea.addEventListener("click",(e)=>{
        let progressWidthval = progressArea.clientWidth;
        let clickedOffSetX = e.offsetX;
        let songDuration =mainAudio.duration;

        mainAudio.currentTime = (clickedOffSetX/progressWidthval)*songDuration;
        playMusic();
    });

    // Repeat and shuffle
    repeatBtn.addEventListener("click", ()=>{
        //to get current mode
        let getText = repeatBtn.innerText;
        switch(getText){
            case "repeat": 
                repeatBtn.innerText = "repeat_one";
                repeatBtn.setAttribute("title","Song looped");
                break;
            case "repeat_one":
                repeatBtn.innerText = "shuffle";
                repeatBtn.setAttribute("title","Playback shuffle");
                break;
            case "shuffle":
                repeatBtn.innerText = "repeat";
                repeatBtn.setAttribute("title","Playlist looped");
                break;
        }
    });

    mainAudio.addEventListener("ended",()=>{
        let getText = repeatBtn.innerText;

        switch(getText){
            case "repeat": 
                nextMusic();
                break;
            case "repeat_one":
               mainAudio.currentTime = 0;
               loadMusic(musicIndex);
               playMusic();
                break;
            case "shuffle":
               let randomIndex = Math.floor((Math.random() * allMusic.length)+1);
               do {
                randomIndex = Math.floor((Math.random() * allMusic.length)+1)
               }
               while(musicIndex == randomIndex);
               musicIndex = randomIndex;
               loadMusic(musicIndex);
               playMusic();
               playingNow();
                break;
        }
    });

    //Playlist
    showMoreBtn.addEventListener("click",()=>{
        musicList.classList.toggle("show");
    });
    hideMusicBtn.addEventListener("click",()=>{
        showMoreBtn.click();
    });

    const ulTag = wrapper.querySelector("ul");
    for (let i = 0; i<allMusic.length; i++){
        //passing song name, artist from array to li 
        let liTag = `<li li-index="${i + 1}">
                <div class="row">
                    <span>${allMusic[i].name}</span>
                    <p>${allMusic[i].artist}</p>
                </div>
                <audio class = "${allMusic[i].src}" src="songs/${allMusic[i].src}.mp3"></audio>
                <span id="${allMusic[i].src}" class="audio-duration">3:15</span>
            </li>`;
        ulTag.insertAdjacentHTML("beforeend",liTag);

        //liAudioDuration select span tag which shows audio total duration
        let liAudioDuration = ulTag.querySelector(`#${allMusic[i].src}`);
        // liaudiotag - audio source
        let liAudioTag = ulTag.querySelector(`.${allMusic[i].src}`);

        //loadeddata event used to getaudio total duration without playing it
        liAudioTag.addEventListener("loadeddata",()=>{
            let audioDuration = liAudioTag.duration;
            let totalMin = Math.floor(audioDuration/60);
            let totalSec = Math.floor(audioDuration%60);
            if (totalSec<10){
                totalSec = `0${totalSec}`;
            }
            liAudioDuration.innerText = `${totalMin}:${totalSec}`;
            liAudioDuration.setAttribute("t-duration", `${totalMin}:${totalSec}`);

            });
            
    }

    //particular song on click attribute
    const allLiTags = ulTag.querySelectorAll("li");
    function playingNow(){
    for (let j = 0; j<allLiTags.length; j++){

        let audioTag = allLiTags[j].querySelector(".audio-duration");
        //removing playing class from other li
        if(allLiTags[j].classList.contains("playing")){
            allLiTags[j].classList.remove("playing");

            let adDuration = audioTag.getAttribute("t-duration");
            audioTag.innerText = adDuration;

        }

        if(allLiTags[j].getAttribute("li-index") == musicIndex){
            allLiTags[j].classList.add("playing");
            audioTag.innerText = "Playing";
        }

        //adding onclick attribute on all li tags
        allLiTags[j].setAttribute("onclick","clicked(this)");
    }
    }

  function clicked(element){
    let getliIndex = element.getAttribute("li-index");
    musicIndex = Number(getliIndex) ; 
    loadMusic(musicIndex);
    playMusic();
    playingNow();
}
