// theme.js — Design tokens de Mémoire

export const Colors = {
  bg:      "#0C0A08",
  surface: "#161410",
  card:    "#1E1A14",
  border:  "#2A2418",
  gold:    "#C8956C",
  goldL:   "#E4B48A",
  cream:   "#F5EDD8",
  muted:   "#6B5E4A",
  green:   "#4CAF82",
  red:     "#E05252",
  blue:    "#5B9BD8",
  overlay: "rgba(0,0,0,0.85)",
};

export const Typography = {
  display: {
    fontFamily: "Georgia",
    fontWeight: "700",
    color: Colors.cream,
  },
  title: {
    fontFamily: "Georgia",
    fontWeight: "600",
    color: Colors.cream,
  },
  body: {
    fontFamily: "System",
    fontWeight: "400",
    color: Colors.cream,
  },
  label: {
    fontFamily: "System",
    fontWeight: "500",
    color: Colors.muted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  mono: {
    fontFamily: "Courier",
    color: Colors.muted,
  },
};

export const Radii = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 28,
};

export const Shadows = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  glow: (color) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  }),
};

export default { Colors, Typography, Radii, Shadows };
