// components/index.js — Composants réutilisables

import React from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
} from "react-native";
import { Colors, Radii, Typography } from "../theme";

// ─── SCORE BAR ───────────────────────────────────────────────────────────────
export function ScoreBar({ score, style }) {
  const color =
    score >= 85 ? Colors.green :
    score >= 65 ? Colors.gold  : Colors.red;

  return (
    <View style={[styles.scoreRow, style]}>
      <View style={styles.scoreBg}>
        <View style={[styles.scoreFill, { width: `${score}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.scoreNum, { color }]}>★{score}</Text>
    </View>
  );
}

// ─── PILL ─────────────────────────────────────────────────────────────────────
export function Pill({ label, color = Colors.gold, style }) {
  return (
    <View style={[styles.pill, {
      backgroundColor: color + "20",
      borderColor: color + "50",
    }, style]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

// ─── SECTION LABEL ────────────────────────────────────────────────────────────
export function SectionLabel({ children, style }) {
  return (
    <Text style={[styles.sectionLabel, style]}>{children}</Text>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
export function StatCard({ value, label, color = Colors.cream }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── GOLD BUTTON ─────────────────────────────────────────────────────────────
export function GoldButton({ title, onPress, disabled, style, textStyle }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.82}
      style={[styles.goldBtn, disabled && styles.goldBtnDisabled, style]}
    >
      <Text style={[styles.goldBtnText, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}

// ─── GHOST BUTTON ────────────────────────────────────────────────────────────
export function GhostButton({ title, onPress, style }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.ghostBtn, style]}
    >
      <Text style={styles.ghostBtnText}>{title}</Text>
    </TouchableOpacity>
  );
}

// ─── PROGRESS BAR ────────────────────────────────────────────────────────────
export function ProgressBar({ progress, color = Colors.gold, style }) {
  return (
    <View style={[styles.progressBg, style]}>
      <View style={[styles.progressFill, {
        width: `${Math.round(progress * 100)}%`,
        backgroundColor: color,
      }]} />
    </View>
  );
}

// ─── CARD WRAPPER ─────────────────────────────────────────────────────────────
export function Card({ children, style, onPress }) {
  const Component = onPress ? TouchableOpacity : View;
  return (
    <Component
      activeOpacity={0.88}
      onPress={onPress}
      style={[styles.card, style]}
    >
      {children}
    </Component>
  );
}

// ─── DIVIDER ──────────────────────────────────────────────────────────────────
export function Divider({ style }) {
  return <View style={[styles.divider, style]} />;
}

// ─── ROW ITEM (pour les résumés) ──────────────────────────────────────────────
export function RowItem({ label, value }) {
  return (
    <View style={styles.rowItem}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────
export function EmptyState({ emoji, title, subtitle, action, onAction }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySub}>{subtitle}</Text>}
      {action && (
        <GoldButton title={action} onPress={onAction} style={{ marginTop: 20, paddingHorizontal: 32 }} />
      )}
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // ScoreBar
  scoreRow:  { flexDirection: "row", alignItems: "center", gap: 6 },
  scoreBg:   { flex: 1, height: 3, backgroundColor: Colors.border, borderRadius: 2, overflow: "hidden" },
  scoreFill: { height: "100%", borderRadius: 2 },
  scoreNum:  { fontFamily: "Courier", fontSize: 11, minWidth: 30, textAlign: "right" },

  // Pill
  pill:     { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
              borderWidth: 1, alignSelf: "flex-start" },
  pillText: { fontSize: 10, fontWeight: "500", letterSpacing: 0.5,
              textTransform: "uppercase" },

  // SectionLabel
  sectionLabel: { fontSize: 10, fontWeight: "600", color: Colors.gold,
                  letterSpacing: 1.5, textTransform: "uppercase",
                  marginBottom: 10, marginTop: 4 },

  // StatCard
  statCard:  { flex: 1, backgroundColor: Colors.card, borderRadius: Radii.md,
               padding: 12, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  statValue: { fontSize: 22, fontWeight: "700", fontFamily: "Georgia" },
  statLabel: { fontSize: 9, color: Colors.muted, letterSpacing: 0.8,
               textTransform: "uppercase", marginTop: 2 },

  // Buttons
  goldBtn:        { backgroundColor: Colors.gold, borderRadius: Radii.lg,
                    paddingVertical: 15, alignItems: "center" },
  goldBtnDisabled:{ opacity: 0.4 },
  goldBtnText:    { color: "#0C0A08", fontSize: 15, fontWeight: "700", letterSpacing: 0.3 },
  ghostBtn:       { borderRadius: Radii.lg, paddingVertical: 14, alignItems: "center",
                    backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border },
  ghostBtnText:   { color: Colors.cream, fontSize: 14, fontWeight: "500" },

  // ProgressBar
  progressBg:   { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },

  // Card
  card: { backgroundColor: Colors.card, borderRadius: Radii.lg,
          borderWidth: 1, borderColor: Colors.border },

  // Divider
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },

  // RowItem
  rowItem:  { flexDirection: "row", justifyContent: "space-between",
              alignItems: "center", paddingVertical: 9,
              borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowLabel: { fontSize: 13, color: Colors.muted },
  rowValue: { fontSize: 13, color: Colors.cream, fontWeight: "500" },

  // EmptyState
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center",
                padding: 40, minHeight: 300 },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: Colors.cream,
                fontFamily: "Georgia", textAlign: "center", marginBottom: 8 },
  emptySub:   { fontSize: 14, color: Colors.muted, textAlign: "center", lineHeight: 22 },
});
