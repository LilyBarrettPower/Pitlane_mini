import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View, Modal, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { apiFetch } from "../../../../assets/api";
import { useAuth } from "../../../../context/AuthContext";
import { globalStyles } from "../../../../constants/styles";
import { colors } from "../../../../constants/theme";
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
} from "../../../../components/ui/kit";

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
    heatCycles?: string;
    kmTotal?: number;
};

// One row per event, from GET /tyre-runs/tyre/:tyreId/events
type TyreEventSummary = {
    eventId: string;
    eventName: string;
    startDate?: string;
    endDate?: string;
    trackName?: string;
    corners: string[];
    runCount: number;
    laps: number;
    distanceKm: number;
};

type TyreNote = {
    _id: string;
    corner: "LF" | "RF" | "LR" | "RR";
    category: string;
    note: string;
    createdAt: string;
    // populated by the backend with the run's name
    runId?: { _id: string; name?: string } | null;
};

export default function TyreDetailPage() {
    const { token } = useAuth();
    const { tyreId } = useLocalSearchParams<{ tyreId: string }>();
    const isWide = useIsWide();

    const [tyre, setTyre] = useState<Tyre | null>(null);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [errorMessage, setErrorMessage] = useState("");

    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [selectedVehicleId, setSelectedVehicleId] = useState("");

    const [brand, setBrand] = useState("");
    const [spec, setSpec] = useState("");
    const [currentSet, setCurrentSet] = useState("");
    const [size, setSize] = useState("");
    const [position, setPosition] = useState("");
    const [fiaSerial, setFiaSerial] = useState("");
    const [condition, setCondition] = useState("");
    const [heatCycles, setHeatCycles] = useState("");
    const [kmTotal, setKmTotal] = useState("");

    const [tyreNotes, setTyreNotes] = useState<TyreNote[]>([]);
    const [tyreEvents, setTyreEvents] = useState<TyreEventSummary[]>([]);

    async function fetchTyreEvents() {
        if (!token || !tyreId) return;

        const data = await apiFetch(`/tyre-runs/tyre/${tyreId}/events`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        setTyreEvents(data.events || []);
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

    async function fetchTyreNotes() {
        if (!token || !tyreId) return;

        const data = await apiFetch(`/tyre-notes?tyreId=${tyreId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        setTyreNotes(data.tyreNotes || []);
    }

    async function fetchTyre() {
        if (!token || !tyreId) return;

        const data = await apiFetch(`/tyres/${tyreId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const loadedTyre: Tyre = data.tyre || data;

        setTyre(loadedTyre);
        populateEditForm(loadedTyre);
    }

    async function fetchVehicles() {
        if (!token) return;

        const data = await apiFetch("/vehicles", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        setVehicles(data.vehicles || []);
    }

    useEffect(() => {
        async function loadPage() {
            if (!token || !tyreId) return;

            try {
                setIsLoading(true);
                setErrorMessage("");

                await Promise.all([
                    fetchTyre(),
                    fetchVehicles(),
                    fetchTyreNotes(),
                    fetchTyreEvents(),
                ]);
            } catch (error) {
                setErrorMessage(error instanceof Error ? error.message : "Failed to load tyre");
            } finally {
                setIsLoading(false);
            }
        }

        loadPage();
    }, [token, tyreId]);

    function getTyreVehicleId(selectedTyre: Tyre) {
        return typeof selectedTyre.vehicleId === "string"
            ? selectedTyre.vehicleId
            : selectedTyre.vehicleId._id;
    }

    function populateEditForm(selectedTyre: Tyre) {
        setSelectedVehicleId(
            getTyreVehicleId(selectedTyre)
        );
        setBrand(selectedTyre.brand || "");
        setSpec(selectedTyre.spec || "");
        setCurrentSet(selectedTyre.currentSet || "");
        setSize(selectedTyre.size || "");
        setPosition(selectedTyre.position || "");
        setFiaSerial(selectedTyre.fiaSerial || "");
        setCondition(selectedTyre.condition || "");
        setHeatCycles(String(selectedTyre.heatCycles ?? 0));
        setKmTotal(String(Math.round((selectedTyre.kmTotal ?? 0) * 10) / 10));
    }

    function openEditModal() {
        if (!tyre) return;

        populateEditForm(tyre);
        setErrorMessage("");
        setShowEditModal(true);
    }

    function closeEditModal() {
        if (isSaving) return;

        setShowEditModal(false);
        setErrorMessage("");

        if (tyre) {
            populateEditForm(tyre);
        }
    }

    async function handleUpdateTyre() {
        if (!selectedVehicleId) {
            setErrorMessage("Please select a vehicle");
            return;
        }

        if (!brand.trim()) {
            setErrorMessage("Please enter a tyre brand");
            return;
        }

        if (!condition) {
            setErrorMessage("Please select a condition");
            return;
        }

        try {
            setIsSaving(true);
            setErrorMessage("");

            await apiFetch(`/tyres/${tyreId}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    vehicleId: selectedVehicleId,
                    brand: brand.trim(),
                    spec: spec.trim(),
                    currentSet: currentSet.trim(),
                    size: size.trim(),
                    position,
                    fiaSerial: fiaSerial.trim(),
                    condition,
                    heatCycles: Number(heatCycles) || 0,
                    kmTotal: Number(kmTotal) || 0,
                }),
            });

            await fetchTyre();

            setShowEditModal(false);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Failed to update tyre"
            );
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDeleteTyre() {
        try {
            setIsDeleting(true);
            setErrorMessage("");

            await apiFetch(`/tyres/${tyreId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setShowDeleteModal(false);
            // The tyre is gone - return to the tyres list
            router.navigate("/tyres" as any);
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : "Failed to archive tyre"
            );
        } finally {
            setIsDeleting(false);
        }
    }


    function getVehicleName(tyre: Tyre) {
        if (!tyre) return "Unknown Vehicle";

        if (
            typeof tyre.vehicleId === "object" &&
            tyre.vehicleId !== null
        ) {
            return formatVehicleName(tyre.vehicleId);
        }

        const vehicle = vehicles.find(
            (item) => item._id === tyre.vehicleId
        );

        return vehicle
            ? formatVehicleName(vehicle)
            : "Unknown vehicle";
    }

    function formatVehicleName(vehicle: Vehicle) {
        if (vehicle.name) return vehicle.name;

        const makeModel = [
            vehicle.make,
            vehicle.model,
        ]
            .filter(Boolean)
            .join(" ");

        if (makeModel) return makeModel;

        if (vehicle.racingNumber) {
            return vehicle.racingNumber;
        }

        return "Unnamed Vehicle";
    }

    if (isLoading && !tyre) {
        return (
            <Screen>
                <LoadingState />
            </Screen>
        );
    }

    if (!tyre) {
        return (
            <Screen>
                <PageHeader title="Tyre" onBack={() => router.navigate("/tyres" as any)} backLabel="Tyres" />
                <ErrorBanner message={errorMessage || "Tyre not found"} />
            </Screen>
        );
    }

    const isUsed = (tyre.kmTotal ?? 0) > 0 || tyre.condition === "Used";

    // Note categories, most serious first, mapped to badge colours
    const noteTone = (category: string) =>
        ["Puncture", "Damage", "Flat Spot"].includes(category)
            ? "severe"
            : category === "Wear"
                ? "warning"
                : "neutral";

    const statTiles = (
        <View style={styles.statRow}>
            <View style={styles.statTile}>
                <Text style={styles.statLabel}>DISTANCE</Text>
                <Text style={styles.statValue}>
                    {Math.round((tyre.kmTotal ?? 0) * 10) / 10}
                    <Text style={styles.statUnit}> km</Text>
                </Text>
            </View>
            <View style={styles.statTile}>
                <Text style={styles.statLabel}>HEAT CYCLES</Text>
                <Text style={styles.statValue}>{tyre.heatCycles ?? 0}</Text>
            </View>
            <View style={styles.statTile}>
                <Text style={styles.statLabel}>CONDITION</Text>
                <View style={styles.statBadge}>
                    <Badge label={isUsed ? "Used" : "New"} tone={isUsed ? "warning" : "live"} />
                </View>
            </View>
            <View style={styles.statTile}>
                <Text style={styles.statLabel}>EVENTS</Text>
                <Text style={styles.statValue}>{tyreEvents.length}</Text>
            </View>
        </View>
    );

    const detailsPanel = (
        <Panel title="Details" icon="information-circle-outline">
            <View style={styles.fieldGrid}>
                <Field label="Set" value={tyre.currentSet} />
                <Field label="Position" value={tyre.position} />
                <Field label="Vehicle" value={getVehicleName(tyre)} />
                <Field label="Brand" value={tyre.brand} />
                <Field label="Spec" value={tyre.spec} />
                <Field label="Size" value={tyre.size} />
                <Field label="FIA serial" value={tyre.fiaSerial} />
            </View>
        </Panel>
    );

    const eventsPanel = (
        <Panel title="Events Used At" icon="flag-outline">
            {tyreEvents.length === 0 ? (
                <EmptyState icon="flag-outline" text="Not used at any events yet." />
            ) : (
                tyreEvents.map((item) => (
                    <Pressable
                        key={item.eventId}
                        style={({ pressed }) => [styles.historyRow, pressed && styles.pressed]}
                        onPress={() =>
                            router.push({
                                pathname: "/events/[id]" as any,
                                params: { id: item.eventId },
                            })
                        }
                    >
                        <View style={styles.historyText}>
                            <Text style={styles.historyTitle}>{item.eventName}</Text>
                            <Text style={globalStyles.subText}>
                                {[formatEventDates(item.startDate, item.endDate), item.trackName]
                                    .filter(Boolean)
                                    .join(" · ")}
                            </Text>
                            <Text style={styles.historyStats}>
                                {item.corners.join(", ") || "—"} · {item.runCount}{" "}
                                {item.runCount === 1 ? "run" : "runs"} · {item.laps} laps
                            </Text>
                        </View>
                        <Text style={styles.historyKm}>
                            {item.distanceKm}
                            <Text style={styles.statUnit}> km</Text>
                        </Text>
                    </Pressable>
                ))
            )}
        </Panel>
    );

    const notesPanel = (
        <Panel title="Tyre Notes" icon="chatbox-ellipses-outline">
            {tyreNotes.length === 0 ? (
                <EmptyState icon="chatbox-ellipses-outline" text="No notes recorded for this tyre." />
            ) : (
                tyreNotes.map((item) => (
                    <View key={item._id} style={styles.noteRow}>
                        <View style={styles.noteHeader}>
                            <Text style={styles.historyTitle}>
                                {item.corner} · {item.runId?.name || "Unnamed Run"}
                            </Text>
                            <Badge label={item.category} tone={noteTone(item.category)} />
                        </View>
                        <Text style={styles.noteText}>{item.note}</Text>
                        <Text style={globalStyles.subText}>
                            {new Date(item.createdAt).toLocaleString("en-NZ")}
                        </Text>
                    </View>
                ))
            )}
        </Panel>
    );

    return (
        <Screen>
            <PageHeader
                eyebrow={tyre.currentSet ? `Set ${tyre.currentSet}` : "Tyre"}
                title={`${tyre.position || "Tyre"}${tyre.currentSet ? ` · ${tyre.currentSet}` : ""}`}
                subtitle={[tyre.brand, tyre.spec, getVehicleName(tyre)].filter(Boolean).join(" · ")}
                onBack={() => router.navigate("/tyres" as any)}
                backLabel="Tyres"
                actions={
                    <>
                        <Button label="Edit" icon="create-outline" variant="secondary" onPress={openEditModal} />
                        <Button
                            label="Delete"
                            icon="trash-outline"
                            variant="ghost"
                            onPress={() => {
                                setErrorMessage("");
                                setShowDeleteModal(true);
                            }}
                        />
                    </>
                }
            />

            {!showEditModal ? <ErrorBanner message={errorMessage} /> : null}

            {statTiles}

            {isWide ? (
                <View style={styles.columns}>
                    <View style={styles.colMain}>
                        {eventsPanel}
                        {notesPanel}
                    </View>
                    <View style={styles.colSide}>{detailsPanel}</View>
                </View>
            ) : (
                <>
                    {detailsPanel}
                    {eventsPanel}
                    {notesPanel}
                </>
            )}

                <Modal
                    visible={showEditModal}
                    transparent
                    animationType="fade"
                    onRequestClose={closeEditModal}
                >
                    <ScrollView
                        contentContainerStyle={
                            styles.modalContent
                        }
                    >
                        <View
                            style={globalStyles.modalOverlay}
                        >
                            <View
                                style={globalStyles.modalCard}
                            >
                                <Text
                                    style={globalStyles.modalTitle}
                                >
                                    Edit Tyre
                                </Text>

                                <Text
                                    style={globalStyles.label}
                                >
                                    Vehicle
                                </Text>

                                <View style={styles.optionGrid}>
                                    {vehicles.map((vehicle) => {
                                        const isSelected =
                                            selectedVehicleId ===
                                            vehicle._id;

                                        return (
                                            <Pressable
                                                key={vehicle._id}
                                                style={[
                                                    styles.optionButton,
                                                    isSelected &&
                                                    styles.optionButtonSelected,
                                                ]}
                                                onPress={() =>
                                                    setSelectedVehicleId(
                                                        vehicle._id
                                                    )
                                                }
                                            >
                                                <Text
                                                    style={[
                                                        styles.optionText,
                                                        isSelected &&
                                                        styles.optionTextSelected,
                                                    ]}
                                                >
                                                    {formatVehicleName(
                                                        vehicle
                                                    )}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>

                                <Text
                                    style={globalStyles.label}
                                >
                                    Brand
                                </Text>

                                <TextInput
                                    style={globalStyles.input}
                                    value={brand}
                                    onChangeText={setBrand}
                                    placeholder="Michelin"
                                    placeholderTextColor="#9ca3af"
                                />

                                <Text
                                    style={globalStyles.label}
                                >
                                    Specification
                                </Text>

                                <TextInput
                                    style={globalStyles.input}
                                    value={spec}
                                    onChangeText={setSpec}
                                    placeholder="S9M"
                                    placeholderTextColor="#9ca3af"
                                />

                                <Text
                                    style={globalStyles.label}
                                >
                                    Current Set
                                </Text>

                                <TextInput
                                    style={globalStyles.input}
                                    value={currentSet}
                                    onChangeText={setCurrentSet}
                                    placeholder="Set 1"
                                    placeholderTextColor="#9ca3af"
                                />

                                <Text
                                    style={globalStyles.label}
                                >
                                    Size
                                </Text>

                                <TextInput
                                    style={globalStyles.input}
                                    value={size}
                                    onChangeText={setSize}
                                    placeholder="30/68-18"
                                    placeholderTextColor="#9ca3af"
                                />

                                <Text
                                    style={globalStyles.label}
                                >
                                    Position
                                </Text>

                                <View style={styles.optionGrid}>
                                    {["LF", "RF", "LR", "RR"].map(
                                        (item) => {
                                            const isSelected =
                                                position === item;

                                            return (
                                                <Pressable
                                                    key={item}
                                                    style={[
                                                        styles.optionButton,
                                                        isSelected &&
                                                        styles.optionButtonSelected,
                                                    ]}
                                                    onPress={() =>
                                                        setPosition(
                                                            item
                                                        )
                                                    }
                                                >
                                                    <Text
                                                        style={[
                                                            styles.optionText,
                                                            isSelected &&
                                                            styles.optionTextSelected,
                                                        ]}
                                                    >
                                                        {item}
                                                    </Text>
                                                </Pressable>
                                            );
                                        }
                                    )}
                                </View>

                                <Text
                                    style={globalStyles.label}
                                >
                                    FIA Serial
                                </Text>

                                <TextInput
                                    style={globalStyles.input}
                                    value={fiaSerial}
                                    onChangeText={setFiaSerial}
                                    placeholder="Tyre serial number"
                                    placeholderTextColor="#9ca3af"
                                    autoCapitalize="characters"
                                />

                                <Text
                                    style={globalStyles.label}
                                >
                                    Condition
                                </Text>

                                <View style={styles.optionGrid}>
                                    {[
                                        {
                                            label: "New",
                                            value: "new",
                                        },
                                        {
                                            label: "Used",
                                            value: "used",
                                        },
                                    ].map((item) => {
                                        const isSelected =
                                            condition === item.value;

                                        return (
                                            <Pressable
                                                key={item.value}
                                                style={[
                                                    styles.optionButton,
                                                    isSelected &&
                                                    styles.optionButtonSelected,
                                                ]}
                                                onPress={() =>
                                                    setCondition(
                                                        item.value
                                                    )
                                                }
                                            >
                                                <Text
                                                    style={[
                                                        styles.optionText,
                                                        isSelected &&
                                                        styles.optionTextSelected,
                                                    ]}
                                                >
                                                    {item.label}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>

                                <Text
                                    style={globalStyles.label}
                                >
                                    Heat Cycles
                                </Text>

                                <TextInput
                                    style={globalStyles.input}
                                    value={heatCycles}
                                    onChangeText={setHeatCycles}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor="#9ca3af"
                                />

                                <Text
                                    style={globalStyles.label}
                                >
                                    Distance km
                                </Text>

                                <TextInput
                                    style={globalStyles.input}
                                    value={kmTotal}
                                    onChangeText={setKmTotal}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor="#9ca3af"
                                />

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
                                            globalStyles.buttonDanger
                                        }
                                        onPress={closeEditModal}
                                        disabled={isSaving}
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
                                            isSaving &&
                                            globalStyles.buttonDisabled,
                                        ]}
                                        onPress={
                                            handleUpdateTyre
                                        }
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <ActivityIndicator
                                                color="#ffffff"
                                            />
                                        ) : (
                                            <Text
                                                style={
                                                    globalStyles.buttonPrimaryText
                                                }
                                            >
                                                Save Changes
                                            </Text>
                                        )}
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </Modal>

                <Modal
                    visible={showDeleteModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() =>
                        setShowDeleteModal(false)
                    }
                >
                    <View style={globalStyles.modalOverlay}>
                        <View style={globalStyles.modalCard}>
                            <Text
                                style={globalStyles.modalTitle}
                            >
                                Delete tyre?
                            </Text>

                            <Text style={globalStyles.text}>
                                Are you sure you want to delete{" "}
                                {tyre.currentSet || "this tyre"}
                                {tyre.position
                                    ? ` - ${tyre.position}`
                                    : ""}
                                ?
                            </Text>

                            {tyre.fiaSerial ? (
                                <Text
                                    style={globalStyles.subText}
                                >
                                    FIA Serial: {tyre.fiaSerial}
                                </Text>
                            ) : null}

                            {errorMessage ? (
                                <Text
                                    style={globalStyles.errorText}
                                >
                                    {errorMessage}
                                </Text>
                            ) : null}

                            <View style={styles.actionRow}>
                                <Pressable
                                    style={
                                        globalStyles.buttonPrimary
                                    }
                                    onPress={() =>
                                        setShowDeleteModal(false)
                                    }
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
                                    onPress={handleDeleteTyre}
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
                                            Yes, Delete
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
    },

    modalContent: {
        flexGrow: 1,
    },

    optionGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 12,
    },

    optionButton: {
        backgroundColor: "#1f2937",
        borderWidth: 1,
        borderColor: "#4b5563",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },

    optionButtonSelected: {
        backgroundColor: "#2563eb",
        borderColor: "#2563eb",
    },

    optionText: {
        color: "#d1d5db",
        fontWeight: "600",
    },

    optionTextSelected: {
        color: "#ffffff",
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
        gap: 8,
    },

    tyreNoteCorner: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "800",
        flexShrink: 1,
    },

    tyreNoteCategory: {
        color: "#93c5fd",
        fontSize: 13,
        fontWeight: "700",
    },

    pressed: {
        opacity: 0.75,
    },

    // ----- Redesigned layout -----
    columns: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 20,
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
    statBadge: {
        paddingTop: 6,
    },
    fieldGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 18,
    },
    historyRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
    },
    historyText: {
        flex: 1,
        gap: 3,
    },
    historyTitle: {
        color: colors.textPrimary,
        fontSize: 15,
        fontWeight: "800",
        flexShrink: 1,
    },
    historyStats: {
        color: colors.textSecondary,
        fontSize: 13,
        marginTop: 2,
    },
    historyKm: {
        color: colors.textPrimary,
        fontSize: 18,
        fontWeight: "800",
        fontVariant: ["tabular-nums"],
    },
    noteRow: {
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        gap: 6,
    },
    noteHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
    },
    noteText: {
        color: colors.textSecondary,
        fontSize: 15,
    },
});
