const PLAYLISTS_URL = "data/playlists.json";

let playlistsData = [];
let activeIndex = 0;

async function loadPlaylists() {
  const tabsEl = document.getElementById("trilha-tabs");
  const detailEl = document.getElementById("trilha-detail");
  const updatedAtEl = document.getElementById("updated-at");

  try {
    const res = await fetch(PLAYLISTS_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.updatedAt) {
      const date = new Date(data.updatedAt);
      updatedAtEl.textContent = `Última atualização: ${date.toLocaleString("pt-BR")}`;
    }

    if (!data.playlists || data.playlists.length === 0) {
      tabsEl.innerHTML = "";
      detailEl.innerHTML = '<p id="error-message">Nenhuma trilha disponível no momento.</p>';
      return;
    }

    playlistsData = data.playlists;
    renderTabs();
    selectTrilha(0);
  } catch (err) {
    console.error("Falha ao carregar as trilhas:", err);
    tabsEl.innerHTML = "";
    detailEl.innerHTML = '<p id="error-message">Não foi possível carregar as trilhas agora. Tente novamente mais tarde.</p>';
  }
}

function renderTabs() {
  const tabsEl = document.getElementById("trilha-tabs");
  tabsEl.innerHTML = "";

  playlistsData.forEach((playlist, index) => {
    const videoCount = playlist.videos ? playlist.videos.length : 0;
    const title = playlist.title || "Trilha ainda não sincronizada";

    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "trilha-tab";
    tab.setAttribute("data-index", String(index));
    tab.innerHTML = `
      <span class="trilha-tab-thumb">${thumbHtml(playlist.thumbnail, "")}</span>
      <span class="trilha-tab-info">
        <span class="trilha-tab-eyebrow">Trilha ${index + 1}</span>
        <span class="trilha-tab-title">${escapeHtml(title)}</span>
        <span class="trilha-tab-count">${videoCount} vídeo${videoCount === 1 ? "" : "s"}</span>
      </span>
    `;
    tab.addEventListener("click", () => selectTrilha(index));
    tabsEl.appendChild(tab);
  });
}

function selectTrilha(index) {
  activeIndex = index;
  const playlist = playlistsData[index];

  document.querySelectorAll(".trilha-tab").forEach((tab) => {
    tab.classList.toggle("active", Number(tab.dataset.index) === index);
  });

  renderDetail(playlist);
}

function renderDetail(playlist) {
  const detailEl = document.getElementById("trilha-detail");
  const videoCount = playlist.videos ? playlist.videos.length : 0;
  const title = playlist.title || "Trilha ainda não sincronizada";

  detailEl.innerHTML = `
    <div class="trilha-banner">
      <div class="trilha-banner-thumb">
        ${thumbHtml(playlist.thumbnail, `Capa da trilha ${escapeHtml(title)}`)}
      </div>
      <div class="trilha-banner-info">
        <h2 class="trilha-banner-title">${escapeHtml(title)}</h2>
        <p class="trilha-banner-meta">${videoCount} vídeo${videoCount === 1 ? "" : "s"} nesta trilha</p>
        <a class="btn btn-primary" href="${playlist.url}" target="_blank" rel="noopener">
          <span class="playlist-icon" aria-hidden="true">▤</span>
          Abrir playlist completa no YouTube
        </a>
      </div>
    </div>
    <div class="video-grid"></div>
  `;

  const grid = detailEl.querySelector(".video-grid");
  renderVideoGrid(grid, playlist.videos || []);
}

function renderVideoGrid(gridEl, videos) {
  if (videos.length === 0) {
    gridEl.innerHTML = '<p class="video-grid-empty">Nenhum vídeo sincronizado ainda para esta trilha.</p>';
    return;
  }

  gridEl.innerHTML = videos
    .map(
      (video, i) => `
      <a class="video-card" href="https://www.youtube.com/watch?v=${video.videoId}" target="_blank" rel="noopener">
        <span class="video-card-thumb">
          ${thumbHtml(video.thumbnail, "")}
          <span class="video-card-number">${i + 1}</span>
        </span>
        <span class="video-card-title">${escapeHtml(video.title)}</span>
      </a>
    `
    )
    .join("");
}

function thumbHtml(url, alt) {
  if (!url) {
    return `<div class="thumb-placeholder">▶</div>`;
  }
  return `<img src="${url}" alt="${alt}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'thumb-placeholder',textContent:'▶'}))" />`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

loadPlaylists();
