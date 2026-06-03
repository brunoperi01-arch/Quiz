# 📱 Mémoire — Lancer l'app iPhone

## Prérequis (une seule fois)

1. **Node.js** → https://nodejs.org (version 18+)
2. **Expo Go** sur l'iPhone → App Store, gratuit
3. **Mac** avec le backend Python lancé

---

## Étape 1 — Configurer l'IP du Mac

Ouvrez `services/api.js` et changez :

```js
export let API_BASE = "http://192.168.1.100:7777";
//                              ↑ votre IP Mac ici
```

Trouver l'IP Mac : Réglages Système → Wi-Fi → votre réseau → Adresse IP

---

## Étape 2 — Lancer le serveur Mac

```bash
cd memoire_backend
python setup_and_run.py --wifi
```

---

## Étape 3 — Lancer l'app

```bash
cd memoire_rn
npm install        # une seule fois
npx expo start
```

Un QR code s'affiche dans le terminal.

---

## Étape 4 — Ouvrir sur iPhone

- Ouvrez l'app **Expo Go** sur l'iPhone
- Scannez le QR code
- L'app Mémoire s'ouvre

---

## Structure de l'app

```
App.js                          Navigation principale (4 onglets)
theme/index.js                  Couleurs, typographie, espacements
components/index.js             Composants réutilisables
hooks/usePhotos.js              Accès galerie iPhone
services/api.js                 Connexion backend Mac
screens/
  AlbumsScreen.js               Liste des albums
  AlbumDetailScreen.js          Grille photos + sélection
  ImportBookSendScreens.js      Import / Livre / Envoi
```

## Les 4 onglets

| Onglet   | Rôle |
|---|---|
| 📁 Albums  | Voir tous les albums, renommer, supprimer |
| 📥 Importer | Choisir la période, lancer l'analyse |
| 📖 Livre    | Choisir style, format, résolution |
| 🚀 Envoyer  | Générer le PDF et le partager |

## Workflow

1. **Importer** → choisissez "6 derniers mois" → Analyser
2. Photos envoyées au Mac via Wi-Fi
3. Mac analyse, crée les albums
4. **Albums** → vérifiez chaque album, sélectionnez/excluez des photos
5. **Livre** → choisissez le style
6. **Envoyer** → générez le PDF
7. Partagez via AirDrop ou envoyez chez CEWE/Photobox
