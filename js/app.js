const PLAYLISTS_URL = "data/playlists.json";

async function loadPlaylists() {
  const container = document.getElementById("playlists");
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
      container.innerHTML = '<p id="error-message">Nenhuma trilha disponível no momento.</p>';
      return;
    }

    container.innerHTML = "";
    data.playlists.forEach((playlist) => {
      container.appendChild(renderPlaylistCard(playlist));
    });
  } catch (err) {
    console.error("Falha ao carregar as trilhas:", err);
    container.innerHTML = '<p id="error-message">Não foi possível carregar as trilhas agora. Tente novamente mais tarde.</p>';
  }
}

function renderPlaylistCard(playlist) {
  const card = document.createElement("article");
  card.className = "playlist-card";

  const videoCount = playlist.videos ? playlist.videos.length : 0;
  const title = playlist.title || "Trilha ainda não sincronizada";

  card.innerHTML = `
    <a class="playlist-thumb-link" href="${playlist.url}" target="_blank" rel="noopener">
      ${thumbHtml(playlist.thumbnail, `Capa da trilha ${escapeHtml(title)}`)}
      <span class="play-badge">▶</span>
    </a>
    <div class="playlist-body">
      <h2 class="playlist-title"><a href="${playlist.url}" target="_blank" rel="noopener">${escapeHtml(title)}</a></h2>
      <p class="playlist-meta">${videoCount} vídeo${videoCount === 1 ? "" : "s"}</p>
      <div class="playlist-actions">
        <a class="btn btn-primary" href="${playlist.url}" target="_blank" rel="noopener">Assistir no YouTube</a>
        <button type="button" class="btn btn-toggle" aria-expanded="false">Ver vídeos da trilha</button>
      </div>
      <ul class="video-list"></ul>
    </div>
  `;

  const toggleBtn = card.querySelector(".btn-toggle");
  const videoList = card.querySelector(".video-list");
  let rendered = false;

  toggleBtn.addEventListener("click", () => {
    const isOpen = videoList.classList.toggle("open");
    toggleBtn.setAttribute("aria-expanded", String(isOpen));
    toggleBtn.textContent = isOpen ? "Esconder vídeos" : "Ver vídeos da trilha";

    if (isOpen && !rendered) {
      renderVideoList(videoList, playlist.videos || []);
      rendered = true;
    }
  });

  return card;
}

function renderVideoList(listEl, videos) {
  if (videos.length === 0) {
    listEl.innerHTML = "<li>Nenhum vídeo encontrado.</li>";
    return;
  }

  listEl.innerHTML = videos
    .map(
      (video) => `
      <li>
        <a class="video-item" href="https://www.youtube.com/watch?v=${video.videoId}" target="_blank" rel="noopener">
          <div class="video-thumb-wrap">${thumbHtml(video.thumbnail, "")}</div>
          <span class="video-item-title">${escapeHtml(video.title)}</span>
        </a>
      </li>
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
