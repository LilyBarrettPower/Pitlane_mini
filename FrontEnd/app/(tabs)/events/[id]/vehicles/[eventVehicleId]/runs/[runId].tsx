import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, Pressable, Modal, TextInput } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { apiFetch } from "../../../../../../../assets/api";
import { useAuth } from "../../../../../../../context/AuthContext";
import { globalStyles } from "../../../../../../../constants/styles";

type Run = {
    _id: string;
    eventVehicleId: string;
    name: string;
    weather?: string;
    trackTemp?: string;
    trackCondition?: string;
    outTime?: string;
    inTime?: string;
    lapsDone?: number;
    fuelStart?: number;
    fuelEnd?: number;
    fuelUsed?: number; // Make it so that this auto populates 
    fuelPerLap?: number; // Also auto populates
    bestLapS?: number;
    averageLapS?: number;
    notes?: string;
};

export default function RunDetailPage() {
    const { runId } = useLocalSearchParams<{
        id: string;
        eventVehicleId: string;
        runId: string;
    }>();

    const { token } = useAuth();
    const [run, setRun] = useState<Run | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [showFuelEndModal, setShowFuelEndModal] = useState(false);
    const [fuelEndInput, setFuelEndInput] = useState("");
    const [isSavingFuelEnd, setIsSavingFuelEnd] = useState(false);

    async function fetchRun() {
        try {
            setIsLoading(true);
            setErrorMessage("");

            const data = await apiFetch(`/runs/${runId}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                },
            });

            setRun(data.run);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to load run");
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (runId && token) {
            fetchRun();
        }
    }, [runId, token]);

    async function handleCarOut() {
        await apiFetch(`/runs/${runId}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                outTime: new Date().toISOString(),
            }),
        });

        await fetchRun();
    }

    async function handleCarIn() {
        await apiFetch(`/runs/${runId}`, {
            method: "PATCH",
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                inTime: new Date().toISOString(),
            }),
        });

        await fetchRun();
    }

    // Would need to change this depending on where in the world you sold the app.
    function formatTime(date?: string) {
        if (!date) return "-";
        return new Date(date).toLocaleDateString("en-NZ", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
        });
    }

    async function handleSaveFuelEnd() {
        if (!fuelEndInput) {
            setErrorMessage("Fuel end is required")
            return;
        }

        try {
            setIsSavingFuelEnd(true);
            setErrorMessage("");

            await apiFetch(`/runs/${runId}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    fuelEnd: Number(fuelEndInput)
                }),
            });

            setFuelEndInput("");
            setShowFuelEndModal(false);
            await fetchRun();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to save fuel end");
        } finally {
            setIsSavingFuelEnd(false);
        }
    }

    function formatLapTime(seconds?: number) {
        if (!seconds && seconds !== 0) return "-";

        const mins = Math.floor(seconds / 60);
        const secs = (seconds % 60).toFixed(3).padStart(6, "0");

        return `${mins}:${secs}`;
    }

    if (isLoading) {
        return (
            <SafeAreaView style={globalStyles.container}>
                <ActivityIndicator color="#ffffff" />
            </SafeAreaView>
        );
    }

    if (errorMessage || !run) {
        return (
            <SafeAreaView style={globalStyles.container}>
                <View style={styles.content}>
                    <Text style={globalStyles.errorText}>
                        {errorMessage || "Run not found"}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={globalStyles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={globalStyles.title}>
                    Run Detail
                </Text>

                <View style={globalStyles.card}>
                    <Text style={globalStyles.sectionTitle}>Run Info</Text>
                    <Text style={globalStyles.text}>{run.name}</Text>
                    {!run.outTime ? (
                        <View style={styles.actionRow}>
                            <Pressable style={globalStyles.buttonPrimary} onPress={handleCarOut}>
                                <Text style={globalStyles.buttonPrimaryText}>Car Out</Text>
                            </Pressable>
                        </View>
                    ) : !run.inTime ? (
                        <View style={styles.actionRow}>
                            <Pressable style={globalStyles.buttonDanger} onPress={handleCarIn}>
                                <Text style={globalStyles.buttonPrimaryText}>Car In</Text>
                            </Pressable>
                        </View>
                    ) : (
                        <View style={styles.completeCard}>
                            <Text style={globalStyles.text}>Run Complete</Text>
                        </View>
                    )}
                    <Text style={globalStyles.cardText}>Out Time: {formatTime(run.outTime)}</Text>
                    <Text style={globalStyles.cardText}>In Time: {formatTime(run.inTime)}</Text>
                    <Text style={globalStyles.cardText}>Laps Done: {run.lapsDone ?? "-"}</Text>
                </View>
                <View style={globalStyles.card}>
                    <Text style={globalStyles.sectionTitle}>Conditions</Text>
                    <Text style={globalStyles.cardText}>Weather: {run.weather || "-"}</Text>
                    <Text style={globalStyles.cardText}>Track Temp: {run.trackTemp ?? "-"}°C</Text>
                    <Text style={globalStyles.cardText}>
                        Track Condition: {run.trackCondition || "-"}
                    </Text>
                </View>

                <View style={globalStyles.card}>
                    <Text style={globalStyles.sectionTitle}>Fuel</Text>
                    <Text style={globalStyles.cardText}>Fuel Start: {run.fuelStart ?? "-"} L</Text>
                    <Text style={globalStyles.cardText}>Fuel End: {run.fuelEnd ?? "-"} L</Text>
                    <Text style={globalStyles.cardText}>Fuel Used: {run.fuelUsed ?? "-"} L</Text>
                    <Text style={globalStyles.cardText}>Fuel/Lap: {run.fuelPerLap ?? "-"} L</Text>
                    <View style={styles.actionRow}>
                        <Pressable
                            style={globalStyles.buttonPrimary}
                            onPress={() => {
                                setFuelEndInput(run.fuelEnd ? String(run.fuelEnd) : "");
                                setShowFuelEndModal(true);
                            }}
                        >
                            <Text style={globalStyles.buttonPrimaryText}>
                                {run.fuelEnd == null ? "Enter Fuel End" : "Edit Fuel End"}
                            </Text>
                        </Pressable>
                    </View>
                </View>

                <View style={globalStyles.card}>
                    <Text style={globalStyles.sectionTitle}>Lap Times</Text>
                    <Text style={globalStyles.cardText}>
                        Best Lap: {formatLapTime(run.bestLapS)}
                    </Text>
                    <Text style={globalStyles.cardText}>
                        Average Lap: {formatLapTime(run.averageLapS)}
                    </Text>
                </View>

                <View style={globalStyles.card}>
                    <Text style={globalStyles.sectionTitle}>Notes</Text>
                    <Text style={globalStyles.cardText}>{run.notes || "-"}</Text>
                </View>

                <Modal
                    visible={showFuelEndModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowFuelEndModal(false)}
                >
                    <View style={globalStyles.modalOverlay}>
                        <View style={globalStyles.modalCard}>
                            <Text style={globalStyles.modalTitle}>Fuel End</Text>

                            <Text style={globalStyles.label}>Fuel End</Text>
                            <TextInput
                                style={globalStyles.input}
                                value={fuelEndInput}
                                onChangeText={setFuelEndInput}
                                keyboardType="numeric"
                                placeholder="e.g. 18"
                                placeholderTextColor="#9ca3af"
                            />

                            <View style={styles.actionRow}>
                                <Pressable
                                    style={globalStyles.buttonDanger}
                                    onPress={() => {
                                        setFuelEndInput("");
                                        setShowFuelEndModal(false);
                                    }}
                                    disabled={isSavingFuelEnd}
                                >
                                    <Text style={globalStyles.buttonPrimaryText}>Cancel</Text>
                                </Pressable>

                                <Pressable
                                    style={[
                                        globalStyles.buttonPrimary,
                                        isSavingFuelEnd && globalStyles.buttonDisabled,
                                    ]}
                                    onPress={handleSaveFuelEnd}
                                    disabled={isSavingFuelEnd}
                                >
                                    {isSavingFuelEnd ? (
                                        <ActivityIndicator color="#ffffff" />
                                    ) : (
                                        <Text style={globalStyles.buttonPrimaryText}>Save Fuel End</Text>
                                    )}
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </SafeAreaView>
    )

}

const styles = StyleSheet.create({
    content: {
        padding: 24,
        gap: 16,
    },
    actionRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 10,
        flexWrap: "wrap",
        marginBottom: 10,
    },
    completeCard: {
        borderWidth: 1,
        borderColor: "#10b981",
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        marginTop: 10,
        alignItems: "center",
    },
});
