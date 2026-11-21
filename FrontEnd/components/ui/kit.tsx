// Shared building blocks for every page, matching the dashboard's look.
// Import what you need: import { Screen, PageHeader, Button, Panel } from "../components/ui/kit";

import { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { colors, spacing, WIDE_BREAKPOINT } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";

export type IconName = keyof typeof Ionicons.glyphMap;

// True on tablets / laptops / web, false on phones
export function useIsWide() {
  const { width } = useWindowDimensions();
  return width >= WIDE_BREAKPOINT;
}

// ---------- Screen: safe area + scrolling + page width/padding ----------

export function Screen({
  children,
  refreshing,
  onRefresh,
  scroll = true,
}: {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  scroll?: boolean;
}) {
  const isWide = useIsWide();
  const contentStyle = [styles.screenContent, !isWide && styles.screenContentNarrow];

  return (
    <SafeAreaView style={styles.screen}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={contentStyle}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor="#ffffff" />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[contentStyle, styles.flex]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

// ---------- PageHeader: eyebrow, big title, subtitle, actions ----------

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  onBack,
  backLabel = "Back",
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  actions?: ReactNode;
}) {
  // Viewers can't change anything - say so, so missing buttons don't look like a bug
  const { user } = useAuth();
  const isViewOnly = user?.role === "viewer";
  const headerActions = isViewOnly ? <Badge label="View only" tone="neutral" /> : actions;

  return (
    <View style={styles.pageHeader}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={8} style={styles.backLink}>
          <Ionicons name="chevron-back" size={16} color={colors.primaryLight} />
          <Text style={styles.backLinkText}>{backLabel}</Text>
        </Pressable>
      ) : null}

      <View style={styles.pageHeaderRow}>
        <View style={styles.pageHeaderText}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
          <Text style={styles.pageTitle}>{title}</Text>
          {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
        </View>

        {headerActions ? <View style={styles.pageHeaderActions}>{headerActions}</View> : null}
      </View>
    </View>
  );
}

// ---------- Button ----------

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  loading,
  disabled,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: "sm" | "md";
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const textColor = variant === "ghost" ? colors.primaryLight : colors.textPrimary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        size === "sm" && styles.buttonSm,
        styles[`button_${variant}`],
        (disabled || loading) && styles.buttonDisabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={size === "sm" ? 15 : 17} color={textColor} /> : null}
          <Text style={[styles.buttonText, size === "sm" && styles.buttonTextSm, { color: textColor }]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

// ---------- Panel: titled card ----------

export function Panel({
  title,
  icon,
  actionLabel,
  onAction,
  children,
  style,
}: {
  title?: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.panel, style]}>
      {title ? (
        <View style={styles.panelHeader}>
          <View style={styles.panelTitleRow}>
            {icon ? <Ionicons name={icon} size={16} color={colors.textMuted} /> : null}
            <Text style={styles.panelTitle}>{title}</Text>
          </View>

          {actionLabel && onAction ? (
            <Pressable onPress={onAction} hitSlop={8}>
              <Text style={styles.panelAction}>{actionLabel} ›</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {children}
    </View>
  );
}

// ---------- Small pieces ----------

type BadgeTone = "neutral" | "live" | "severe" | "warning" | "primary";

export function Badge({ label, tone = "neutral" }: { label: string; tone?: BadgeTone }) {
  return (
    <View style={[styles.badge, styles[`badge_${tone}`]]}>
      <Text style={[styles.badgeText, styles[`badgeText_${tone}`]]}>{label}</Text>
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: IconName;
  title?: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={22} color={colors.textMuted} />
      </View>
      {title ? <Text style={styles.emptyTitle}>{title}</Text> : null}
      <Text style={styles.emptyText}>{text}</Text>
      {action}
    </View>
  );
}

// Small uppercase label above a group of rows, e.g. "UPCOMING"
export function SectionLabel({ children, spaced }: { children: string; spaced?: boolean }) {
  return <Text style={[styles.sectionLabel, spaced && styles.sectionLabelSpaced]}>{children.toUpperCase()}</Text>;
}

// Label / value pair, for detail grids
export function Field({ label, value }: { label: string; value?: string | number | null }) {
  const display = value === undefined || value === null || value === "" ? "—" : String(value);

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label.toUpperCase()}</Text>
      <Text style={styles.fieldValue}>{display}</Text>
    </View>
  );
}

export function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <View style={styles.errorBanner}>
      <Ionicons name="alert-circle" size={16} color={colors.error} />
      <Text style={styles.errorBannerText}>{message}</Text>
    </View>
  );
}

export function LoadingState() {
  return <ActivityIndicator color="#ffffff" style={styles.loading} />;
}

// Round initials avatar, e.g. for drivers and users
export function Avatar({ name, size = 40 }: { name?: string; size?: number }) {
  const initials =
    (name || "?")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "?";

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

// Responsive grid: GridItems wrap onto new rows; each item's `minWidth`
// sets roughly how wide a column is before it wraps
export function Grid({ children }: { children: ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

export function GridItem({ children, minWidth = 300 }: { children: ReactNode; minWidth?: number }) {
  return <View style={[styles.gridItem, { flexBasis: minWidth }]}>{children}</View>;
}

// ---------- Styles ----------

const styles = StyleSheet.create({
  flex: { flex: 1 },

  pressed: { opacity: 0.8 },

  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  screenContent: {
    padding: spacing.pagePadding,
    gap: 20,
    width: "100%",
  },

  screenContentNarrow: {
    padding: spacing.pagePaddingNarrow,
    gap: 16,
  },

  // Page header
  pageHeader: {
    gap: 10,
    marginBottom: 4,
  },

  backLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
  },

  backLinkText: {
    color: colors.primaryLight,
    fontSize: 14,
    fontWeight: "700",
  },

  pageHeaderRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 16,
  },

  pageHeaderText: {
    flexShrink: 1,
    gap: 4,
  },

  eyebrow: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
  },

  pageTitle: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "800",
  },

  pageSubtitle: {
    color: colors.textSecondary,
    fontSize: 15,
  },

  pageHeaderActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  // Buttons
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: spacing.radiusMd,
    borderWidth: 1,
    borderColor: "transparent",
  },

  buttonSm: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },

  button_primary: {
    backgroundColor: colors.primary,
  },

  button_secondary: {
    backgroundColor: colors.card,
    borderColor: colors.borderDark,
  },

  button_danger: {
    backgroundColor: colors.danger,
  },

  button_ghost: {
    backgroundColor: "transparent",
  },

  buttonDisabled: {
    opacity: 0.55,
  },

  buttonText: {
    fontSize: 15,
    fontWeight: "700",
  },

  buttonTextSm: {
    fontSize: 13,
  },

  // Panel
  panel: {
    backgroundColor: colors.card,
    borderRadius: spacing.radiusLg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: 20,
  },

  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  panelTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  panelTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "800",
  },

  panelAction: {
    color: colors.primaryLight,
    fontSize: 13,
    fontWeight: "700",
  },

  // Badge
  badge: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },

  badge_neutral: { backgroundColor: colors.borderDark },
  badgeText_neutral: { color: "#e5e7eb" },

  badge_live: { backgroundColor: colors.liveSoft },
  badgeText_live: { color: "#86efac" },

  badge_severe: { backgroundColor: colors.severeSoft },
  badgeText_severe: { color: "#fca5a5" },

  badge_warning: { backgroundColor: colors.warningSoft },
  badgeText_warning: { color: "#fcd34d" },

  badge_primary: { backgroundColor: colors.primarySoft },
  badgeText_primary: { color: "#93c5fd" },

  // Empty state
  emptyState: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 28,
    paddingHorizontal: 16,
  },

  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },

  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
  },

  sectionLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
  },

  sectionLabelSpaced: {
    marginTop: 12,
  },

  // Field
  field: {
    gap: 4,
    minWidth: 140,
    flexGrow: 1,
    flexBasis: 140,
  },

  fieldLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },

  fieldValue: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },

  // Error
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.severeSoft,
    borderRadius: 10,
    padding: 12,
  },

  errorBannerText: {
    color: colors.error,
    flexShrink: 1,
  },

  loading: {
    marginTop: 40,
  },

  // Avatar
  avatar: {
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#93c5fd",
    fontWeight: "800",
  },

  // Grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },

  gridItem: {
    flexGrow: 1,
    minWidth: 0,
  },
});
