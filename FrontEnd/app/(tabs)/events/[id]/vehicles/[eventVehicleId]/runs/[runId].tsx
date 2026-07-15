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

type LapTime = {
    _id: string;
    runId: string;
    lapNumber: number;
    lapTimeS: number;
    fuelRemaining?: number;
    trackStatus?: string;
    isInLap?: boolean;
    isOutLap?: boolean;
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

    const [lapTimes, setLapTimes] = useState<LapTime[]>([]);
    const [showLapModal, setShowLapModal] = useState(false);
    const [isSavingLap, setIsSavingLap] = useState(false);

    const [lapNumber, setLapNumber] = useState("");
    const [lapTimeS, setLapTimeS] = useState("");
    const [fuelRemaining, setFuelRemaining] = useState("");
    const [trackStatus, setTrackStatus] = useState("Green");
    const [lapNotes, setLapNotes] = useState("");

    const [editingLap, setEditingLap] = useState<LapTime | null>(null);
    const [lapToDelete, setLapToDelete] = useState<LapTime | null>(null);
    const [isDeletingLap, setIsDeletingLap] = useState(false);

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

            console.log("Fetched run:", {
                requestedRunId: runId,
                returnedRunId: data.run?._id,
                outTime: data.run?.outTime,
                inTime: data.run?.inTime,
            });

            if (!data.run) {
                throw new Error("Run not found");
            }

            if (String(data.run._id) !== String(runId)) {
                throw new Error("The API returned the wrong run");
            }

            setRun(data.run);
        } catch (error) {
            setRun(null);
            setErrorMessage(error instanceof Error ? error.message : "Failed to load run");
        } finally {
            setIsLoading(false);
        }
    }

    async function fetchLapTimes() {
        const data = await apiFetch(`/lap-times?runId=${runId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        setLapTimes(data.lapTimes || []);
    }

    useEffect(() => {
        setRun(null);
        setLapTimes([]);
        setErrorMessage("");

        if (runId && token) {
            Promise.all([
                fetchRun(),
                fetchLapTimes(),
            ])
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
        try {
            setIsLoading(true);
            setErrorMessage("");

            await apiFetch(`/runs/${runId}/car-in`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            await Promise.all([
                fetchRun(),
                fetchLapTimes(),
            ]);
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : "Failed to make car in"
            );
        } finally {
            setIsLoading(false);
        }
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

    function clearLapForm() {
        setEditingLap(null);
        setLapNumber("");
        setLapTimeS("");
        setFuelRemaining("");
        setTrackStatus("Green");
        setLapNotes("");
    }

    function openAddLapModal() {
        setEditingLap(null);

        const nextLapNumber =
            lapTimes.length === 0
                ? 1
                : Math.max(...lapTimes.map((lap) => lap.lapNumber)) + 1;

        setLapNumber(String(nextLapNumber));
        setLapTimeS("");
        setFuelRemaining("");
        setTrackStatus("Green");
        setLapNotes("");
        setShowLapModal(true);
    }

    function openEditLapModal(lap: LapTime) {
        setEditingLap(lap);

        setLapNumber(String(lap.lapNumber));
        setLapTimeS(String(lap.lapTimeS));
        setFuelRemaining(
            lap.fuelRemaining != null ? String(lap.fuelRemaining) : ""
        );
        setTrackStatus(lap.trackStatus || "Green");
        setLapNotes(lap.notes || "");

        setShowLapModal(true);
    }

    async function handleSaveLap() {
        if (!lapNumber || !lapTimeS) {
            setErrorMessage("Lap number and lap time are required");
            return;
        }

        try {
            setIsSavingLap(true);
            setErrorMessage("");

            const payload = {
                runId,
                lapNumber: Number(lapNumber),
                lapTimeS: Number(lapTimeS),
                fuelRemaining: fuelRemaining
                    ? Number(fuelRemaining)
                    : undefined,
                trackStatus,
                notes: lapNotes,
            };

            if (editingLap) {
                await apiFetch(`/lap-times/${editingLap._id}`, {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                });
            } else {
                await apiFetch("/lap-times", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                });
            }

            clearLapForm();
            setShowLapModal(false);

            await Promise.all([
                fetchLapTimes(),
                fetchRun(),
            ]);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : editingLap
                        ? "Failed to update lap"
                        : "Failed to create lap"
            );
        } finally {
            setIsSavingLap(false);
        }
    }

    async function handleDeleteLap() {
        if (!lapToDelete) return;

        try {
            setIsDeletingLap(true);
            setErrorMessage("");

            await apiFetch(`/lap-times/${lapToDelete._id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setLapToDelete(null);

            await Promise.all([
                fetchLapTimes(),
                fetchRun(),
            ]);
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : "Failed to delete lap"
            );
        } finally {
            setIsDeletingLap(false);
        }
    }

    function getLapFuelBurn(index: number) {
        const currentLap = lapTimes[index];

        if (
            currentLap.fuelRemaining === undefined ||
            currentLap.fuelRemaining === null
        ) {
            return null;
        }

        const previousFuel =
            index === 0
                ? run?.fuelStart
                : lapTimes[index - 1]?.fuelRemaining;

        if (previousFuel === undefined || previousFuel === null) {
            return null;
        }

        return previousFuel - currentLap.fuelRemaining;
    }

    function getBestLapNumber() {
        if (lapTimes.length === 0 || run?.bestLapS == null) {
            return null;
        }

        const bestLap = lapTimes.find(
            (lap) => lap.lapTimeS === run.bestLapS
        );

        return bestLap?.lapNumber ?? null;
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
                            <Pressable
                                style={globalStyles.buttonPrimary}
                                onPress={handleCarOut}
                            >
                                <Text style={globalStyles.buttonPrimaryText}>Car Out</Text>
                            </Pressable>
                        </View>
                    ) : run.inTime ? (
                        <View style={styles.completeCard}>
                            <Text style={globalStyles.text}>Run Complete</Text>
                        </View>
                    ) : (
                        <Text style={globalStyles.subText}>Car is on track</Text>
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
                    <Text style={globalStyles.cardText}>Average Fuel/Lap: {run.fuelPerLap ?? "-"} L</Text>
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
                    <Text style={globalStyles.sectionTitle}>Laps</Text>
                    {lapTimes.length === 0 ? (
                        <Text style={globalStyles.text}>No lap times yet</Text>
                    ) : (
                        lapTimes.map((lap, index) => {
                            const fuelBurn = getLapFuelBurn(index);

                            return (
                                <View key={lap._id} style={styles.lapRow}>
                                    <Text style={globalStyles.cardText}>
                                        Lap {lap.lapNumber}: {formatLapTime(lap.lapTimeS)}
                                    </Text>

                                    <Text style={globalStyles.subText}>
                                        Fuel Remaining: {lap.fuelRemaining ?? "-"} L
                                    </Text>

                                    <Text style={globalStyles.subText}>
                                        Fuel Burn: {fuelBurn !== null ? `${fuelBurn.toFixed(2)} L` : "-"}
                                    </Text>

                                    <Text style={globalStyles.subText}>
                                        Status: {lap.trackStatus || "-"}
                                    </Text>

                                    {lap.notes ? (
                                        <Text style={globalStyles.subText}>Notes: {lap.notes}</Text>
                                    ) : null}

                                    <View style={styles.lapButtonRow}>
                                        <Pressable 
                                            style={globalStyles.smallButton}
                                            onPress={() => openEditLapModal(lap)}
                                            >
                                                <Text style={globalStyles.smallButtonText}>Edit</Text>
                                            </Pressable>
                                            <Pressable 
                                                style={globalStyles.buttonDangerSmall}
                                                onPress={() => setLapToDelete(lap)}
                                            >
                                                <Text style={globalStyles.smallButtonText}>Delete</Text>
                                            </Pressable>
                                    </View>
                                </View>
                            );
                        })
                    )}
                    <View style={styles.actionRow}>
                        {run.outTime && !run.inTime ? (
                            <>
                                <Pressable
                                    style={globalStyles.buttonPrimary}
                                    onPress={openAddLapModal}
                                >
                                    <Text style={globalStyles.buttonPrimaryText}>Add Lap</Text>
                                </Pressable>

                                <Pressable
                                    style={globalStyles.buttonDanger}
                                    onPress={handleCarIn}
                                >
                                    <Text style={globalStyles.buttonPrimaryText}>Car In</Text>
                                </Pressable>
                            </>
                        ) : !run.outTime ? (
                            <Text style={globalStyles.subText}>
                                Press Car Out before entering laps
                            </Text>
                        ) : (
                            <Text style={globalStyles.subText}>
                                Lap entry closed — run complete
                            </Text>
                        )}
                    </View>
                </View>
                <View style={globalStyles.card}>
                    <Text style={globalStyles.sectionTitle}>Laps Summary</Text>
                    <Text style={globalStyles.cardText}>Total Laps: {run.lapsDone || "-"}</Text>
                    <Text style={globalStyles.cardText}>
                        Best Lap: {""}
                        {run.bestLapS != null
                            ? `Lap ${getBestLapNumber()} (${formatLapTime(run.bestLapS)})`
                            : "-"
                        }
                    </Text>
                    <Text style={globalStyles.cardText}>Average Lap: {run.averageLapS || "-"}</Text>
                    <Text style={globalStyles.cardText}>Fuel Used: {run.fuelUsed}</Text>
                    <Text style={globalStyles.cardText}>Average Fuel/Lap: {run.fuelPerLap}</Text>

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
                <Modal
                    visible={showLapModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowLapModal(false)}
                >
                    <ScrollView contentContainerStyle={styles.modalContent}>
                        <View style={globalStyles.modalOverlay}>
                            <View style={globalStyles.modalCard}>

                                <Text style={globalStyles.modalTitle}>
                                    {editingLap ? "Edit Lap" : "Add Lap"}
                                    </Text>

                                <Text style={globalStyles.label}>Lap Number</Text>
                                <TextInput
                                    style={globalStyles.input}
                                    value={lapNumber}
                                    onChangeText={setLapNumber}
                                    keyboardType="numeric"
                                />

                                <Text style={globalStyles.label}>Lap Time Seconds</Text>
                                <TextInput
                                    style={globalStyles.input}
                                    value={lapTimeS}
                                    onChangeText={setLapTimeS}
                                    placeholder="92.154"
                                    placeholderTextColor="#9ca3af"
                                    keyboardType="numeric"
                                />

                                <Text style={globalStyles.label}>Fuel Remaining</Text>
                                <TextInput
                                    style={globalStyles.input}
                                    value={fuelRemaining}
                                    onChangeText={setFuelRemaining}
                                    keyboardType="numeric"
                                />
                                <Text style={globalStyles.label}>Track Status</Text>
                                <TextInput
                                    style={globalStyles.input}
                                    value={trackStatus}
                                    onChangeText={setTrackStatus}
                                    placeholder="Green"
                                    placeholderTextColor="#9ca3af"
                                />

                                <Text style={globalStyles.label}>Notes</Text>
                                <TextInput
                                    style={globalStyles.input}
                                    value={lapNotes}
                                    onChangeText={setLapNotes}
                                />

                                <View style={styles.actionRow}>
                                    <Pressable
                                        style={globalStyles.buttonDanger}
                                        onPress={() => {
                                            clearLapForm();
                                            setShowLapModal(false);
                                        }}
                                        disabled={isSavingLap}
                                    >
                                        <Text style={globalStyles.buttonPrimaryText}>Cancel</Text>
                                    </Pressable>

                                    <Pressable
                                        style={[
                                            globalStyles.buttonPrimary,
                                            isSavingLap && globalStyles.buttonDisabled,
                                        ]}
                                        onPress={handleSaveLap}
                                        disabled={isSavingLap}
                                    >
                                        {isSavingLap ? (
                                            <ActivityIndicator color="#ffffff" />
                                        ) : (
                                            <Text style={globalStyles.buttonPrimaryText}>
                                                {editingLap ? "Save Changes" : "Save Lap"}
                                                </Text>
                                        )}
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </Modal>
                <Modal 
                    visible={lapToDelete !== null}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setLapToDelete(null)}
                    >
                        <View style={globalStyles.modalOverlay}>
                            <View style={globalStyles.modalCard}>
                                <Text style={globalStyles.modalTitle}>Delete Lap</Text>
                                <Text style={globalStyles.text}>
                                    Are you sure you want to delete lap {lapToDelete?.lapNumber}?
                                </Text>
                                <View style={styles.actionRow}>
                                    <Pressable
                                        style={globalStyles.smallButton}
                                        onPress={() => setLapToDelete(null)}
                                        disabled={isDeletingLap}
                                        >
                                            <Text style={globalStyles.smallButtonText}>Cancel</Text>
                                        </Pressable>
                                    <Pressable
                                        style={[globalStyles.buttonDanger, isDeletingLap && globalStyles.buttonDisabled]}
                                        onPress={handleDeleteLap}
                                        disabled={isDeletingLap}
                                        >
                                            {isDeletingLap ? (
                                                <ActivityIndicator color="#ffffff"/>
                                            ) : (
                                                <Text style={globalStyles.buttonPrimaryText}>Delete Lap</Text>
                                            )}
                                        </Pressable>
                                </View>
                            </View>
                        </View>
                    </Modal>
            </ScrollView>
        </SafeAreaView >
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
    lapRow: {
        marginBottom: 10,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#374151",
    },

    modalContent: {
        gap: 10,
        paddingBottom: 24,
    },
    lapButtonRow: {
        flexDirection: "row",
        gap: 8,
        marginTop: 8,
    },
});
