const PLAYLISTS_URL = "data/playlists.json";

let playlistsData = [];

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
};

async function loadPlaylists() {
  const tabsEl = document.getElementById("trilha-tabs");

  try {
    const response = await fetch(PLAYLISTS_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    updatePageSummary(data);

    if (!data.playlists || data.playlists.length === 0) {
      tabsEl.innerHTML = '<p id="error-message">Nenhuma trilha disponível no momento.</p>';
      return;
    }

    playlistsData = data.playlists;
    renderHeroCourse(playlistsData[0]);
    renderTabs();
  } catch (error) {
    console.error("Falha ao carregar as trilhas:", error);
    tabsEl.innerHTML = '<p id="error-message">Não foi possível carregar as trilhas agora. Tente novamente mais tarde.</p>';
  }
}

function courseUrl(playlist) {
  return `trilha.html?id=${encodeURIComponent(playlist.id || "")}`;
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
  linkEl.href = courseUrl(playlist);
  linkEl.setAttribute("aria-label", `Abrir página da trilha em destaque: ${title}`);

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
    const tab = document.createElement("article");

    tab.className = "trilha-tab";
    tab.innerHTML = `
      <a
        class="trilha-tab-select"
        href="${escapeAttribute(courseUrl(playlist))}"
        aria-label="Abrir página da trilha ${escapeAttribute(title)}"
      >
        <span class="sr-only">Abrir página de ${escapeHtml(title)}</span>
      </a>
      <span class="trilha-tab-thumb">
        ${thumbHtml(playlist.thumbnail, "")}
        <span class="trilha-tab-index">TRILHA ${String(index + 1).padStart(2, "0")}</span>
      </span>
      <span class="trilha-tab-info">
        <span class="trilha-tab-meta">
          ${videoCount} aula${videoCount === 1 ? "" : "s"}
        </span>
        <span class="trilha-tab-title">${escapeHtml(title)}</span>
        <span class="trilha-tab-actions">
          <span class="trilha-tab-hint">
            Abrir curso
            <i aria-hidden="true">→</i>
          </span>
          <a
            class="trilha-playlist-btn"
            href="${escapeAttribute(playlist.url || "#")}"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Assistir playlist ${escapeAttribute(title)} no YouTube"
          >
            ${icons.youtube}
            Assistir playlist
          </a>
        </span>
      </span>
    `;
    tabsEl.appendChild(tab);
  });
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
