// One run's tyre pressure checks as a progression table: corners down the
// side, checks across (Start -> Mid -> End), plus the change from the first
// to the last check.

import { ScrollView, StyleSheet, Text, View } from "react-native";

import { colors } from "../constants/theme";

type CornerValues = {
    LF?: number;
    RF?: number;
    LR?: number;
    RR?: number;
};

export type PressureCheckForTable = {
    _id: string;
    stage: "start" | "mid" | "end";
    lapNumber?: number;
    pressurePsi?: CornerValues;
    rimTempC?: CornerValues;
    recordedAt?: string;
    notes?: string;
};

const CORNERS = ["LF", "RF", "LR", "RR"] as const;

const STAGE_ORDER: Record<PressureCheckForTable["stage"], number> = { start: 0, mid: 1, end: 2 };

const STAGE_LABEL: Record<PressureCheckForTable["stage"], string> = {
    start: "START",
    mid: "MID",
    end: "END",
};

// Start first, then any mid checks in the order they were taken, then end
function orderChecks(checks: PressureCheckForTable[]) {
    return [...checks].sort((a, b) => {
        const byStage = STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage];
        if (byStage !== 0) return byStage;
        return new Date(a.recordedAt || 0).getTime() - new Date(b.recordedAt || 0).getTime();
    });
}

function isNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

function formatPsi(value?: number) {
    return isNumber(value) ? value.toFixed(1) : "—";
}

function formatTemp(value?: number) {
    return isNumber(value) ? String(Math.round(value)) : "—";
}

// Pressure change between the first and last checks that have a value
function pressureChange(checks: PressureCheckForTable[], corner: (typeof CORNERS)[number]) {
    const values = checks.map((check) => check.pressurePsi?.[corner]).filter(isNumber);
    if (values.length < 2) return null;
    return values[values.length - 1] - values[0];
}

export default function PressureProgression({ checks }: { checks: PressureCheckForTable[] }) {
    if (checks.length === 0) {
        return <Text style={styles.empty}>No checks recorded for this run.</Text>;
    }

    const ordered = orderChecks(checks);
    const notes = ordered.filter((check) => check.notes);

    return (
        <View style={styles.wrapper}>
            {/* Scrolls sideways only if there are lots of mid checks */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.table}>
                    {/* Header: one column per check, then the change */}
                    <View style={[styles.row, styles.headerRow]}>
                        <View style={styles.labelCell} />
                        {ordered.map((check) => (
                            <View key={check._id} style={styles.valueCell}>
                                <Text style={styles.headerText}>{STAGE_LABEL[check.stage]}</Text>
                                {check.lapNumber != null ? (
                                    <Text style={styles.headerSub}>Lap {check.lapNumber}</Text>
                                ) : null}
                            </View>
                        ))}
                        <View style={styles.valueCell}>
                            <Text style={styles.headerText}>CHANGE</Text>
                        </View>
                    </View>

                    {CORNERS.map((corner, index) => {
                        const change = pressureChange(ordered, corner);

                        return (
                            <View
                                key={corner}
                                style={[styles.cornerBlock, index === CORNERS.length - 1 && styles.cornerBlockLast]}
                            >
                                {/* Pressure */}
                                <View style={styles.row}>
                                    <View style={styles.labelCell}>
                                        <Text style={styles.cornerText}>{corner}</Text>
                                        <Text style={styles.metricText}>psi</Text>
                                    </View>
                                    {ordered.map((check) => (
                                        <View key={check._id} style={styles.valueCell}>
                                            <Text style={styles.psiValue}>{formatPsi(check.pressurePsi?.[corner])}</Text>
                                        </View>
                                    ))}
                                    <View style={styles.valueCell}>
                                        <Text
                                            style={[
                                                styles.changeValue,
                                                change !== null && change > 0 && styles.changeUp,
                                                change !== null && change < 0 && styles.changeDown,
                                            ]}
                                        >
                                            {change === null
                                                ? "—"
                                                : `${change > 0 ? "+" : ""}${change.toFixed(1)}`}
                                        </Text>
                                    </View>
                                </View>

                                {/* Rim temperature */}
                                <View style={styles.row}>
                                    <View style={styles.labelCell}>
                                        <Text style={styles.metricText}>rim °C</Text>
                                    </View>
                                    {ordered.map((check) => (
                                        <View key={check._id} style={styles.valueCell}>
                                            <Text style={styles.tempValue}>{formatTemp(check.rimTempC?.[corner])}</Text>
                                        </View>
                                    ))}
                                    <View style={styles.valueCell} />
                                </View>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

            {notes.length > 0 ? (
                <View style={styles.notes}>
                    {notes.map((check) => (
                        <Text key={check._id} style={styles.noteText}>
                            <Text style={styles.noteLabel}>
                                {STAGE_LABEL[check.stage]}
                                {check.lapNumber != null ? ` · Lap ${check.lapNumber}` : ""}:{" "}
                            </Text>
                            {check.notes}
                        </Text>
                    ))}
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        gap: 10,
    },

    scrollContent: {
        flexGrow: 1,
    },

    table: {
        flexGrow: 1,
    },

    row: {
        flexDirection: "row",
        alignItems: "center",
    },

    headerRow: {
        alignItems: "flex-end",
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderDark,
    },

    labelCell: {
        width: 62,
    },

    valueCell: {
        flex: 1,
        minWidth: 62,
        alignItems: "flex-end",
        paddingLeft: 8,
    },

    headerText: {
        color: colors.textMuted,
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 1,
    },

    headerSub: {
        color: colors.textMuted,
        fontSize: 11,
        marginTop: 2,
    },

    cornerBlock: {
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderDark,
        gap: 2,
    },

    cornerBlockLast: {
        borderBottomWidth: 0,
        paddingBottom: 0,
    },

    cornerText: {
        color: colors.textPrimary,
        fontSize: 14,
        fontWeight: "800",
    },

    metricText: {
        color: colors.textMuted,
        fontSize: 11,
    },

    psiValue: {
        color: colors.textPrimary,
        fontSize: 15,
        fontWeight: "700",
        fontVariant: ["tabular-nums"],
    },

    tempValue: {
        color: colors.textMuted,
        fontSize: 12,
        fontVariant: ["tabular-nums"],
    },

    changeValue: {
        color: colors.textSecondary,
        fontSize: 15,
        fontWeight: "800",
        fontVariant: ["tabular-nums"],
    },

    // Pressure up = amber (tyres heating), down = blue
    changeUp: {
        color: colors.warning,
    },

    changeDown: {
        color: colors.primaryLight,
    },

    notes: {
        gap: 4,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: colors.borderDark,
    },

    noteText: {
        color: colors.textSecondary,
        fontSize: 13,
    },

    noteLabel: {
        color: colors.textMuted,
        fontWeight: "700",
    },

    empty: {
        color: colors.textMuted,
        fontSize: 14,
    },
});
