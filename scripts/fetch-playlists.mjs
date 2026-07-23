// Busca dados atualizados das playlists do YouTube (título, capa e vídeos)
// usando a YouTube Data API v3, e atualiza data/playlists.json.
//
// Requer a variável de ambiente YOUTUBE_API_KEY.

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, "..", "data", "playlists.json");
const API_KEY = process.env.YOUTUBE_API_KEY;

if (!API_KEY) {
  console.error("Erro: variável de ambiente YOUTUBE_API_KEY não definida.");
  process.exit(1);
}

const API_BASE = "https://www.googleapis.com/youtube/v3";

async function apiGet(endpoint, params) {
  const url = new URL(`${API_BASE}/${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("key", API_KEY);

  const res = await fetch(url);
  const body = await res.json();

  if (!res.ok) {
    const message = body?.error?.message || res.statusText;
    throw new Error(`YouTube API ${endpoint} falhou (${res.status}): ${message}`);
  }
  return body;
}

function bestThumbnail(thumbnails) {
  if (!thumbnails) return "";
  return (
    thumbnails.maxres?.url ||
    thumbnails.standard?.url ||
    thumbnails.high?.url ||
    thumbnails.medium?.url ||
    thumbnails.default?.url ||
    ""
  );
}

async function fetchPlaylistMeta(playlistId) {
  const data = await apiGet("playlists", { part: "snippet", id: playlistId });
  const item = data.items?.[0];
  if (!item) {
    throw new Error(`Playlist ${playlistId} não encontrada (privada, removida ou ID inválido).`);
  }
  return {
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnail: bestThumbnail(item.snippet.thumbnails),
  };
}

async function fetchPlaylistVideos(playlistId) {
  const videos = [];
  let pageToken;

  do {
    const data = await apiGet("playlistItems", {
      part: "snippet",
      playlistId,
      maxResults: 50,
      ...(pageToken ? { pageToken } : {}),
    });

    for (const item of data.items ?? []) {
      const videoId = item.snippet?.resourceId?.videoId;
      if (!videoId) continue;
      // Vídeos removidos/privados aparecem com esse título — pula.
      if (item.snippet.title === "Deleted video" || item.snippet.title === "Private video") continue;

      videos.push({
        videoId,
        title: item.snippet.title,
        thumbnail: bestThumbnail(item.snippet.thumbnails),
        publishedAt: item.snippet.publishedAt,
        position: item.snippet.position,
      });
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  videos.sort((a, b) => a.position - b.position);
  return videos;
}

async function main() {
  const raw = await readFile(DATA_PATH, "utf-8");
  const current = JSON.parse(raw);

  let anySuccess = false;

  const updatedPlaylists = await Promise.all(
    current.playlists.map(async (playlist) => {
      try {
        const [meta, videos] = await Promise.all([
          fetchPlaylistMeta(playlist.id),
          fetchPlaylistVideos(playlist.id),
        ]);
        anySuccess = true;
        return {
          ...playlist,
          title: meta.title,
          description: meta.description,
          thumbnail: meta.thumbnail,
          videos,
        };
      } catch (err) {
        console.error(`Aviso: falha ao atualizar a playlist ${playlist.id}: ${err.message}`);
        // Mantém os dados anteriores dessa playlist em vez de apagar.
        return playlist;
      }
    })
  );

  const result = {
    updatedAt: anySuccess ? new Date().toISOString() : current.updatedAt,
    playlists: updatedPlaylists,
  };

  await writeFile(DATA_PATH, JSON.stringify(result, null, 2) + "\n", "utf-8");
  console.log("data/playlists.json atualizado.");
}

main().catch((err) => {
  console.error("Erro inesperado:", err);
  process.exit(1);
});
