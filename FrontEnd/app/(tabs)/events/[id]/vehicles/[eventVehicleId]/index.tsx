import { useEffect, useState, useCallback, useMemo } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, Pressable, Modal, TextInput } from "react-native";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
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
    outTime?: string;
    inTime?: string;
    lapsDone?: number;
    fuelStart?: number;
    // fuelEnd?: number;
    fuelUsed?: number; // Make it so that this auto populates 
    fuelPerLap?: number; // Also auto populates
    bestLapS?: number;
    averageLapS?: number;
    notes?: string;
};

type Tyre = {
    _id: string;
    vehicleId: string;
    brand: string;
    spec?: string;
    currentSet?: string;
    position?: string;
    fiaSerial?: string;
    condition?: string;
};

type TyreSetOption = {
    key: string;
    currentSet: string;
    brand: string;
    spec?: string;
    tyres: {
        LF: Tyre;
        RF: Tyre;
        LR: Tyre;
        RR: Tyre;
    };
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

    const [availableTyres, setAvailableTyres] = useState<Tyre[]>([]);
    const [selectedTyreSetKey, setSelectedTyreSetKey] = useState("");
    const [isLoadingTyres, setIsLoadingTyres] = useState(false);


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

    async function fetchAvailableTyres() {
        const vehicleId = getVehicleId();
        if (!vehicleId || !token) {
            setAvailableTyres([]);
            return;
        }

        try {
            setIsLoadingTyres(true);
            setErrorMessage("");

            const data = await apiFetch(
                `/tyres?vehicleId=${vehicleId}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setAvailableTyres(data.tyres || []);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to load tyre sets");
        } finally {
            setIsLoadingTyres(false);
        }
    }

    useEffect(() => {
        if (eventId && eventVehicleId && token) {
            fetchEventVehicle();
            fetchEvent();
            fetchRuns();
        }
    }, [eventId, eventVehicleId, token]);

    useFocusEffect(
        useCallback(() => {
            if (eventVehicleId && token) {
                fetchRuns();
            }
        }, [eventVehicleId, token])
    );

    function vehicleLabel(vehicle: Vehicle) {
        const number = vehicle.racingNumber ? `#${vehicle.racingNumber} ` : ""
        const name = vehicle.name || `${vehicle.make || ""} ${vehicle.model || ""}`.trim();

        return `${number}${name || "Unnamed vehicle"}`;
    }

    function clearRunForm() {
        setName("");
        setWeather("");
        setTrackTemp("");
        setTrackCondition("");
        setFuelStart("");
        setNotes("");
        setSelectedTyreSetKey("");
        setAvailableTyres([]);
    }

    async function handleCreateRun() {
        if (!name.trim()) {
            setErrorMessage("Run name is required");
            return;
        }

        if (!fuelStart) {
            setErrorMessage("Fuel start is required");
            return;
        }

        if (!selectedTyreSetKey) {
            setErrorMessage("Please select a tyre set");
            return;
        }

        const selectedSet = tyreSetOptions.find(
            (set) =>
                set.key === selectedTyreSetKey
        );

        if (!selectedSet) {
            setErrorMessage(
                "Selected tyre set could not be found"
            );
            return;
        }

        try {
            setIsSavingRun(true);
            setErrorMessage("");

            // 1. Create the Run
            const runData = await apiFetch("/runs", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    eventVehicleId,
                    name: name.trim(),
                    weather,
                    trackTemp: trackTemp
                        ? Number(trackTemp)
                        : undefined,
                    trackCondition,
                    fuelStart: Number(fuelStart),
                    notes,
                }),
            });

            const createdRun =
                runData.run || runData;

            if (!createdRun?._id) {
                throw new Error(
                    "Run was created but no Run ID was returned"
                );
            }

            // 2. Create the TyreRun using the selected set
            await apiFetch("/tyre-runs", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    runId: createdRun._id,

                    tyres: {
                        LF: selectedSet.tyres.LF._id,
                        RF: selectedSet.tyres.RF._id,
                        LR: selectedSet.tyres.LR._id,
                        RR: selectedSet.tyres.RR._id,
                    },

                    notes: "",
                }),
            });

            clearRunForm();
            setShowRunModal(false);

            await fetchRuns();
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Failed to create run"
            );
        } finally {
            setIsSavingRun(false);
        }
    }

    // async function handleCreateRun() {
    //     try {
    //         setIsSavingRun(true);
    //         setErrorMessage("");

    //         await apiFetch("/runs", {
    //             method: "POST",
    //             headers: {
    //                 Authorization: `Bearer ${token}`,
    //             },
    //             body: JSON.stringify({
    //                 eventVehicleId,
    //                 name: name.trim(),
    //                 weather,
    //                 trackTemp: trackTemp ? Number(trackTemp) : undefined,
    //                 trackCondition,
    //                 fuelStart: fuelStart ? Number(fuelStart) : undefined,
    //                 notes,
    //             }),
    //         });

    //         clearRunForm();
    //         setShowRunModal(false);
    //         await fetchRuns();
    //     } catch (error) {
    //         setErrorMessage(error instanceof Error ? error.message : "Failed to create run");
    //     } finally {
    //         setIsSavingRun(false);
    //     }
    // }

    function getVehicleId() {
        if (!eventVehicle) return "";
        return typeof eventVehicle.vehicleId === "string"
            ? eventVehicle.vehicleId
            : eventVehicle.vehicleId._id;
    }


    const tyreSetOptions = useMemo<TyreSetOption[]>(() => {
        const groups = new Map<string, Tyre[]>();

        availableTyres.forEach((tyre) => {
            const setName = tyre.currentSet?.trim();

            if (!setName) return;

            const key = setName.toLowerCase();

            const existing = groups.get(key) || [];

            existing.push(tyre);
            groups.set(key, existing);
        });

        const completeSets: TyreSetOption[] = [];

        groups.forEach((tyres, key) => {
            const LF = tyres.find(
                (tyre) =>
                    tyre.position?.toUpperCase() === "LF"
            );

            const RF = tyres.find(
                (tyre) =>
                    tyre.position?.toUpperCase() === "RF"
            );

            const LR = tyres.find(
                (tyre) =>
                    tyre.position?.toUpperCase() === "LR"
            );

            const RR = tyres.find(
                (tyre) =>
                    tyre.position?.toUpperCase() === "RR"
            );

            // Only allow complete 4-tyre sets
            if (!LF || !RF || !LR || !RR) {
                return;
            }

            completeSets.push({
                key,
                currentSet:
                    tyres[0].currentSet || "Unnamed Set",
                brand: tyres[0].brand,
                spec: tyres[0].spec,
                tyres: {
                    LF,
                    RF,
                    LR,
                    RR,
                },
            });
        });

        return completeSets;
    }, [availableTyres]);

    async function openCreateRunModal() {
        clearRunForm();

        setSelectedTyreSetKey("");
        setShowRunModal(true);

        await fetchAvailableTyres();
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
                        runs.map((run) => (
                            <Pressable
                                key={run._id}
                                style={styles.listItemCard}
                                onPress={() => {
                                    console.log("Opening run:", {
                                        name: run.name,
                                        runId: run._id,
                                    });

                                    router.push(
                                        `/events/${String(eventId)}/vehicles/${String(
                                            eventVehicleId
                                        )}/runs/${run._id}`
                                    );
                                }}
                            >
                                <View>
                                    <Text style={globalStyles.cardText}>{run.name || "Unnamed Run"}</Text>
                                    <Text style={globalStyles.subText}>
                                        Status:{" "}
                                        {!run.outTime
                                            ? "Not started"
                                            : !run.inTime
                                                ? "On track"
                                                : "Complete"}
                                    </Text>
                                    {/* <Text style={globalStyles.subText}>
                                        ID: {run._id}
                                    </Text> */}

                                    <Text style={globalStyles.subText}>
                                        Total Laps: {run.lapsDone ?? "-"} | Best Time s: {run.bestLapS ?? "-"}
                                    </Text>
                                    <Text style={globalStyles.subText}>
                                        Fuel Used: {run.fuelUsed ?? "-"} L
                                    </Text>
                                </View>
                            </Pressable>
                        ))
                    )}

                    <View style={styles.actionRow}>
                        <Pressable
                            style={globalStyles.buttonPrimary}
                            onPress={openCreateRunModal}>
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
                                    placeholder="Practice 1/ Qualifying/ Race 1"
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

                                <Text style={globalStyles.label}>Fuel Start</Text>
                                <TextInput
                                    style={globalStyles.input}
                                    value={fuelStart}
                                    onChangeText={setFuelStart}
                                    keyboardType="numeric"
                                />

                                <Text style={globalStyles.label}>Tyre Set</Text>
                                {isLoadingTyres ? (
                                    <ActivityIndicator color="#ffffff" />
                                ) : tyreSetOptions.length === 0 ? (
                                    <Text style={globalStyles.subText}>
                                        No complete tyre sets available for this vehicle
                                    </Text>
                                ) : (
                                    <View style={styles.tyreSetList}>
                                        {tyreSetOptions.map((set) => {
                                            const isSelected =
                                                selectedTyreSetKey === set.key;

                                            return (
                                                <Pressable
                                                    key={set.key}
                                                    style={[
                                                        styles.tyreSetCard,
                                                        isSelected &&
                                                        styles.tyreSetCardSelected,
                                                    ]}
                                                    onPress={() =>
                                                        setSelectedTyreSetKey(set.key)
                                                    }
                                                >
                                                    <View style={styles.tyreSetHeader}>
                                                        <Text
                                                            style={globalStyles.cardText}
                                                        >
                                                            {set.currentSet}
                                                        </Text>

                                                        <Text
                                                            style={globalStyles.subText}
                                                        >
                                                            4/4
                                                        </Text>
                                                    </View>

                                                    <Text style={globalStyles.subText}>
                                                        {set.brand}
                                                        {set.spec
                                                            ? ` ${set.spec}`
                                                            : ""}
                                                    </Text>

                                                    <Text style={globalStyles.subText}>
                                                        LF · RF · LR · RR
                                                    </Text>
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                )}

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
    listItemCard: {
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#374151",
        borderRadius: 12,
        padding: 14,
        marginTop: 10,

        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    tyreSetList: {
        gap: 10,
        marginTop: 8,
        marginBottom: 12,
    },

    tyreSetCard: {
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#374151",
        borderRadius: 12,
        padding: 14,
    },

    tyreSetCardSelected: {
        backgroundColor: "#1d4ed8",
        borderColor: "#2563eb",
    },

    tyreSetHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
});