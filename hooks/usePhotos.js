// hooks/usePhotos.js
// Accès à la galerie iPhone via expo-media-library

import { useState, useEffect, useCallback } from "react";
import * as MediaLibrary from "expo-media-library";

export const PERIODS = [
  { label: "Ce mois-ci",          months: 1  },
  { label: "3 derniers mois",     months: 3  },
  { label: "6 derniers mois",     months: 6  },
  { label: "Cette année",         months: 12 },
  { label: "2 dernières années",  months: 24 },
  { label: "Toutes mes photos",   months: 0  },
];

export function usePhotoPermission() {
  const [status, setStatus] = useState(null); // null | "granted" | "denied"

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setStatus(status === "granted" ? "granted" : "denied");
    })();
  }, []);

  const request = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    setStatus(status === "granted" ? "granted" : "denied");
    return status === "granted";
  };

  return { status, request };
}

/**
 * Compte les photos d'une période donnée
 */
export async function countPhotos(periodIdx) {
  const period = PERIODS[periodIdx];
  try {
    const opts = {
      mediaType: MediaLibrary.MediaType.photo,
      first: 1,
    };
    if (period.months > 0) {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - period.months);
      opts.createdAfter = cutoff.getTime() / 1000;
    }
    const result = await MediaLibrary.getAssetsAsync(opts);
    return result.totalCount;
  } catch {
    return 0;
  }
}

/**
 * Récupère toutes les URIs locales d'une période
 * Retourne un tableau de { uri, filename, creationTime, location }
 */
export async function fetchPhotoAssets(periodIdx, onProgress) {
  const period = PERIODS[periodIdx];
  const allAssets = [];
  let cursor;

  const cutoff = period.months > 0
    ? new Date(Date.now() - period.months * 30 * 24 * 3600 * 1000)
    : null;

  do {
    const opts = {
      mediaType: MediaLibrary.MediaType.photo,
      first: 300,
      sortBy: MediaLibrary.SortBy.creationTime,
      after: cursor,
    };
    if (cutoff) opts.createdAfter = cutoff.getTime() / 1000;

    const page = await MediaLibrary.getAssetsAsync(opts);

    // Récupérer les infos complètes (incluant localUri et location)
    const detailed = await Promise.all(
      page.assets.map(a => MediaLibrary.getAssetInfoAsync(a))
    );

    allAssets.push(...detailed);
    cursor = page.endCursor;
    onProgress?.(allAssets.length, page.totalCount);

    if (!page.hasNextPage) break;
  } while (true);

  return allAssets.map(a => ({
    uri:          a.localUri || a.uri,
    filename:     a.filename,
    creationTime: a.creationTime,
    duration:     a.duration,
    width:        a.width,
    height:       a.height,
    location:     a.location || null,
    mediaType:    a.mediaType,
  }));
}
