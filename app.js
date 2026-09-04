const PLAYLIST_ID = "PLSGypVHffn-w";

const tracks = [
  { id: "6UhQaoM_sjk", title: "Irving O.D ft. Django - Marimba" },
  { id: "TkDfHGn9e3Y", title: "Irving O.D - Prende y Fuma (En Vivo)" },
  { id: "J6ClaWpOnlQ", title: "Irving O.D - Lo Tenemos" },
  { id: "rOvO8TgvIBA", title: "Los Darlings de Huánuco - Marihuana" },
  { id: "lcg_lmI9WCw", title: "Norick Rapper School - I Love" },
  { id: "33MpTofKVI0", title: "Terrateniente - Relajadito" },
  { id: "nzv-cr4czXY", title: "La Torita, El Paisa, SofGab, Blas, BJ, Sky Sapiens y RJ - Noche y Día" },
  { id: "f-_xgHGQJNQ", title: "Los Destellos - Onsta la Yerbita" },
  { id: "27z2U8PoPdI", title: "6 Voltios - Wirito" },
  { id: "5VWLHsRqgOs", title: "Callao Cartel - Legalizando el Área" },
  { id: "OzPPnWuD_f0", title: "Callao Cartel - Lámpara Mágica" },
  { id: "YWKhBWX41sQ", title: "Pedro Mo - Escríbelo con P" },
  { id: "vX5FfN8dW8M", title: "The Faites - La Venganza" },
  { id: "Hx40zUDnOYU", title: "MSECO - Antauro Fúmala Maldita" },
  { id: "eRua23gK3Rw", title: "Pochi Marambio y Tierra Sur - Mi Marimba" },
  { id: "CxfRmNcBe6M", title: "Dengue Dengue Dengue - Serpiente Dorada" },
  { id: "VZZoX_LDJc4", title: "Olaya Sound System - En Mi Jardín" },
  { id: "nwVChl5eYy8", title: "Arte Oculto en las Calles - Peruvian Legalize" },
  { id: "qxJvElQ72Yo", title: "Asmereir - Gente Ganya" },
  { id: "MSY0vHpVt6s", title: "La Raza - A Mi No Wanna" },
  { id: "3-kTAvXlc_Q", title: "Los Filipz - Positivo" },
];

const initialTrackIndex = Math.floor(Math.random() * tracks.length);

const playlistElement = document.querySelector("#playlist");
tracks.forEach((track, index) => {
  const item = document.createElement("li");
  const button = document.createElement("button");
  const number = document.createElement("span");
  const title = document.createElement("span");

  button.type = "button";
  button.dataset.index = String(index);
  button.className = "track";
  number.textContent = String(index + 1).padStart(2, "0");
  title.textContent = track.title;
  button.append(number, title);
  item.append(button);
  playlistElement.append(item);
});

const ui = {
  shell: document.querySelector(".app-shell"),
  splash: document.querySelector("#splash-screen"),
  enter: document.querySelector("#enter-app"),
  loading: document.querySelector("#video-loading"),
  play: document.querySelector("#play-toggle"),
  previous: document.querySelector("#previous"),
  next: document.querySelector("#next"),
  shuffle: document.querySelector("#shuffle"),
  volume: document.querySelector("#volume"),
  progress: document.querySelector("#progress"),
  elapsed: document.querySelector("#elapsed"),
  duration: document.querySelector("#duration"),
  trackButtons: [...document.querySelectorAll(".track")],
};

let player;
let playerReady = false;
let shuffleEnabled = false;
let isSeeking = false;
let hasEntered = false;
let playlistPrepared = false;

function formatTime(value) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function scrollTrackIntoView(index, behavior = "smooth") {
  const button = ui.trackButtons[index];
  if (!button) return;

  const playlistRect = playlistElement.getBoundingClientRect();
  const trackRect = button.getBoundingClientRect();
  const centeredTop = playlistElement.scrollTop
    + trackRect.top
    - playlistRect.top
    - (playlistElement.clientHeight - trackRect.height) / 2;

  playlistElement.scrollTo({
    top: Math.max(0, centeredTop),
    behavior,
  });
}

function setActiveTrack(index, shouldScroll = hasEntered) {
  ui.trackButtons.forEach((button, buttonIndex) => {
    button.classList.toggle("is-active", buttonIndex === index);
  });

  if (shouldScroll) scrollTrackIntoView(index);
}

function getOriginalTrackIndex() {
  if (!playerReady) return 0;
  const videoId = player.getVideoData?.().video_id;
  const indexByVideoId = tracks.findIndex((track) => track.id === videoId);
  if (indexByVideoId >= 0) return indexByVideoId;

  return Math.max(0, player.getPlaylistIndex?.() ?? 0);
}

function updateCurrentTrack() {
  if (!playerReady) return;
  setActiveTrack(getOriginalTrackIndex());
}

function setPlaybackIcon(state) {
  const playing = state === YT.PlayerState.PLAYING;
  ui.play.classList.toggle("is-playing", playing);
  ui.play.setAttribute("aria-label", playing ? "Pausar" : "Reproducir");
}

function onPlayerReady(event) {
  playerReady = true;
  ui.loading.classList.add("is-hidden");
  setActiveTrack(initialTrackIndex);

  event.target.setVolume(Number(ui.volume.value));
  event.target.cuePlaylist({
    listType: "playlist",
    list: PLAYLIST_ID,
    index: initialTrackIndex,
    startSeconds: 0,
  });
  event.target.setLoop(true);

  if (hasEntered) startInitialPlayback();

}

function startInitialPlayback() {
  if (!playerReady || !playlistPrepared) return;
  player.setLoop(true);
  const playlist = player.getPlaylist?.() || [];
  const playlistIndex = playlist.indexOf(tracks[initialTrackIndex].id);
  player.playVideoAt(playlistIndex >= 0 ? playlistIndex : initialTrackIndex);
  player.playVideo();
}

function onPlayerStateChange(event) {
  setPlaybackIcon(event.data);

  if (event.data === YT.PlayerState.CUED && !playlistPrepared) {
    playlistPrepared = true;
    setActiveTrack(initialTrackIndex);
    ui.enter.disabled = false;
    ui.enter.focus({ preventScroll: true });
  }

  if (
    event.data === YT.PlayerState.PLAYING ||
    event.data === YT.PlayerState.PAUSED ||
    event.data === YT.PlayerState.CUED
  ) {
    updateCurrentTrack();
  }
}

function onPlayerError() {
  ui.loading.classList.remove("is-hidden");
  ui.loading.querySelector("span:last-child").textContent = "YouTube no pudo cargar este video";
}

window.onYouTubeIframeAPIReady = () => {
  player = new YT.Player("youtube-player", {
    width: "100%",
    height: "100%",
    videoId: "6UhQaoM_sjk",
    playerVars: {
      controls: 0,
      disablekb: 1,
      playsinline: 1,
      rel: 0,
      modestbranding: 1,
      origin: window.location.origin,
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
      onError: onPlayerError,
    },
  });
};

function playTrack(originalIndex) {
  if (!playerReady) return;
  const currentPlaylist = player.getPlaylist?.() || [];
  const wantedId = tracks[originalIndex]?.id;
  const currentIndex = currentPlaylist.indexOf(wantedId);

  if (currentIndex >= 0) player.playVideoAt(currentIndex);
  else if (wantedId) player.loadVideoById(wantedId);
}

ui.play.addEventListener("click", () => {
  if (!playerReady) return;
  const state = player.getPlayerState();
  if (state === YT.PlayerState.PLAYING) player.pauseVideo();
  else player.playVideo();
});

function enterApplication() {
  if (hasEntered || !playerReady || !playlistPrepared) return;
  hasEntered = true;
  ui.shell.classList.add("is-entered");
  ui.splash.setAttribute("aria-hidden", "true");
  window.requestAnimationFrame(() => setActiveTrack(initialTrackIndex, true));
  startInitialPlayback();
}

ui.enter.addEventListener("click", enterApplication);
ui.splash.addEventListener("click", enterApplication);
document.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || hasEntered) return;
  event.preventDefault();
  enterApplication();
});

ui.previous.addEventListener("click", () => playerReady && player.previousVideo());
ui.next.addEventListener("click", () => playerReady && player.nextVideo());

ui.shuffle.addEventListener("click", () => {
  if (!playerReady) return;
  shuffleEnabled = !shuffleEnabled;
  player.setShuffle(shuffleEnabled);
  ui.shuffle.setAttribute("aria-pressed", String(shuffleEnabled));
  ui.shuffle.setAttribute("aria-label", shuffleEnabled ? "Desactivar orden aleatorio" : "Activar orden aleatorio");
});

ui.volume.addEventListener("input", (event) => {
  event.target.parentElement.style.setProperty("--vol", Number(event.target.value) / 100);
  if (playerReady) player.setVolume(Number(event.target.value));
});

ui.trackButtons.forEach((button) => {
  button.addEventListener("click", () => playTrack(Number(button.dataset.index)));
});

ui.progress.addEventListener("pointerdown", () => { isSeeking = true; });
ui.progress.addEventListener("input", () => { isSeeking = true; });
ui.progress.addEventListener("change", (event) => {
  if (!playerReady) return;
  const duration = player.getDuration();
  player.seekTo((Number(event.target.value) / 1000) * duration, true);
  isSeeking = false;
});

window.setInterval(() => {
  if (!playerReady || typeof player.getCurrentTime !== "function") return;

  const current = player.getCurrentTime();
  const duration = player.getDuration();
  ui.elapsed.textContent = formatTime(current);
  ui.duration.textContent = formatTime(duration);

  if (!isSeeking && duration > 0) {
    ui.progress.value = String(Math.round((current / duration) * 1000));
  }
}, 500);

const apiScript = document.createElement("script");
apiScript.src = "https://www.youtube.com/iframe_api";
apiScript.async = true;
document.head.append(apiScript);
