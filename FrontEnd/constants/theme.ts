export const colors = {
  background: "#111827",
  // Slightly darker than the page - used for the tab bar and inset rows
  backgroundDeep: "#0b1220",
  card: "#1f2937",
  primary: "#2563eb",
  primaryLight: "#60a5fa",
  danger: "#dc2626",
  success: "#34d399",
  error: "#f87171",

  textPrimary: "#ffffff",
  textSecondary: "#d1d5db",
  textMuted: "#9ca3af",

  border: "#6b7280",
  borderDark: "#374151",

  // Status accents (match the dashboard)
  live: "#22c55e",
  liveSoft: "rgba(34, 197, 94, 0.12)",
  severe: "#ef4444",
  severeSoft: "rgba(239, 68, 68, 0.12)",
  warning: "#f59e0b",
  warningSoft: "rgba(245, 158, 11, 0.14)",
  primarySoft: "rgba(37, 99, 235, 0.14)",
  pressedOverlay: "rgba(255, 255, 255, 0.04)",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,

  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 18,
  radiusModal: 20,

  // Page layout (pages use the full screen width)
  pagePadding: 32,
  pagePaddingNarrow: 16,
};

// Below this width the app uses single-column, phone layouts
export const WIDE_BREAKPOINT = 900;

export const typography = {
  title: {
    fontSize: 36,
    fontWeight: "700" as const,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: "700" as const,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
  },
  heading: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
  },
  small: {
    fontSize: 13,
  },
};
