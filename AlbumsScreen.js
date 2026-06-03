// screens/AlbumsScreen.js

import React, { useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, Alert, TextInput,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Colors, Radii } from "../theme";
import { ScoreBar, Pill, StatCard, GoldButton, EmptyState, Card } from "../components";
import { getAlbums, getStats, renameAlbum, deleteAlbum } from "../services/api";

export default function AlbumsScreen({ navigation }) {
  const [albums,    setAlbums]    = useState([]);
  const [stats,     setStats]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [editId,    setEditId]    = useState(null);
  const [editTitle, setEditTitle] = useState("");

  const load = async () => {
    try {
      const [a, s] = await Promise.all([getAlbums(), getStats()]);
      setAlbums(a || []); setStats(s);
    } catch { /* handled */ }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const confirmRename = async (albumId) => {
    if (!editTitle.trim()) return;
    await renameAlbum(albumId, editTitle.trim());
    setEditId(null); load();
  };

  const confirmDelete = (album) => {
    Alert.alert(
      "Supprimer l'album",
      `Supprimer "${album.title}" ?\nLes photos restent sur votre iPhone.`,
      [
        { text: "Annuler",    style: "cancel" },
        { text: "Supprimer",  style: "destructive",
          onPress: async () => { await deleteAlbum(album.id); load(); } },
      ]
    );
  };

  // ── Album card ─────────────────────────────────────────────────────────────
  const AlbumCard = ({ item, index }) => {
    const selCount = item.selected_photo_ids?.length ?? item.photos_total ?? 0;
    const issueCount = (item.photos_total - selCount);
    const coverColors = ["#4A7C59","#8B5E7A","#5B7A8B","#7A6B8B","#8B7A5B","#5B6B8B"];
    const bg = coverColors[index % coverColors.length];

    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => navigation.navigate("AlbumDetail", { album: item })}
        style={styles.albumCard}
      >
        {/* Cover */}
        <View style={[styles.albumCover, { backgroundColor: bg + "40" }]}>
          <Text style={styles.albumEmoji}>📸</Text>
          <View style={{ flex: 1 }}>
            {editId === item.id ? (
              <View style={styles.editRow}>
                <TextInput
                  value={editTitle}
                  onChangeText={setEditTitle}
                  onSubmitEditing={() => confirmRename(item.id)}
                  autoFocus
                  style={styles.editInput}
                  returnKeyType="done"
                />
                <TouchableOpacity onPress={() => confirmRename(item.id)}
                  style={styles.editOk}>
                  <Text style={{ color: "#000", fontSize: 12, fontWeight: "700" }}>✓</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.albumTitle} numberOfLines={1}>{item.title}</Text>
            )}
            <Text style={styles.albumSub} numberOfLines={1}>
              {item.subtitle || `${item.date_start} · ${item.place || ""}`}
            </Text>
          </View>
          <View style={styles.albumCountBox}>
            <Text style={[styles.albumCountNum, { color: bg }]}>{selCount}</Text>
            <Text style={styles.albumCountLabel}>SELECT.</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.albumFooter}>
          <View style={styles.pillRow}>
            {issueCount > 0 && (
              <Pill label={`${issueCount} exclus`} color={Colors.red} />
            )}
            <Pill label={`${item.photos_total} photos`} color={Colors.muted} />
            {item.place && <Pill label={item.place} color={Colors.blue} />}
          </View>
          <View style={styles.albumActions}>
            <TouchableOpacity onPress={() => { setEditId(item.id); setEditTitle(item.title); }}
              hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
              <Text style={styles.actionIcon}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => confirmDelete(item)}
              hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
              <Text style={styles.actionIcon}>🗑</Text>
            </TouchableOpacity>
            <Text style={{ color: Colors.gold, fontSize: 18 }}>›</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return (
    <View style={styles.center}>
      <Text style={{ fontSize: 36 }}>📁</Text>
      <Text style={styles.loadingText}>Chargement des albums…</Text>
    </View>
  );

  return (
    <View style={styles.bg}>
      <FlatList
        data={albums}
        keyExtractor={a => a.id}
        renderItem={({ item, index }) => <AlbumCard item={item} index={index} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={Colors.gold}
          />
        }
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            {/* Stats */}
            {stats && (
              <View style={styles.statsRow}>
                <StatCard value={stats.photos_total}   label="Photos"   />
                <StatCard value={stats.photos_kept}    label="Conservées" color={Colors.green} />
                <StatCard value={stats.albums_total}   label="Albums"   />
              </View>
            )}
            {/* CTA */}
            {albums.length > 0 && (
              <GoldButton
                title="📖  Créer le livre photo →"
                onPress={() => navigation.navigate("BookTab")}
                style={styles.ctaBtn}
              />
            )}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            emoji="📭"
            title="Aucun album"
            subtitle={"Importez vos photos iPhone\ndepuis l'onglet Import"}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bg:      { flex: 1, backgroundColor: Colors.bg },
  center:  { flex: 1, backgroundColor: Colors.bg, alignItems: "center",
             justifyContent: "center", padding: 32 },
  loadingText: { marginTop: 12, fontSize: 14, color: Colors.muted },

  list:    { padding: 16, paddingBottom: 40 },
  header:  { marginBottom: 16 },

  statsRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  ctaBtn:   { marginBottom: 4 },

  // Album card
  albumCard:   { backgroundColor: Colors.card, borderRadius: Radii.lg,
                 marginBottom: 12, overflow: "hidden",
                 borderWidth: 1, borderColor: Colors.border },
  albumCover:  { flexDirection: "row", alignItems: "center",
                 padding: 14, gap: 12 },
  albumEmoji:  { fontSize: 36 },
  albumTitle:  { fontSize: 16, fontWeight: "700", color: Colors.cream,
                 fontFamily: "Georgia", marginBottom: 3 },
  albumSub:    { fontSize: 12, color: Colors.muted },
  albumCountBox: { alignItems: "center", minWidth: 44 },
  albumCountNum: { fontSize: 20, fontWeight: "700", fontFamily: "Georgia" },
  albumCountLabel: { fontSize: 8, color: Colors.muted, letterSpacing: 0.8,
                     textTransform: "uppercase", marginTop: 1 },
  albumFooter: { flexDirection: "row", justifyContent: "space-between",
                 alignItems: "center", paddingHorizontal: 14, paddingVertical: 10,
                 borderTopWidth: 1, borderTopColor: Colors.border },
  pillRow:     { flexDirection: "row", flexWrap: "wrap", gap: 5, flex: 1 },
  albumActions:{ flexDirection: "row", alignItems: "center", gap: 10, paddingLeft: 8 },
  actionIcon:  { fontSize: 15 },

  // Edit
  editRow:   { flexDirection: "row", alignItems: "center", gap: 6 },
  editInput: { flex: 1, backgroundColor: Colors.bg, color: Colors.cream,
               borderBottomWidth: 1.5, borderBottomColor: Colors.gold,
               fontSize: 15, paddingVertical: 3 },
  editOk:    { backgroundColor: Colors.gold, borderRadius: 6,
               paddingHorizontal: 10, paddingVertical: 5 },
});
