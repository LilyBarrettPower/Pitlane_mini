import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { apiFetch } from "../../../../../assets/api";
import { useAuth } from "../../../../../context/AuthContext";
import { globalStyles } from "../../../../../constants/styles";
import { colors } from "../../../../../constants/theme";
import { Button, ErrorBanner, LoadingState, PageHeader, Panel, Screen } from "../../../../../components/ui/kit";
import PressureProgression from "../../../../../components/PressureProgression";


type Vehicle = {
    _id: string;
    name?: string;
    racingNumber?: string;
    make?: string;
    model?: string;
};

type Tyre = {
    _id: string;
    vehicleId: string | Vehicle;
    brand: string;
    spec?: string;
    currentSet?: string;
    size?: string;
    position?: string;
    fiaSerial?: string;
    condition: string;
    heatCycles?: number;
    kmTotal?: number;
    notes?: string;
};

type CornerValues = {
    LF?: number;
    RF?: number;
    LR?: number;
    RR?: number;
};

type PressureCheck = {
    _id: string;
    stage: "start" | "mid" | "end";
    lapNumber?: number;
    pressurePsi: CornerValues;
    rimTempC?: CornerValues;
    recordedAt?: string;
    notes?: string;
};

type TyreSetHistoryItem = {
    eventName: string;
    runName: string;
    lapsDone?: string;
    tyreRunId: string;
    pressureChecks: PressureCheck[];
};

export default function TyreSetDetailPage() {
    const { token } = useAuth();

    const { vehicleId, setName } =
        useLocalSearchParams<{
            vehicleId: string;
            setName: string;
        }>();

    const [tyres, setTyres] = useState<Tyre[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [history, setHistory] = useState<TyreSetHistoryItem[]>([]);

    const [vehicle, setVehicle] = useState<Vehicle | null>(null);

    async function fetchTyreSet() {
        if (!token || !vehicleId) return;

        const data = await apiFetch(
            `/tyres?vehicleId=${vehicleId}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );


        const matchingTyres = (data.tyres || []).filter(
            (tyre: Tyre) =>
                tyre.currentSet
                    ?.trim()
                    .toLowerCase() ===
                String(setName)
                    .trim()
                    .toLowerCase()
        );

        setTyres(matchingTyres);
    }

    async function fetchPressureHistory() {
        if (!token || !vehicleId || !setName) return;

        const data = await apiFetch(
            `/tyre-runs/history?vehicleId=${vehicleId}&currentSet=${encodeURIComponent(
                String(setName)
            )}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        setHistory(data.history || []);
    }

    async function fetchVehicle() {
        if (!token || !vehicleId) return;

        const data = await apiFetch(
            `/vehicles/${vehicleId}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        setVehicle(data.vehicle || data);
    }

    useEffect(() => {
        async function loadPage() {
            if (!token || !vehicleId || !setName) {
                return;
            }

            try {
                setIsLoading(true);
                setErrorMessage("");

                await Promise.all([
                    fetchTyreSet(),
                    fetchVehicle(),
                    fetchPressureHistory(),
                ]);
            } catch (error) {
                setErrorMessage(error instanceof Error ? error.message : "Failed to load tyre set");
            } finally {
                setIsLoading(false);
            }
        }

        loadPage();
    }, [token, vehicleId, setName]);

    function formatVehicleName(vehicle: Vehicle) {
        if (vehicle.name) {
            return vehicle.name;
        }

        const makeModel = [
            vehicle.make,
            vehicle.model,
        ]
            .filter(Boolean)
            .join(" ");

        if (makeModel) {
            return makeModel;
        }

        if (vehicle.racingNumber) {
            return vehicle.racingNumber;
        }

        return "Unnamed Vehicle";
    }

    function getVehicleName() {
        if (!vehicle) {
            return "Unknown vehicle";
        }
        return formatVehicleName(vehicle);
    }

    function getAverageHeatCycles() {
        if (tyres.length === 0) return 0;
        const total = tyres.reduce(
            (sum, tyre) => sum + (tyre.heatCycles ?? 0), 0
        );
        return total / tyres.length;
    }

    function getAverageDistance() {
        if (tyres.length === 0) return 0;
        const total = tyres.reduce(
            (sum, tyre) => sum + (tyre.kmTotal ?? 0), 0
        );
        return total / tyres.length;
    }

    async function handleDeleteSet() {
        try {
            setIsDeleting(true);
            setErrorMessage("");

            await apiFetch("/tyres/set", {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    vehicleId,
                    currentSet: setName,
                }),
            });

            setShowDeleteModal(false);
            router.replace("/tyres");
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to delete tyre set");
        } finally {
            setIsDeleting(false);
        }
    }

    if (isLoading && tyres.length === 0) {
        return (
            <Screen>
                <LoadingState />
            </Screen>
        );
    }

    if (tyres.length === 0) {
        return (
            <Screen>
                <PageHeader title={String(setName || "Tyre set")} onBack={() => router.navigate("/tyres" as any)} backLabel="Tyres" />
                <ErrorBanner message={errorMessage || "Tyre set not found"} />
            </Screen>
        );
    }

    return (
        <Screen>
                <PageHeader
                    eyebrow="Tyre set"
                    title={String(setName)}
                    subtitle={[getVehicleName(), tyres[0]?.brand, tyres[0]?.spec].filter(Boolean).join(" · ")}
                    onBack={() => router.navigate("/tyres" as any)}
                    backLabel="Tyres"
                    actions={
                        <Button
                            label="Delete Set"
                            icon="trash-outline"
                            variant="ghost"
                            onPress={() => {
                                setErrorMessage("");
                                setShowDeleteModal(true);
                            }}
                        />
                    }
                />

                {!showDeleteModal ? <ErrorBanner message={errorMessage} /> : null}

                <View style={styles.statRow}>
                    <View style={styles.statTile}>
                        <Text style={styles.statLabel}>AVG MILEAGE</Text>
                        <Text style={styles.statValue}>
                            {getAverageDistance().toFixed(0)}
                            <Text style={styles.statUnit}> km</Text>
                        </Text>
                    </View>
                    <View style={styles.statTile}>
                        <Text style={styles.statLabel}>AVG HEAT CYCLES</Text>
                        <Text style={styles.statValue}>{getAverageHeatCycles().toFixed(1)}</Text>
                    </View>
                    <View style={styles.statTile}>
                        <Text style={styles.statLabel}>TYRES</Text>
                        <Text style={styles.statValue}>
                            {tyres.length}
                            <Text style={styles.statUnit}> / 4</Text>
                        </Text>
                    </View>
                    <View style={styles.statTile}>
                        <Text style={styles.statLabel}>RUNS</Text>
                        <Text style={styles.statValue}>{history.length}</Text>
                    </View>
                </View>

                <Panel title="Pressure Check History" icon="speedometer-outline">

                    {history.length === 0 ? (
                        <Text style={globalStyles.subText}>
                            No pressure checks recorded for this set.
                        </Text>
                    ) : (
                        history.map((item, index) => (
                            <View
                                key={`${item.tyreRunId}-${index}`}
                                style={styles.historyCard}
                            >
                                <View style={styles.historyHeader}>
                                    <Text style={styles.eventTitle}>
                                        {item.eventName}
                                    </Text>
                                    <Text style={globalStyles.subText}>
                                        {item.runName} · {item.lapsDone ?? 0} laps
                                    </Text>
                                </View>

                                {/* Start -> Mid -> End for this run, side by side */}
                                <PressureProgression checks={item.pressureChecks} />

                            </View>
                        ))
                    )}
                </Panel>

                <Modal
                    visible={showDeleteModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => {
                        if (!isDeleting) {
                            setShowDeleteModal(false);
                        }
                    }}
                >
                    <View
                        style={
                            globalStyles.modalOverlay
                        }
                    >
                        <View
                            style={
                                globalStyles.modalCard
                            }
                        >
                            <Text
                                style={
                                    globalStyles.modalTitle
                                }
                            >
                                Delete tyre set?
                            </Text>

                            <Text
                                style={globalStyles.text}
                            >
                                Are you sure you want to
                                delete {setName}?
                            </Text>

                            <Text
                                style={
                                    globalStyles.subText
                                }
                            >
                                This will archive all tyres
                                belonging to this set.
                            </Text>

                            {errorMessage ? (
                                <Text
                                    style={
                                        globalStyles.errorText
                                    }
                                >
                                    {errorMessage}
                                </Text>
                            ) : null}

                            <View
                                style={styles.actionRow}
                            >
                                <Pressable
                                    style={
                                        globalStyles.buttonPrimary
                                    }
                                    onPress={() => {
                                        setErrorMessage("");
                                        setShowDeleteModal(
                                            false
                                        );
                                    }}
                                    disabled={isDeleting}
                                >
                                    <Text
                                        style={
                                            globalStyles.buttonPrimaryText
                                        }
                                    >
                                        Cancel
                                    </Text>
                                </Pressable>

                                <Pressable
                                    style={[
                                        globalStyles.buttonDanger,
                                        isDeleting &&
                                        globalStyles.buttonDisabled,
                                    ]}
                                    onPress={
                                        handleDeleteSet
                                    }
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <ActivityIndicator
                                            color="#ffffff"
                                        />
                                    ) : (
                                        <Text
                                            style={
                                                globalStyles.buttonPrimaryText
                                            }
                                        >
                                            Yes, Delete Set
                                        </Text>
                                    )}
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </Modal>
        </Screen>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: 24,
        gap: 16,
    },

    titleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
    },

    titleText: {
        flex: 1,
        gap: 3,
    },

    actionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        marginTop: 14,
    },

    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#374151",
    },

    infoLabel: {
        color: "#9ca3af",
        fontSize: 14,
        fontWeight: "600",
    },

    infoValue: {
        color: "#f3f4f6",
        fontSize: 14,
        fontWeight: "700",
        textAlign: "right",
        flexShrink: 1,
    },
    historyCard: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.borderDark,
        borderRadius: 14,
        padding: 16,
        marginTop: 12,
        gap: 14,
    },

    historyHeader: {
        gap: 3,
    },

    eventTitle: {
        color: "#ffffff",
        fontSize: 18,
        fontWeight: "800",
    },

    runTitle: {
        color: "#d1d5db",
        fontSize: 15,
        fontWeight: "700",
    },

    checkCard: {
        backgroundColor: "#1f2937",
        borderRadius: 10,
        padding: 12,
        marginTop: 8,
        gap: 8,
    },

    checkHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    checkTitle: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "800",
    },

    checkLap: {
        color: "#9ca3af",
        fontSize: 12,
        fontWeight: "600",
    },

    pressureGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },

    cornerCard: {
        flexGrow: 1,
        flexBasis: "45%",
        backgroundColor: "#111827",
        borderRadius: 8,
        padding: 10,
    },

    cornerLabel: {
        color: "#ffffff",
        fontSize: 15,
        fontWeight: "800",
    },

    pressureValue: {
        color: "#f3f4f6",
        fontSize: 14,
        fontWeight: "700",
        marginTop: 4,
    },

    rimTempValue: {
        color: "#9ca3af",
        fontSize: 12,
        marginTop: 2,
    },

    checkNotes: {
        color: "#d1d5db",
        fontSize: 12,
    },

    // ----- Redesigned layout -----
    statRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    statTile: {
        flexGrow: 1,
        flexBasis: 150,
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.borderDark,
        padding: 16,
        gap: 8,
    },
    statLabel: {
        color: colors.textMuted,
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 1,
    },
    statValue: {
        color: colors.textPrimary,
        fontSize: 26,
        fontWeight: "800",
        fontVariant: ["tabular-nums"],
    },
    statUnit: {
        color: colors.textMuted,
        fontSize: 13,
        fontWeight: "600",
    },
});
