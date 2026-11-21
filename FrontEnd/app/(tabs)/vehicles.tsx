import { useEffect, useState } from "react";
import { router } from "expo-router";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { globalStyles } from "../../constants/styles";
import { colors } from "../../constants/theme";
import { apiFetch } from "../../assets/api";
import { useAuth } from "../../context/AuthContext";
import { useCan } from "../../constants/permissions";
import {
    Button,
    EmptyState,
    ErrorBanner,
    Grid,
    GridItem,
    LoadingState,
    PageHeader,
    Screen,
} from "../../components/ui/kit";

type Vehicle = {
    _id: string;
    name?: string;
    make?: string;
    model?: string;
    year?: string;
    owner?: string;
    odo?: number;
    racingNumber?: string;
    chassisNumber?: string;
    notes?: string;
};

// Fields on the "Add Vehicle" form, in display order
const FORM_FIELDS = [
    { key: "name", label: "Name", placeholder: "e.g. Civic Type R" },
    { key: "racingNumber", label: "Race number", placeholder: "e.g. 7" },
    { key: "make", label: "Make", placeholder: "e.g. Honda" },
    { key: "model", label: "Model", placeholder: "e.g. FK8" },
    { key: "year", label: "Year", placeholder: "e.g. 2019", numeric: true },
    { key: "odo", label: "Odometer (km)", placeholder: "e.g. 12000", numeric: true },
    { key: "owner", label: "Owner", placeholder: "Owner name" },
    { key: "chassisNumber", label: "Chassis number", placeholder: "Chassis / VIN" },
    { key: "notes", label: "Notes", placeholder: "Optional notes" },
] as const;

type FormKey = (typeof FORM_FIELDS)[number]["key"];

const EMPTY_FORM: Record<FormKey, string> = {
    name: "",
    racingNumber: "",
    make: "",
    model: "",
    year: "",
    odo: "",
    owner: "",
    chassisNumber: "",
    notes: "",
};

function vehicleTitle(vehicle: Vehicle) {
    return vehicle.name || `${vehicle.make || ""} ${vehicle.model || ""}`.trim() || "Unnamed vehicle";
}

export default function VehiclesPage() {
    const { token } = useAuth();
    const canManage = useCan("manage");

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [formError, setFormError] = useState("");

    const [form, setForm] = useState<Record<FormKey, string>>(EMPTY_FORM);

    async function fetchVehicles() {
        try {
            setIsLoading(true);
            setErrorMessage("");

            const data = await apiFetch("/vehicles", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setVehicles(data.vehicles || []);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to load vehicles. Please try again");
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (token) fetchVehicles();
    }, [token]);

    function openCreateModal() {
        setForm(EMPTY_FORM);
        setFormError("");
        setShowCreateModal(true);
    }

    async function handleSaveVehicle() {
        if (!form.name.trim() || !form.racingNumber.trim()) {
            setFormError("Name and race number are required");
            return;
        }

        try {
            setIsSaving(true);
            setFormError("");

            await apiFetch("/vehicles", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    ...form,
                    year: form.year ? Number(form.year) : undefined,
                    odo: form.odo ? Number(form.odo) : undefined,
                }),
            });

            setShowCreateModal(false);
            setForm(EMPTY_FORM);
            await fetchVehicles();
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Failed to create vehicle. Please try again");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Screen>
            <PageHeader
                eyebrow="Garage"
                title="Vehicles"
                subtitle={
                    vehicles.length
                        ? `${vehicles.length} ${vehicles.length === 1 ? "vehicle" : "vehicles"}`
                        : undefined
                }
                actions={canManage ? <Button label="Add Vehicle" icon="add" onPress={openCreateModal} /> : undefined}
            />

            <ErrorBanner message={errorMessage} />

            {isLoading && vehicles.length === 0 ? (
                <LoadingState />
            ) : vehicles.length === 0 ? (
                <View style={globalStyles.card}>
                    <EmptyState
                        icon="car-sport-outline"
                        title="No vehicles yet"
                        text="Add your first car to start tracking runs, tyres and setups."
                        action={canManage ? <Button label="Add Vehicle" icon="add" onPress={openCreateModal} /> : undefined}
                    />
                </View>
            ) : (
                <Grid>
                    {vehicles.map((vehicle) => (
                        <GridItem key={vehicle._id} minWidth={320}>
                            <Pressable
                                style={({ pressed }) => [styles.vehicleCard, pressed && styles.pressed]}
                                onPress={() =>
                                    router.push({
                                        pathname: "/vehicles/[id]",
                                        params: { id: vehicle._id },
                                    })
                                }
                            >
                                <View style={styles.vehicleTop}>
                                    <View style={styles.numberTile}>
                                        <Text style={styles.numberHash}>#</Text>
                                        <Text style={styles.numberText}>{vehicle.racingNumber || "–"}</Text>
                                    </View>

                                    <View style={styles.vehicleTitleBlock}>
                                        <Text style={styles.vehicleName} numberOfLines={1}>
                                            {vehicleTitle(vehicle)}
                                        </Text>
                                        <Text style={styles.vehicleMeta} numberOfLines={1}>
                                            {[vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(" · ") ||
                                                "No make / model"}
                                        </Text>
                                    </View>

                                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                                </View>

                                <View style={styles.statsRow}>
                                    <View style={styles.stat}>
                                        <Text style={styles.statLabel}>ODO</Text>
                                        <Text style={styles.statValue}>
                                            {vehicle.odo != null
                                                ? `${Math.round(Number(vehicle.odo)).toLocaleString("en-NZ")} km`
                                                : "—"}
                                        </Text>
                                    </View>
                                    <View style={styles.stat}>
                                        <Text style={styles.statLabel}>CHASSIS</Text>
                                        <Text style={styles.statValue} numberOfLines={1}>
                                            {vehicle.chassisNumber || "—"}
                                        </Text>
                                    </View>
                                    <View style={styles.stat}>
                                        <Text style={styles.statLabel}>OWNER</Text>
                                        <Text style={styles.statValue} numberOfLines={1}>
                                            {vehicle.owner || "—"}
                                        </Text>
                                    </View>
                                </View>
                            </Pressable>
                        </GridItem>
                    ))}
                </Grid>
            )}

            <Modal
                visible={showCreateModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowCreateModal(false)}
            >
                <View style={globalStyles.modalOverlay}>
                    <View style={[globalStyles.modalCard, styles.modalCard]}>
                        <Text style={globalStyles.modalTitle}>Add Vehicle</Text>

                        <ScrollView contentContainerStyle={styles.formGrid}>
                            {FORM_FIELDS.map((field) => (
                                <View
                                    key={field.key}
                                    style={[styles.formField, field.key === "notes" && styles.formFieldFull]}
                                >
                                    <Text style={globalStyles.label}>{field.label}</Text>
                                    <TextInput
                                        style={globalStyles.input}
                                        placeholder={field.placeholder}
                                        placeholderTextColor={colors.textMuted}
                                        value={form[field.key]}
                                        keyboardType={"numeric" in field ? "numeric" : "default"}
                                        onChangeText={(text) =>
                                            setForm((current) => ({ ...current, [field.key]: text }))
                                        }
                                    />
                                </View>
                            ))}
                        </ScrollView>

                        <ErrorBanner message={formError} />

                        <View style={styles.modalActions}>
                            <Button
                                label="Cancel"
                                variant="secondary"
                                onPress={() => setShowCreateModal(false)}
                                disabled={isSaving}
                            />
                            <Button label="Create Vehicle" onPress={handleSaveVehicle} loading={isSaving} />
                        </View>
                    </View>
                </View>
            </Modal>
        </Screen>
    );
}

const styles = StyleSheet.create({
    pressed: {
        opacity: 0.85,
    },

    vehicleCard: {
        backgroundColor: colors.card,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.borderDark,
        padding: 18,
        gap: 16,
    },

    vehicleTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },

    numberTile: {
        width: 56,
        height: 56,
        borderRadius: 14,
        backgroundColor: colors.primarySoft,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },

    numberHash: {
        color: colors.primaryLight,
        fontSize: 14,
        fontWeight: "700",
        marginTop: 2,
    },

    numberText: {
        color: colors.textPrimary,
        fontSize: 22,
        fontWeight: "800",
    },

    vehicleTitleBlock: {
        flex: 1,
        gap: 3,
    },

    vehicleName: {
        color: colors.textPrimary,
        fontSize: 18,
        fontWeight: "800",
    },

    vehicleMeta: {
        color: colors.textMuted,
        fontSize: 14,
    },

    statsRow: {
        flexDirection: "row",
        gap: 10,
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 12,
    },

    stat: {
        flex: 1,
        gap: 3,
    },

    statLabel: {
        color: colors.textMuted,
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 1,
    },

    statValue: {
        color: colors.textPrimary,
        fontSize: 14,
        fontWeight: "700",
    },

    modalCard: {
        maxHeight: "90%",
    },

    formGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 14,
        paddingVertical: 4,
    },

    formField: {
        flexGrow: 1,
        flexBasis: 220,
    },

    formFieldFull: {
        flexBasis: "100%",
    },

    modalActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 4,
    },
});
