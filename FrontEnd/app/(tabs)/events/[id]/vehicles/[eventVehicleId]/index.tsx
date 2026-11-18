import { useEffect, useState, useCallback, useMemo } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, Pressable, Modal, TextInput } from "react-native";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";

import { apiFetch } from "../../../../../../assets/api";
import { useAuth } from "../../../../../../context/AuthContext";
import { globalStyles } from "../../../../../../constants/styles";
import { colors } from "../../../../../../constants/theme";
import {
    Badge,
    Button,
    EmptyState,
    ErrorBanner,
    LoadingState,
    PageHeader,
    Panel,
    Screen,
    useIsWide,
} from "../../../../../../components/ui/kit";

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
    rimTempC: CornerValues;
    recordedAt?: string;
    notes?: string;
};

type SetUpOption = {
    _id: string;
    version: string;
};

// From GET /run-setups/event-vehicle/:eventVehicleId
type SetUpUsedItem = {
    setUp: SetUpOption;
    runs: { _id: string; name?: string }[];
};

type EventTyreHistoryItem = {
    run: {
        _id: string;
        name: string;
        lapsDone?: number;
        outTime?: string;
        inTime?: string;
    };

    tyreRun: {
        _id: string;
        tyres: {
            LF: Tyre;
            RF: Tyre;
            LR: Tyre;
            RR: Tyre;
        };
    };

    pressureChecks: PressureCheck[];
}

export default function EventVehicleDetailPage() {
    const { id: eventId, eventVehicleId } = useLocalSearchParams<{
        id: string;
        eventVehicleId: string;
    }>();

    const { token } = useAuth();
    const isWide = useIsWide();

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

    const [tyreHistory, setTyreHistory] = useState<EventTyreHistoryItem[]>([]);

    // Setups: the car's setups for the Create Run picker (optional, "" = none),
    // and which setups were used at this event for the "Setup Used" card
    const [vehicleSetUps, setVehicleSetUps] = useState<SetUpOption[]>([]);
    const [selectedSetUpId, setSelectedSetUpId] = useState("");
    const [setUpsUsed, setSetUpsUsed] = useState<SetUpUsedItem[]>([]);

    const [tyreSelectionMode, setTyreSelectionMode] = useState<"set" | "custom">("set");
    const [selectedLF, setSelectedLF] = useState("");
    const [selectedRF, setSelectedRF] = useState("");
    const [selectedLR, setSelectedLR] = useState("");
    const [selectedRR, setSelectedRR] = useState("");


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

    async function fetchTyreHistory() {
        if (!eventVehicleId || !token) return;

        const data = await apiFetch(
            `/tyre-runs/event-vehicle/${eventVehicleId}/history`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        setTyreHistory(data.history || []);
    }

    async function fetchSetUpsUsed() {
        if (!eventVehicleId || !token) return;

        const data = await apiFetch(`/run-setups/event-vehicle/${eventVehicleId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        setSetUpsUsed(data.setUps || []);
    }

    // Loads the car's setups and pre-selects the one used on its most recent run
    async function loadSetUpOptions() {
        const vehicleId = getVehicleId();
        if (!vehicleId || !token) return;

        const [setUpsData, summaryData] = await Promise.all([
            apiFetch(`/setups?vehicleId=${vehicleId}`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            }),
            apiFetch(`/run-setups/vehicle/${vehicleId}/summary`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            }),
        ]);

        const setUps: SetUpOption[] = setUpsData.setups || [];
        setVehicleSetUps(setUps);

        const lastUsedId = summaryData.lastUsedSetUpId
            ? String(summaryData.lastUsedSetUpId)
            : "";
        setSelectedSetUpId(
            setUps.some((setUp) => setUp._id === lastUsedId) ? lastUsedId : ""
        );
    }

    useEffect(() => {
        if (eventId && eventVehicleId && token) {
            fetchEventVehicle();
            fetchEvent();
            fetchRuns();
            fetchTyreHistory();
            fetchSetUpsUsed();
        }
    }, [eventId, eventVehicleId, token]);

    useFocusEffect(
        useCallback(() => {
            if (eventVehicleId && token) {
                fetchRuns();
                fetchTyreHistory();
                fetchSetUpsUsed().catch(() => {});
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
        setTyreSelectionMode("set");
        setSelectedTyreSetKey("");
        setSelectedLF("");
        setSelectedLR("");
        setSelectedRF("");
        setSelectedRR("");
        setAvailableTyres([]);
        setSelectedSetUpId("");
    }

    function getTyresForCorner(
        corner: "LF" | "RF" | "LR" | "RR"
    ) {
        return availableTyres.filter(
            (tyre) =>
                tyre.position?.toUpperCase() === corner
        );
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

        // if (!selectedTyreSetKey) {
        //     setErrorMessage("Please select a tyre set");
        //     return;
        // }

        // const selectedSet = tyreSetOptions.find(
        //     (set) =>
        //         set.key === selectedTyreSetKey
        // );

        // if (!selectedSet) {
        //     setErrorMessage(
        //         "Selected tyre set could not be found"
        //     );
        //     return;
        // }

        let selectedTyres: {
            LF: string;
            RF: string;
            LR: string;
            RR: string;
        };

        if (tyreSelectionMode === "set") {
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

            selectedTyres = {
                LF: selectedSet.tyres.LF._id,
                RF: selectedSet.tyres.RF._id,
                LR: selectedSet.tyres.LR._id,
                RR: selectedSet.tyres.RR._id,
            };
        } else {
            if (
                !selectedLF ||
                !selectedRF ||
                !selectedLR ||
                !selectedRR
            ) {
                setErrorMessage(
                    "Please select a tyre for all four corners"
                );
                return;
            }

            selectedTyres = {
                LF: selectedLF,
                RF: selectedRF,
                LR: selectedLR,
                RR: selectedRR,
            };
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

                    tyres: selectedTyres,

                    notes: "",
                }),
            });

            // 3. Link the setup, if one was chosen (optional)
            if (selectedSetUpId) {
                await apiFetch(`/run-setups/run/${createdRun._id}`, {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ setUpId: selectedSetUpId }),
                });
            }

            clearRunForm();
            setShowRunModal(false);

            await Promise.all([fetchRuns(), fetchSetUpsUsed()]);
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

        await Promise.all([
            fetchAvailableTyres(),
            loadSetUpOptions().catch((error) =>
                setErrorMessage(
                    error instanceof Error ? error.message : "Failed to load setups"
                )
            ),
        ]);
    }


    if (isLoading && !eventVehicle) {
        return (
            <Screen>
                <LoadingState />
            </Screen>
        );
    }

    if (!eventVehicle) {
        return (
            <Screen>
                <PageHeader title="Event vehicle" onBack={() => router.back()} backLabel="Event" />
                <ErrorBanner message={errorMessage || "Event vehicle not found"} />
            </Screen>
        );
    }

    const carName =
        typeof eventVehicle.vehicleId === "string" ? "Event Vehicle" : vehicleLabel(eventVehicle.vehicleId);

    // e.g. 92.415 -> "1:32.415"
    const lapTime = (seconds?: number) => {
        if (!seconds || !Number.isFinite(seconds)) return "—";
        const mins = Math.floor(seconds / 60);
        const secs = (seconds % 60).toFixed(3).padStart(6, "0");
        return `${mins}:${secs}`;
    };

    const totalLaps = runs.reduce((sum, run) => sum + (run.lapsDone ?? 0), 0);
    const bestLaps = runs.map((run) => run.bestLapS).filter((time): time is number => !!time && time > 0);
    const bestLap = bestLaps.length ? Math.min(...bestLaps) : undefined;
    const totalFuel = runs.reduce((sum, run) => sum + (run.fuelUsed ?? 0), 0);

    const runStatus = (run: Run) =>
        !run.outTime
            ? { label: "Not started", tone: "neutral" as const }
            : !run.inTime
                ? { label: "● On track", tone: "live" as const }
                : { label: "Complete", tone: "primary" as const };

    const statTiles = (
        <View style={styles.statRow}>
            <View style={styles.statTile}>
                <Text style={styles.statLabel}>RUNS</Text>
                <Text style={styles.statValue}>{runs.length}</Text>
            </View>
            <View style={styles.statTile}>
                <Text style={styles.statLabel}>TOTAL LAPS</Text>
                <Text style={styles.statValue}>{totalLaps}</Text>
            </View>
            <View style={styles.statTile}>
                <Text style={styles.statLabel}>BEST LAP</Text>
                <Text style={styles.statValue}>{lapTime(bestLap)}</Text>
            </View>
            <View style={styles.statTile}>
                <Text style={styles.statLabel}>FUEL USED</Text>
                <Text style={styles.statValue}>
                    {Math.round(totalFuel * 10) / 10}
                    <Text style={styles.statUnit}> L</Text>
                </Text>
            </View>
        </View>
    );

    const runsPanel = (
        <Panel title="Runs" icon="stopwatch-outline" actionLabel="New run" onAction={openCreateRunModal}>
            {runs.length === 0 ? (
                <EmptyState
                    icon="stopwatch-outline"
                    text="No runs yet for this car."
                    action={<Button label="Create Run" icon="add" size="sm" onPress={openCreateRunModal} />}
                />
            ) : (
                <>
                    <View style={styles.tableHead}>
                        <Text style={[styles.tableHeadText, styles.colRun]}>RUN</Text>
                        <Text style={[styles.tableHeadText, styles.colLaps]}>LAPS</Text>
                        <Text style={[styles.tableHeadText, styles.colBest]}>BEST</Text>
                    </View>

                    {runs.map((run, index) => {
                        const status = runStatus(run);

                        return (
                            <Pressable
                                key={run._id}
                                style={({ pressed }) => [
                                    styles.tableRow,
                                    index === runs.length - 1 && styles.tableRowLast,
                                    pressed && styles.rowPressed,
                                ]}
                                onPress={() =>
                                    router.push(
                                        `/events/${String(eventId)}/vehicles/${String(eventVehicleId)}/runs/${run._id}`
                                    )
                                }
                            >
                                <View style={styles.colRun}>
                                    <View style={styles.runNameRow}>
                                        <Text style={styles.runName} numberOfLines={1}>
                                            {run.name || "Unnamed Run"}
                                        </Text>
                                        <Badge label={status.label} tone={status.tone} />
                                    </View>
                                    <Text style={styles.runSub} numberOfLines={1}>
                                        {[
                                            run.fuelUsed ? `${Math.round(run.fuelUsed * 10) / 10} L fuel` : "",
                                            run.weather,
                                        ]
                                            .filter(Boolean)
                                            .join(" · ") || "—"}
                                    </Text>
                                </View>
                                <Text style={[styles.tableCell, styles.colLaps]}>{run.lapsDone ?? 0}</Text>
                                <Text style={[styles.tableCell, styles.tableCellStrong, styles.colBest]}>
                                    {lapTime(run.bestLapS)}
                                </Text>
                            </Pressable>
                        );
                    })}
                </>
            )}
        </Panel>
    );

    const setupsPanel = (
        <Panel title="Setups Used" icon="construct-outline">
            {setUpsUsed.length === 0 ? (
                <EmptyState icon="construct-outline" text="No setups recorded for runs at this event yet." />
            ) : (
                setUpsUsed.map((item) => (
                    <Pressable
                        key={item.setUp._id}
                        style={({ pressed }) => [styles.setupRow, pressed && styles.pressed]}
                        onPress={() =>
                            router.push({
                                pathname: "/vehicles/[id]/setups/[setupId]",
                                params: {
                                    id: getVehicleId(),
                                    setupId: item.setUp._id,
                                },
                            })
                        }
                    >
                        <View style={styles.versionTile}>
                            <Text style={styles.versionText} numberOfLines={1}>{item.setUp.version || "–"}</Text>
                        </View>
                        <View style={styles.setupText}>
                            <Text style={styles.runName}>Setup {item.setUp.version}</Text>
                            <Text style={styles.runSub} numberOfLines={2}>
                                {item.runs.length} {item.runs.length === 1 ? "run" : "runs"}:{" "}
                                {item.runs.map((run) => run.name || "Unnamed Run").join(", ")}
                            </Text>
                        </View>
                    </Pressable>
                ))
            )}
        </Panel>
    );

    return (
        <Screen>
                <PageHeader
                    eyebrow={event?.name || "Event"}
                    title={carName}
                    subtitle="Runs, tyres and setups at this event"
                    onBack={() => router.back()}
                    backLabel="Event"
                    actions={<Button label="New Run" icon="add" onPress={openCreateRunModal} />}
                />

                {!showRunModal ? <ErrorBanner message={errorMessage} /> : null}

                {statTiles}

                <View style={isWide ? styles.columns : styles.stack}>
                    <View style={isWide ? styles.colMain : styles.stack}>
                        {runsPanel}
                        <Panel title="Tyres" icon="disc-outline">

                    {tyreHistory.length === 0 ? (
                        <Text style={globalStyles.text}>
                            No tyre sets have been used at this event yet.
                        </Text>
                    ) : (
                        tyreHistory.map((item) => {
                            const firstTyre =
                                item.tyreRun.tyres.LF;

                            const setName =
                                firstTyre?.currentSet ||
                                "Unknown Set";

                            const brand =
                                firstTyre?.brand || "-";

                            const spec =
                                firstTyre?.spec || "";

                            return (
                                <View
                                    key={item.tyreRun._id}
                                    style={styles.tyreHistoryCard}
                                >
                                    <View style={styles.tyreHistoryHeader}>
                                        <View>
                                            <Text style={styles.runTitle}>
                                                {item.run.name ||
                                                    "Unnamed Run"}
                                            </Text>

                                            <Text
                                                style={
                                                    globalStyles.subText
                                                }
                                            >
                                                {setName} · {brand}
                                                {spec
                                                    ? ` ${spec}`
                                                    : ""}
                                            </Text>
                                        </View>

                                        <Text
                                            style={
                                                styles.tyreHistoryLaps
                                            }
                                        >
                                            {item.run.lapsDone ?? 0} laps
                                        </Text>
                                    </View>

                                    <View style={styles.assignedTyresGrid}>
                                        {(
                                            ["LF", "RF", "LR", "RR"] as const
                                        ).map((corner) => {
                                            const tyre =
                                                item.tyreRun.tyres[
                                                corner
                                                ];

                                            return (
                                                <View
                                                    key={corner}
                                                    style={
                                                        styles.assignedTyreCard
                                                    }
                                                >
                                                    <Text
                                                        style={
                                                            styles.tyreCorner
                                                        }
                                                    >
                                                        {corner}
                                                    </Text>

                                                    <Text
                                                        style={
                                                            globalStyles.subText
                                                        }
                                                    >
                                                        FIA:{" "}
                                                        {tyre?.fiaSerial ||
                                                            "-"}
                                                    </Text>
                                                </View>
                                            );
                                        })}
                                    </View>

                                    <View
                                        style={
                                            styles.pressureSection
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.pressureSectionTitle
                                            }
                                        >
                                            Pressure Checks
                                        </Text>

                                        {item.pressureChecks.length ===
                                            0 ? (
                                            <Text
                                                style={
                                                    globalStyles.subText
                                                }
                                            >
                                                No pressure checks recorded
                                            </Text>
                                        ) : (
                                            item.pressureChecks.map(
                                                (check) => (
                                                    <View
                                                        key={check._id}
                                                        style={
                                                            styles.pressureCheckCard
                                                        }
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
                                                                {check.stage.toUpperCase()}
                                                            </Text>

                                                            <Text
                                                                style={
                                                                    globalStyles.subText
                                                                }
                                                            >
                                                                {check.lapNumber !=
                                                                    null
                                                                    ? `Lap ${check.lapNumber}`
                                                                    : ""}
                                                            </Text>
                                                        </View>

                                                        <View
                                                            style={
                                                                styles.pressureGrid
                                                            }
                                                        >
                                                            {(
                                                                [
                                                                    "LF",
                                                                    "RF",
                                                                    "LR",
                                                                    "RR",
                                                                ] as const
                                                            ).map(
                                                                (
                                                                    corner
                                                                ) => (
                                                                    <View
                                                                        key={
                                                                            corner
                                                                        }
                                                                        style={
                                                                            styles.pressureCorner
                                                                        }
                                                                    >
                                                                        <Text
                                                                            style={
                                                                                styles.tyreCorner
                                                                            }
                                                                        >
                                                                            {
                                                                                corner
                                                                            }
                                                                        </Text>

                                                                        <Text
                                                                            style={
                                                                                styles.pressureValue
                                                                            }
                                                                        >
                                                                            {check
                                                                                .pressurePsi?.[
                                                                                corner
                                                                            ] ??
                                                                                "-"}{" "}
                                                                            psi
                                                                        </Text>

                                                                        <Text
                                                                            style={
                                                                                globalStyles.subText
                                                                            }
                                                                        >
                                                                            Rim:{" "}
                                                                            {check
                                                                                .rimTempC?.[
                                                                                corner
                                                                            ] ??
                                                                                "-"}
                                                                            °C
                                                                        </Text>
                                                                    </View>
                                                                )
                                                            )}
                                                        </View>

                                                        {check.notes ? (
                                                            <Text
                                                                style={
                                                                    globalStyles.subText
                                                                }
                                                            >
                                                                Notes:{" "}
                                                                {
                                                                    check.notes
                                                                }
                                                            </Text>
                                                        ) : null}
                                                    </View>
                                                )
                                            )
                                        )}
                                    </View>
                                </View>
                            );
                        })
                    )}
                        </Panel>
                    </View>
                    <View style={isWide ? styles.colSide : styles.stack}>{setupsPanel}</View>
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

                                <Text style={globalStyles.label}>Setup (optional)</Text>
                                {vehicleSetUps.length === 0 ? (
                                    <Text style={[globalStyles.subText, styles.setUpHint]}>
                                        No setups for this vehicle yet
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
                                                        isSelected && styles.tyreModeButtonSelected,
                                                    ]}
                                                    onPress={() => setSelectedSetUpId(setUp._id)}
                                                >
                                                    <Text style={styles.tyreModeText}>
                                                        {setUp._id ? `Setup ${setUp.version}` : "None"}
                                                    </Text>
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                )}

                                <Text style={globalStyles.label}>Tyre Set</Text>
                                <View style={styles.tyreModeRow}>
                                    <Pressable
                                        style={[
                                            styles.tyreModeButton,
                                            tyreSelectionMode === "set" &&
                                            styles.tyreModeButtonSelected,
                                        ]}
                                        onPress={() => setTyreSelectionMode("set")}
                                    >
                                        <Text style={styles.tyreModeText}>
                                            Full Set
                                        </Text>
                                    </Pressable>

                                    <Pressable
                                        style={[
                                            styles.tyreModeButton,
                                            tyreSelectionMode === "custom" &&
                                            styles.tyreModeButtonSelected,
                                        ]}
                                        onPress={() => setTyreSelectionMode("custom")}
                                    >
                                        <Text style={styles.tyreModeText}>
                                            Custom Corners
                                        </Text>
                                    </Pressable>
                                </View>

                                {tyreSelectionMode === "set" ? (
                                    <>
                                        <Text style={globalStyles.label}>
                                            Tyre Set
                                        </Text>

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
                                                                <Text style={globalStyles.cardText}>
                                                                    {set.currentSet}
                                                                </Text>

                                                                <Text style={globalStyles.subText}>
                                                                    4/4
                                                                </Text>
                                                            </View>

                                                            <Text style={globalStyles.subText}>
                                                                {set.brand}
                                                                {set.spec ? ` ${set.spec}` : ""}
                                                            </Text>

                                                            <Text style={globalStyles.subText}>
                                                                LF · RF · LR · RR
                                                            </Text>
                                                        </Pressable>
                                                    );
                                                })}
                                            </View>
                                        )}
                                    </>
                                ) : (
                                    <View style={styles.customTyreSection}>
                                        {(["LF", "RF", "LR", "RR"] as const).map(
                                            (corner) => {
                                                const tyresForCorner =
                                                    getTyresForCorner(corner);

                                                const selectedId =
                                                    corner === "LF"
                                                        ? selectedLF
                                                        : corner === "RF"
                                                            ? selectedRF
                                                            : corner === "LR"
                                                                ? selectedLR
                                                                : selectedRR;

                                                const setSelected = (id: string) => {
                                                    if (corner === "LF") {
                                                        setSelectedLF(id);
                                                    } else if (corner === "RF") {
                                                        setSelectedRF(id);
                                                    } else if (corner === "LR") {
                                                        setSelectedLR(id);
                                                    } else {
                                                        setSelectedRR(id);
                                                    }
                                                };

                                                return (
                                                    <View
                                                        key={corner}
                                                        style={styles.customCornerCard}
                                                    >
                                                        <Text style={styles.customCornerTitle}>
                                                            {corner}
                                                        </Text>

                                                        {tyresForCorner.length === 0 ? (
                                                            <Text style={globalStyles.subText}>
                                                                No tyres available
                                                            </Text>
                                                        ) : (
                                                            tyresForCorner.map((tyre) => {
                                                                const isSelected =
                                                                    selectedId === tyre._id;

                                                                return (
                                                                    <Pressable
                                                                        key={tyre._id}
                                                                        style={[
                                                                            styles.customTyreOption,
                                                                            isSelected &&
                                                                            styles.customTyreOptionSelected,
                                                                        ]}
                                                                        onPress={() =>
                                                                            setSelected(tyre._id)
                                                                        }
                                                                    >
                                                                        <Text
                                                                            style={
                                                                                globalStyles.cardText
                                                                            }
                                                                        >
                                                                            {tyre.currentSet ||
                                                                                "No Set"}
                                                                        </Text>

                                                                        <Text
                                                                            style={
                                                                                globalStyles.subText
                                                                            }
                                                                        >
                                                                            {tyre.brand}
                                                                            {tyre.spec
                                                                                ? ` ${tyre.spec}`
                                                                                : ""}
                                                                        </Text>

                                                                        <Text
                                                                            style={
                                                                                globalStyles.subText
                                                                            }
                                                                        >
                                                                            FIA:{" "}
                                                                            {tyre.fiaSerial || "-"}
                                                                        </Text>
                                                                    </Pressable>
                                                                );
                                                            })
                                                        )}
                                                    </View>
                                                );
                                            }
                                        )}
                                    </View>
                                )}
                                {/* {isLoadingTyres ? (
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
                                )} */}

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
        </Screen>
    );
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
    tyreHistoryCard: {
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#374151",
        borderRadius: 12,
        padding: 14,
        marginTop: 12,
        gap: 12,
    },

    tyreHistoryHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
    },

    runTitle: {
        color: "#ffffff",
        fontSize: 17,
        fontWeight: "800",
    },

    tyreHistoryLaps: {
        color: "#9ca3af",
        fontSize: 12,
        fontWeight: "700",
    },

    assignedTyresGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },

    assignedTyreCard: {
        flexGrow: 1,
        flexBasis: "45%",
        backgroundColor: "#1f2937",
        borderRadius: 8,
        padding: 10,
    },

    tyreCorner: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "800",
    },

    pressureSection: {
        borderTopWidth: 1,
        borderTopColor: "#374151",
        paddingTop: 12,
        gap: 8,
    },

    pressureSectionTitle: {
        color: "#d1d5db",
        fontSize: 14,
        fontWeight: "700",
    },

    pressureCheckCard: {
        backgroundColor: "#1f2937",
        borderRadius: 10,
        padding: 12,
        gap: 8,
    },

    pressureCheckHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    pressureCheckTitle: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "800",
    },

    pressureGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },

    pressureCorner: {
        flexGrow: 1,
        flexBasis: "45%",
        backgroundColor: "#111827",
        borderRadius: 8,
        padding: 9,
    },

    pressureValue: {
        color: "#f3f4f6",
        fontSize: 13,
        fontWeight: "700",
        marginTop: 3,
    },
    tyreModeRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 12,
    },

    tyreModeButton: {
        flex: 1,
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#374151",
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: "center",
    },

    tyreModeButtonSelected: {
        backgroundColor: "#2563eb",
        borderColor: "#2563eb",
    },

    tyreModeText: {
        color: "#ffffff",
        fontWeight: "700",
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
        borderColor: "#374151",
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 14,
        alignItems: "center",
    },

    setUpHint: {
        marginBottom: 12,
    },

    customTyreSection: {
        gap: 12,
        marginBottom: 12,
    },

    customCornerCard: {
        backgroundColor: "#111827",
        borderRadius: 12,
        padding: 12,
        gap: 8,
    },

    customCornerTitle: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "800",
    },

    customTyreOption: {
        backgroundColor: "#1f2937",
        borderWidth: 1,
        borderColor: "#374151",
        borderRadius: 8,
        padding: 10,
    },

    customTyreOptionSelected: {
        backgroundColor: "#1d4ed8",
        borderColor: "#2563eb",
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
    rowPressed: {
        backgroundColor: colors.pressedOverlay,
    },
    tableCell: {
        color: colors.textSecondary,
        fontSize: 15,
        fontVariant: ["tabular-nums"],
    },
    tableCellStrong: {
        color: colors.textPrimary,
        fontWeight: "700",
    },
    colRun: {
        flex: 1,
        paddingRight: 12,
        gap: 4,
    },
    colLaps: {
        width: 56,
        textAlign: "center",
    },
    colBest: {
        width: 90,
        textAlign: "right",
    },
    runNameRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
    },
    runName: {
        color: colors.textPrimary,
        fontSize: 15,
        fontWeight: "700",
    },
    runSub: {
        color: colors.textMuted,
        fontSize: 13,
    },
    setupRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
    },
    setupText: {
        flex: 1,
        gap: 2,
    },
    versionTile: {
        minWidth: 38,
        height: 38,
        paddingHorizontal: 8,
        borderRadius: 10,
        backgroundColor: colors.primarySoft,
        alignItems: "center",
        justifyContent: "center",
    },
    versionText: {
        color: "#93c5fd",
        fontSize: 14,
        fontWeight: "800",
    },
    pressed: {
        opacity: 0.8,
    },
});
