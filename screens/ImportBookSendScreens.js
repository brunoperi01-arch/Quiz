// screens/ImportScreen.js
import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from "react-native";
import * as MediaLibrary from "expo-media-library";
import { Colors, Radii } from "../theme";
import {
  GoldButton, GhostButton, SectionLabel,
  ProgressBar, Card, RowItem, EmptyState,
} from "../components";
import { PERIODS, countPhotos, fetchPhotoAssets } from "../hooks/usePhotos";
import { ping, uploadPhotos, startScan, waitForJob } from "../services/api";

export function ImportScreen({ navigation }) {
  const [permission, setPerm]   = useState(null);
  const [serverOk,  setServer]  = useState(null);
  const [period,    setPeriod]  = useState(2);
  const [count,     setCount]   = useState(null);
  const [counting,  setCounting]= useState(false);
  const [step,      setStep]    = useState("idle"); // idle|loading|uploading|analyzing|done
  const [progress,  setProgress]= useState(0);
  const [message,   setMessage] = useState("");
  const [skipBlurry,    setSkipBlurry]    = useState(true);
  const [skipDups,      setSkipDups]      = useState(true);
  const [skipScreens,   setSkipScreens]   = useState(true);

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setPerm(status === "granted");
      try { await ping(); setServer(true); } catch { setServer(false); }
    })();
  }, []);

  const selectPeriod = async (idx) => {
    setPeriod(idx); setCounting(true);
    const n = await countPhotos(idx);
    setCount(n); setCounting(false);
  };

  useEffect(() => { if (permission) selectPeriod(period); }, [permission]);

  const launch = async () => {
    if (!count) return;
    setStep("loading"); setProgress(0); setMessage("Lecture de la galerie…");
    try {
      const assets = await fetchPhotoAssets(period, (done, total) => {
        setMessage(`Lecture : ${done} / ${total} photos`);
        setProgress(done / total * 0.15);
      });

      setStep("uploading"); setMessage(`Envoi de ${assets.length} photos…`);
      await uploadPhotos(assets, (p) => {
        setProgress(0.15 + p * 0.45);
        setMessage(`Upload : ${Math.round(p * assets.length)} / ${assets.length}`);
      });

      setStep("analyzing"); setMessage("Analyse en cours sur le Mac…");
      const jobId = await startScan({ skipBlurry, skipDuplicates: skipDups, skipScreenshots: skipScreens });
      await waitForJob(jobId, (p, msg) => {
        setProgress(0.6 + p * 0.4);
        setMessage(msg);
      });

      setStep("done"); setMessage("Albums créés !");
    } catch (e) {
      Alert.alert("Erreur", e.message || "Une erreur est survenue");
      setStep("idle");
    }
  };

  if (permission === false) return (
    <EmptyState emoji="🔒" title="Accès photos requis"
      subtitle={"Réglages → Confidentialité\n→ Photos → Mémoire → Accès complet"} />
  );

  if (step === "done") return (
    <View style={s.center}>
      <Text style={{ fontSize: 64, marginBottom: 16 }}>🎉</Text>
      <Text style={s.doneTitle}>Analyse terminée !</Text>
      <Text style={s.doneSub}>{message}</Text>
      <GoldButton title="Voir mes albums →"
        onPress={() => navigation.navigate("AlbumsTab")} style={s.fullBtn} />
      <GhostButton title="Recommencer"
        onPress={() => setStep("idle")} style={[s.fullBtn, { marginTop: 8 }]} />
    </View>
  );

  if (step !== "idle") return (
    <View style={s.center}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>
        {step === "uploading" ? "📤" : "⚙️"}
      </Text>
      <Text style={s.doneTitle}>
        {step === "loading"   ? "Lecture…"   :
         step === "uploading" ? "Envoi…"     : "Analyse…"}
      </Text>
      <Text style={s.doneSub}>{message}</Text>
      <ProgressBar progress={progress} style={s.progressBar} />
      <Text style={{ color: Colors.gold, fontWeight: "700", fontFamily: "Courier" }}>
        {Math.round(progress * 100)} %
      </Text>
      <Text style={s.hint}>🔒 Traitement sur votre Mac via Wi-Fi local</Text>
    </View>
  );

  return (
    <ScrollView style={s.bg} contentContainerStyle={s.container}>
      {/* Statut serveur */}
      <Card style={[s.serverCard, { borderLeftColor: serverOk ? Colors.green : Colors.red }]}>
        <Text style={s.serverTitle}>
          {serverOk === null ? "⏳ Connexion…" :
           serverOk ? "✓ Mac connecté" : "✗ Mac inaccessible"}
        </Text>
        {!serverOk && serverOk !== null && (
          <Text style={s.serverHint}>
            Lancez : <Text style={{ color: Colors.gold }}>python setup_and_run.py --wifi</Text>
          </Text>
        )}
      </Card>

      {/* Période */}
      <SectionLabel>Période à importer</SectionLabel>
      <Card style={s.sectionCard}>
        {PERIODS.map((p, i) => (
          <TouchableOpacity key={i} onPress={() => selectPeriod(i)}
            style={[s.periodRow, i < PERIODS.length - 1 && s.periodBorder]}>
            <View style={[s.radio, period === i && s.radioOn]} />
            <Text style={[s.periodLabel, period === i && { color: Colors.gold }]}>
              {p.label}
            </Text>
            {period === i && (
              counting
                ? <ActivityIndicator size="small" color={Colors.gold} />
                : <Text style={s.countBadge}>{count ?? "—"}</Text>
            )}
          </TouchableOpacity>
        ))}
      </Card>

      {/* Filtres */}
      <SectionLabel>Filtres automatiques</SectionLabel>
      <Card style={s.sectionCard}>
        {[
          ["🌫️  Ignorer les photos floues",    skipBlurry,  setSkipBlurry],
          ["🔁  Supprimer les doublons",        skipDups,    setSkipDups],
          ["📱  Exclure les captures d'écran",  skipScreens, setSkipScreens],
        ].map(([label, val, set]) => (
          <TouchableOpacity key={label} onPress={() => set(!val)}
            style={s.filterRow}>
            <View style={[s.checkbox, val && s.checkboxOn]}>
              {val && <Text style={{ color: "#000", fontSize: 11, fontWeight: "800" }}>✓</Text>}
            </View>
            <Text style={s.filterLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </Card>

      {count != null && (
        <View style={s.summary}>
          <Text style={s.summaryText}>
            {count} photos · {PERIODS[period].label}
          </Text>
        </View>
      )}

      <GoldButton
        title={`🚀  Analyser ${count ? count + " photos" : "…"}`}
        onPress={launch}
        disabled={!count || !serverOk || counting}
        style={s.fullBtn}
      />
      <Text style={s.hint}>
        🔒 Envoi via Wi-Fi local · Aucune donnée vers internet
      </Text>
    </ScrollView>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BOOK SCREEN
// ══════════════════════════════════════════════════════════════════════════════

import { getAlbums } from "../services/api";
import { useFocusEffect } from "@react-navigation/native";

const STYLES_DATA = [
  { id:"familial", icon:"🏠", label:"Familial",  desc:"Chaleureux, coloré" },
  { id:"voyage",   icon:"✈️", label:"Voyage",    desc:"Sobre, typographique" },
  { id:"luxe",     icon:"🖤", label:"Luxe",      desc:"Minimaliste, élégant" },
  { id:"enfance",  icon:"🌸", label:"Enfance",   desc:"Doux, pastel" },
];
const FORMATS_DATA = [
  { id:"square",    icon:"⬛", label:"Carré\n20×20" },
  { id:"landscape", icon:"▬",  label:"Paysage\nA4" },
  { id:"portrait",  icon:"▮",  label:"Portrait\nA4" },
];

export function BookScreen({ navigation }) {
  const [style,  setStyle]  = useState("familial");
  const [format, setFormat] = useState("square");
  const [dpi,    setDpi]    = useState(300);
  const [albums, setAlbums] = useState([]);

  useFocusEffect(useCallback(() => {
    getAlbums().then(a => setAlbums(a || [])).catch(() => {});
  }, []));

  const totalSel = albums.reduce((s,a) =>
    s + (a.selected_photo_ids?.length ?? 0), 0);

  return (
    <ScrollView style={s.bg} contentContainerStyle={s.container}>
      <SectionLabel>Style du livre</SectionLabel>
      <View style={s.styleGrid}>
        {STYLES_DATA.map(st => (
          <TouchableOpacity key={st.id} onPress={() => setStyle(st.id)}
            style={[s.styleCard, style === st.id && s.styleCardOn]}>
            <Text style={{ fontSize: 28, marginBottom: 6 }}>{st.icon}</Text>
            <Text style={[s.styleLabel, style === st.id && { color: Colors.gold }]}>
              {st.label}
            </Text>
            <Text style={s.styleDesc}>{st.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionLabel style={{ marginTop: 16 }}>Format</SectionLabel>
      <View style={s.formatRow}>
        {FORMATS_DATA.map(f => (
          <TouchableOpacity key={f.id} onPress={() => setFormat(f.id)}
            style={[s.formatBtn, format === f.id && s.formatBtnOn]}>
            <Text style={{ fontSize: 22, marginBottom: 4 }}>{f.icon}</Text>
            <Text style={[s.formatLabel, format === f.id && { color: Colors.gold }]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionLabel style={{ marginTop: 16 }}>Résolution</SectionLabel>
      <View style={s.formatRow}>
        {[150, 200, 300].map(d => (
          <TouchableOpacity key={d} onPress={() => setDpi(d)}
            style={[s.formatBtn, dpi === d && s.formatBtnOn]}>
            <Text style={[s.formatLabel, dpi === d && { color: Colors.gold }]}>
              {d} dpi{"\n"}
              <Text style={{ fontSize: 10 }}>
                {d === 300 ? "Pro" : d === 200 ? "Bien" : "Standard"}
              </Text>
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Résumé */}
      <Card style={[s.sectionCard, { marginTop: 20 }]}>
        <RowItem label="Style"   value={STYLES_DATA.find(x=>x.id===style)?.label} />
        <RowItem label="Format"  value={FORMATS_DATA.find(x=>x.id===format)?.label.replace("\n"," ")} />
        <RowItem label="Photos"  value={`${totalSel} sélectionnées`} />
        <RowItem label="Albums"  value={`${albums.length} chapitres`} />
        <RowItem label="Qualité" value={`${dpi} dpi`} />
      </Card>

      <GoldButton
        title="🚀  Envoyer au Mac pour impression"
        onPress={() => navigation.navigate("SendTab", {
          bookStyle: style, bookFormat: format, dpi,
          albumIds: albums.map(a => a.id), totalPhotos: totalSel,
        })}
        disabled={totalSel === 0}
        style={[s.fullBtn, { marginTop: 20 }]}
      />
    </ScrollView>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SEND SCREEN
// ══════════════════════════════════════════════════════════════════════════════

import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { startPDF, waitForJob as waitJob, pdfDownloadUrl } from "../services/api";

export function SendScreen({ navigation, route }) {
  const params = route.params || {};
  const [step, setStep]         = useState("confirm"); // confirm|generating|done
  const [progress, setProgress] = useState(0);
  const [message,  setMessage]  = useState("");
  const [pdfPath,  setPdfPath]  = useState(null);
  const [pages,    setPages]    = useState(null);

  const generate = async () => {
    setStep("generating"); setProgress(0);
    try {
      const jobId = await startPDF(
        params.albumIds, params.bookStyle, params.bookFormat, params.dpi
      );
      const result = await waitJob(jobId, (p, msg) => {
        setProgress(p); setMessage(msg);
      });

      const url   = pdfDownloadUrl(jobId);
      const local = FileSystem.documentDirectory + "memoire_livre.pdf";
      await FileSystem.downloadAsync(url, local);

      setPdfPath(local);
      setPages(result?.pages);
      setStep("done");
    } catch (e) {
      Alert.alert("Erreur", e.message);
      setStep("confirm");
    }
  };

  const share = async () => {
    if (!pdfPath) return;
    const ok = await Sharing.isAvailableAsync();
    if (ok) await Sharing.shareAsync(pdfPath, { mimeType: "application/pdf" });
    else Alert.alert("Partage indisponible");
  };

  if (step === "done") return (
    <ScrollView style={s.bg} contentContainerStyle={[s.container, s.center]}>
      <Text style={{ fontSize: 72, marginBottom: 16 }}>🎉</Text>
      <Text style={s.doneTitle}>Votre livre est prêt !</Text>
      <Text style={s.doneSub}>
        ~{pages} pages · PDF haute résolution
      </Text>
      {[
        { icon:"📥", label:"Télécharger",     sub:"Enregistre sur l'iPhone",     onPress: share,   primary: true },
        { icon:"📤", label:"Partager",         sub:"AirDrop, Mail, Messages",     onPress: share },
        { icon:"🖨️", label:"CEWE",             sub:"cewe-print.fr",               onPress: () => {} },
        { icon:"📦", label:"Photobox",         sub:"photobox.fr",                 onPress: () => {} },
      ].map((a, i) => (
        <TouchableOpacity key={i} onPress={a.onPress}
          style={[s.sendAction, a.primary && s.sendActionGold]}>
          <Text style={{ fontSize: 24, marginRight: 12 }}>{a.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.sendActionLabel, a.primary && { color: "#0C0A08" }]}>
              {a.label}
            </Text>
            <Text style={[s.sendActionSub, a.primary && { color: "#0C0A0880" }]}>
              {a.sub}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
      <TouchableOpacity onPress={() => { setStep("confirm"); navigation.navigate("AlbumsTab"); }}>
        <Text style={{ color: Colors.muted, fontSize: 13, marginTop: 12 }}>
          Retour aux albums →
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  if (step === "generating") return (
    <View style={[s.bg, s.center]}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>📖</Text>
      <Text style={s.doneTitle}>Génération en cours…</Text>
      <Text style={s.doneSub}>{message}</Text>
      <ProgressBar progress={progress} style={s.progressBar} />
      <Text style={{ color: Colors.gold, fontWeight: "700", fontFamily: "Courier" }}>
        {Math.round(progress * 100)} %
      </Text>
    </View>
  );

  // Confirm step
  const STYLE_LABELS = { familial:"Familial", voyage:"Voyage", luxe:"Luxe", enfance:"Enfance" };
  const FORMAT_LABELS = { square:"Carré 20×20", landscape:"Paysage A4", portrait:"Portrait A4" };

  return (
    <ScrollView style={s.bg} contentContainerStyle={s.container}>
      <Text style={s.sendTitle}>Prêt à envoyer au Mac</Text>
      <Text style={s.sendSub}>
        {params.totalPhotos} photos dans {params.albumIds?.length} albums
      </Text>

      <Card style={s.sectionCard}>
        <RowItem label="Style"   value={STYLE_LABELS[params.bookStyle]  || "—"} />
        <RowItem label="Format"  value={FORMAT_LABELS[params.bookFormat] || "—"} />
        <RowItem label="Photos"  value={`${params.totalPhotos} sélectionnées`} />
        <RowItem label="Qualité" value={`${params.dpi} dpi`} />
      </Card>

      <View style={s.localBadge}>
        <Text style={s.localText}>
          🔒  Envoi via Wi-Fi local{"\n"}
          Aucune donnée vers internet
        </Text>
      </View>

      <GoldButton
        title="🚀  Générer le livre PDF"
        onPress={generate}
        style={s.fullBtn}
      />
    </ScrollView>
  );
}

// ─── SHARED STYLES ───────────────────────────────────────────────────────────
const { useCallback } = require("react");

const s = StyleSheet.create({
  bg:          { flex: 1, backgroundColor: Colors.bg },
  center:      { flex: 1, alignItems: "center", justifyContent: "center" },
  container:   { padding: 20, paddingBottom: 48 },

  serverCard:  { padding: 14, marginBottom: 16, borderLeftWidth: 4 },
  serverTitle: { fontSize: 14, fontWeight: "600", color: Colors.cream, marginBottom: 2 },
  serverHint:  { fontSize: 12, color: Colors.muted, lineHeight: 20 },

  sectionCard: { padding: 0, overflow: "hidden", marginBottom: 4 },
  periodRow:   { flexDirection: "row", alignItems: "center",
                 paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  periodBorder:{ borderBottomWidth: 1, borderBottomColor: Colors.border },
  radio:       { width: 18, height: 18, borderRadius: 9, borderWidth: 2,
                 borderColor: Colors.border },
  radioOn:     { borderColor: Colors.gold, backgroundColor: Colors.gold },
  periodLabel: { flex: 1, fontSize: 15, color: Colors.cream },
  countBadge:  { fontSize: 13, color: Colors.gold, fontWeight: "700", fontFamily: "Courier" },

  filterRow:    { flexDirection: "row", alignItems: "center", gap: 12,
                  paddingHorizontal: 16, paddingVertical: 13,
                  borderBottomWidth: 1, borderBottomColor: Colors.border },
  checkbox:     { width: 22, height: 22, borderRadius: 6, borderWidth: 2,
                  borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  checkboxOn:   { backgroundColor: Colors.gold, borderColor: Colors.gold },
  filterLabel:  { fontSize: 15, color: Colors.cream, flex: 1 },

  summary:      { backgroundColor: Colors.gold + "18", borderRadius: Radii.md,
                  padding: 12, alignItems: "center", marginVertical: 12 },
  summaryText:  { fontSize: 14, color: Colors.gold, fontWeight: "600" },

  fullBtn:     { marginTop: 4 },
  hint:        { fontSize: 12, color: Colors.muted, textAlign: "center",
                 marginTop: 12, lineHeight: 20 },
  progressBar: { width: "100%", marginVertical: 16 },

  doneTitle:   { fontSize: 24, fontWeight: "700", color: Colors.cream,
                 fontFamily: "Georgia", textAlign: "center", marginBottom: 8 },
  doneSub:     { fontSize: 14, color: Colors.muted, textAlign: "center",
                 marginBottom: 24, lineHeight: 22 },

  // Book screen
  styleGrid:   { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  styleCard:   { width: "47.5%", backgroundColor: Colors.card, borderRadius: Radii.md,
                 padding: 14, borderWidth: 1.5, borderColor: Colors.border },
  styleCardOn: { borderColor: Colors.gold, backgroundColor: Colors.gold + "18" },
  styleLabel:  { fontSize: 15, fontWeight: "700", color: Colors.cream,
                 fontFamily: "Georgia", marginBottom: 2 },
  styleDesc:   { fontSize: 11, color: Colors.muted },
  formatRow:   { flexDirection: "row", gap: 8 },
  formatBtn:   { flex: 1, backgroundColor: Colors.card, borderRadius: Radii.md,
                 padding: 12, alignItems: "center", borderWidth: 1.5, borderColor: Colors.border },
  formatBtnOn: { borderColor: Colors.gold, backgroundColor: Colors.gold + "18" },
  formatLabel: { fontSize: 12, color: Colors.cream, textAlign: "center", lineHeight: 18 },

  // Send screen
  sendTitle:    { fontSize: 26, fontWeight: "700", color: Colors.cream,
                  fontFamily: "Georgia", marginBottom: 6 },
  sendSub:      { fontSize: 14, color: Colors.muted, marginBottom: 20, lineHeight: 22 },
  localBadge:   { backgroundColor: Colors.green + "15", borderRadius: Radii.md,
                  padding: 14, borderWidth: 1, borderColor: Colors.green + "40",
                  marginVertical: 16 },
  localText:    { fontSize: 13, color: Colors.green, textAlign: "center", lineHeight: 22 },
  sendAction:   { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card,
                  borderRadius: Radii.lg, padding: 16, marginBottom: 8,
                  borderWidth: 1, borderColor: Colors.border, width: "100%" },
  sendActionGold:{ backgroundColor: Colors.gold, borderColor: Colors.gold },
  sendActionLabel:{ fontSize: 15, fontWeight: "700", color: Colors.cream, fontFamily: "Georgia" },
  sendActionSub: { fontSize: 12, color: Colors.muted, marginTop: 2 },
});
