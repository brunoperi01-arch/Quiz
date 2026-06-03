// services/api.js
// Communication avec le backend Python (FastAPI) sur le Mac

import axios from "axios";
import { Alert } from "react-native";

// ─── CONFIGURATION ───────────────────────────────────────────────────────────
// Changez cette IP par celle de votre Mac :
// Mac → Réglages Système → Wi-Fi → Détails → Adresse IP
export let API_BASE = "http://192.168.1.100:7777";

export const setApiBase = (url) => { API_BASE = url; };

const client = () => axios.create({
  baseURL: API_BASE,
  timeout: 300_000,
  headers: { "Content-Type": "application/json" },
});

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function handleError(error) {
  if (!error.response) {
    Alert.alert(
      "Serveur inaccessible",
      `Impossible de joindre votre Mac.\n\nVérifiez :\n`+
      `• Mac allumé sur le même Wi-Fi\n`+
      `• Serveur lancé : python setup_and_run.py --wifi\n\n`+
      `Adresse : ${API_BASE}`,
      [{ text: "OK" }]
    );
  }
  throw error;
}

// ─── ENDPOINTS ───────────────────────────────────────────────────────────────

/** Ping le serveur */
export async function ping() {
  try {
    const res = await client().get("/health");
    return res.data;
  } catch (e) { handleError(e); }
}

/** Upload des photos par batch */
export async function uploadPhotos(assets, onProgress) {
  const BATCH = 15;
  let done = 0;

  for (let i = 0; i < assets.length; i += BATCH) {
    const batch = assets.slice(i, i + BATCH);
    const form  = new FormData();

    for (const asset of batch) {
      form.append("files", {
        uri:  asset.uri,
        name: asset.filename || `photo_${done}.jpg`,
        type: "image/jpeg",
      });
    }

    await axios.post(`${API_BASE}/upload`, form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 300_000,
    });

    done += batch.length;
    onProgress?.(done / assets.length);
  }
}

/** Lance l'analyse sur le serveur */
export async function startScan(options = {}) {
  try {
    const res = await client().post("/scan", {
      folder_path:      "/tmp/memoire_uploads",
      skip_blurry:      options.skipBlurry      ?? true,
      skip_duplicates:  options.skipDuplicates  ?? true,
      skip_screenshots: options.skipScreenshots ?? true,
    });
    return res.data.job_id;
  } catch (e) { handleError(e); }
}

/** Suit la progression d'un job */
export async function getJobStatus(jobId) {
  try {
    const res = await client().get(`/scan/${jobId}/status`);
    return res.data;
  } catch (e) { handleError(e); }
}

/** Attend la fin d'un job (polling) */
export async function waitForJob(jobId, onProgress, intervalMs = 1200) {
  while (true) {
    await new Promise(r => setTimeout(r, intervalMs));
    const status = await getJobStatus(jobId);
    onProgress?.(status.progress / 100, status.message);
    if (status.status === "done")   return status.result;
    if (status.status === "error")  throw new Error(status.message);
  }
}

/** Récupère tous les albums */
export async function getAlbums() {
  try {
    const res = await client().get("/albums");
    return res.data.albums;
  } catch (e) { handleError(e); }
}

/** Récupère les photos d'un album */
export async function getAlbumPhotos(albumId) {
  try {
    const res = await client().get(`/photos?album_id=${albumId}`);
    return res.data.photos;
  } catch (e) { handleError(e); }
}

/** Statistiques globales */
export async function getStats() {
  try {
    const res = await client().get("/stats");
    return res.data;
  } catch (e) { handleError(e); }
}

/** Renomme un album */
export async function renameAlbum(albumId, title) {
  try {
    await client().patch(`/albums/${albumId}/rename`, { title });
  } catch (e) { handleError(e); }
}

/** Supprime un album */
export async function deleteAlbum(albumId) {
  try {
    await client().delete(`/albums/${albumId}`);
  } catch (e) { handleError(e); }
}

/** Met à jour la sélection de photos */
export async function updateSelection(albumId, selectedIds) {
  try {
    await client().patch(`/albums/${albumId}/selection`, { selected_ids: selectedIds });
  } catch (e) { handleError(e); }
}

/** Lance la génération PDF */
export async function startPDF(albumIds, style, format, dpi = 300) {
  try {
    const res = await client().post("/generate-pdf", {
      album_ids: albumIds,
      style, format, dpi,
    });
    return res.data.job_id;
  } catch (e) { handleError(e); }
}

/** URL de téléchargement du PDF */
export const pdfDownloadUrl = (jobId) => `${API_BASE}/download/${jobId}`;
