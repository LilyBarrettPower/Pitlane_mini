import { useEffect, useState } from "react";
import { StyleSheet, Text, View, Modal, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "../../../../../assets/api";
import { useAuth } from "../../../../../context/AuthContext";
import { useCan } from "../../../../../constants/permissions";
import { globalStyles } from "../../../../../constants/styles";
import { colors } from "../../../../../constants/theme";
import SetupModal from "../../../../../components/SetupModal";
import {
    SetupCustomValue,
    SetupField,
    CORNERS,
    activeSetupFields,
    customValuesToMap,
} from "../../../../../constants/setupFields";
import {
    Button,
    EmptyState,
    ErrorBanner,
    Field,
    LoadingState,
    PageHeader,
    Panel,
    Screen,
    useIsWide,
} from "../../../../../components/ui/kit";


type SetUp = {
    _id: string;
    vehicleId: string;
    version: string;
    springNm?: { front?: number; rear?: number };
    arbPos?: { front?: number; rear?: number };
    rideHeight?: { front?: number; rear?: number };
    camber?: { front?: string, rear?: string };
    toe?: { front?: string, rear?: string };
    packers?: { front?: string; rear?: string };
    diffPreload?: number;
    brakeBias?: string;
    wingHole?: string;
    splitter?: string;
    notes?: string;
    customValues?: SetupCustomValue[];
};

// One row per event, from GET /run-setups/setup/:setUpId/events
type SetUpEventSummary = {
    eventId: string;
    eventName: string;
    startDate?: string;
    endDate?: string;
    trackName?: string;
    runCount: number;
    laps: number;
    bestLapS: number | null;
};

// e.g. 92.415 -> "1:32.415"
function formatLapTime(seconds: number | null) {
    if (seconds === null || !Number.isFinite(seconds)) return "-";

    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3).padStart(6, "0");

    return `${mins}:${secs}`;
}

// e.g. "12 Apr 2026" or "12 Apr 2026 – 13 Apr 2026"
function formatEventDates(startDate?: string, endDate?: string) {
    const format = (date: string) =>
        new Date(date).toLocaleDateString("en-NZ", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });

    if (!startDate) return "";
    const start = format(startDate);
    const end = endDate ? format(endDate) : start;
    return start === end ? start : `${start} – ${end}`;
}

export default function SetupDetailPage() {
    const { id, setupId } = useLocalSearchParams<{ id: string; setupId: string }>();
    const { token } = useAuth();
    const canManage = useCan("manage");
    const canSetups = useCan("setups");

    const [setup, setSetup] = useState<SetUp | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showSetupModal, setShowSetupModal] = useState(false);
    const [allSetups, setAllSetups] = useState<SetUp[]>([]);
    const [setUpEvents, setSetUpEvents] = useState<SetUpEventSummary[]>([]);

    async function fetchSetUpEvents() {
        try {
            const data = await apiFetch(`/run-setups/setup/${setupId}/events`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setSetUpEvents(data.events || []);
        } catch (error) {
            // Not critical - the rest of the setup page still works without it
            console.error("Failed to load setup events", error);
        }
    }


    async function fetchSetup() {
        try {
            setIsLoading(true);
            setErrorMessage("");

            const data = await apiFetch(`/setups/${setupId}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setSetup(data.setup);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to load setup");
        } finally {
            setIsLoading(false)
        }
    }

    async function fetchAllSetupsForVehicle() {
        const data = await apiFetch(`/setups?vehicleId=${id}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        setAllSetups(data.setups || []);
    }

    // The vehicle's custom setup fields
    const [vehicleFields, setVehicleFields] = useState<SetupField[]>([]);

    async function fetchVehicleFields() {
        try {
            const data = await apiFetch(`/vehicles/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setVehicleFields(data.vehicle?.setupFields || []);
        } catch {
            // Not critical - the built-in fields still show
        }
    }

    useEffect(() => {
        if (setupId && token) {
            fetchSetup();
            fetchSetUpEvents();
        }
        if (id && token) {
            fetchAllSetupsForVehicle();
            fetchVehicleFields();
        }
    }, [id, setupId, token]);


    const isWide = useIsWide();

    async function handleDeleteSetup() {
        try {
            setIsLoading(true);
            setErrorMessage("");

            await apiFetch(`/setups/${setupId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setShowDeleteModal(false);

            // The setup is gone, so go back to the vehicle
            router.navigate({ pathname: "/vehicles/[id]", params: { id: String(id) } });
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : "Failed to remove setup"
            );
        } finally {
            setIsLoading(false);
        }
    }

    if (isLoading && !setup) {
        return (
            <Screen>
                <LoadingState />
            </Screen>
        );
    }

    if (!setup) {
        return (
            <Screen>
                <PageHeader title="Setup" onBack={() => router.navigate({ pathname: "/vehicles/[id]", params: { id: String(id) } })} />
                <ErrorBanner message={errorMessage || "Setup not found"} />
            </Screen>
        );
    }

    // Custom fields: front/rear ones join the spec table, single ones the
    // Drivetrain & Aero panel. Removed fields aren't shown.
    const customFields = activeSetupFields(vehicleFields);
    const customValues = customValuesToMap(setup.customValues);

    // Front / rear values shown as a two-column spec table
    const frontRearRows: {
        key: string;
        label: string;
        front?: string | number;
        rear?: string | number;
        unit?: string;
    }[] = [
        { key: "springs", label: "Springs", front: setup.springNm?.front, rear: setup.springNm?.rear, unit: "N/mm" },
        { key: "arb", label: "Anti-roll bar", front: setup.arbPos?.front, rear: setup.arbPos?.rear },
        { key: "rideHeight", label: "Ride height", front: setup.rideHeight?.front, rear: setup.rideHeight?.rear, unit: "mm" },
        { key: "camber", label: "Camber", front: setup.camber?.front, rear: setup.camber?.rear },
        { key: "toe", label: "Toe", front: setup.toe?.front, rear: setup.toe?.rear },
        { key: "packers", label: "Packers", front: setup.packers?.front, rear: setup.packers?.rear },
        ...customFields
            .filter((field) => field.kind === "frontRear")
            .map((field) => ({
                key: field._id,
                label: field.label,
                unit: field.unit,
                front: customValues[field._id]?.front,
                rear: customValues[field._id]?.rear,
            })),
    ];

    const showValue = (value?: string | number) =>
        value === undefined || value === null || value === "" ? "—" : String(value);

    const suspensionPanel = (
        <Panel title="Suspension & Alignment" icon="git-compare-outline">
            <View style={styles.tableHead}>
                <Text style={[styles.tableHeadText, styles.colLabel]}>SETTING</Text>
                <Text style={[styles.tableHeadText, styles.colValue]}>FRONT</Text>
                <Text style={[styles.tableHeadText, styles.colValue]}>REAR</Text>
            </View>

            {frontRearRows.map((row, index) => (
                <View
                    key={row.key}
                    style={[styles.tableRow, index === frontRearRows.length - 1 && styles.tableRowLast]}
                >
                    <View style={styles.colLabel}>
                        <Text style={styles.rowLabel}>{row.label}</Text>
                        {row.unit ? <Text style={styles.rowUnit}>{row.unit}</Text> : null}
                    </View>
                    <Text style={[styles.rowValue, styles.colValue]}>{showValue(row.front)}</Text>
                    <Text style={[styles.rowValue, styles.colValue]}>{showValue(row.rear)}</Text>
                </View>
            ))}
        </Panel>
    );

    // Custom fields with a value per corner (only shown if the car has any)
    const cornerFields = customFields.filter((field) => field.kind === "corners");

    const cornersPanel =
        cornerFields.length > 0 ? (
            <Panel title="Per Corner" icon="grid-outline">
                <View style={styles.tableHead}>
                    <Text style={[styles.tableHeadText, styles.colLabel]}>SETTING</Text>
                    {CORNERS.map((corner) => (
                        <Text key={corner.key} style={[styles.tableHeadText, styles.colCorner]}>
                            {corner.label}
                        </Text>
                    ))}
                </View>

                {cornerFields.map((field, index) => (
                    <View
                        key={field._id}
                        style={[styles.tableRow, index === cornerFields.length - 1 && styles.tableRowLast]}
                    >
                        <View style={styles.colLabel}>
                            <Text style={styles.rowLabel}>{field.label}</Text>
                            {field.unit ? <Text style={styles.rowUnit}>{field.unit}</Text> : null}
                        </View>
                        {CORNERS.map((corner) => (
                            <Text key={corner.key} style={[styles.rowValue, styles.colCorner]}>
                                {showValue(customValues[field._id]?.[corner.key])}
                            </Text>
                        ))}
                    </View>
                ))}
            </Panel>
        ) : null;

    const otherPanel = (
        <Panel title="Drivetrain & Aero" icon="options-outline">
            <View style={styles.fieldGrid}>
                <Field label="Diff preload" value={setup.diffPreload} />
                <Field label="Brake bias" value={setup.brakeBias} />
                <Field label="Wing hole" value={setup.wingHole} />
                <Field label="Splitter" value={setup.splitter} />
                {customFields
                    .filter((field) => field.kind === "single")
                    .map((field) => (
                        <Field
                            key={field._id}
                            label={field.unit ? `${field.label} (${field.unit})` : field.label}
                            value={customValues[field._id]?.value}
                        />
                    ))}
            </View>
        </Panel>
    );

    const notesPanel = (
        <Panel title="Notes" icon="document-text-outline">
            <Text style={setup.notes ? styles.notes : styles.muted}>
                {setup.notes || "No notes for this setup."}
            </Text>
        </Panel>
    );

    const eventsPanel = (
        <Panel title="Events Used At" icon="flag-outline">
            {setUpEvents.length === 0 ? (
                <EmptyState icon="flag-outline" text="Not used at any events yet." />
            ) : (
                setUpEvents.map((item) => (
                    <Pressable
                        key={item.eventId}
                        style={({ pressed }) => [styles.eventRow, pressed && styles.pressed]}
                        onPress={() =>
                            router.push({
                                pathname: "/events/[id]" as any,
                                params: { id: item.eventId },
                            })
                        }
                    >
                        <View style={styles.eventInfo}>
                            <Text style={styles.eventName}>{item.eventName}</Text>
                            <Text style={globalStyles.subText}>
                                {[formatEventDates(item.startDate, item.endDate), item.trackName]
                                    .filter(Boolean)
                                    .join(" · ")}
                            </Text>
                            <Text style={styles.eventStats}>
                                {item.runCount} {item.runCount === 1 ? "run" : "runs"} · {item.laps} laps · Best{" "}
                                <Text style={styles.eventBest}>{formatLapTime(item.bestLapS)}</Text>
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </Pressable>
                ))
            )}
        </Panel>
    );

    return (
        <Screen>
            <PageHeader
                eyebrow="Setup sheet"
                title={`Setup ${setup.version}`}
                onBack={() => router.navigate({ pathname: "/vehicles/[id]", params: { id: String(id) } })}
                backLabel="Vehicle"
                actions={
                    <>
                        {canSetups ? (
                            <Button
                                label="Edit"
                                icon="create-outline"
                                variant="secondary"
                                onPress={() => setShowSetupModal(true)}
                            />
                        ) : null}
                        {canManage ? (
                            <Button
                                label="Delete"
                                icon="trash-outline"
                                variant="ghost"
                                onPress={() => setShowDeleteModal(true)}
                            />
                        ) : null}
                    </>
                }
            />

            <ErrorBanner message={errorMessage} />

            {isWide ? (
                <View style={styles.columns}>
                    <View style={styles.colMain}>
                        {suspensionPanel}
                        {cornersPanel}
                        {eventsPanel}
                    </View>
                    <View style={styles.colSide}>
                        {otherPanel}
                        {notesPanel}
                    </View>
                </View>
            ) : (
                <>
                    {suspensionPanel}
                    {cornersPanel}
                    {otherPanel}
                    {notesPanel}
                    {eventsPanel}
                </>
            )}

            <Modal
                visible={showDeleteModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDeleteModal(false)}
            >
                <View style={globalStyles.modalOverlay}>
                    <View style={globalStyles.modalCard}>
                        <Text style={globalStyles.modalTitle}>Delete setup?</Text>
                        <Text style={globalStyles.text}>
                            Setup {setup.version} will be removed from this vehicle.
                        </Text>

                        <View style={styles.modalActions}>
                            <Button
                                label="Cancel"
                                variant="secondary"
                                onPress={() => setShowDeleteModal(false)}
                                disabled={isLoading}
                            />
                            <Button label="Delete" variant="danger" onPress={handleDeleteSetup} loading={isLoading} />
                        </View>
                    </View>
                </View>
            </Modal>

            <SetupModal
                visible={showSetupModal}
                vehicleId={setup.vehicleId}
                setup={setup}
                existingSetups={allSetups}
                onClose={() => {
                    setShowSetupModal(false);
                    // Fields may have been added / renamed / removed in the modal
                    fetchVehicleFields();
                }}
                onSaved={() => {
                    fetchSetup();
                    fetchAllSetupsForVehicle();
                }}
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    columns: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 20,
    },
    colMain: {
        flex: 3,
        gap: 20,
    },
    colSide: {
        flex: 2,
        gap: 20,
    },
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
    colLabel: {
        flex: 1.4,
    },
    colValue: {
        flex: 1,
        textAlign: "right",
    },
    colCorner: {
        flex: 0.8,
        textAlign: "right",
    },
    rowLabel: {
        color: colors.textSecondary,
        fontSize: 15,
        fontWeight: "600",
    },
    rowUnit: {
        color: colors.textMuted,
        fontSize: 12,
    },
    rowValue: {
        color: colors.textPrimary,
        fontSize: 16,
        fontWeight: "700",
        fontVariant: ["tabular-nums"],
    },
    fieldGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 18,
    },
    notes: {
        color: colors.textSecondary,
        fontSize: 15,
        lineHeight: 22,
    },
    muted: {
        color: colors.textMuted,
        fontSize: 15,
    },
    eventRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
    },
    eventInfo: {
        flex: 1,
        gap: 3,
    },
    eventName: {
        color: colors.textPrimary,
        fontSize: 15,
        fontWeight: "800",
    },
    eventStats: {
        color: colors.textSecondary,
        fontSize: 13,
        marginTop: 2,
    },
    eventBest: {
        color: colors.textPrimary,
        fontWeight: "700",
        fontVariant: ["tabular-nums"],
    },
    pressed: {
        opacity: 0.8,
    },
    modalActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 4,
    },
});
