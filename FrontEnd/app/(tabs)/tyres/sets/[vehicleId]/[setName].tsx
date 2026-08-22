import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { apiFetch } from "../../../../../assets/api";
import { useAuth } from "../../../../../context/AuthContext";
import { globalStyles } from "../../../../../constants/styles";


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

    if (isLoading) {
        return (
            <SafeAreaView style={globalStyles.container}>
                <ActivityIndicator color="#ffffff" />
            </SafeAreaView>
        );
    }

    if (tyres.length === 0) {
        return (
            <SafeAreaView style={globalStyles.container}>
                <View style={styles.content}>
                    <Text style={globalStyles.errorText}>
                        {errorMessage || "Tyre set not found"}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView
            style={globalStyles.container}
        >
            <ScrollView
                contentContainerStyle={styles.content}
            >
                <View style={styles.titleRow}>
                    <View style={styles.titleText}>
                        <Text style={globalStyles.title}>
                            {setName}
                        </Text>

                        <Text
                            style={globalStyles.subText}
                        >
                            {getVehicleName()}
                        </Text>
                    </View>

                    <Pressable
                        style={
                            globalStyles.buttonDangerSmall
                        }
                        onPress={() => {
                            setErrorMessage("");
                            setShowDeleteModal(true);
                        }}
                    >
                        <Text
                            style={
                                globalStyles.smallButtonText
                            }
                        >
                            Delete Set
                        </Text>
                    </Pressable>
                </View>

                {errorMessage ? (
                    <Text
                        style={globalStyles.errorText}
                    >
                        {errorMessage}
                    </Text>
                ) : null}

                <View style={globalStyles.card}>
                    <Text
                        style={
                            globalStyles.sectionTitle
                        }
                    >
                        Set Information
                    </Text>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>
                            Vehicle
                        </Text>

                        <Text style={styles.infoValue}>
                            {getVehicleName()}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>
                            Brand
                        </Text>

                        <Text style={styles.infoValue}>
                            {tyres[0]?.brand || "-"}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>
                            Specification
                        </Text>

                        <Text style={styles.infoValue}>
                            {tyres[0]?.spec || "-"}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>
                            Tyres
                        </Text>

                        <Text style={styles.infoValue}>
                            {tyres.length}/4
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>
                            Heat Cycles
                        </Text>

                        <Text style={styles.infoValue}>
                            {getAverageHeatCycles().toFixed(
                                1
                            )}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>
                            Current Mileage
                        </Text>

                        <Text style={styles.infoValue}>
                            {getAverageDistance().toFixed(
                                0
                            )}{" "}
                            km
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>
                            Runs
                        </Text>

                        <Text style={styles.infoValue}>
                            -
                        </Text>
                    </View>
                </View>

                <View style={globalStyles.card}>
                    <Text style={globalStyles.sectionTitle}>
                        Pressure Check History
                    </Text>

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
                                <Text style={styles.eventTitle}>
                                    {item.eventName}
                                </Text>

                                <Text style={styles.runTitle}>
                                    {item.runName}
                                </Text>

                                <Text style={globalStyles.subText}>
                                    Laps: {item.lapsDone ?? "-"}
                                </Text>

                                {item.pressureChecks.length === 0 ? (
                                    <Text style={globalStyles.subText}>
                                        No checks recorded
                                    </Text>
                                ) : (
                                    item.pressureChecks.map((check) => (
                                        <View
                                            key={check._id}
                                            style={styles.checkCard}
                                        >
                                            <View style={styles.checkHeader}>
                                                <Text style={styles.checkTitle}>
                                                    {check.stage.toUpperCase()}
                                                </Text>

                                                <Text style={styles.checkLap}>
                                                    {check.lapNumber != null
                                                        ? `Lap ${check.lapNumber}`
                                                        : ""}
                                                </Text>
                                            </View>

                                            <View style={styles.pressureGrid}>
                                                {(
                                                    ["LF", "RF", "LR", "RR"] as const
                                                ).map((corner) => (
                                                    <View
                                                        key={corner}
                                                        style={styles.cornerCard}
                                                    >
                                                        <Text
                                                            style={
                                                                styles.cornerLabel
                                                            }
                                                        >
                                                            {corner}
                                                        </Text>

                                                        <Text
                                                            style={
                                                                styles.pressureValue
                                                            }
                                                        >
                                                            {check.pressurePsi?.[
                                                                corner
                                                            ] ?? "-"}{" "}
                                                            psi
                                                        </Text>

                                                        <Text
                                                            style={
                                                                styles.rimTempValue
                                                            }
                                                        >
                                                            Rim:{" "}
                                                            {check.rimTempC?.[
                                                                corner
                                                            ] ?? "-"}
                                                            °C
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>

                                            {check.notes ? (
                                                <Text
                                                    style={
                                                        styles.checkNotes
                                                    }
                                                >
                                                    {check.notes}
                                                </Text>
                                            ) : null}
                                        </View>
                                    ))
                                )}
                            </View>
                        ))
                    )}
                </View>

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
            </ScrollView>
        </SafeAreaView>
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
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#374151",
        borderRadius: 12,
        padding: 14,
        marginTop: 12,
        gap: 8,
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
});