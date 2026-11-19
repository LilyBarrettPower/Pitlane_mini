import { useEffect, useState, useMemo } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, Pressable, Modal, TextInput } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { apiFetch } from "../../../../../../../assets/api";
import { useAuth } from "../../../../../../../context/AuthContext";
import { globalStyles } from "../../../../../../../constants/styles";
import { colors } from "../../../../../../../constants/theme";
import {
    Badge,
    Button,
    EmptyState,
    ErrorBanner,
    Field,
    LoadingState,
    PageHeader,
    Panel,
    Screen,
    useIsWide,
} from "../../../../../../../components/ui/kit";

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
    distanceKm?: number; // laps x track length, set when the car comes in
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

type SetUpOption = {
    _id: string;
    version: string;
};

type TyreNote = {
    _id: string;
    tyreId: string;
    runId: string;
    corner: "LF" | "RF" | "LR" | "RR";
    category: string;
    note: string;
    createdAt: string;
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
    const { id: eventId, runId, eventVehicleId } = useLocalSearchParams<{
        id: string;
        eventVehicleId: string;
        runId: string;
    }>();

    const { token } = useAuth();
    const isWide = useIsWide();
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

    const [tyreNotes, setTyreNotes] = useState<TyreNote[]>([]);
    const [showTyreNoteModal, setShowTyreNoteModal] = useState(false);
    const [isSavingTyreNote, setIsSavingTyreNote] = useState(false);

    const [noteCorner, setNoteCorner] = useState<"LF" | "RF" | "LR" | "RR">("LF");
    const [noteCategory, setNoteCategory] = useState("General");
    const [tyreNoteText, setTyreNoteText] = useState("");
    const [tyreNoteError, setTyreNoteError] = useState("");
    // First tap on "Delete" arms this; second tap confirms.
    const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);
    const [isDeletingTyreNote, setIsDeletingTyreNote] = useState(false);

    // The setup this run used (one per run) and the car's setups to choose from
    const [runSetUp, setRunSetUp] = useState<SetUpOption | null>(null);
    const [vehicleSetUps, setVehicleSetUps] = useState<SetUpOption[]>([]);
    const [showSetUpModal, setShowSetUpModal] = useState(false);
    const [selectedSetUpId, setSelectedSetUpId] = useState("");
    const [isSavingSetUp, setIsSavingSetUp] = useState(false);

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

    async function fetchTyreNotes() {
        const data = await apiFetch(
            `/tyre-notes?runId=${runId}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        setTyreNotes(data.tyreNotes || []);
    }

    async function fetchRunSetUp() {
        const data = await apiFetch(`/run-setups/setup/${runId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const setUp = data.assignments?.[0]?.setUpId;
        setRunSetUp(setUp ? { _id: setUp._id, version: setUp.version } : null);
    }

    async function fetchVehicleSetUps(vehicleId: string) {
        const data = await apiFetch(`/setups?vehicleId=${vehicleId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        setVehicleSetUps(data.setups || []);
    }

    function openSetUpModal() {
        setSelectedSetUpId(runSetUp?._id || "");
        setShowSetUpModal(true);
    }

    async function handleSaveRunSetUp() {
        try {
            setIsSavingSetUp(true);
            setErrorMessage("");

            await apiFetch(`/run-setups/run/${runId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ setUpId: selectedSetUpId || null }),
            });

            setShowSetUpModal(false);
            await fetchRunSetUp();
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : "Failed to save setup"
            );
        } finally {
            setIsSavingSetUp(false);
        }
    }

    function openTyreNoteModal() {
        setNoteCorner("LF");
        setNoteCategory("General");
        setTyreNoteText("");
        setTyreNoteError("");
        setShowTyreNoteModal(true);
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
        setTyreNotes([]);

        async function loadPage() {
            if (!runId || !token) return;

            try {
                await Promise.all([
                    fetchRun(),
                    fetchLapTimes(),
                    fetchTyreNotes(),
                    fetchRunSetUp(),
                ]);

                const loadedEventVehicle =
                    await fetchEventVehicle();

                if (loadedEventVehicle) {
                    await Promise.all([
                        fetchAvailableTyres(loadedEventVehicle),
                        fetchVehicleSetUps(getVehicleId(loadedEventVehicle)),
                    ]);
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

            const data = await apiFetch(`/runs/${runId}/car-in`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            await Promise.all([
                fetchRun(),
                fetchLapTimes(),
            ]);

            // e.g. tyre mileage skipped because the track has no distance set
            if (data.warning) {
                setErrorMessage(data.warning);
            }
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

    async function handleDeleteTyreNote(noteId: string) {
        try {
            setIsDeletingTyreNote(true);
            setErrorMessage("");

            await apiFetch(`/tyre-notes/${noteId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setNoteToDeleteId(null);
            await fetchTyreNotes();
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : "Failed to delete tyre note"
            );
        } finally {
            setIsDeletingTyreNote(false);
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

    async function handleSaveTyreNote() {
        if (!tyreRun) {
            setTyreNoteError("No tyres assigned to this run");
            return;
        }

        if (!tyreNoteText.trim()) {
            setTyreNoteError("Please enter a tyre note");
            return;
        }

        try {
            setIsSavingTyreNote(true);
            setTyreNoteError("");

            await apiFetch("/tyre-notes", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    runId,
                    corner: noteCorner,
                    category: noteCategory,
                    note: tyreNoteText.trim(),
                }),
            });

            setShowTyreNoteModal(false);
            setTyreNoteText("");

            await fetchTyreNotes();

        } catch (error) {
            setTyreNoteError(
                error instanceof Error
                    ? error.message
                    : "Failed to save tyre note"
            );
        } finally {
            setIsSavingTyreNote(false);
        }
    }

    if (isLoading && !run) {
        return (
            <Screen>
                <LoadingState />
            </Screen>
        );
    }

    if (!run) {
        return (
            <Screen>
                <PageHeader title="Run" onBack={() => router.navigate(`/events/${eventId}/vehicles/${eventVehicleId}` as any)} backLabel="Runs" />
                <ErrorBanner message={errorMessage || "Run not found"} />
            </Screen>
        );
    }

    const runState = !run.outTime ? "ready" : !run.inTime ? "onTrack" : "complete";

    const headerActions =
        runState === "ready" ? (
            <Button label="Car Out" icon="play" onPress={handleCarOut} />
        ) : runState === "onTrack" ? (
            <>
                <Button label="Add Lap" icon="add" variant="secondary" onPress={openAddLapModal} />
                <Button label="Car In" icon="flag" variant="danger" onPress={handleCarIn} />
            </>
        ) : (
            <Badge label="Run complete" tone="primary" />
        );

    const statTiles = (
        <View style={styles.statRow}>
            <View style={styles.statTile}>
                <Text style={styles.statLabel}>LAPS</Text>
                <Text style={styles.statValue}>{run.lapsDone ?? lapTimes.length}</Text>
            </View>
            <View style={styles.statTile}>
                <Text style={styles.statLabel}>
                    BEST LAP{run.bestLapS && getBestLapNumber() ? ` · LAP ${getBestLapNumber()}` : ""}
                </Text>
                <Text style={styles.statValue}>{run.bestLapS ? formatLapTime(run.bestLapS) : "—"}</Text>
            </View>
            <View style={styles.statTile}>
                <Text style={styles.statLabel}>AVERAGE LAP</Text>
                <Text style={styles.statValue}>{run.averageLapS ? formatLapTime(run.averageLapS) : "—"}</Text>
            </View>
            <View style={styles.statTile}>
                <Text style={styles.statLabel}>FUEL / LAP</Text>
                <Text style={styles.statValue}>
                    {run.fuelPerLap != null ? run.fuelPerLap.toFixed(2) : "—"}
                    {run.fuelPerLap != null ? <Text style={styles.statUnit}> L</Text> : null}
                </Text>
            </View>
            <View style={styles.statTile}>
                <Text style={styles.statLabel}>DISTANCE</Text>
                <Text style={styles.statValue}>
                    {run.distanceKm ? Math.round(run.distanceKm * 10) / 10 : "—"}
                    {run.distanceKm ? <Text style={styles.statUnit}> km</Text> : null}
                </Text>
            </View>
        </View>
    );

    const detailsPanel = (
        <Panel title="Run Details" icon="information-circle-outline">
            <View style={styles.fieldGrid}>
                <Field label="Out" value={run.outTime ? formatTime(run.outTime) : undefined} />
                <Field label="In" value={run.inTime ? formatTime(run.inTime) : undefined} />
                <Field label="Weather" value={run.weather} />
                <Field label="Track temp" value={run.trackTemp != null && run.trackTemp !== "" ? `${run.trackTemp}°C` : undefined} />
                <Field label="Track condition" value={run.trackCondition} />
            </View>

            <View style={styles.setupBlock}>
                <View style={styles.setupInfo}>
                    <Text style={styles.setupLabel}>SETUP</Text>
                    {runSetUp ? (
                        <Pressable
                            hitSlop={6}
                            onPress={() =>
                                eventVehicle &&
                                router.push({
                                    pathname: "/vehicles/[id]/setups/[setupId]",
                                    params: {
                                        id: getVehicleId(eventVehicle),
                                        setupId: runSetUp._id,
                                    },
                                })
                            }
                        >
                            <Text style={styles.setupLink}>Setup {runSetUp.version} ›</Text>
                        </Pressable>
                    ) : (
                        <Text style={styles.setupNone}>None recorded</Text>
                    )}
                </View>
                <Button
                    label={runSetUp ? "Change" : "Choose"}
                    size="sm"
                    variant="secondary"
                    onPress={openSetUpModal}
                />
            </View>
        </Panel>
    );

    const lapsPanel = (
        <Panel
            title="Lap Times"
            icon="stopwatch-outline"
            actionLabel={runState === "onTrack" ? "Add lap" : undefined}
            onAction={runState === "onTrack" ? openAddLapModal : undefined}
        >
            {lapTimes.length === 0 ? (
                <EmptyState
                    icon="stopwatch-outline"
                    text={
                        runState === "ready"
                            ? "Press Car Out to start the run, then add laps."
                            : runState === "onTrack"
                                ? "No laps yet. Add the first lap time."
                                : "No lap times were recorded for this run."
                    }
                    action={
                        runState === "onTrack" ? (
                            <Button label="Add Lap" icon="add" size="sm" onPress={openAddLapModal} />
                        ) : undefined
                    }
                />
            ) : (
                <>
                    <View style={styles.tableHead}>
                        <Text style={[styles.tableHeadText, styles.colLap]}>LAP</Text>
                        <Text style={[styles.tableHeadText, styles.colTime]}>TIME</Text>
                        <Text style={[styles.tableHeadText, styles.colFuel]}>FUEL</Text>
                        <Text style={[styles.tableHeadText, styles.colFuel]}>BURN</Text>
                        <View style={styles.colActions} />
                    </View>

                    {lapTimes.map((lap, index) => {
                        const fuelBurn = getLapFuelBurn(index);
                        const isBest = !!run.bestLapS && lap.lapTimeS === run.bestLapS && !lap.isInLap && !lap.isOutLap;

                        return (
                            <View
                                key={lap._id}
                                style={[styles.tableRow, index === lapTimes.length - 1 && styles.tableRowLast]}
                            >
                                <View style={styles.colLap}>
                                    <Text style={styles.lapNumber}>{lap.lapNumber}</Text>
                                    {lap.isOutLap ? <Badge label="OUT" /> : lap.isInLap ? <Badge label="IN" /> : null}
                                </View>

                                <View style={styles.colTime}>
                                    <Text style={[styles.lapTime, isBest && styles.lapTimeBest]}>
                                        {formatLapTime(lap.lapTimeS)}
                                    </Text>
                                    {lap.trackStatus || lap.notes ? (
                                        <Text style={styles.lapMeta} numberOfLines={1}>
                                            {[lap.trackStatus, lap.notes].filter(Boolean).join(" · ")}
                                        </Text>
                                    ) : null}
                                </View>

                                <Text style={[styles.tableCell, styles.colFuel]}>
                                    {lap.fuelRemaining != null ? `${lap.fuelRemaining} L` : "—"}
                                </Text>
                                <Text style={[styles.tableCell, styles.colFuel]}>
                                    {fuelBurn !== null ? `${fuelBurn.toFixed(2)} L` : "—"}
                                </Text>

                                <View style={[styles.colActions, styles.lapActions]}>
                                    <Pressable
                                        hitSlop={6}
                                        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
                                        onPress={() => openEditLapModal(lap)}
                                    >
                                        <Ionicons name="create-outline" size={17} color={colors.textMuted} />
                                    </Pressable>
                                    <Pressable
                                        hitSlop={6}
                                        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
                                        onPress={() => setLapToDelete(lap)}
                                    >
                                        <Ionicons name="trash-outline" size={17} color={colors.textMuted} />
                                    </Pressable>
                                </View>
                            </View>
                        );
                    })}
                </>
            )}

            {runState === "complete" && lapTimes.length > 0 ? (
                <Text style={styles.lapFootnote}>Lap entry closed — run complete</Text>
            ) : null}
        </Panel>
    );

    return (
        <Screen>
            <PageHeader
                eyebrow={
                    runState === "onTrack" ? "● On track" : runState === "complete" ? "Run complete" : "Ready to go out"
                }
                title={run.name || "Run"}
                subtitle={
                    run.outTime
                        ? `Out ${formatTime(run.outTime)}${run.inTime ? ` · In ${formatTime(run.inTime)}` : ""}`
                        : undefined
                }
                onBack={() => router.navigate(`/events/${eventId}/vehicles/${eventVehicleId}` as any)}
                backLabel="Runs"
                actions={headerActions}
            />

            <ErrorBanner message={errorMessage} />

            {statTiles}

            <View style={isWide ? styles.columns : styles.stack}>
                <View style={isWide ? styles.colMain : styles.stack}>
                    {lapsPanel}
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
                </View>

                <View style={isWide ? styles.colSide : styles.stack}>
                    {detailsPanel}
                <View style={globalStyles.card}>
                    <Text style={globalStyles.sectionTitle}>
                        Tyre Notes
                    </Text>

                    {tyreRun ? (
                        <Pressable
                            style={globalStyles.buttonPrimary}
                            onPress={openTyreNoteModal}
                        >
                            <Text style={globalStyles.buttonPrimaryText}>
                                Add Tyre Note
                            </Text>
                        </Pressable>
                    ) : (
                        <Text style={globalStyles.subText}>
                            Assign tyres before recording tyre notes.
                        </Text>
                    )}

                    {tyreNotes.length === 0 ? (
                        <Text style={globalStyles.subText}>
                            No tyre notes recorded for this run.
                        </Text>
                    ) : (
                        tyreNotes.map((item) => (
                            <View
                                key={item._id}
                                style={styles.tyreNoteCard}
                            >
                                <View style={styles.tyreNoteHeader}>
                                    <Text style={styles.tyreNoteCorner}>
                                        {item.corner}
                                    </Text>

                                    <Text style={styles.tyreNoteCategory}>
                                        {item.category}
                                    </Text>
                                </View>

                                <Text style={globalStyles.cardText}>
                                    {item.note}
                                </Text>

                                <View style={styles.tyreNoteFooter}>
                                    <Text style={globalStyles.subText}>
                                        {new Date(item.createdAt).toLocaleString("en-NZ")}
                                    </Text>

                                    {noteToDeleteId === item._id ? (
                                        <View style={styles.tyreNoteActions}>
                                            <Pressable
                                                style={globalStyles.smallButton}
                                                onPress={() => setNoteToDeleteId(null)}
                                                disabled={isDeletingTyreNote}
                                            >
                                                <Text style={globalStyles.smallButtonText}>
                                                    Cancel
                                                </Text>
                                            </Pressable>

                                            <Pressable
                                                style={[
                                                    globalStyles.buttonDangerSmall,
                                                    isDeletingTyreNote && globalStyles.buttonDisabled,
                                                ]}
                                                onPress={() => handleDeleteTyreNote(item._id)}
                                                disabled={isDeletingTyreNote}
                                            >
                                                <Text style={globalStyles.smallButtonText}>
                                                    {isDeletingTyreNote ? "Deleting..." : "Confirm Delete"}
                                                </Text>
                                            </Pressable>
                                        </View>
                                    ) : (
                                        <Pressable
                                            style={globalStyles.smallButton}
                                            onPress={() => setNoteToDeleteId(item._id)}
                                        >
                                            <Text style={globalStyles.smallButtonText}>
                                                Delete
                                            </Text>
                                        </Pressable>
                                    )}
                                </View>
                            </View>
                        ))
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
                {/* Fuel per lap is in the stat tiles above */}
                <Panel title="Fuel" icon="water-outline">
                    <View style={styles.fieldGrid}>
                        <Field label="Start" value={run.fuelStart != null ? `${run.fuelStart} L` : undefined} />
                        <Field label="End" value={run.fuelEnd != null ? `${run.fuelEnd} L` : undefined} />
                        <Field
                            label="Used"
                            value={run.fuelUsed != null ? `${Math.round(run.fuelUsed * 100) / 100} L` : undefined}
                        />
                    </View>
                    <Button
                        label={run.fuelEnd == null ? "Enter Fuel End" : "Edit Fuel End"}
                        icon="create-outline"
                        size="sm"
                        variant="secondary"
                        style={styles.fuelButton}
                        onPress={() => {
                            setFuelEndInput(run.fuelEnd ? String(run.fuelEnd) : "");
                            setShowFuelEndModal(true);
                        }}
                    />
                </Panel>

                <View style={globalStyles.card}>
                    <Text style={globalStyles.sectionTitle}>Notes</Text>
                    <Text style={globalStyles.cardText}>{run.notes || "-"}</Text>
                </View>
                </View>
            </View>

                <Modal
                    visible={showSetUpModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowSetUpModal(false)}
                >
                    <View style={globalStyles.modalOverlay}>
                        <View style={globalStyles.modalCard}>
                            <Text style={globalStyles.modalTitle}>Setup Used</Text>

                            {vehicleSetUps.length === 0 ? (
                                <Text style={globalStyles.subText}>
                                    This vehicle has no setups yet. Create one on the vehicle page.
                                </Text>
                            ) : (
                                <View style={styles.setUpOptionGrid}>
                                    {[{ _id: "", version: "None" }, ...vehicleSetUps].map((setUp) => {
                                        const isSelected = selectedSetUpId === setUp._id;

                                        return (
                                            <Pressable
                                                key={setUp._id || "none"}
                                                style={[
                                                    styles.setUpOption,
                                                    isSelected && styles.lapTypeButtonSelected,
                                                ]}
                                                onPress={() => setSelectedSetUpId(setUp._id)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.lapTypeButtonText,
                                                        isSelected && styles.lapTypeButtonTextSelected,
                                                    ]}
                                                >
                                                    {setUp._id ? `Setup ${setUp.version}` : "None"}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            )}

                            <View style={styles.actionRow}>
                                <Pressable
                                    style={globalStyles.buttonDanger}
                                    onPress={() => setShowSetUpModal(false)}
                                    disabled={isSavingSetUp}
                                >
                                    <Text style={globalStyles.buttonPrimaryText}>Cancel</Text>
                                </Pressable>

                                <Pressable
                                    style={[
                                        globalStyles.buttonPrimary,
                                        isSavingSetUp && globalStyles.buttonDisabled,
                                    ]}
                                    onPress={handleSaveRunSetUp}
                                    disabled={isSavingSetUp}
                                >
                                    {isSavingSetUp ? (
                                        <ActivityIndicator color="#ffffff" />
                                    ) : (
                                        <Text style={globalStyles.buttonPrimaryText}>Save Setup</Text>
                                    )}
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </Modal>

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

                <Modal
                    visible={showTyreNoteModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowTyreNoteModal(false)}
                >
                    <ScrollView
                        contentContainerStyle={styles.modalContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={globalStyles.modalOverlay}>
                            <View style={globalStyles.modalCard}>
                                <Text style={globalStyles.modalTitle}>
                                    Add Tyre Note
                                </Text>

                                <Text style={globalStyles.label}>
                                    Tyre Position
                                </Text>

                                <View style={styles.stageButtonRow}>
                                    {(["LF", "RF", "LR", "RR"] as const).map(
                                        (corner) => (
                                            <Pressable
                                                key={corner}
                                                style={[
                                                    styles.stageButton,
                                                    noteCorner === corner &&
                                                    styles.stageButtonSelected,
                                                ]}
                                                onPress={() => setNoteCorner(corner)}
                                            >
                                                <Text style={styles.stageButtonText}>
                                                    {corner}
                                                </Text>
                                            </Pressable>
                                        )
                                    )}
                                </View>

                                <Text style={globalStyles.label}>
                                    Category
                                </Text>

                                <View style={styles.stageButtonRow}>
                                    {[
                                        "General",
                                        "Puncture",
                                        "Flat Spot",
                                        "Damage",
                                        "Wear",
                                        "Other",
                                    ].map((category) => (
                                        <Pressable
                                            key={category}
                                            style={[
                                                styles.stageButton,
                                                noteCategory === category &&
                                                styles.stageButtonSelected,
                                            ]}
                                            onPress={() => setNoteCategory(category)}
                                        >
                                            <Text style={styles.stageButtonText}>
                                                {category}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>

                                <Text style={globalStyles.label}>
                                    Notes
                                </Text>

                                <TextInput
                                    style={[
                                        globalStyles.input,
                                        styles.tyreNoteInput,
                                    ]}
                                    value={tyreNoteText}
                                    onChangeText={setTyreNoteText}
                                    placeholder="Describe the tyre issue..."
                                    placeholderTextColor="#9ca3af"
                                    multiline
                                    textAlignVertical="top"
                                />

                                {tyreNoteError ? (
                                    <Text style={globalStyles.errorText}>
                                        {tyreNoteError}
                                    </Text>
                                ) : null}

                                <View style={styles.modalActions}>
                                    <Pressable
                                        style={globalStyles.buttonDanger}
                                        onPress={() => setShowTyreNoteModal(false)}
                                        disabled={isSavingTyreNote}
                                    >
                                        <Text style={globalStyles.buttonPrimaryText}>
                                            Cancel
                                        </Text>
                                    </Pressable>

                                    <Pressable
                                        style={globalStyles.buttonPrimary}
                                        onPress={handleSaveTyreNote}
                                        disabled={isSavingTyreNote}
                                    >
                                        {isSavingTyreNote ? (
                                            <ActivityIndicator color="#ffffff" />
                                        ) : (
                                            <Text style={globalStyles.buttonPrimaryText}>
                                                Save Note
                                            </Text>
                                        )}
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </Modal>
        </Screen>
    );
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

    setUpOptionGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 12,
    },

    setUpOption: {
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#4b5563",
        borderRadius: 10,
        paddingVertical: 11,
        paddingHorizontal: 14,
        alignItems: "center",
    },
    tyreNoteCard: {
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#374151",
        borderRadius: 12,
        padding: 14,
        marginTop: 12,
        gap: 8,
    },

    tyreNoteHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    tyreNoteCorner: {
        color: "#ffffff",
        fontSize: 17,
        fontWeight: "800",
    },

    tyreNoteCategory: {
        color: "#93c5fd",
        fontSize: 13,
        fontWeight: "700",
    },

    tyreNoteInput: {
        minHeight: 110,
    },

    tyreNoteFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
    },

    tyreNoteActions: {
        flexDirection: "row",
        gap: 8,
    },

    // ----- Redesigned layout -----
    columns: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 20,
    },
    stack: {
        gap: 16,
    },
    colMain: {
        flex: 3,
        gap: 20,
    },
    colSide: {
        flex: 2,
        gap: 20,
    },
    statRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    statTile: {
        flexGrow: 1,
        flexBasis: 140,
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
        fontSize: 24,
        fontWeight: "800",
        fontVariant: ["tabular-nums"],
    },
    statUnit: {
        color: colors.textMuted,
        fontSize: 13,
        fontWeight: "600",
    },
    fieldGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 18,
    },
    setupBlock: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginTop: 18,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.borderDark,
    },
    setupInfo: {
        gap: 4,
        flexShrink: 1,
    },
    setupLabel: {
        color: colors.textMuted,
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 1,
    },
    setupLink: {
        color: colors.primaryLight,
        fontSize: 15,
        fontWeight: "700",
    },
    setupNone: {
        color: colors.textMuted,
        fontSize: 15,
    },
    tableHead: {
        flexDirection: "row",
        alignItems: "center",
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
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderDark,
    },
    tableRowLast: {
        borderBottomWidth: 0,
        paddingBottom: 0,
    },
    tableCell: {
        color: colors.textSecondary,
        fontSize: 14,
        fontVariant: ["tabular-nums"],
    },
    colLap: {
        width: 64,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    colTime: {
        flex: 1,
        paddingRight: 8,
    },
    colFuel: {
        width: 72,
        textAlign: "right",
    },
    colActions: {
        width: 76,
    },
    lapActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 4,
    },
    lapNumber: {
        color: colors.textMuted,
        fontSize: 14,
        fontWeight: "700",
        fontVariant: ["tabular-nums"],
    },
    lapTime: {
        color: colors.textPrimary,
        fontSize: 16,
        fontWeight: "700",
        fontVariant: ["tabular-nums"],
    },
    lapTimeBest: {
        color: colors.live,
    },
    lapMeta: {
        color: colors.textMuted,
        fontSize: 12,
        marginTop: 2,
    },
    fuelButton: {
        alignSelf: "flex-start",
        marginTop: 16,
    },
    lapFootnote: {
        color: colors.textMuted,
        fontSize: 13,
        marginTop: 14,
    },
    iconButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    pressed: {
        opacity: 0.7,
    },
});
