import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, Modal, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "../../../../../assets/api";
import { useAuth } from "../../../../../context/AuthContext";
import { globalStyles } from "../../../../../constants/styles";
import SetupModal from "../../../../../components/SetupModal";


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

    useEffect(() => {
        if (setupId && token) {
            fetchSetup();
            fetchSetUpEvents();
        }
        if (id && token) fetchAllSetupsForVehicle();
    }, [id, setupId, token]);

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

            await fetchSetup();
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : "Failed to remove setup"
            );
        } finally {
            setIsLoading(false);
        }
    }

    if (isLoading) {
        return (
            <SafeAreaView style={globalStyles.container}>
                <ActivityIndicator color="#ffffff" />
            </SafeAreaView>
        );
    }

    if (errorMessage || !setup) {
        return (
            <SafeAreaView style={globalStyles.container}>
                <View style={styles.content}>
                    <Text style={globalStyles.errorText}>{errorMessage || "Setup not found"}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={globalStyles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={globalStyles.title}>Setup {setup.version}</Text>

                <View style={styles.actionRow}>
                    <Pressable style={globalStyles.smallButton}>
                        <Text style={globalStyles.smallButtonText}
                            onPress={() => setShowSetupModal(true)}
                        >Edit setup</Text>
                    </Pressable>
                    <Pressable
                        style={globalStyles.buttonDangerSmall}
                        onPress={() => setShowDeleteModal(true)}
                    >
                        <Text style={globalStyles.smallButtonText}>Delete Setup</Text>
                    </Pressable>
                </View>

                <View style={globalStyles.card}>
                    <Text style={globalStyles.sectionTitle}>Springs</Text>
                    <Text style={globalStyles.cardText}>Front: {setup.springNm?.front || "-"}</Text>
                    <Text style={globalStyles.cardText}>Rear: {setup.springNm?.rear || "-"}</Text>
                </View>

                <View style={globalStyles.card}>
                    <Text style={globalStyles.sectionTitle}>ARB</Text>
                    <Text style={globalStyles.cardText}>Front: {setup.arbPos?.front || "-"}</Text>
                    <Text style={globalStyles.cardText}>Rear: {setup.arbPos?.rear || "-"}</Text>
                </View>

                <View style={globalStyles.card}>
                    <Text style={globalStyles.sectionTitle}>Ride Height</Text>
                    <Text style={globalStyles.cardText}>Front: {setup.rideHeight?.front || "-"}</Text>
                    <Text style={globalStyles.cardText}>Rear: {setup.rideHeight?.rear || "-"}</Text>
                </View>

                <View style={globalStyles.card}>
                    <Text style={globalStyles.sectionTitle}>Alignment</Text>
                    <Text style={globalStyles.cardText}>Camber F/R: {setup.camber?.front || "-"} / {setup.camber?.rear || "-"}</Text>
                    <Text style={globalStyles.cardText}>Toe F/R: {setup.toe?.front || "-"} / {setup.toe?.rear || "-"}</Text>
                </View>

                <View style={globalStyles.card}>
                    <Text style={globalStyles.sectionTitle}>Other</Text>
                    <Text style={globalStyles.cardText}>Packers F/R: {setup.packers?.front || "-"} / {setup.packers?.rear || "-"}</Text>
                    <Text style={globalStyles.cardText}>Diff Preload: {setup.diffPreload || "-"}</Text>
                    <Text style={globalStyles.cardText}>Brake Bias: {setup.brakeBias || "-"}</Text>
                    <Text style={globalStyles.cardText}>Wing Hole: {setup.wingHole || "-"}</Text>
                    <Text style={globalStyles.cardText}>Splitter: {setup.splitter || "-"}</Text>
                    <Text style={globalStyles.cardText}>Notes: {setup.notes || "-"}</Text>
                </View>

                <View style={globalStyles.card}>
                    <Text style={globalStyles.sectionTitle}>Events Used At</Text>

                    {setUpEvents.length === 0 ? (
                        <Text style={globalStyles.cardText}>
                            Not used at any events yet.
                        </Text>
                    ) : (
                        setUpEvents.map((item) => (
                            <Pressable
                                key={item.eventId}
                                style={({ pressed }) => [
                                    styles.eventCard,
                                    pressed && styles.pressed,
                                ]}
                                onPress={() =>
                                    router.push({
                                        pathname: "/events/[id]" as any,
                                        params: { id: item.eventId },
                                    })
                                }
                            >
                                <Text style={styles.eventName}>{item.eventName}</Text>

                                <Text style={globalStyles.subText}>
                                    {[
                                        formatEventDates(item.startDate, item.endDate),
                                        item.trackName,
                                    ]
                                        .filter(Boolean)
                                        .join(" · ")}
                                </Text>

                                <Text style={globalStyles.cardText}>
                                    {item.runCount} {item.runCount === 1 ? "run" : "runs"}
                                    {" · "}
                                    {item.laps} laps
                                    {" · "}
                                    Best {formatLapTime(item.bestLapS)}
                                </Text>
                            </Pressable>
                        ))
                    )}
                </View>

                <Modal
                    visible={showDeleteModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowDeleteModal(false)}
                >
                    <View style={globalStyles.modalOverlay}>
                        <View style={globalStyles.modalCard}>
                            <Text style={globalStyles.modalTitle}>Delete setup?</Text>
                            <Text style={globalStyles.text}>Are you sure you want to delete setup {setup.version}?</Text>

                            <View style={styles.actionRow}>
                                <Pressable
                                    style={globalStyles.buttonPrimary}
                                    onPress={() => setShowDeleteModal(false)}
                                    disabled={isLoading}
                                >
                                    <Text style={globalStyles.buttonPrimaryText}>Cancel</Text>
                                </Pressable>
                                <Pressable
                                    style={[globalStyles.buttonDanger, isLoading && globalStyles.buttonDisabled]}
                                    onPress={handleDeleteSetup}
                                    disabled={isLoading}
                                >
                                    <Text style={globalStyles.buttonPrimaryText}>Yes, Delete</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </Modal>

                <SetupModal 
                    visible={showSetupModal}
                    vehicleId={setup.vehicleId}
                    setup={setup}
                    existingSetups={allSetups}
                    onClose={() => setShowSetupModal(false)}
                    onSaved={() => {
                        fetchSetup();
                        fetchAllSetupsForVehicle();
                    }}
                    />

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: 24,
        gap: 16
    },
    actionRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 14,
    },
    eventCard: {
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#374151",
        borderRadius: 12,
        padding: 14,
        marginTop: 12,
        gap: 6,
    },
    eventName: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "800",
    },
    pressed: {
        opacity: 0.75,
    },
});