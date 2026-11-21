
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Modal, ScrollView, Text, TextInput, View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { apiFetch } from "../../../assets/api";
import { useAuth } from "../../../context/AuthContext";
import { useCan } from "../../../constants/permissions";
import { globalStyles } from "../../../constants/styles";
import { colors } from "../../../constants/theme";
import { Button, EmptyState, ErrorBanner, LoadingState, PageHeader, Screen } from "../../../components/ui/kit";

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
};

// From GET /tyre-notes/summary. "General" notes are excluded by the backend.
type TyreNoteSummary = {
    tyreId: string;
    count: number;
    topCategory: string;
};

type TyreSetGroup = {
    key: string;
    vehicleId: string;
    currentSet: string;
    vehicleName: string;
    brand: string;
    spec?: string;
    tyres: Tyre[];
};

type VehicleTyreGroup = {
    vehicleId: string;
    vehicleName: string;
    sets: TyreSetGroup[];
};


export default function TyresPage() {
    const { token } = useAuth();
    const canManage = useCan("manage");

    const [tyres, setTyres] = useState<Tyre[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const [searchText, setSearchText] = useState("");

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isCreatingTyre, setIsCreatingTyre] = useState(false);

    const [selectedVehicleId, setSelectedVehicleId] = useState("");
    const [brand, setBrand] = useState("");
    const [spec, setSpec] = useState("");
    const [currentSet, setCurrentSet] = useState("");
    const [size, setSize] = useState("");
    const [position, setPosition] = useState("");
    const [fiaSerial, setFiaSerial] = useState("");
    const [condition, setCondition] = useState("New");
    const [heatCycles, setHeatCycles] = useState("");
    const [kmTotal, setKmTotal] = useState("");

    // tyreId -> note summary, for the badge on each tyre card
    const [noteSummaries, setNoteSummaries] = useState<Record<string, TyreNoteSummary>>({});

    async function fetchNoteSummaries() {
        const data = await apiFetch("/tyre-notes/summary", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const byTyreId: Record<string, TyreNoteSummary> = {};
        for (const item of (data.summary || []) as TyreNoteSummary[]) {
            byTyreId[item.tyreId] = item;
        }
        setNoteSummaries(byTyreId);
    }

    async function fetchTyres() {
        const data = await apiFetch("/tyres", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        setTyres(data.tyres || []);
    }

    async function fetchVehicles() {
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
            if (!token) return;

            try {
                setIsLoading(true);
                setErrorMessage("");

                await Promise.all([
                    fetchTyres(),
                    fetchVehicles(),
                    fetchNoteSummaries(),
                ]);
            } catch (error) {
                setErrorMessage(
                    error instanceof Error ? error.message : "Failed to load tyres"
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadPage();
    }, [token]);

    async function createTyre() {
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
            setIsCreatingTyre(true);
            setErrorMessage("");

            await apiFetch("/tyres", {
                method: "POST",
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
                    position: position.trim(),
                    fiaSerial: fiaSerial.trim(),
                    condition,
                    heatCycles: Number(heatCycles) || 0,
                    kmTotal: Number(kmTotal) || 0,
                }),
            });

            await fetchTyres();

            setShowCreateModal(false);
            resetCreateForm();
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : "Failed to create tyre"
            );
        } finally {
            setIsCreatingTyre(false);
        }
    }

    function resetCreateForm() {
        setSelectedVehicleId("");
        setBrand("");
        setSpec("");
        setCurrentSet("");
        setSize("");
        setPosition("");
        setFiaSerial("");
        setCondition("");
        setHeatCycles("");
        setKmTotal("");
    }

    function closeCreateModal() {
        if (isCreatingTyre) return;

        setShowCreateModal(false);
        setErrorMessage("");
        resetCreateForm();
    }


    function getVehicleId(tyre: Tyre) {
        return typeof tyre.vehicleId === "string"
            ? tyre.vehicleId
            : tyre.vehicleId?._id;
    }

    function getVehicleName(tyre: Tyre) {
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

    const filteredTyres = useMemo(() => {
        const query = searchText.trim().toLowerCase();

        if (!query) return tyres;

        return tyres.filter((tyre) => {
            const searchableText = [
                tyre.brand,
                tyre.spec,
                tyre.size,
                tyre.position,
                tyre.fiaSerial,
                tyre.condition,
                getVehicleName(tyre),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchableText.includes(query);
        });
    }, [tyres, vehicles, searchText]);

    const groupedTyreSets = useMemo<TyreSetGroup[]>(() => {
        const groups = new Map<string, TyreSetGroup>();

        filteredTyres.forEach((tyre) => {
            const vehicleId = getVehicleId(tyre) || "unknown-vehicle";
            const setName = tyre.currentSet?.trim() || "No Set";

            const groupKey = `${vehicleId}-${setName.toLowerCase()}`;

            const existingGroup = groups.get(groupKey);

            if (existingGroup) {
                existingGroup.tyres.push(tyre);
                return;
            }

            groups.set(groupKey, {
                key: groupKey,
                vehicleId,
                currentSet: setName,
                vehicleName: getVehicleName(tyre),
                brand: tyre.brand,
                spec: tyre.spec,
                tyres: [tyre],
            });
        });

        const positionOrder: Record<string, number> = {
            LF: 1,
            RF: 2,
            LR: 3,
            RR: 4,
        };

        return Array.from(groups.values()).map((group) => ({
            ...group,
            tyres: [...group.tyres].sort((a, b) => {
                const aOrder =
                    positionOrder[a.position?.toUpperCase() || ""] ?? 99;

                const bOrder =
                    positionOrder[b.position?.toUpperCase() || ""] ?? 99;

                return aOrder - bOrder;
            }),
        }))

    }, [filteredTyres, vehicles])

    const groupedByVehicle = useMemo<VehicleTyreGroup[]>(() => {
        const groups = new Map<string, VehicleTyreGroup>();
        groupedTyreSets.forEach((set) => {
            const existingVehicle = groups.get(set.vehicleId);

            if (existingVehicle) {
                existingVehicle.sets.push(set);
                return;
            }

            groups.set(set.vehicleId, {
                vehicleId: set.vehicleId,
                vehicleName: set.vehicleName,
                sets: [set],
            });
        });

        return Array.from(groups.values()).map((vehicleGroup) => ({
            ...vehicleGroup,
            sets: [...vehicleGroup.sets].sort((a, b) =>
                a.currentSet.localeCompare(
                    b.currentSet,
                    undefined,
                    {
                        numeric: true,
                        sensitivity: "base",
                    }
                )
            ),
        }));
    }, [groupedTyreSets]);

    if (isLoading && tyres.length === 0) {
        return (
            <Screen>
                <LoadingState />
            </Screen>
        );
    }

    const openCreate = () => {
        setErrorMessage("");
        setShowCreateModal(true);
    };

    return (
        <Screen>
                <PageHeader
                    eyebrow="Inventory"
                    title="Tyres"
                    subtitle={
                        tyres.length
                            ? `${tyres.length} ${tyres.length === 1 ? "tyre" : "tyres"} · ${groupedTyreSets.length} ${groupedTyreSets.length === 1 ? "set" : "sets"}`
                            : undefined
                    }
                    actions={canManage ? <Button label="Add Tyre" icon="add" onPress={openCreate} /> : undefined}
                />

                <View style={styles.searchBox}>
                    <Ionicons name="search" size={18} color={colors.textMuted} />
                    <TextInput
                        style={styles.searchInput}
                        value={searchText}
                        onChangeText={setSearchText}
                        placeholder="Search vehicle, brand, spec, serial…"
                        placeholderTextColor={colors.textMuted}
                    />
                    {searchText ? (
                        <Pressable onPress={() => setSearchText("")} hitSlop={8}>
                            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                        </Pressable>
                    ) : null}
                </View>

                {!showCreateModal ? <ErrorBanner message={errorMessage} /> : null}

                {filteredTyres.length === 0 ? (
                    <View style={globalStyles.card}>
                        <EmptyState
                            icon={tyres.length === 0 ? "disc-outline" : "search-outline"}
                            title={tyres.length === 0 ? "No tyres yet" : "No matches"}
                            text={
                                tyres.length === 0
                                    ? "Add tyres to track sets, pressures and mileage."
                                    : "No tyres match your search."
                            }
                            action={
                                tyres.length === 0 && canManage ? (
                                    <Button label="Add Tyre" icon="add" onPress={openCreate} />
                                ) : undefined
                            }
                        />
                    </View>
                ) : (
                    groupedByVehicle.map((vehicleGroup) => (
                        <View
                            key={vehicleGroup.vehicleId}
                            style={styles.vehicleSection}
                        >
                            <View style={styles.vehicleHeader}>
                                <Text style={styles.vehicleTitle}>
                                    {vehicleGroup.vehicleName}
                                </Text>

                                <Text style={styles.vehicleSetCount}>
                                    {vehicleGroup.sets.length}{" "}
                                    {vehicleGroup.sets.length === 1
                                        ? "set"
                                        : "sets"}
                                </Text>
                            </View>

                            <View style={styles.vehicleSets}>
                                {vehicleGroup.sets.map((group) => (
                                    <Pressable
                                        key={group.key}
                                        style={({ pressed }) => [
                                            styles.tyreSetCard,
                                            pressed &&
                                            styles.tyreSetCardPressed,
                                        ]}
                                        onPress={() =>
                                            router.push({
                                                pathname:
                                                    "/tyres/sets/[vehicleId]/[setName]",
                                                params: {
                                                    vehicleId:
                                                        group.vehicleId,
                                                    setName:
                                                        group.currentSet,
                                                },
                                            })
                                        }
                                    >
                                        <View
                                            style={styles.tyreSetHeader}
                                        >
                                            <View
                                                style={
                                                    styles.tyreSetHeaderText
                                                }
                                            >
                                                <Text
                                                    style={
                                                        styles.tyreSetTitle
                                                    }
                                                >
                                                    {group.currentSet}
                                                </Text>

                                                <Text
                                                    style={
                                                        styles.tyreSetBrand
                                                    }
                                                >
                                                    {group.brand}
                                                    {group.spec
                                                        ? ` ${group.spec}`
                                                        : ""}
                                                </Text>
                                            </View>

                                            <View
                                                style={
                                                    styles.tyreCountBadge
                                                }
                                            >
                                                <Text
                                                    style={
                                                        styles.tyreCountText
                                                    }
                                                >
                                                    {group.tyres.length}/4
                                                </Text>
                                            </View>
                                        </View>

                                        <View
                                            style={styles.tyreGrid}
                                        >
                                            {group.tyres.map(
                                                (tyre) => (
                                                    <Pressable
                                                        key={tyre._id}
                                                        style={({
                                                            pressed,
                                                        }) => [
                                                                styles.tyreCard,
                                                                pressed &&
                                                                styles.tyreCardPressed,
                                                            ]}
                                                        onPress={(
                                                            event
                                                        ) => {
                                                            event.stopPropagation();

                                                            router.push({
                                                                pathname:
                                                                    "/tyres/[tyreId]",
                                                                params: {
                                                                    tyreId:
                                                                        tyre._id,
                                                                },
                                                            });
                                                        }}
                                                    >
                                                        <View
                                                            style={
                                                                styles.tyreCardHeader
                                                            }
                                                        >
                                                            <Text
                                                                style={
                                                                    styles.tyrePosition
                                                                }
                                                            >
                                                                {tyre.position ||
                                                                    "No Position"}
                                                            </Text>

                                                            <Text
                                                                style={[
                                                                    styles.conditionBadge,
                                                                    (tyre.kmTotal ?? 0) > 0 || 
                                                                    tyre.condition === "Used"
                                                                        ? styles.conditionUsed
                                                                        : styles.conditionNew,
                                                                ]}
                                                            >
                                                                {(tyre.kmTotal ?? 0) > 0 ||
                                                                tyre.condition == "Used"
                                                                    ? "Used"
                                                                    : "New"}
                                                            </Text>
                                                        </View>

                                                        {noteSummaries[tyre._id] ? (
                                                            <TyreNoteBadge
                                                                summary={noteSummaries[tyre._id]}
                                                            />
                                                        ) : null}

                                                        <Text
                                                            style={
                                                                styles.tyreDetailLabel
                                                            }
                                                        >
                                                            FIA Serial
                                                        </Text>

                                                        <Text
                                                            style={
                                                                styles.tyreDetailValue
                                                            }
                                                        >
                                                            {tyre.fiaSerial ||
                                                                "-"}
                                                        </Text>

                                                        <Text
                                                            style={
                                                                styles.tyreDetailLabel
                                                            }
                                                        >
                                                            Size
                                                        </Text>

                                                        <Text
                                                            style={
                                                                styles.tyreDetailValue
                                                            }
                                                        >
                                                            {tyre.size ||
                                                                "-"}
                                                        </Text>

                                                        <View
                                                            style={
                                                                styles.tyreStatsRow
                                                            }
                                                        >
                                                            <View
                                                                style={
                                                                    styles.tyreStat
                                                                }
                                                            >
                                                                <Text
                                                                    style={
                                                                        styles.tyreDetailLabel
                                                                    }
                                                                >
                                                                    Cycles
                                                                </Text>

                                                                <Text
                                                                    style={
                                                                        styles.tyreDetailValue
                                                                    }
                                                                >
                                                                    {tyre.heatCycles ??
                                                                        0}
                                                                </Text>
                                                            </View>

                                                            <View
                                                                style={
                                                                    styles.tyreStat
                                                                }
                                                            >
                                                                <Text
                                                                    style={
                                                                        styles.tyreDetailLabel
                                                                    }
                                                                >
                                                                    Distance
                                                                </Text>

                                                                <Text
                                                                    style={
                                                                        styles.tyreDetailValue
                                                                    }
                                                                >
                                                                    {(tyre.kmTotal ?? 0).toFixed(1)}{" "}
                                                                    km
                                                                </Text>
                                                            </View>
                                                        </View>

                                                    </Pressable>
                                                )
                                            )}
                                        </View>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    ))

                )}

                <Modal
                    visible={showCreateModal}
                    transparent
                    animationType="fade"
                    onRequestClose={closeCreateModal}
                >
                    <ScrollView contentContainerStyle={styles.modalContent}>
                        <View style={globalStyles.modalOverlay}>
                            <View style={globalStyles.modalCard}>
                                <Text style={globalStyles.modalTitle}>Create Tyre</Text>
                                <Text style={globalStyles.label}>Vehicle</Text>
                                <View style={styles.optionGrid}>
                                    {vehicles.map((vehicle) => {
                                        const isSelected =
                                            selectedVehicleId === vehicle._id;

                                        return (
                                            <Pressable
                                                key={vehicle._id}
                                                style={[styles.optionButton, isSelected && styles.optionButtonSelected,]}
                                                onPress={() => setSelectedVehicleId(vehicle._id)
                                                }
                                            >
                                                <Text
                                                    style={[
                                                        styles.optionText, isSelected && styles.optionTextSelected,
                                                    ]}
                                                >
                                                    {formatVehicleName(vehicle)}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>

                                {vehicles.length === 0 ? (
                                    <Text style={globalStyles.subText}>No vehicles available</Text>
                                ) : null}

                                <Text style={globalStyles.label}>Brand</Text>

                                <TextInput
                                    style={globalStyles.input}
                                    value={brand}
                                    onChangeText={setBrand}
                                    placeholder="Michelin"
                                    placeholderTextColor="#9ca3af"
                                />

                                <Text style={globalStyles.label}>
                                    Specification
                                </Text>

                                <TextInput
                                    style={globalStyles.input}
                                    value={spec}
                                    onChangeText={setSpec}
                                    placeholder="S9M"
                                    placeholderTextColor="#9ca3af"
                                />

                                <Text style={globalStyles.label}>
                                    Current Set
                                </Text>

                                <TextInput
                                    style={globalStyles.input}
                                    value={currentSet}
                                    onChangeText={setCurrentSet}
                                    placeholder="Set 1"
                                    placeholderTextColor="#9ca3af"
                                />

                                <Text style={globalStyles.label}>Size</Text>

                                <TextInput
                                    style={globalStyles.input}
                                    value={size}
                                    onChangeText={setSize}
                                    placeholder="30/68-18"
                                    placeholderTextColor="#9ca3af"
                                />

                                <Text style={globalStyles.label}>
                                    Position
                                </Text>

                                <View style={styles.optionGrid}>
                                    {["LF", "RF", "LR", "RR"].map(
                                        (item) => {
                                            const isSelected = position === item;

                                            return (
                                                <Pressable
                                                    key={item}
                                                    style={[
                                                        styles.optionButton,
                                                        isSelected &&
                                                        styles.optionButtonSelected,
                                                    ]}
                                                    onPress={() => setPosition(item)}
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

                                <Text style={globalStyles.label}>
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

                                <Text style={globalStyles.label}>
                                    Condition
                                </Text>

                                <View style={styles.optionGrid}>
                                    {[
                                        { label: "New", value: "New" },
                                        { label: "Used", value: "Used" },
                                    ].map((item) => {
                                        const isSelected =
                                            condition === item.value;

                                        return (
                                            <Pressable
                                                key={item.value}
                                                style={[
                                                    styles.optionButton,
                                                    isSelected && styles.optionButtonSelected,
                                                ]}
                                                onPress={() => setCondition(item.value)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.optionText,
                                                        isSelected && styles.optionTextSelected,
                                                    ]}
                                                >
                                                    {item.label}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>

                                <Text style={globalStyles.label}>
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

                                <Text style={globalStyles.label}>
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
                                    <Text style={globalStyles.errorText}>
                                        {errorMessage}
                                    </Text>
                                ) : null}

                                <View style={styles.actionRow}>
                                    <Pressable
                                        style={globalStyles.buttonDanger}
                                        onPress={closeCreateModal}
                                        disabled={isCreatingTyre}
                                    >
                                        <Text style={globalStyles.buttonPrimaryText}>
                                            Cancel
                                        </Text>
                                    </Pressable>

                                    <Pressable
                                        style={[
                                            globalStyles.buttonPrimary,
                                            isCreatingTyre &&
                                            globalStyles.buttonDisabled,
                                        ]}
                                        onPress={createTyre}
                                        disabled={isCreatingTyre}
                                    >
                                        {isCreatingTyre ? (
                                            <ActivityIndicator color="#ffffff" />
                                        ) : (
                                            <Text style={globalStyles.buttonPrimaryText}>
                                                Create Tyre
                                            </Text>
                                        )}
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </Modal>


        </Screen>



    )
}

// Shows the most serious note category on a tyre, e.g. "⚠ Puncture · 3 notes".
function TyreNoteBadge({ summary }: { summary: TyreNoteSummary }) {
    const severeCategories = ["Puncture", "Damage", "Flat Spot"];

    const colourStyle = severeCategories.includes(summary.topCategory)
        ? styles.noteBadgeSevere
        : summary.topCategory === "Wear"
            ? styles.noteBadgeWarning
            : styles.noteBadgeNeutral;

    return (
        <Text style={[styles.noteBadge, colourStyle]}>
            ⚠ {summary.topCategory}
            {summary.count > 1 ? ` · ${summary.count} notes` : ""}
        </Text>
    );
}


const styles = StyleSheet.create({
    content: {
        padding: 24,
        gap: 16,
    },
    actionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
    },
    modalContent: {
        gap: 10,
        paddingBottom: 24,
    },
    optionGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 12,
    },

    optionButton: {
        borderWidth: 1,
        borderColor: "#4b5563",
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 14,
        backgroundColor: "#1f2937",
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

    // Sets sit side by side on wide screens and stack on phones
    tyreSetCard: {
        backgroundColor: colors.card,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.borderDark,
        padding: 18,
        gap: 16,
        flexGrow: 1,
        flexBasis: 420,
    },

    tyreSetHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#374151",
    },

    tyreSetHeaderText: {
        flex: 1,
        gap: 3,
    },

    tyreSetTitle: {
        color: "#ffffff",
        fontSize: 20,
        fontWeight: "700",
    },

    tyreSetVehicle: {
        color: "#d1d5db",
        fontSize: 15,
        fontWeight: "600",
    },

    tyreSetBrand: {
        color: "#9ca3af",
        fontSize: 14,
    },

    tyreCountBadge: {
        backgroundColor: "#111827",
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },

    tyreCountText: {
        color: "#ffffff",
        fontSize: 13,
        fontWeight: "700",
    },

    tyreGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },

    tyreCard: {
        width: "48%",
        backgroundColor: "#111827",
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: "#374151",
        gap: 5,
    },

    tyreCardPressed: {
        opacity: 0.75,
    },

    tyreCardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
        marginBottom: 5,
    },

    tyrePosition: {
        color: "#ffffff",
        fontSize: 18,
        fontWeight: "800",
    },

    conditionBadge: {
        color: "#d1d5db",
        backgroundColor: "#374151",
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        fontSize: 11,
        fontWeight: "700",
        textTransform: "capitalize",
        overflow: "hidden",
    },

    conditionNew: {
        backgroundColor: "#166534",
        color: "#dcfce7",
    },

    conditionUsed: {
        backgroundColor: "#92400e",
        color: "#fef3c7",
    },

    tyreDetailLabel: {
        color: "#9ca3af",
        fontSize: 11,
        fontWeight: "600",
        textTransform: "uppercase",
    },

    tyreDetailValue: {
        color: "#f3f4f6",
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 4,
    },

    tyreStatsRow: {
        flexDirection: "row",
        gap: 12,
        marginTop: 4,
    },

    tyreStat: {
        flex: 1,
    },

    noteBadge: {
        alignSelf: "flex-start",
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        fontSize: 11,
        fontWeight: "700",
        overflow: "hidden",
        marginBottom: 5,
    },

    // Puncture / Damage / Flat Spot
    noteBadgeSevere: {
        backgroundColor: "#991b1b",
        color: "#fee2e2",
    },

    // Wear
    noteBadgeWarning: {
        backgroundColor: "#92400e",
        color: "#fef3c7",
    },

    // Other
    noteBadgeNeutral: {
        backgroundColor: "#374151",
        color: "#e5e7eb",
    },
    tyreSetCardPressed: {
        opacity: 0.8,
    },
    vehicleSection: {
        gap: 12,
        marginTop: 8,
    },

    vehicleHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#4b5563",
    },

    vehicleTitle: {
        color: "#ffffff",
        fontSize: 22,
        fontWeight: "800",
    },

    vehicleSetCount: {
        color: "#9ca3af",
        fontSize: 13,
        fontWeight: "600",
    },

    vehicleSets: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
    },

    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.borderDark,
        borderRadius: 12,
        paddingHorizontal: 14,
    },

    searchInput: {
        flex: 1,
        color: colors.textPrimary,
        fontSize: 16,
        paddingVertical: 12,
    },
})