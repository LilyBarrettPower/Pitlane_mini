import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../assets/api";
import { globalStyles } from "../../constants/styles";
import { colors } from "../../constants/theme";

// ---------- Types (shape of GET /dashboard) ----------

type CurrentEvent = {
  eventId: string;
  name: string;
  trackName: string;
  startDate: string;
  endDate: string;
  isLive: boolean;
  vehicles: string[];
  runCount: number;
};

type RunSummary = {
  runId: string;
  runName: string;
  eventVehicleId: string;
  eventId: string | null;
  eventName: string;
  vehicleName: string;
};

type OnTrackRun = RunSummary & {
  outTime: string;
  lapCount: number;
};

type RecentRun = RunSummary & {
  lapsDone: number;
  bestLapS: number | null;
};

type FlaggedTyre = {
  tyreId: string;
  position: string;
  currentSet: string;
  vehicleName: string;
  noteCount: number;
  topCategory: string;
};

type MileageTyre = {
  tyreId: string;
  position: string;
  currentSet: string;
  vehicleName: string;
  kmTotal: number;
  heatCycles: number;
};

type DashboardData = {
  currentEvent: CurrentEvent | null;
  onTrack: OnTrackRun[];
  flaggedTyres: FlaggedTyre[];
  highestMileageTyres: MileageTyre[];
  recentRuns: RecentRun[];
  stats: {
    vehicles: number;
    drivers: number;
    tyres: number;
    eventsThisSeason: number;
  };
};

// ---------- Helpers ----------

const DAY_MS = 24 * 60 * 60 * 1000;

const accent = {
  live: "#22c55e",
  liveSoft: "rgba(34, 197, 94, 0.12)",
  severe: "#ef4444",
  severeSoft: "rgba(239, 68, 68, 0.12)",
  primarySoft: "rgba(37, 99, 235, 0.14)",
};

// e.g. 92.415 -> "1:32.415"
function formatLapTime(seconds: number | null) {
  if (seconds === null || !Number.isFinite(seconds)) return "—";

  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3).padStart(6, "0");

  return `${mins}:${secs}`;
}

function formatShortDate(date: string) {
  return new Date(date).toLocaleDateString("en-NZ", { day: "numeric", month: "short" });
}

function formatDateRange(start: string, end: string) {
  const startLabel = formatShortDate(start);
  const endLabel = formatShortDate(end);
  const year = new Date(end).getFullYear();
  return startLabel === endLabel ? `${startLabel} ${year}` : `${startLabel} – ${endLabel} ${year}`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function daysUntil(date: string) {
  return Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / DAY_MS));
}

function tyreLabel(tyre: { position: string; currentSet: string }) {
  return [tyre.position || "Tyre", tyre.currentSet ? `Set ${tyre.currentSet}` : ""]
    .filter(Boolean)
    .join(" · ");
}

function openRun(run: RunSummary) {
  if (!run.eventId) return;
  router.push(`/events/${run.eventId}/vehicles/${run.eventVehicleId}/runs/${run.runId}`);
}

function openTyre(tyreId: string) {
  router.push({ pathname: "/tyres/[tyreId]", params: { tyreId } });
}

// ---------- Small building blocks ----------

// Pulsing green dot used for anything live
function LiveDot() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.25, duration: 700, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: Platform.OS !== "web" }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.liveDot, { opacity }]} />;
}

function Panel({
  title,
  icon,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
}) {
  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <View style={styles.panelTitleRow}>
          <Ionicons name={icon} size={16} color={colors.textMuted} />
          <Text style={styles.panelTitle}>{title}</Text>
        </View>

        {actionLabel && onAction ? (
          <Pressable onPress={onAction} hitSlop={8}>
            <Text style={styles.panelAction}>{actionLabel} ›</Text>
          </Pressable>
        ) : null}
      </View>

      {children}
    </View>
  );
}

function EmptyState({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={22} color={colors.border} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

// ---------- Page ----------

export default function DashboardPage() {
  const { user, organisation, token, isLoading } = useAuth();

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Tablet / laptop gets a two-column body; phones get one column
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace("/");
    }
  }, [token, isLoading]);

  const fetchDashboard = useCallback(async () => {
    if (!token) return;

    try {
      setErrorMessage("");

      const result = await apiFetch("/dashboard", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setData(result);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load dashboard");
    } finally {
      setIsLoadingData(false);
    }
  }, [token]);

  // Reload whenever the tab comes back into view
  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [fetchDashboard])
  );

  async function handleRefresh() {
    setIsRefreshing(true);
    await fetchDashboard();
    setIsRefreshing(false);
  }

  if (isLoading) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={globalStyles.content}>
          <ActivityIndicator color="#ffffff" />
        </View>
      </SafeAreaView>
    );
  }

  if (!token) {
    return null;
  }

  const firstName = user?.name?.trim().split(" ")[0];
  const todayLabel = new Date().toLocaleDateString("en-NZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const maxKm = Math.max(1, ...(data?.highestMileageTyres.map((tyre) => tyre.kmTotal) || [1]));

  // ----- Sections -----

  const header = (
    <View style={styles.header}>
      <Text style={styles.headerDate}>{todayLabel.toUpperCase()}</Text>
      <Text style={styles.headerTitle}>
        {greeting()}
        {firstName ? `, ${firstName}` : ""}
      </Text>
      {organisation?.name ? <Text style={styles.headerOrg}>{organisation.name}</Text> : null}
    </View>
  );

  const event = data?.currentEvent;

  const hero = event ? (
    <Pressable
      style={({ pressed }) => [styles.hero, event.isLive && styles.heroLive, pressed && styles.pressed]}
      onPress={() => router.push({ pathname: "/events/[id]" as any, params: { id: event.eventId } })}
    >
      <View style={[styles.heroInfo, !isWide && styles.heroInfoNarrow]}>
        <View style={styles.heroEyebrowRow}>
          {event.isLive ? <LiveDot /> : null}
          <Text style={[styles.heroEyebrow, event.isLive && { color: accent.live }]}>
            {event.isLive ? "LIVE NOW" : "NEXT EVENT"}
          </Text>
        </View>

        <Text style={styles.heroTitle}>{event.name}</Text>

        <View style={styles.heroMetaRow}>
          {event.trackName ? (
            <View style={styles.heroMeta}>
              <Ionicons name="location-outline" size={15} color={colors.textMuted} />
              <Text style={styles.heroMetaText}>{event.trackName}</Text>
            </View>
          ) : null}
          <View style={styles.heroMeta}>
            <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
            <Text style={styles.heroMetaText}>{formatDateRange(event.startDate, event.endDate)}</Text>
          </View>
        </View>

        <View style={styles.chipRow}>
          {event.vehicles.length === 0 ? (
            <Text style={styles.heroMetaText}>No cars entered yet</Text>
          ) : (
            event.vehicles.map((vehicle) => (
              <View key={vehicle} style={styles.chip}>
                <Ionicons name="car-sport" size={13} color={colors.textSecondary} />
                <Text style={styles.chipText}>{vehicle}</Text>
              </View>
            ))
          )}
        </View>
      </View>

      <View style={[styles.heroCounter, !isWide && styles.heroCounterNarrow]}>
        <Text style={styles.heroCounterValue}>
          {event.isLive ? event.runCount : daysUntil(event.startDate)}
        </Text>
        <Text style={styles.heroCounterLabel}>
          {event.isLive
            ? event.runCount === 1 ? "RUN SO FAR" : "RUNS SO FAR"
            : daysUntil(event.startDate) === 1 ? "DAY TO GO" : "DAYS TO GO"}
        </Text>
      </View>
    </Pressable>
  ) : (
    <View style={[styles.hero, styles.heroEmpty]}>
      <View style={styles.heroInfo}>
        <Text style={styles.heroEyebrow}>NEXT EVENT</Text>
        <Text style={styles.heroTitle}>Nothing on the calendar</Text>
        <Text style={styles.heroMetaText}>Add your next race weekend or test day to see it here.</Text>
      </View>
      <Pressable
        style={({ pressed }) => [globalStyles.buttonPrimary, pressed && styles.pressed]}
        onPress={() => router.push("/events" as any)}
      >
        <Text style={globalStyles.buttonPrimaryText}>Go to Events</Text>
      </Pressable>
    </View>
  );

  const onTrack =
    data && data.onTrack.length > 0 ? (
      <View style={styles.liveStrip}>
        <View style={styles.liveStripHeader}>
          <LiveDot />
          <Text style={styles.liveStripTitle}>ON TRACK</Text>
        </View>

        <View style={[styles.liveCars, isWide && styles.liveCarsWide]}>
          {data.onTrack.map((run) => (
            <Pressable
              key={run.runId}
              style={({ pressed }) => [styles.liveCar, isWide && styles.liveCarWide, pressed && styles.pressed]}
              onPress={() => openRun(run)}
            >
              <View style={styles.flexShrink}>
                <Text style={styles.rowTitle} numberOfLines={1}>{run.vehicleName}</Text>
                <Text style={styles.rowSub} numberOfLines={1}>{run.runName} · {run.eventName}</Text>
              </View>
              <View style={styles.liveLaps}>
                <Text style={styles.liveLapsValue}>{run.lapCount}</Text>
                <Text style={styles.liveLapsLabel}>{run.lapCount === 1 ? "LAP" : "LAPS"}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    ) : null;

  const kpis = data ? (
    <View style={styles.kpiRow}>
      {[
        { label: "Vehicles", value: data.stats.vehicles, href: "/vehicles", icon: <Ionicons name="car-sport" size={18} color={colors.primary} /> },
        { label: "Drivers", value: data.stats.drivers, href: "/drivers", icon: <Ionicons name="id-card" size={18} color={colors.primary} /> },
        { label: "Active tyres", value: data.stats.tyres, href: "/tyres", icon: <MaterialCommunityIcons name="tire" size={18} color={colors.primary} /> },
        { label: "Events this season", value: data.stats.eventsThisSeason, href: "/events", icon: <Ionicons name="flag" size={18} color={colors.primary} /> },
      ].map((kpi) => (
        <Pressable
          key={kpi.label}
          style={({ pressed }) => [styles.kpiTile, isWide ? styles.kpiTileWide : styles.kpiTileNarrow, pressed && styles.pressed]}
          onPress={() => router.push(kpi.href as any)}
        >
          <View style={styles.kpiIcon}>{kpi.icon}</View>
          <Text style={styles.kpiValue}>{kpi.value}</Text>
          <Text style={styles.kpiLabel}>{kpi.label}</Text>
        </Pressable>
      ))}
    </View>
  ) : null;

  const recentRuns = data ? (
    <Panel title="Recent Runs" icon="stopwatch-outline">
      {data.recentRuns.length === 0 ? (
        <EmptyState icon="stopwatch-outline" text="No runs recorded yet" />
      ) : (
        <>
          <View style={styles.tableHead}>
            <Text style={[styles.tableHeadText, styles.colMain]}>RUN</Text>
            <Text style={[styles.tableHeadText, styles.colLaps]}>LAPS</Text>
            <Text style={[styles.tableHeadText, styles.colBest]}>BEST</Text>
          </View>

          {data.recentRuns.map((run, index) => (
            <Pressable
              key={run.runId}
              style={({ pressed }) => [
                styles.tableRow,
                index === data.recentRuns.length - 1 && styles.tableRowLast,
                pressed && styles.rowPressed,
              ]}
              onPress={() => openRun(run)}
            >
              <View style={styles.colMain}>
                <Text style={styles.rowTitle} numberOfLines={1}>{run.runName}</Text>
                <Text style={styles.rowSub} numberOfLines={1}>{run.vehicleName} · {run.eventName}</Text>
              </View>
              <Text style={[styles.tableCell, styles.colLaps]}>{run.lapsDone}</Text>
              <Text style={[styles.tableCell, styles.tableCellStrong, styles.colBest]}>
                {formatLapTime(run.bestLapS)}
              </Text>
            </Pressable>
          ))}
        </>
      )}
    </Panel>
  ) : null;

  const tyreWatch = data ? (
    <Panel title="Tyre Watch" icon="warning-outline" actionLabel="All tyres" onAction={() => router.push("/tyres" as any)}>
      <Text style={styles.subHeading}>FLAGGED</Text>
      {data.flaggedTyres.length === 0 ? (
        <View style={styles.allClear}>
          <Ionicons name="checkmark-circle" size={16} color={accent.live} />
          <Text style={styles.allClearText}>No punctures, damage or flat spots</Text>
        </View>
      ) : (
        data.flaggedTyres.map((tyre) => (
          <Pressable
            key={tyre.tyreId}
            style={({ pressed }) => [styles.flagRow, pressed && styles.rowPressed]}
            onPress={() => openTyre(tyre.tyreId)}
          >
            <View style={styles.flagBar} />
            <View style={[styles.flexShrink, styles.flagInfo]}>
              <Text style={styles.rowTitle} numberOfLines={1}>{tyreLabel(tyre)}</Text>
              <Text style={styles.rowSub} numberOfLines={1}>{tyre.vehicleName}</Text>
            </View>
            <View style={styles.severeBadge}>
              <Text style={styles.severeBadgeText}>
                {tyre.topCategory}
                {tyre.noteCount > 1 ? ` ×${tyre.noteCount}` : ""}
              </Text>
            </View>
          </Pressable>
        ))
      )}

      <Text style={[styles.subHeading, styles.subHeadingSpaced]}>HIGHEST MILEAGE</Text>
      {data.highestMileageTyres.length === 0 ? (
        <EmptyState icon="speedometer-outline" text="No tyre mileage yet" />
      ) : (
        data.highestMileageTyres.map((tyre) => (
          <Pressable
            key={tyre.tyreId}
            style={({ pressed }) => [styles.mileageRow, pressed && styles.rowPressed]}
            onPress={() => openTyre(tyre.tyreId)}
          >
            <View style={styles.mileageTop}>
              <View style={styles.flexShrink}>
                <Text style={styles.rowTitle} numberOfLines={1}>{tyreLabel(tyre)}</Text>
                <Text style={styles.rowSub} numberOfLines={1}>
                  {tyre.vehicleName} · {tyre.heatCycles} HC
                </Text>
              </View>
              <Text style={styles.mileageValue}>
                {tyre.kmTotal}
                <Text style={styles.mileageUnit}> km</Text>
              </Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${Math.max(4, (tyre.kmTotal / maxKm) * 100)}%` }]} />
            </View>
          </Pressable>
        ))
      )}
    </Panel>
  ) : null;

  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, !isWide && styles.contentNarrow]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#ffffff" />
        }
      >
        {header}

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        ) : null}

        {isLoadingData && !data ? (
          <ActivityIndicator color="#ffffff" style={styles.loader} />
        ) : data ? (
          <>
            {hero}
            {onTrack}
            {kpis}

            <View style={isWide ? styles.columns : styles.stack}>
              <View style={isWide ? styles.colWide : undefined}>{recentRuns}</View>
              <View style={isWide ? styles.colNarrow : undefined}>{tyreWatch}</View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------- Styles ----------

const styles = StyleSheet.create({
  content: {
    padding: 32,
    gap: 20,
    maxWidth: 1180,
    width: "100%",
    alignSelf: "center",
  },

  contentNarrow: {
    padding: 16,
    gap: 16,
  },

  loader: {
    marginTop: 40,
  },

  pressed: {
    opacity: 0.8,
  },

  flexShrink: {
    flexShrink: 1,
  },

  // Header
  header: {
    gap: 4,
    marginBottom: 4,
  },

  headerDate: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
  },

  headerTitle: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "800",
  },

  headerOrg: {
    color: colors.textSecondary,
    fontSize: 15,
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: accent.severeSoft,
    borderRadius: 10,
    padding: 12,
  },

  errorBannerText: {
    color: colors.error,
    flexShrink: 1,
  },

  // Hero
  hero: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 20,
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    padding: 24,
  },

  heroLive: {
    borderLeftColor: accent.live,
  },

  heroEmpty: {
    borderLeftColor: colors.borderDark,
  },

  heroInfo: {
    flex: 1,
    minWidth: 240,
    gap: 8,
  },

  heroInfoNarrow: {
    minWidth: "100%",
  },

  heroEyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  heroEyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
  },

  heroTitle: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: "800",
  },

  heroMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },

  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  heroMetaText: {
    color: colors.textMuted,
    fontSize: 14,
  },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.background,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderDark,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  chipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },

  heroCounter: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 140,
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },

  heroCounterNarrow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
    width: "100%",
  },

  heroCounterValue: {
    color: colors.textPrimary,
    fontSize: 44,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },

  heroCounterLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },

  // Live
  liveDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: accent.live,
  },

  liveStrip: {
    backgroundColor: accent.liveSoft,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.35)",
    padding: 16,
    gap: 12,
  },

  liveStripHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  liveStripTitle: {
    color: accent.live,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
  },

  liveCars: {
    gap: 8,
  },

  liveCarsWide: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  liveCar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
  },

  liveCarWide: {
    flexBasis: 300,
    flexGrow: 1,
  },

  liveLaps: {
    alignItems: "flex-end",
  },

  liveLapsValue: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },

  liveLapsLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },

  // KPIs
  kpiRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  kpiTile: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderDark,
    padding: 16,
    gap: 6,
  },

  kpiTileWide: {
    flex: 1,
  },

  // Two per row on phones
  kpiTileNarrow: {
    flexBasis: "47%",
    flexGrow: 1,
  },

  kpiIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: accent.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  kpiValue: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },

  kpiLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },

  // Body columns
  columns: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 20,
  },

  stack: {
    gap: 16,
  },

  colWide: {
    flex: 3,
  },

  colNarrow: {
    flex: 2,
  },

  // Panels
  panel: {
    backgroundColor: colors.card,
    borderRadius: 18,
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
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },

  emptyState: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 20,
  },

  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },

  rowTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },

  rowSub: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },

  rowPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },

  // Recent runs table
  tableHead: {
    flexDirection: "row",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },

  tableHeadText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },

  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },

  tableRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },

  tableCell: {
    color: colors.textSecondary,
    fontSize: 15,
    fontVariant: ["tabular-nums"],
  },

  tableCellStrong: {
    color: colors.textPrimary,
    fontWeight: "700",
  },

  colMain: {
    flex: 1,
    paddingRight: 12,
  },

  colLaps: {
    width: 56,
    textAlign: "center",
  },

  colBest: {
    width: 90,
    textAlign: "right",
  },

  // Tyre watch
  subHeading: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 8,
  },

  subHeadingSpaced: {
    marginTop: 20,
  },

  allClear: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },

  allClearText: {
    color: colors.textSecondary,
    fontSize: 14,
  },

  flagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingVertical: 10,
    paddingRight: 12,
    marginBottom: 8,
    overflow: "hidden",
  },

  flagBar: {
    alignSelf: "stretch",
    width: 4,
    backgroundColor: accent.severe,
    marginVertical: -10,
  },

  flagInfo: {
    flex: 1,
  },

  severeBadge: {
    backgroundColor: accent.severeSoft,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  severeBadgeText: {
    color: "#fca5a5",
    fontSize: 12,
    fontWeight: "700",
  },

  mileageRow: {
    paddingVertical: 8,
    gap: 8,
  },

  mileageTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },

  mileageValue: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },

  mileageUnit: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },

  barTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.background,
    overflow: "hidden",
  },

  barFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
});
