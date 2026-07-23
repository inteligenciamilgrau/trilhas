const PLAYLISTS_URL = "data/playlists.json";

const icons = {
  play: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m8.5 5.7 9.8 6.3-9.8 6.3V5.7Z"/>
    </svg>
  `,
  youtube: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21.6 7.2a2.9 2.9 0 0 0-2-2C17.8 4.7 12 4.7 12 4.7s-5.8 0-7.6.5a2.9 2.9 0 0 0-2 2A30 30 0 0 0 2 12a30 30 0 0 0 .4 4.8 2.9 2.9 0 0 0 2 2c1.8.5 7.6.5 7.6.5s5.8 0 7.6-.5a2.9 2.9 0 0 0 2-2A30 30 0 0 0 22 12a30 30 0 0 0-.4-4.8ZM10 15.2V8.8l5.5 3.2-5.5 3.2V8.8Z"/>
    </svg>
  `,
  lessons: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6.5h16v11H4zM9.5 9l5 3-5 3V9Z"/>
    </svg>
  `,
  sequence: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 5h10M7 12h10M7 19h10M4 5h.01M4 12h.01M4 19h.01"/>
    </svg>
  `,
};

async function loadCourse() {
  const contentEl = document.getElementById("course-content");
  const switcherEl = document.getElementById("course-switcher-options");

  try {
    const response = await fetch(PLAYLISTS_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const playlists = data.playlists || [];
    if (playlists.length === 0) {
      throw new Error("Nenhuma trilha disponível");
    }

    const requestedId = new URLSearchParams(window.location.search).get("id");
    const activeIndex = Math.max(0, playlists.findIndex((playlist) => playlist.id === requestedId));
    const activePlaylist = playlists[activeIndex];

    if (requestedId !== activePlaylist.id) {
      const url = new URL(window.location.href);
      url.searchParams.set("id", activePlaylist.id);
      window.history.replaceState({}, "", url);
    }

    document.title = `${activePlaylist.title || "Trilha"} — Inteligência Mil Grau`;
    renderSwitcher(switcherEl, playlists, activeIndex);
    renderCourse(contentEl, activePlaylist, activeIndex);
  } catch (error) {
    console.error("Falha ao carregar a trilha:", error);
    switcherEl.innerHTML = "";
    contentEl.innerHTML = `
      <div class="course-error">
        <p>Não foi possível carregar esta trilha agora.</p>
        <a class="course-back" href="index.html">← Voltar para todas as trilhas</a>
      </div>
    `;
  }
}

function courseUrl(playlist) {
  return `trilha.html?id=${encodeURIComponent(playlist.id || "")}`;
}

function renderSwitcher(container, playlists, activeIndex) {
  container.innerHTML = playlists
    .map((playlist, index) => {
      const title = playlist.title || `Trilha ${index + 1}`;
      const isActive = index === activeIndex;

      return `
        <a
          class="course-switch-link${isActive ? " active" : ""}"
          href="${escapeAttribute(courseUrl(playlist))}"
          ${isActive ? 'aria-current="page"' : ""}
          title="${escapeAttribute(title)}"
        >
          <span>${String(index + 1).padStart(2, "0")}</span>
          ${escapeHtml(shortTitle(title))}
        </a>
      `;
    })
    .join("");
}

function renderCourse(container, playlist, index) {
  const title = playlist.title || "Trilha em preparação";
  const description = playlist.description || "Aulas organizadas para você avançar em sequência.";
  const videoCount = playlist.videos?.length || 0;

  container.innerHTML = `
    <article class="trilha-banner course-banner">
      <div class="trilha-banner-thumb">
        ${thumbHtml(playlist.thumbnail, `Capa da trilha ${title}`)}
        <span class="trilha-banner-badge">Trilha ${String(index + 1).padStart(2, "0")}</span>
      </div>
      <div class="trilha-banner-info">
        <p class="trilha-banner-eyebrow">Sua trilha de aprendizagem</p>
        <h1 class="trilha-banner-title">${escapeHtml(title)}</h1>
        <p class="trilha-banner-description">${escapeHtml(description)}</p>
        <div class="trilha-banner-meta">
          <span class="meta-chip">
            ${icons.lessons}
            ${videoCount} aula${videoCount === 1 ? "" : "s"}
          </span>
          <span class="meta-chip">
            ${icons.sequence}
            Conteúdo em sequência
          </span>
        </div>
        <a class="btn btn-primary" href="${escapeAttribute(playlist.url || "#")}" target="_blank" rel="noopener noreferrer">
          ${icons.youtube}
          Assistir playlist no YouTube
        </a>
      </div>
    </article>

    <section class="course-videos-panel" aria-labelledby="course-videos-title">
      <div class="video-section-heading">
        <div>
          <p class="section-kicker">Aulas da trilha</p>
          <h2 id="course-videos-title">Continue de onde preferir</h2>
        </div>
        <span class="video-section-count">${videoCount} aula${videoCount === 1 ? "" : "s"}</span>
      </div>
      <div class="video-grid"></div>
    </section>
  `;

  renderVideoGrid(container.querySelector(".video-grid"), playlist.videos || []);
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

function shortTitle(title) {
  return title
    .replace(/^curso\s+(de\s+)?/i, "")
    .replace(/^trilha\s+(de\s+)?/i, "")
    .trim();
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

loadCourse();
