const PLAYLISTS_URL = "data/playlists.json";

let playlistsData = [];
let activeIndex = 0;

const icons = {
  play: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m8.5 5.7 9.8 6.3-9.8 6.3V5.7Z"/>
    </svg>
  `,
  youtube: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21.6 7.2a2.9 2.9 0 0 0-2-2C17.8 4.7 12 4.7 12 4.7s-5.8 0-7.6.5a2.9 2.9 0 0 0-2 2A30 30 0 0 0 2 12a30 30 0 0 0 .4 4.8 2.9 2.9 0 0 0 2 2c1.8.5 7.6.5 7.6.5s5.8 0 7.6-.5a2.9 2.9 0 0 0 2-2A30 30 0 0 0 22 12a30 30 0 0 0-.4-4.8ZM10 15.2V8.8l5.5 3.2-5.5 3.2Z"/>
    </svg>
  `,
  lessons: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6.5h16v11H4zM9.5 9l5 3-5 3V9Z"/>
    </svg>
  `,
  spark: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3 1.4 4.2a5.2 5.2 0 0 0 3.4 3.4L21 12l-4.2 1.4a5.2 5.2 0 0 0-3.4 3.4L12 21l-1.4-4.2a5.2 5.2 0 0 0-3.4-3.4L3 12l4.2-1.4a5.2 5.2 0 0 0 3.4-3.4L12 3Z"/>
    </svg>
  `,
};

async function loadPlaylists() {
  const tabsEl = document.getElementById("trilha-tabs");
  const detailEl = document.getElementById("trilha-detail");

  try {
    const response = await fetch(PLAYLISTS_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    updatePageSummary(data);

    if (!data.playlists || data.playlists.length === 0) {
      tabsEl.innerHTML = "";
      detailEl.innerHTML = '<p id="error-message">Nenhuma trilha disponível no momento.</p>';
      return;
    }

    playlistsData = data.playlists;
    renderHeroCourse(playlistsData[0]);
    renderTabs();
    selectTrilha(0);
  } catch (error) {
    console.error("Falha ao carregar as trilhas:", error);
    tabsEl.innerHTML = "";
    detailEl.innerHTML = '<p id="error-message">Não foi possível carregar as trilhas agora. Tente novamente mais tarde.</p>';
  }
}

function renderHeroCourse(playlist) {
  const linkEl = document.getElementById("hero-course-link");
  const thumbEl = document.getElementById("hero-course-thumb");
  const titleEl = document.getElementById("hero-course-title");
  const countEl = document.getElementById("hero-course-count");
  const videoCount = playlist.videos?.length || 0;
  const title = playlist.title || "Trilha em destaque";

  titleEl.textContent = title;
  countEl.textContent = `${videoCount} aula${videoCount === 1 ? "" : "s"} em sequência`;
  linkEl.setAttribute("aria-label", `Abrir trilha em destaque: ${title}`);
  linkEl.addEventListener("click", () => selectTrilha(0));

  const skeletonEl = thumbEl.querySelector(".hero-course-skeleton");
  if (!skeletonEl) return;

  if (!playlist.thumbnail) {
    skeletonEl.className = "thumb-placeholder";
    skeletonEl.innerHTML = icons.play;
    return;
  }

  const image = document.createElement("img");
  image.src = playlist.thumbnail;
  image.alt = `Capa da trilha ${title}`;
  image.loading = "eager";
  image.decoding = "async";
  image.fetchPriority = "high";
  image.addEventListener("error", () => handleThumbError(image));
  skeletonEl.replaceWith(image);
}

function updatePageSummary(data) {
  const updatedAtEl = document.getElementById("updated-at");
  const trailCountEl = document.getElementById("trail-count");
  const videoCountEl = document.getElementById("video-count");
  const playlists = data.playlists || [];
  const videoCount = playlists.reduce((total, playlist) => total + (playlist.videos?.length || 0), 0);

  trailCountEl.textContent = String(playlists.length).padStart(2, "0");
  videoCountEl.textContent = String(videoCount).padStart(2, "0");

  if (data.updatedAt) {
    const date = new Date(data.updatedAt);
    if (!Number.isNaN(date.getTime())) {
      updatedAtEl.textContent = `Atualizado em ${date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}`;
    }
  }
}

function renderTabs() {
  const tabsEl = document.getElementById("trilha-tabs");
  tabsEl.innerHTML = "";

  playlistsData.forEach((playlist, index) => {
    const videoCount = playlist.videos?.length || 0;
    const title = playlist.title || "Trilha em preparação";
    const tab = document.createElement("button");

    tab.type = "button";
    tab.className = "trilha-tab";
    tab.dataset.index = String(index);
    tab.setAttribute("aria-pressed", "false");
    tab.setAttribute("aria-label", `Abrir trilha ${index + 1}: ${title}`);
    tab.innerHTML = `
      <span class="trilha-tab-thumb">
        ${thumbHtml(playlist.thumbnail, "")}
        <span class="trilha-tab-index">TRILHA ${String(index + 1).padStart(2, "0")}</span>
      </span>
      <span class="trilha-tab-info">
        <span class="trilha-tab-meta">
          ${videoCount} aula${videoCount === 1 ? "" : "s"}
        </span>
        <span class="trilha-tab-title">${escapeHtml(title)}</span>
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
    const isActive = Number(tab.dataset.index) === index;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-pressed", String(isActive));
  });

  renderDetail(playlist, index);
}

function renderDetail(playlist, index) {
  const detailEl = document.getElementById("trilha-detail");
  const videoCount = playlist.videos?.length || 0;
  const title = playlist.title || "Trilha em preparação";
  const description =
    playlist.description?.trim() ||
    "Uma sequência prática de conteúdos para você aprender com clareza e aplicar o conhecimento em projetos reais.";

  detailEl.innerHTML = `
    <article class="trilha-banner">
      <div class="trilha-banner-thumb">
        ${thumbHtml(playlist.thumbnail, `Capa da trilha ${title}`)}
        <span class="trilha-banner-badge">Trilha ${String(index + 1).padStart(2, "0")}</span>
      </div>
      <div class="trilha-banner-info">
        <p class="trilha-banner-eyebrow">Trilha em destaque</p>
        <h2 class="trilha-banner-title">${escapeHtml(title)}</h2>
        <p class="trilha-banner-description">${escapeHtml(description)}</p>
        <div class="trilha-banner-meta">
          <span class="meta-chip">
            ${icons.lessons}
            ${videoCount} aula${videoCount === 1 ? "" : "s"}
          </span>
          <span class="meta-chip">
            ${icons.spark}
            Aprendizado prático
          </span>
        </div>
        <a class="btn btn-primary" href="${escapeAttribute(playlist.url || "#")}" target="_blank" rel="noopener noreferrer">
          ${icons.youtube}
          Assistir playlist no YouTube
        </a>
      </div>
    </article>

    <div class="video-section-heading">
      <div>
        <p class="section-kicker">Conteúdo da formação</p>
        <h3>Aulas desta trilha</h3>
      </div>
      <span class="video-section-count">${videoCount} conteúdo${videoCount === 1 ? "" : "s"} em sequência</span>
    </div>
    <div class="video-grid"></div>
  `;

  const grid = detailEl.querySelector(".video-grid");
  renderVideoGrid(grid, playlist.videos || []);
}

function renderVideoGrid(gridEl, videos) {
  if (videos.length === 0) {
    gridEl.innerHTML = '<p class="video-grid-empty">Novas aulas serão adicionadas em breve.</p>';
    return;
  }

  gridEl.innerHTML = videos
    .map((video, index) => {
      const lessonNumber = String(index + 1).padStart(2, "0");
      const videoUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(video.videoId || "")}`;

      return `
        <a class="video-card" href="${videoUrl}" target="_blank" rel="noopener noreferrer">
          <span class="video-card-thumb">
            ${thumbHtml(video.thumbnail, "")}
            <span class="video-play">${icons.play}</span>
            <span class="video-card-number">${lessonNumber}</span>
          </span>
          <span class="video-card-body">
            <span class="video-card-eyebrow">Aula ${lessonNumber}</span>
            <span class="video-card-title">${escapeHtml(video.title || "Aula da trilha")}</span>
          </span>
        </a>
      `;
    })
    .join("");
}

function thumbHtml(url, alt) {
  if (!url) return placeholderHtml();

  return `
    <img
      src="${escapeAttribute(url)}"
      alt="${escapeAttribute(alt)}"
      loading="lazy"
      decoding="async"
      onerror="handleThumbError(this)"
    />
  `;
}

function placeholderHtml() {
  return `<span class="thumb-placeholder">${icons.play}</span>`;
}

function handleThumbError(image) {
  const placeholder = document.createElement("span");
  placeholder.className = "thumb-placeholder";
  placeholder.innerHTML = icons.play;
  image.replaceWith(placeholder);
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

function escapeAttribute(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("'", "&#39;");
}

loadPlaylists();
