// screens/AlbumDetailScreen.js

import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Image, Dimensions, Modal,
  Alert, ScrollView, ActivityIndicator,
} from "react-native";
import { Colors, Radii } from "../theme";
import { ScoreBar, Pill, GoldButton, GhostButton, SectionLabel } from "../components";
import { getAlbumPhotos, updateSelection } from "../services/api";

const { width } = Dimensions.get("window");
const COLS   = 3;
const GAP    = 3;
const CELL_W = (width - 32 - GAP * (COLS - 1)) / COLS;

const FILTERS = ["Toutes", "Sélectionnées", "Exclues"];

export default function AlbumDetailScreen({ navigation, route }) {
  const { album: initialAlbum } = route.params;
  const [album,   setAlbum]   = useState(initialAlbum);
  const [photos,  setPhotos]  = useState([]);
  const [filter,  setFilter]  = useState("Toutes");
  const [loading, setLoading] = useState(true);
  const [selected,setSelected]= useState(new Set());
  const [viewPhoto,setView]   = useState(null);

  useEffect(() => {
    navigation.setOptions({ title: album.title });
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      const data = await getAlbumPhotos(album.id);
      setPhotos(data || []);
      // Initialiser la sélection depuis les données serveur
      const initSel = new Set(
        (data || [])
          .filter(p => p.is_kept)
          .map(p => p.id)
      );
      setSelected(initSel);
    } catch { /* handled */ }
    finally { setLoading(false); }
  };

  const togglePhoto = useCallback((photoId) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  }, []);

  const autoSelect = () => {
    const auto = new Set(
      photos.filter(p => p.score >= 65 && !p.is_duplicate && !p.is_blurry && !p.is_screenshot)
             .map(p => p.id)
    );
    setSelected(auto);
  };

  const selectAll  = () => setSelected(new Set(photos.map(p => p.id)));
  const selectNone = () => setSelected(new Set());

  const saveSelection = async () => {
    await updateSelection(album.id, [...selected]);
    Alert.alert("✓ Sélection sauvegardée", `${selected.size} photos sélectionnées`);
  };

  const filtered = photos.filter(p =>
    filter === "Toutes"        ? true :
    filter === "Sélectionnées" ? selected.has(p.id) :
    !selected.has(p.id)
  );

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={Colors.gold} />
      <Text style={styles.loadTxt}>Chargement des photos…</Text>
    </View>
  );

  return (
    <View style={styles.bg}>
      {/* Filter tabs */}
      <View style={styles.filterBar}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterBtn, filter === f && styles.filterActive]}
          >
            <Text style={[styles.filterTxt, filter === f && styles.filterTxtActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.filterCount}>
          {selected.size}/{photos.length}
        </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={p => p.id}
        numColumns={COLS}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        ListHeaderComponent={
          <View style={styles.actions}>
            <TouchableOpacity onPress={autoSelect} style={styles.actionBtn}>
              <Text style={styles.actionBtnTxt}>✦ Auto</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={selectAll} style={styles.actionBtn}>
              <Text style={styles.actionBtnTxt}>Tout</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={selectNone} style={styles.actionBtn}>
              <Text style={styles.actionBtnTxt}>Aucun</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={saveSelection}
              style={[styles.actionBtn, styles.actionBtnGold]}>
              <Text style={[styles.actionBtnTxt, { color: "#0C0A08" }]}>Sauvegarder</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <PhotoCell
            photo={item}
            isSelected={selected.has(item.id)}
            onToggle={() => togglePhoto(item.id)}
            onPress={() => setView(item)}
          />
        )}
        ListFooterComponent={<View style={{ height: 100 }} />}
      />

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <GhostButton
          title={`${selected.size} sélectionnées`}
          onPress={saveSelection}
          style={{ flex: 1 }}
        />
        <GoldButton
          title="Livre →"
          onPress={() => navigation.navigate("BookTab")}
          style={{ flex: 1 }}
        />
      </View>

      {/* Photo modal */}
      <PhotoModal
        photo={viewPhoto}
        isSelected={viewPhoto ? selected.has(viewPhoto.id) : false}
        onToggle={() => viewPhoto && togglePhoto(viewPhoto.id)}
        onClose={() => setView(null)}
      />
    </View>
  );
}

// ── Photo Cell ───────────────────────────────────────────────────────────────
function PhotoCell({ photo, isSelected, onToggle, onPress }) {
  const hasIssue = photo.is_blurry || photo.is_duplicate || photo.is_screenshot;
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onToggle}
      activeOpacity={0.85}
      style={[
        styles.cell,
        !isSelected && styles.cellExcluded,
      ]}
    >
      {/* Image ou placeholder */}
      {photo.path && photo.path !== "" ? (
        <Image
          source={{ uri: `file://${photo.path}` }}
          style={styles.cellImg}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.cellImg, styles.cellPlaceholder]}>
          <Text style={{ fontSize: 28 }}>📷</Text>
        </View>
      )}

      {/* Overlay si exclu */}
      {!isSelected && (
        <View style={styles.cellOverlay} />
      )}

      {/* Score bar */}
      <View style={styles.cellBottom}>
        <ScoreBar score={photo.score} />
      </View>

      {/* Selection badge */}
      <View style={[styles.cellBadge, isSelected && styles.cellBadgeOn]}>
        {isSelected && <Text style={styles.cellCheck}>✓</Text>}
      </View>

      {/* Issue pill */}
      {hasIssue && (
        <View style={styles.issuePill}>
          <Text style={styles.issueText}>
            {photo.is_blurry ? "flou" :
             photo.is_duplicate ? "doublon" : "écran"}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Photo Modal ──────────────────────────────────────────────────────────────
function PhotoModal({ photo, isSelected, onToggle, onClose }) {
  if (!photo) return null;
  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={() => {}}>
          {/* Photo */}
          {photo.path ? (
            <Image source={{ uri: `file://${photo.path}` }}
              style={styles.modalImg} resizeMode="cover" />
          ) : (
            <View style={[styles.modalImg, styles.cellPlaceholder]}>
              <Text style={{ fontSize: 64 }}>📷</Text>
            </View>
          )}

          {/* Info */}
          <View style={styles.modalInfo}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
              <View>
                <Text style={styles.modalTitle}>{photo.filename}</Text>
                <Text style={styles.modalSub}>{photo.date_str}</Text>
              </View>
              <Pill
                label={isSelected ? "Sélectionnée" : "Exclue"}
                color={isSelected ? Colors.green : Colors.red}
              />
            </View>

            <SectionLabel>Qualité</SectionLabel>
            <ScoreBar score={photo.score} style={{ marginBottom: 12 }} />

            {photo.place && (
              <>
                <SectionLabel>Lieu</SectionLabel>
                <Text style={styles.modalSub}>📍 {photo.place}</Text>
              </>
            )}

            {photo.camera && (
              <Text style={[styles.modalSub, { marginTop: 4 }]}>
                📷 {photo.camera}
              </Text>
            )}
          </View>

          {/* Actions */}
          <View style={styles.modalBtns}>
            <TouchableOpacity
              onPress={onToggle}
              style={[styles.modalBtn, {
                backgroundColor: isSelected ? Colors.red + "20" : Colors.green + "20",
                borderColor:     isSelected ? Colors.red         : Colors.green,
              }]}
            >
              <Text style={{ color: isSelected ? Colors.red : Colors.green,
                fontSize: 14, fontWeight: "600" }}>
                {isSelected ? "✗  Exclure" : "✓  Sélectionner"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.modalBtnClose}>
              <Text style={{ color: Colors.muted, fontSize: 14 }}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  bg:       { flex: 1, backgroundColor: Colors.bg },
  center:   { flex: 1, backgroundColor: Colors.bg, alignItems: "center",
              justifyContent: "center" },
  loadTxt:  { marginTop: 12, color: Colors.muted, fontSize: 14 },

  filterBar: { flexDirection: "row", alignItems: "center", padding: 12,
               paddingBottom: 8, gap: 6, backgroundColor: Colors.surface,
               borderBottomWidth: 1, borderBottomColor: Colors.border },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
               backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  filterActive: { backgroundColor: Colors.gold + "20", borderColor: Colors.gold },
  filterTxt:    { fontSize: 12, color: Colors.muted, fontWeight: "500" },
  filterTxtActive: { color: Colors.gold },
  filterCount: { marginLeft: "auto", fontSize: 12, color: Colors.muted,
                 fontFamily: "Courier" },

  grid:    { padding: 16, paddingBottom: 0 },
  row:     { gap: GAP, marginBottom: GAP },
  actions: { flexDirection: "row", gap: 8, marginBottom: 12 },
  actionBtn: { flex: 1, backgroundColor: Colors.card, borderRadius: Radii.sm,
               paddingVertical: 9, alignItems: "center",
               borderWidth: 1, borderColor: Colors.border },
  actionBtnGold: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  actionBtnTxt:  { fontSize: 12, color: Colors.cream, fontWeight: "500" },

  // Cell
  cell:          { width: CELL_W, height: CELL_W, borderRadius: Radii.sm,
                   overflow: "hidden", position: "relative" },
  cellExcluded:  { opacity: 0.4 },
  cellImg:       { width: "100%", height: "100%" },
  cellPlaceholder:{ backgroundColor: Colors.card, alignItems: "center", justifyContent: "center" },
  cellOverlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)" },
  cellBottom:    { position: "absolute", bottom: 0, left: 0, right: 0,
                   padding: 4, backgroundColor: "rgba(0,0,0,0.6)" },
  cellBadge:     { position: "absolute", top: 5, right: 5, width: 20, height: 20,
                   borderRadius: 10, borderWidth: 2, borderColor: Colors.muted,
                   backgroundColor: "rgba(0,0,0,0.5)",
                   alignItems: "center", justifyContent: "center" },
  cellBadgeOn:   { backgroundColor: Colors.gold, borderColor: Colors.gold },
  cellCheck:     { fontSize: 11, color: "#0C0A08", fontWeight: "800" },
  issuePill:     { position: "absolute", top: 5, left: 5,
                   backgroundColor: Colors.red + "EE",
                   paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6 },
  issueText:     { fontSize: 8, color: "#fff", fontWeight: "600" },

  // Bottom bar
  bottomBar: { flexDirection: "row", gap: 10, padding: 16, paddingBottom: 28,
               backgroundColor: Colors.surface, borderTopWidth: 1,
               borderTopColor: Colors.border },

  // Modal
  modalBg:    { flex: 1, backgroundColor: "rgba(0,0,0,0.88)",
                justifyContent: "flex-end" },
  modalCard:  { backgroundColor: Colors.card, borderTopLeftRadius: 24,
                borderTopRightRadius: 24, overflow: "hidden",
                borderTopWidth: 1, borderColor: Colors.border },
  modalImg:   { width: "100%", height: 220 },
  modalInfo:  { padding: 20 },
  modalTitle: { fontSize: 15, fontWeight: "600", color: Colors.cream,
                marginBottom: 2 },
  modalSub:   { fontSize: 13, color: Colors.muted },
  modalBtns:  { flexDirection: "row", gap: 10, padding: 16, paddingTop: 0,
                paddingBottom: 36 },
  modalBtn:   { flex: 1, borderRadius: Radii.md, paddingVertical: 13,
                alignItems: "center", borderWidth: 1.5 },
  modalBtnClose: { flex: 1, borderRadius: Radii.md, paddingVertical: 13,
                   alignItems: "center", backgroundColor: Colors.bg,
                   borderWidth: 1, borderColor: Colors.border },
});
