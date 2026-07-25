import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View, Modal, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { apiFetch } from "../../../../assets/api";
import { useAuth } from "../../../../context/AuthContext";
import { globalStyles } from "../../../../constants/styles";

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
    notes?: string;
};

export default function TyreDetailPage() {
    const { token } = useAuth();
    const { tyreId } = useLocalSearchParams<{ tyreId: string }>();

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
    const [notes, setNotes] = useState("");

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
        setKmTotal(String(selectedTyre.kmTotal ?? 0));
        setNotes(selectedTyre.notes || "");
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
                    notes: notes.trim(),
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
            router.back();
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

    if (isLoading) {
        return (
            <SafeAreaView style={globalStyles.container}>
                <ActivityIndicator color="ffffff" />
            </SafeAreaView>
        );
    }

    if (!tyre) {
        return (
            <SafeAreaView style={globalStyles.container}>
                <Text style={globalStyles.errorText}>
                    {errorMessage || "Tyre not found"}
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={globalStyles.container}>
            <ScrollView
                contentContainerStyle={styles.content}
            >
                <View style={styles.titleRow}>
                    <View style={styles.titleText}>
                        <Text style={globalStyles.title}>
                            {tyre.currentSet || "Tyre"} - {tyre.position || "No position"}
                        </Text>
                    </View>
                </View>

                <View style={styles.actionRow}>
                    <Pressable
                        style={globalStyles.smallButton}
                        onPress={openEditModal}
                    >
                        <Text
                            style={globalStyles.smallButtonText}
                        >
                            Edit Tyre
                        </Text>
                    </Pressable>

                    <Pressable
                        style={globalStyles.buttonDangerSmall}
                        onPress={() => {
                            setErrorMessage("");
                            setShowDeleteModal(true);
                        }}
                    >
                        <Text
                            style={globalStyles.smallButtonText}
                        >
                            Delete Tyre
                        </Text>
                    </Pressable>
                </View>

                {errorMessage ? (
                    <Text style={globalStyles.errorText}>
                        {errorMessage}
                    </Text>
                ) : null}

                <View style={globalStyles.card}>
                    <Text style={globalStyles.sectionTitle}>
                        Set Information
                    </Text>

                    <Text style={globalStyles.cardText}>
                        Set: {tyre.currentSet || "-"}
                    </Text>

                    <Text style={globalStyles.cardText}>
                        Vehicle: {getVehicleName(tyre)}
                    </Text>

                    <Text style={globalStyles.cardText}>
                        Brand: {tyre.brand || "-"}
                    </Text>

                    <Text style={globalStyles.cardText}>
                        Specification: {tyre.spec || "-"}
                    </Text>
                </View>

                <View style={globalStyles.card}>
                    <Text style={globalStyles.sectionTitle}>
                        Tyre Information
                    </Text>

                    <Text style={globalStyles.cardText}>
                        Position: {tyre.position || "-"}
                    </Text>

                    <Text style={globalStyles.cardText}>
                        Size: {tyre.size || "-"}
                    </Text>

                    <Text style={globalStyles.cardText}>
                        FIA Serial: {tyre.fiaSerial || "-"}
                    </Text>

                    <Text style={globalStyles.cardText}>
                        Condition: {tyre.condition || "-"}
                    </Text>

                    <Text style={globalStyles.cardText}>
                        Heat Cycles: {tyre.heatCycles ?? 0}
                    </Text>

                    <Text style={globalStyles.cardText}>
                        Distance: {tyre.kmTotal ?? 0} km
                    </Text>
                </View>

                <View style={globalStyles.card}>
                    <Text style={globalStyles.sectionTitle}>
                        Notes
                    </Text>

                    <Text style={globalStyles.cardText}>
                        {tyre.notes || "No notes"}
                    </Text>
                </View>

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

                                <Text
                                    style={globalStyles.label}
                                >
                                    Notes
                                </Text>

                                <TextInput
                                    style={[
                                        globalStyles.input,
                                        styles.notesInput,
                                    ]}
                                    value={notes}
                                    onChangeText={setNotes}
                                    multiline
                                    textAlignVertical="top"
                                    placeholder="Optional notes"
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
            </ScrollView>
        </SafeAreaView>
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

    notesInput: {
        minHeight: 90,
    },
});