import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, Pressable, Modal, TextInput } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { apiFetch } from "../../../../../../assets/api";
import { useAuth } from "../../../../../../context/AuthContext";
import { globalStyles } from "../../../../../../constants/styles";

type Vehicle = {
    _id: string;
    name?: string;
    racingNumber?: string;
    make?: string;
    model?: string;
};

type EventVehicle = {
    _id: string;
    eventId: string;
    vehicleId: string | Vehicle;
    type?: string;
};

type Event = {
    _id: string,
    name: string,
    type?: string,
};

type Run = {
    _id: string;
    eventVehicleId: string;
    name: string;
    weather?: string;
    trackTemp?: string;
    trackCondition?: string;
    // outTime?: string;
    // inTime?: string;
    lapsDone?: number;
    fuelStart?: number;
    // fuelEnd?: number;
    fuelUsed?: number; // Make it so that this auto populates 
    fuelPerLap?: number; // Also auto populates
    bestLapS?: number;
    averageLapS?: number;
    notes?: string;
};

export default function EventVehicleDetailPage() {
    const { id: eventId, eventVehicleId } = useLocalSearchParams<{
        id: string;
        eventVehicleId: string;
    }>();

    const { token } = useAuth();

    const [eventVehicle, setEventVehicle] = useState<EventVehicle | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [event, setEvent] = useState<Event | null>(null);

    const [runs, setRuns] = useState<Run[]>([]);

    const [showRunModal, setShowRunModal] = useState(false);
    const [isSavingRun, setIsSavingRun] = useState(false);

    const [name, setName] = useState("");
    const [weather, setWeather] = useState("");
    const [trackTemp, setTrackTemp] = useState("");
    const [trackCondition, setTrackCondition] = useState("");
    // const [outTime, setOutTime] = useState("");
    // const [inTime, setInTime] = useState("");
    // const [lapsDone, setLapsDone] = useState("");
    const [fuelStart, setFuelStart] = useState("");
    const [fuelEnd, setFuelEnd] = useState("");
    // const [bestLapS, setBestLapS] = useState("");
    const [notes, setNotes] = useState("");
    // Do you need to add anything else here? ^ ANd what about stuff that's supposed to autopopulate


    async function fetchEventVehicle() {
        try {
            setIsLoading(true);
            setErrorMessage("");

            const data = await apiFetch(`/event-vehicles/vehicle/${eventId}`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });

            const found = (data.assignments || []).find(
                (item: EventVehicle) => item._id === eventVehicleId
            );

            setEventVehicle(found || null);
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : "Failed to load event vehicle"
            );
        } finally {
            setIsLoading(false);
        }
    }

    async function fetchEvent() {
        const data = await apiFetch(`/events/${eventId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            },
        });

        setEvent(data.event);
    }

    async function fetchRuns() {
        const data = await apiFetch(`/runs?eventVehicleId=${eventVehicleId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        setRuns(data.runs || []);
    }

    useEffect(() => {
        if (eventId && eventVehicleId && token) {
            fetchEventVehicle();
            fetchEvent();
            fetchRuns();
        }
    }, [eventId, eventVehicleId, token]);

    function vehicleLabel(vehicle: Vehicle) {
        const number = vehicle.racingNumber ? `#${vehicle.racingNumber} ` : ""
        const name = vehicle.name || `${vehicle.make || ""} ${vehicle.model || ""}`.trim();

        return `${number}${name || "Unnamed vehicle"}`;
    }

    function clearRunForm() {
        setWeather("");
        setTrackTemp("");
        setTrackCondition("");
        // setOutTime("");
        // setInTime("");
        // setLapsDone("");
        setFuelStart("");
        // setFuelEnd("");
        // setBestLapS("");
        setNotes("");
    }

    async function handleCreateRun() {
        try {
            setIsSavingRun(true);
            setErrorMessage("");

            await apiFetch("/runs", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    eventVehicleId,
                    name,
                    weather,
                    trackTemp: trackTemp ? Number(trackTemp) : undefined,
                    trackCondition,
                    // outTime,
                    // inTime,
                    // lapsDone: lapsDone ? Number(lapsDone) : undefined,
                    fuelStart: fuelStart ? Number(fuelStart) : undefined,
                    // fuelEnd: fuelEnd ? Number(fuelEnd) : undefined,
                    // bestLapS: bestLapS ? Number(bestLapS) : undefined,
                    notes,
                }),
            });

            clearRunForm();
            setShowRunModal(false);
            await fetchRuns();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to create run");
        } finally {
            setIsSavingRun(false);
        }
    }

    if (isLoading) {
        return (
            <SafeAreaView style={globalStyles.container}>
                <ActivityIndicator color="#ffffff" />
            </SafeAreaView>
        );
    }

    if (errorMessage || !eventVehicle) {
        return (
            <SafeAreaView style={globalStyles.container}>
                <View style={styles.content}>
                    <Text style={globalStyles.errorText}>
                        {errorMessage || "Event vehicle not found"}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={globalStyles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.breadcrumbCard}>
                    <Text style={globalStyles.title}>
                        {event?.name || "Event"}
                    </Text>

                    <Text style={globalStyles.text}>
                        {typeof eventVehicle.vehicleId === "string"
                            ? "Event Vehicle"
                            : vehicleLabel(eventVehicle.vehicleId)}
                    </Text>
                </View>

                <View style={globalStyles.card}>
                    <Text style={globalStyles.sectionTitle}>Event Vehicle Info</Text>
                    <Text style={globalStyles.cardText}>
                        Do we want any text here?
                    </Text>
                </View>

                <View style={globalStyles.card}>
                    <Text style={globalStyles.sectionTitle}>Runs</Text>
                    {runs.length === 0 ? (
                        <Text style={globalStyles.text}>No runs yet</Text>
                    ) : (
                        runs.map((run, index) => (
                            <Pressable
                                key={run._id}
                                style={styles.runRow}
                                onPress={() =>
                                    router.push({
                                        pathname: "/events/[id]/vehicles/[eventVehicleId]/runs/[runId]" as any,
                                        params: {
                                            id: String(eventId),
                                            eventVehicleId: String(eventVehicleId),
                                            runId: run._id,
                                        },
                                    })
                                }
                            >
                                <View>
                                    <Text style={globalStyles.cardText}>Run {index + 1}</Text>
                                    <Text style={globalStyles.subText}>
                                        Laps: {run.lapsDone ?? "-"} | Best: {run.bestLapS ?? "-"}
                                    </Text>
                                    <Text style={globalStyles.subText}>
                                        Fuel Used: {run.fuelUsed ?? "-"} L
                                    </Text>
                                </View>
                            </Pressable>
                        ))
                    )}

                    <View style={styles.actionRow}>
                        <Pressable style={globalStyles.buttonPrimary} onPress={() => setShowRunModal(true)}>
                            <Text style={globalStyles.buttonPrimaryText}>Create Run</Text>
                        </Pressable>
                    </View>
                </View>
                <View style={globalStyles.card}>
                    <Text style={globalStyles.sectionTitle}>Setup Used</Text>
                    <Text style={globalStyles.text}>Coming later... </Text>
                </View>
                <View style={globalStyles.card}>
                    <Text style={globalStyles.sectionTitle}>Tyres</Text>
                    <Text style={globalStyles.text}>Coming Later...</Text>
                </View>

                <Modal
                    visible={showRunModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowRunModal(false)}
                >
                    <ScrollView contentContainerStyle={styles.modalContent}>
                        <View style={globalStyles.modalOverlay}>
                            <View style={globalStyles.modalCard}>
                                <Text style={globalStyles.modalTitle}>Create Run</Text>
                                <Text style={globalStyles.label}>Run Name</Text>
                                <TextInput
                                    style={globalStyles.input}
                                    value={name}
                                    onChangeText={setName}
                                    placeholderTextColor="#9ca3af"
                                />
                                <Text style={globalStyles.label}>Weather</Text>
                                <TextInput
                                    style={globalStyles.input}
                                    value={weather}
                                    onChangeText={setWeather}
                                    placeholder="Sunny / Rain / Cloudy"
                                    placeholderTextColor="#9ca3af"
                                />

                                <Text style={globalStyles.label}>Track Temp °C</Text>
                                <TextInput
                                    style={globalStyles.input}
                                    value={trackTemp}
                                    onChangeText={setTrackTemp}
                                    keyboardType="numeric"
                                />

                                <Text style={globalStyles.label}>Track Condition</Text>
                                <TextInput
                                    style={globalStyles.input}
                                    value={trackCondition}
                                    onChangeText={setTrackCondition}
                                    placeholder="Green / Rubbered / Wet"
                                    placeholderTextColor="#9ca3af"
                                />

                                {/* <Text style={globalStyles.label}>Out Time</Text>
                                <TextInput
                                    style={globalStyles.input}
                                    value={outTime}
                                    onChangeText={setOutTime}
                                    placeholder="12:30"
                                    placeholderTextColor="#9ca3af"
                                />

                                <Text style={globalStyles.label}>In Time</Text>
                                <TextInput
                                    style={globalStyles.input}
                                    value={inTime}
                                    onChangeText={setInTime}
                                    placeholder="12:50"
                                    placeholderTextColor="#9ca3af"
                                /> */}

                                {/* <Text style={globalStyles.label}>Laps Done</Text>
                                <TextInput
                                    style={globalStyles.input}
                                    value={lapsDone}
                                    onChangeText={setLapsDone}
                                    keyboardType="numeric"
                                /> */}

                                <Text style={globalStyles.label}>Fuel Start</Text>
                                <TextInput
                                    style={globalStyles.input}
                                    value={fuelStart}
                                    onChangeText={setFuelStart}
                                    keyboardType="numeric"
                                />

                                {/* <Text style={globalStyles.label}>Fuel End</Text>
                                <TextInput
                                    style={globalStyles.input}
                                    value={fuelEnd}
                                    onChangeText={setFuelEnd}
                                    keyboardType="numeric"
                                /> */}

                                {/* <Text style={globalStyles.label}>Best Lap Seconds</Text>
                                <TextInput
                                    style={globalStyles.input}
                                    value={bestLapS}
                                    onChangeText={setBestLapS}
                                    placeholder="92.315"
                                    placeholderTextColor="#9ca3af"
                                    keyboardType="numeric"
                                /> */}

                                <Text style={globalStyles.label}>Notes</Text>
                                <TextInput
                                    style={globalStyles.input}
                                    value={notes}
                                    onChangeText={setNotes}
                                />

                                <View style={styles.actionRow}>
                                    <Pressable
                                        style={globalStyles.buttonDanger}
                                        onPress={() => {
                                            clearRunForm();
                                            setShowRunModal(false);
                                        }}
                                        disabled={isSavingRun}
                                    >
                                        <Text style={globalStyles.buttonPrimaryText}>Cancel</Text>
                                    </Pressable>

                                    <Pressable
                                        style={[
                                            globalStyles.buttonPrimary,
                                            isSavingRun && globalStyles.buttonDisabled,
                                        ]}
                                        onPress={handleCreateRun}
                                        disabled={isSavingRun}
                                    >
                                        {isSavingRun ? (
                                            <ActivityIndicator color="#ffffff" />
                                        ) : (
                                            <Text style={globalStyles.buttonPrimaryText}>Create Run</Text>
                                        )}
                                    </Pressable>
                                </View>

                            </View>
                        </View>
                    </ScrollView>
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
    breadcrumbCard: {
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#374151",
        borderRadius: 12,
        padding: 12,
        gap: 4,
    },
    runRow: {
        marginBottom: 10,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#374151",
    },
    actionRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 14,
        flexWrap: "wrap",
    },
    modalContent: {
        gap: 10,
        paddingBottom: 24,
    },
});