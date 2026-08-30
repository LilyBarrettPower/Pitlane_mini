import { useEffect, useState, useMemo } from "react";
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

type CornerValues = {
    LF?: number;
    RF?: number;
    LR?: number;
    RR?: number
};

type Tyre = {
    _id: string;
    vehicleId: string;
    brand?: string;
    spec?: string;
    currentSet?: string;
    position?: string;
    fiaSerial?: string;
    condition?: string;
};

type TyreRun = {
    _id: string;
    runId: string;
    tyres: {
        LF: string;
        RF: string;
        LR: string;
        RR: string;
    };
};

type TyrePressureCheck = {
    _id: string;
    tyreRunId: string;
    stage: "start" | "mid" | "end";
    pressurePsi: CornerValues;
    tyreTempC?: CornerValues;
    rimTempC?: CornerValues;
    lapNumber?: number;
    recordedAt: string;
    notes?: string;
};

type EventVehicle = {
    _id: string;
    vehicleId:
    | string
    | {
        _id: string;
        name?: string;
        make?: string;
        model?: string;
    };
};

type TyreSetOption = {
    key: string;
    currentSet: string;
    brand?: string;
    spec?: string;

    tyres: {
        LF: Tyre;
        RF: Tyre;
        LR: Tyre;
        RR: Tyre;
    };
};


export default function RunDetailPage() {
    const { runId, eventVehicleId } = useLocalSearchParams<{
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
    const [lapType, setLapType] = useState<"normal" | "out" | "in">("normal");
    const [lapTimeS, setLapTimeS] = useState("");
    const [fuelRemaining, setFuelRemaining] = useState("");
    const [trackStatus, setTrackStatus] = useState("Green");
    const [lapNotes, setLapNotes] = useState("");

    const [editingLap, setEditingLap] = useState<LapTime | null>(null);
    const [lapToDelete, setLapToDelete] = useState<LapTime | null>(null);
    const [isDeletingLap, setIsDeletingLap] = useState(false);

    const [tyreRun, setTyreRun] = useState<TyreRun | null>(null);
    const [pressureChecks, setPressureChecks] = useState<TyrePressureCheck[]>([]);

    const [eventVehicle, setEventVehicle] = useState<EventVehicle | null>(null);
    const [availableTyres, setAvailableTyres] = useState<Tyre[]>([]);
    const [showAssignTyreSetModal, setShowAssignTyreSetModal] = useState(false);
    const [selectedTyreSetKey, setSelectedTyreSetKey] = useState("");
    const [isAssigningTyreSet, setIsAssigningTyreSet] = useState(false);

    const [showPressureModal, setShowPressureModal] = useState(false);
    const [isSavingPressure, setIsSavingPressure] = useState(false);

    const [pressureStage, setPressureStage] = useState<"start" | "mid" | "end">("mid");
    const [pressureLapNumber, setPressureLapNumber] = useState("");
    const [psiLF, setPsiLF] = useState("");
    const [psiRF, setPsiRF] = useState("");
    const [psiLR, setPsiLR] = useState("");
    const [psiRR, setPsiRR] = useState("");
    const [pressureNotes, setPressureNotes] = useState("");

    const [rimTempLF, setRimTempLF] = useState("");
    const [rimTempRF, setRimTempRF] = useState("");
    const [rimTempLR, setRimTempLR] = useState("");
    const [rimTempRR, setRimTempRR] = useState("");

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

    async function fetchTyreRun() {
        const data = await apiFetch(`/tyre-runs?runId=${runId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const foundTyreRun = data.tyreRuns?.[0] || null;
        setTyreRun(foundTyreRun);

        return foundTyreRun;
    }

    async function fetchPressureChecks(tyreRunId?: string) {
        if (!tyreRunId) {
            setPressureChecks([]);
            return;
        }

        const data = await apiFetch(`/tyre-pressure-checks?tyreRunId=${tyreRunId}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        setPressureChecks(data.pressureChecks || []);
    }

    async function fetchEventVehicle() {
        if (!eventVehicleId) return null;

        const data = await apiFetch(
            `/event-vehicles/${eventVehicleId}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const loadedEventVehicle =
            data.eventVehicle || data;

        setEventVehicle(loadedEventVehicle);

        return loadedEventVehicle;
    }

    function getVehicleId(
        selectedEventVehicle: EventVehicle
    ) {
        return typeof selectedEventVehicle.vehicleId === "string"
            ? selectedEventVehicle.vehicleId
            : selectedEventVehicle.vehicleId._id;
    }

    async function fetchAvailableTyres(
        selectedEventVehicle: EventVehicle
    ) {
        const vehicleId = getVehicleId(
            selectedEventVehicle
        );

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
    }


    useEffect(() => {
        setRun(null);
        setLapTimes([]);
        setTyreRun(null);
        setPressureChecks([]);
        setErrorMessage("");

        async function loadPage() {
            if (!runId || !token) return;

            try {
                await Promise.all([
                    fetchRun(),
                    fetchLapTimes(),
                ]);

                const loadedEventVehicle =
                    await fetchEventVehicle();

                if (loadedEventVehicle) {
                    await fetchAvailableTyres(loadedEventVehicle);
                }

                const loadedTyreRun = await fetchTyreRun();

                if (loadedTyreRun?._id) {
                    await fetchPressureChecks(loadedTyreRun._id);
                } else {
                    setPressureChecks([]);
                }
            } catch (error) {
                setErrorMessage(
                    error instanceof Error ? error.message : "Failed to load run information"
                );
            }
        }

        loadPage();
    }, [runId, eventVehicleId, token]);

    const tyreSetOptions =
        useMemo<TyreSetOption[]>(() => {
            const groups = new Map<string, Tyre[]>();

            availableTyres.forEach((tyre) => {
                if (!tyre.currentSet?.trim()) return;

                const setName = tyre.currentSet.trim();
                const key = setName.toLowerCase();

                const existing = groups.get(key) || [];

                existing.push(tyre);

                groups.set(key, existing);
            });

            const completeSets: TyreSetOption[] = [];

            groups.forEach((tyres, key) => {
                const LF = tyres.find(
                    (tyre) =>
                        tyre.position?.toUpperCase() ===
                        "LF"
                );

                const RF = tyres.find(
                    (tyre) =>
                        tyre.position?.toUpperCase() ===
                        "RF"
                );

                const LR = tyres.find(
                    (tyre) =>
                        tyre.position?.toUpperCase() ===
                        "LR"
                );

                const RR = tyres.find(
                    (tyre) =>
                        tyre.position?.toUpperCase() ===
                        "RR"
                );

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

    async function handleAssignTyreSet() {
        if (!selectedTyreSetKey) {
            setErrorMessage(
                "Please select a tyre set"
            );
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
            setIsAssigningTyreSet(true);
            setErrorMessage("");

            await apiFetch("/tyre-runs", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    runId,

                    tyres: {
                        LF: selectedSet.tyres.LF._id,
                        RF: selectedSet.tyres.RF._id,
                        LR: selectedSet.tyres.LR._id,
                        RR: selectedSet.tyres.RR._id,
                    },

                    notes: "",
                }),
            });

            setSelectedTyreSetKey("");
            setShowAssignTyreSetModal(false);

            const loadedTyreRun =
                await fetchTyreRun();

            if (loadedTyreRun?._id) {
                await fetchPressureChecks(
                    loadedTyreRun._id
                );
            }
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Failed to assign tyre set"
            );
        } finally {
            setIsAssigningTyreSet(false);
        }
    }

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
        setLapType("normal");
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
        setLapType("normal");
        setLapTimeS("");
        setFuelRemaining("");
        setTrackStatus("Green");
        setLapNotes("");
        setShowLapModal(true);
    }

    function openEditLapModal(lap: LapTime) {
        setEditingLap(lap);

        setLapNumber(String(lap.lapNumber));
        setLapType(
            lap.isOutLap
                ? "out"
                : lap.isInLap
                    ? "in"
                    : "normal"
        );

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
                isOutLap: lapType === "out",
                isInLap: lapType === "in",
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

    function optionalNumber(value: string) {
        const trimmedValue = value.trim();

        if (!trimmedValue) {
            return undefined;
        }

        const convertedValue = Number(trimmedValue);

        return Number.isFinite(convertedValue)
            ? convertedValue
            : undefined;
    }

    function clearPressureForm() {
        setPressureStage("mid");
        setPressureLapNumber("");

        setPsiLF("");
        setPsiLR("");
        setPsiRF("");
        setPsiRR("");

        setRimTempLF("");
        setRimTempLR("");
        setRimTempRF("");
        setRimTempRR("");

        setPressureNotes("");
    }

    function getLatestLapNumber() {
        if (lapTimes.length === 0) {
            return "";
        }

        const latestLapNumber = Math.max(
            ...lapTimes.map((lap) => lap.lapNumber)
        );

        return String(latestLapNumber);
    }

    function openPressureModal(
        stage: "start" | "mid" | "end"
    ) {
        clearPressureForm();

        setPressureStage(stage);
        setErrorMessage("");

        if (stage == "start") {
            setPressureLapNumber("0");
        } else {
            setPressureLapNumber(getLatestLapNumber());
        }

        setShowPressureModal(true);
    }

    function closePressureModal() {
        if (isSavingPressure) return;

        clearPressureForm();
        setErrorMessage("");
        setShowPressureModal(false);
    }

    function validatePressureForm() {
        if (!tyreRun) {
            setErrorMessage("A tyre set must be assigned before recording pressures");
            return false;
        }

        if (!psiLF || !psiLR || !psiRF || !psiRR) {
            setErrorMessage("Pressure is required for all four tyres");
            return false;
        }

        const pressureValues = [
            Number(psiLF),
            Number(psiLR),
            Number(psiRF),
            Number(psiRR),
        ];

        const invalidPressure = pressureValues.some(
            (value) =>
                !Number.isFinite(value) ||
                value <= 0
        );

        if (invalidPressure) {
            setErrorMessage("Enter a valid pressure for all four tyres");
            return false;
        }

        if (
            pressureLapNumber &&
            !Number.isFinite(Number(pressureLapNumber))
        ) {
            setErrorMessage("Lap number must be a number");
            return false;
        }

        return true;
    }

    async function handleSavePressureCheck() {
        if (!validatePressureForm() || !tyreRun) {
            return;
        }

        try {
            setIsSavingPressure(true);
            setErrorMessage("");

            await apiFetch("/tyre-pressure-checks", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    tyreRunId: tyreRun._id,
                    stage: pressureStage,

                    lapNumber: pressureLapNumber
                        ? Number(pressureLapNumber)
                        : undefined,

                    pressurePsi: {
                        LF: Number(psiLF),
                        RF: Number(psiRF),
                        LR: Number(psiLR),
                        RR: Number(psiRR),
                    },

                    rimTempC: {
                        LF: optionalNumber(rimTempLF),
                        RF: optionalNumber(rimTempRF),
                        LR: optionalNumber(rimTempLR),
                        RR: optionalNumber(rimTempRR),
                    },

                    notes: pressureNotes.trim(),
                }),
            });

            clearPressureForm();
            setShowPressureModal(false);

            await fetchPressureChecks(tyreRun._id);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to save tyre pressure check");
        } finally {
            setIsSavingPressure(false);
        }
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
                    <Text style={globalStyles.sectionTitle}>Laps</Text>
                    {lapTimes.length === 0 ? (
                        <Text style={globalStyles.text}>No lap times yet</Text>
                    ) : (
                        lapTimes.map((lap, index) => {
                            const fuelBurn = getLapFuelBurn(index);

                            return (
                                <View key={lap._id} style={styles.lapRow}>
                                    <Text style={globalStyles.cardText}>
                                        Lap {lap.lapNumber}:{" "} 
                                        {formatLapTime(lap.lapTimeS)}
                                        {lap.isOutLap
                                            ? " . OUT LAP"
                                            : lap.isInLap
                                                ? " . IN LAP"
                                                : ""}
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
                    <Text style={globalStyles.sectionTitle}>
                        Tyre Pressure Checks
                    </Text>

                    {!tyreRun ? (
                        <>
                            <Text style={globalStyles.text}>
                                No tyre set assigned to this run
                            </Text>

                            <View style={styles.actionRow}>
                                <Pressable
                                    style={globalStyles.buttonPrimary}
                                    onPress={() => {
                                        setErrorMessage("");
                                        setSelectedTyreSetKey("");
                                        setShowAssignTyreSetModal(true);
                                    }}
                                >
                                    <Text
                                        style={
                                            globalStyles.buttonPrimaryText
                                        }
                                    >
                                        Assign Tyre Set
                                    </Text>
                                </Pressable>
                            </View>
                        </>
                    ) : (
                        <>
                            <View style={styles.pressureActionRow}>
                                <Pressable
                                    style={globalStyles.smallButton}
                                    onPress={() =>
                                        openPressureModal("start")
                                    }
                                >
                                    <Text
                                        style={globalStyles.smallButtonText}
                                    >
                                        Start Check
                                    </Text>
                                </Pressable>

                                <Pressable
                                    style={globalStyles.smallButton}
                                    onPress={() =>
                                        openPressureModal("mid")
                                    }
                                >
                                    <Text
                                        style={globalStyles.smallButtonText}
                                    >
                                        Mid Check
                                    </Text>
                                </Pressable>

                                <Pressable
                                    style={globalStyles.smallButton}
                                    onPress={() =>
                                        openPressureModal("end")
                                    }
                                >
                                    <Text
                                        style={globalStyles.smallButtonText}
                                    >
                                        End Check
                                    </Text>
                                </Pressable>
                            </View>

                            {pressureChecks.length === 0 ? (
                                <Text style={globalStyles.text}>
                                    No pressure checks recorded
                                </Text>
                            ) : (
                                pressureChecks.map((check) => (
                                    <View
                                        key={check._id}
                                        style={styles.pressureCheckCard}
                                    >
                                        <View
                                            style={
                                                styles.pressureCheckHeader
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.pressureCheckTitle
                                                }
                                            >
                                                {check.stage.toUpperCase()} CHECK
                                            </Text>

                                            <Text
                                                style={
                                                    styles.pressureCheckLap
                                                }
                                            >
                                                {check.lapNumber != null
                                                    ? `Lap ${check.lapNumber}`
                                                    : "No lap"}
                                            </Text>
                                        </View>

                                        <Text style={globalStyles.subText}>
                                            {new Date(
                                                check.recordedAt
                                            ).toLocaleString("en-NZ")}
                                        </Text>

                                        <View style={styles.pressureGrid}>
                                            {(["LF", "RF", "LR", "RR"] as const).map(
                                                (corner) => (
                                                    <View
                                                        key={corner}
                                                        style={
                                                            styles.pressureCornerCard
                                                        }
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
                                                )
                                            )}
                                        </View>

                                        {check.notes ? (
                                            <Text
                                                style={styles.pressureNotes}
                                            >
                                                Notes: {check.notes}
                                            </Text>
                                        ) : null}
                                    </View>
                                ))
                            )}
                        </>
                    )}
                </View>





                {/* <View style={globalStyles.card}>
                    <View style={styles.sectionHeader}>
                        <Text style={globalStyles.sectionTitle}>Tyre Pressure Checks</Text>
                        {tyreRun && (
                            <Pressable
                                style={globalStyles.buttonPrimary}
                                onPress={() => setShowPressureModal(true)}
                            >
                                <Text style={globalStyles.buttonPrimaryText}>Record Pressures</Text>
                            </Pressable>
                        )}
                    </View>

                    {!tyreRun ? (
                        <Text style={globalStyles.text}>No tyre set assigned to this run</Text>
                    ) : pressureChecks.length === 0 ? (
                        <Text style={globalStyles.text}>No pressure checks recorded</Text>
                    ) : (
                        pressureChecks.map((check) => (
                            <View key={check._id} style={styles.pressureCheckCard}>
                                <View style={styles.pressureCheckHeader}>
                                    <Text style={styles.pressureCheckTitle}>
                                        {check.stage.toUpperCase()} CHECK
                                    </Text>

                                    <Text style={styles.pressureCheckLap}>
                                        {check.lapNumber != null
                                            ? `Lap ${check.lapNumber}`
                                            : "Lap not recorded"}
                                    </Text>
                                </View>
                                <View style={styles.pressureCorner}>
                                    <Text style={styles.cornerLabel}>RF</Text>
                                    <Text style={styles.pressureValue}>{check.pressurePsi?.RF ?? "-"} psi</Text>
                                </View>
                                <View style={styles.pressureCorner}>
                                    <Text style={styles.cornerLabel}>LF</Text>
                                    <Text style={styles.pressureValue}>{check.pressurePsi?.LF ?? "-"} psi</Text>
                                </View>
                                <View style={styles.pressureCorner}>
                                    <Text style={styles.cornerLabel}>RR</Text>
                                    <Text style={styles.pressureValue}>{check.pressurePsi?.RR ?? "-"} psi</Text>
                                </View>
                                <View style={styles.pressureCorner}>
                                    <Text style={styles.cornerLabel}>LR</Text>
                                    <Text style={styles.pressureValue}>{check.pressurePsi?.LR ?? "-"} psi</Text>
                                </View>


                                {check.notes ? (
                                    <Text style={styles.pressureNotes}>
                                        {check.notes}
                                    </Text>
                                ) : null}
                            </View>
                        ))
                    )} */}
                {/* </View> */}
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
                                <Text style={globalStyles.label}>Lap Type</Text>
                                <View style={styles.lapTypeRow}>
                                    {(
                                        [
                                            {
                                                label: "Normal",
                                                value: "normal",
                                            },
                                            {
                                                label: "Out Lap",
                                                value: "out",
                                            },
                                            {
                                                label: "In Lap",
                                                value: "in",
                                            },
                                        ] as const
                                    ).map((item) => {
                                        const isSelected =
                                            lapType === item.value;

                                        return (
                                            <Pressable
                                                key={item.value}
                                                style={[
                                                    styles.lapTypeButton,
                                                    isSelected &&
                                                    styles.lapTypeButtonSelected,
                                                ]}
                                                onPress={() => setLapType(item.value)}
                                            >
                                                <Text style={[
                                                    styles.lapTypeButtonText, isSelected && styles.lapTypeButtonTextSelected,
                                                ]}
                                                >{item.label}</Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>

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
                                        <ActivityIndicator color="#ffffff" />
                                    ) : (
                                        <Text style={globalStyles.buttonPrimaryText}>Delete Lap</Text>
                                    )}
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </Modal>
                <Modal
                    visible={showPressureModal}
                    transparent
                    animationType="fade"
                    onRequestClose={closePressureModal}
                >
                    <ScrollView
                        contentContainerStyle={styles.modalContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={globalStyles.modalOverlay}>
                            <View style={globalStyles.modalCard}>
                                <Text style={globalStyles.modalTitle}>
                                    Record Tyre Check
                                </Text>

                                <Text style={globalStyles.label}>
                                    Check Stage
                                </Text>

                                <View style={styles.stageButtonRow}>
                                    {(
                                        [
                                            {
                                                label: "Start",
                                                value: "start",
                                            },
                                            {
                                                label: "Mid",
                                                value: "mid",
                                            },
                                            {
                                                label: "End",
                                                value: "end",
                                            },
                                        ] as const
                                    ).map((item) => {
                                        const isSelected =
                                            pressureStage === item.value;

                                        return (
                                            <Pressable
                                                key={item.value}
                                                style={[
                                                    styles.stageButton,
                                                    isSelected &&
                                                    styles.stageButtonSelected,
                                                ]}
                                                onPress={() =>
                                                    setPressureStage(
                                                        item.value
                                                    )
                                                }
                                            >
                                                <Text
                                                    style={[
                                                        styles.stageButtonText,
                                                        isSelected &&
                                                        styles.stageButtonTextSelected,
                                                    ]}
                                                >
                                                    {item.label}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>

                                <Text style={globalStyles.label}>
                                    Lap Number
                                </Text>

                                <TextInput
                                    style={globalStyles.input}
                                    value={pressureLapNumber}
                                    onChangeText={setPressureLapNumber}
                                    keyboardType="number-pad"
                                    placeholder="Latest lap"
                                    placeholderTextColor="#9ca3af"
                                />

                                <Text style={globalStyles.sectionTitle}>
                                    Pressure — PSI
                                </Text>

                                <View style={styles.cornerInputGrid}>
                                    <View style={styles.cornerInput}>
                                        <Text style={globalStyles.label}>
                                            LF
                                        </Text>

                                        <TextInput
                                            style={globalStyles.input}
                                            value={psiLF}
                                            onChangeText={setPsiLF}
                                            keyboardType="decimal-pad"
                                            placeholder="0.0"
                                            placeholderTextColor="#9ca3af"
                                        />
                                    </View>

                                    <View style={styles.cornerInput}>
                                        <Text style={globalStyles.label}>
                                            RF
                                        </Text>

                                        <TextInput
                                            style={globalStyles.input}
                                            value={psiRF}
                                            onChangeText={setPsiRF}
                                            keyboardType="decimal-pad"
                                            placeholder="0.0"
                                            placeholderTextColor="#9ca3af"
                                        />
                                    </View>

                                    <View style={styles.cornerInput}>
                                        <Text style={globalStyles.label}>
                                            LR
                                        </Text>

                                        <TextInput
                                            style={globalStyles.input}
                                            value={psiLR}
                                            onChangeText={setPsiLR}
                                            keyboardType="decimal-pad"
                                            placeholder="0.0"
                                            placeholderTextColor="#9ca3af"
                                        />
                                    </View>

                                    <View style={styles.cornerInput}>
                                        <Text style={globalStyles.label}>
                                            RR
                                        </Text>

                                        <TextInput
                                            style={globalStyles.input}
                                            value={psiRR}
                                            onChangeText={setPsiRR}
                                            keyboardType="decimal-pad"
                                            placeholder="0.0"
                                            placeholderTextColor="#9ca3af"
                                        />
                                    </View>
                                </View>

                                <Text style={globalStyles.sectionTitle}>
                                    Rim Temperature — °C
                                </Text>

                                <View style={styles.cornerInputGrid}>
                                    <View style={styles.cornerInput}>
                                        <Text style={globalStyles.label}>
                                            LF
                                        </Text>

                                        <TextInput
                                            style={globalStyles.input}
                                            value={rimTempLF}
                                            onChangeText={setRimTempLF}
                                            keyboardType="decimal-pad"
                                            placeholder="Optional"
                                            placeholderTextColor="#9ca3af"
                                        />
                                    </View>

                                    <View style={styles.cornerInput}>
                                        <Text style={globalStyles.label}>
                                            RF
                                        </Text>

                                        <TextInput
                                            style={globalStyles.input}
                                            value={rimTempRF}
                                            onChangeText={setRimTempRF}
                                            keyboardType="decimal-pad"
                                            placeholder="Optional"
                                            placeholderTextColor="#9ca3af"
                                        />
                                    </View>

                                    <View style={styles.cornerInput}>
                                        <Text style={globalStyles.label}>
                                            LR
                                        </Text>

                                        <TextInput
                                            style={globalStyles.input}
                                            value={rimTempLR}
                                            onChangeText={setRimTempLR}
                                            keyboardType="decimal-pad"
                                            placeholder="Optional"
                                            placeholderTextColor="#9ca3af"
                                        />
                                    </View>

                                    <View style={styles.cornerInput}>
                                        <Text style={globalStyles.label}>
                                            RR
                                        </Text>

                                        <TextInput
                                            style={globalStyles.input}
                                            value={rimTempRR}
                                            onChangeText={setRimTempRR}
                                            keyboardType="decimal-pad"
                                            placeholder="Optional"
                                            placeholderTextColor="#9ca3af"
                                        />
                                    </View>
                                </View>

                                <Text style={globalStyles.label}>
                                    Notes
                                </Text>

                                <TextInput
                                    style={[
                                        globalStyles.input,
                                        styles.pressureNotesInput,
                                    ]}
                                    value={pressureNotes}
                                    onChangeText={setPressureNotes}
                                    placeholder="Adjustments, conditions, comments"
                                    placeholderTextColor="#9ca3af"
                                    multiline
                                    textAlignVertical="top"
                                />

                                {errorMessage ? (
                                    <Text style={globalStyles.errorText}>
                                        {errorMessage}
                                    </Text>
                                ) : null}

                                <View style={styles.modalActions}>
                                    <Pressable
                                        style={globalStyles.buttonDanger}
                                        onPress={closePressureModal}
                                        disabled={isSavingPressure}
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
                                            globalStyles.buttonPrimary,
                                            isSavingPressure &&
                                            globalStyles.buttonDisabled,
                                        ]}
                                        onPress={handleSavePressureCheck}
                                        disabled={isSavingPressure}
                                    >
                                        {isSavingPressure ? (
                                            <ActivityIndicator
                                                color="#ffffff"
                                            />
                                        ) : (
                                            <Text
                                                style={
                                                    globalStyles.buttonPrimaryText
                                                }
                                            >
                                                Save Check
                                            </Text>
                                        )}
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </Modal>

                <Modal
                    visible={showAssignTyreSetModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() =>
                        setShowAssignTyreSetModal(false)
                    }
                >
                    <View style={globalStyles.modalOverlay}>
                        <View style={globalStyles.modalCard}>
                            <Text style={globalStyles.modalTitle}>
                                Assign Tyre Set
                            </Text>

                            {tyreSetOptions.length === 0 ? (
                                <Text style={globalStyles.text}>
                                    No complete tyre sets are available
                                    for this vehicle.
                                </Text>
                            ) : (
                                <View style={styles.tyreSetList}>
                                    {tyreSetOptions.map((set) => {
                                        const isSelected =
                                            selectedTyreSetKey ===
                                            set.key;

                                        return (
                                            <Pressable
                                                key={set.key}
                                                style={[
                                                    styles.tyreSetOption,
                                                    isSelected &&
                                                    styles.tyreSetOptionSelected,
                                                ]}
                                                onPress={() =>
                                                    setSelectedTyreSetKey(
                                                        set.key
                                                    )
                                                }
                                            >
                                                <View>
                                                    <Text
                                                        style={
                                                            globalStyles.cardText
                                                        }
                                                    >
                                                        {set.currentSet}
                                                    </Text>

                                                    <Text
                                                        style={
                                                            globalStyles.subText
                                                        }
                                                    >
                                                        {set.brand || "-"}
                                                        {set.spec
                                                            ? ` ${set.spec}`
                                                            : ""}
                                                    </Text>

                                                    <Text
                                                        style={
                                                            globalStyles.subText
                                                        }
                                                    >
                                                        LF · RF · LR · RR
                                                    </Text>
                                                </View>

                                                <Text
                                                    style={
                                                        styles.tyreSetCount
                                                    }
                                                >
                                                    4/4
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            )}

                            {errorMessage ? (
                                <Text style={globalStyles.errorText}>
                                    {errorMessage}
                                </Text>
                            ) : null}

                            <View style={styles.modalActions}>
                                <Pressable
                                    style={globalStyles.buttonDanger}
                                    onPress={() => {
                                        setSelectedTyreSetKey("");
                                        setErrorMessage("");
                                        setShowAssignTyreSetModal(
                                            false
                                        );
                                    }}
                                    disabled={isAssigningTyreSet}
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
                                        globalStyles.buttonPrimary,
                                        isAssigningTyreSet &&
                                        globalStyles.buttonDisabled,
                                    ]}
                                    onPress={handleAssignTyreSet}
                                    disabled={
                                        isAssigningTyreSet ||
                                        !selectedTyreSetKey
                                    }
                                >
                                    {isAssigningTyreSet ? (
                                        <ActivityIndicator
                                            color="#ffffff"
                                        />
                                    ) : (
                                        <Text
                                            style={
                                                globalStyles.buttonPrimaryText
                                            }
                                        >
                                            Assign Set
                                        </Text>
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
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },

    modalActions: {
        flexDirection: "row",
        gap: 10,
        marginTop: 16,
        flexWrap: "wrap",
    },

    pressureActionRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 12,
        marginBottom: 16,
    },

    stageButtonRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 12,
    },

    stageButton: {
        flex: 1,
        minWidth: 80,
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#4b5563",
        borderRadius: 10,
        paddingVertical: 11,
        paddingHorizontal: 14,
        alignItems: "center",
    },

    stageButtonSelected: {
        backgroundColor: "#2563eb",
        borderColor: "#2563eb",
    },

    stageButtonText: {
        color: "#d1d5db",
        fontWeight: "700",
    },

    stageButtonTextSelected: {
        color: "#ffffff",
    },

    cornerInputGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 16,
    },

    cornerInput: {
        flexGrow: 1,
        flexBasis: "45%",
    },

    pressureCheckCard: {
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#374151",
        borderRadius: 12,
        padding: 14,
        marginTop: 12,
        gap: 10,
    },

    pressureCheckHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
    },

    pressureCheckTitle: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "800",
    },

    pressureCheckLap: {
        color: "#9ca3af",
        fontSize: 13,
        fontWeight: "600",
    },

    pressureGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },

    pressureCornerCard: {
        flexGrow: 1,
        flexBasis: "45%",
        backgroundColor: "#1f2937",
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: "#374151",
    },

    cornerLabel: {
        color: "#ffffff",
        fontSize: 17,
        fontWeight: "800",
        marginBottom: 5,
    },

    pressureValue: {
        color: "#f3f4f6",
        fontSize: 15,
        fontWeight: "700",
    },

    rimTempValue: {
        color: "#9ca3af",
        fontSize: 13,
        marginTop: 3,
    },

    pressureNotes: {
        color: "#d1d5db",
        fontSize: 13,
        marginTop: 4,
    },

    pressureNotesInput: {
        minHeight: 90,
    },
    tyreSetList: {
        gap: 10,
        marginTop: 12,
        marginBottom: 12,
    },

    tyreSetOption: {
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#374151",
        borderRadius: 12,
        padding: 14,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
    },

    tyreSetOptionSelected: {
        backgroundColor: "#1d4ed8",
        borderColor: "#2563eb",
    },

    tyreSetCount: {
        color: "#ffffff",
        fontSize: 13,
        fontWeight: "700",
    },
    lapTypeRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 12,
    },

    lapTypeButton: {
        flex: 1,
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#4b5563",
        borderRadius: 10,
        paddingVertical: 11,
        paddingHorizontal: 12,
        alignItems: "center",
    },

    lapTypeButtonSelected: {
        backgroundColor: "#2563eb",
        borderColor: "#2563eb",
    },

    lapTypeButtonText: {
        color: "#d1d5db",
        fontWeight: "700",
    },

    lapTypeButtonTextSelected: {
        color: "#ffffff",
    },
});
