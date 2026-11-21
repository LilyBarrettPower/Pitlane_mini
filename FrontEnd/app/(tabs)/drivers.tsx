import { useEffect, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { globalStyles } from "../../constants/styles";
import { colors } from "../../constants/theme";
import { apiFetch } from "../../assets/api";
import { useAuth } from "../../context/AuthContext";
import { useCan } from "../../constants/permissions";
import {
    Avatar,
    Badge,
    Button,
    EmptyState,
    ErrorBanner,
    Grid,
    GridItem,
    IconName,
    LoadingState,
    PageHeader,
    Screen,
} from "../../components/ui/kit";

type Driver = {
    _id: string;
    name: string;
    experience: string;
    email: string;
    phoneNumber: string;
    notes: string;
    isActive: boolean;
};

const FORM_FIELDS = [
    { key: "name", label: "Name", placeholder: "Full name" },
    { key: "experience", label: "Experience", placeholder: "e.g. Pro, Am, Rookie" },
    { key: "email", label: "Email", placeholder: "driver@example.com", email: true },
    { key: "phoneNumber", label: "Phone", placeholder: "Phone number", phone: true },
    { key: "notes", label: "Notes", placeholder: "Optional notes" },
] as const;

type FormKey = (typeof FORM_FIELDS)[number]["key"];

const EMPTY_FORM: Record<FormKey, string> = {
    name: "",
    experience: "",
    email: "",
    phoneNumber: "",
    notes: "",
};

function ContactLine({ icon, value }: { icon: IconName; value?: string }) {
    return (
        <View style={styles.contactLine}>
            <Ionicons name={icon} size={15} color={colors.textMuted} />
            <Text style={[styles.contactText, !value && styles.contactEmpty]} numberOfLines={1}>
                {value || "Not set"}
            </Text>
        </View>
    );
}

export default function DriversPage() {
    const { user, token } = useAuth();
    const canManage = useCan("manage");

    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [formError, setFormError] = useState("");

    const [form, setForm] = useState<Record<FormKey, string>>(EMPTY_FORM);

    const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);


    async function fetchDrivers() {
        try {
            setIsLoading(true);
            setErrorMessage("");

            const data = await apiFetch("/drivers", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setDrivers(data.drivers || []);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to load drivers");
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (token) fetchDrivers();
    }, [token]);

    function openCreateModal() {
        setEditingDriver(null);
        setForm(EMPTY_FORM);
        setFormError("");
        setShowModal(true);
    }

    function openEditModal(driver: Driver) {
        setEditingDriver(driver);
        setForm({
            name: driver.name || "",
            experience: driver.experience || "",
            email: driver.email || "",
            phoneNumber: driver.phoneNumber || "",
            notes: driver.notes || "",
        });
        setFormError("");
        setShowModal(true);
    }

    async function handleSaveDriver() {
        if (!form.name.trim()) {
            setFormError("Driver name is required");
            return;
        }

        try {
            setIsSaving(true);
            setFormError("");

            if (editingDriver) {
                await apiFetch(`/drivers/${editingDriver._id}`, {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(form),
                });
            } else {
                await apiFetch("/drivers", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(form),
                });
            }

            setShowModal(false);
            setEditingDriver(null);
            setForm(EMPTY_FORM);

            await fetchDrivers();
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Failed to save driver");
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDeleteDriver(driver: Driver) {
        try {
            setIsSaving(true);
            setErrorMessage("");

            await apiFetch(`/drivers/${driver._id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setDriverToDelete(null);
            await fetchDrivers();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to delete driver");
            setDriverToDelete(null);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Screen>
            <PageHeader
                eyebrow="Team"
                title="Drivers"
                subtitle={
                    drivers.length
                        ? `${drivers.length} ${drivers.length === 1 ? "driver" : "drivers"}`
                        : undefined
                }
                actions={canManage ? <Button label="Add Driver" icon="add" onPress={openCreateModal} /> : undefined}
            />

            <ErrorBanner message={errorMessage} />

            {isLoading && drivers.length === 0 ? (
                <LoadingState />
            ) : drivers.length === 0 ? (
                <View style={globalStyles.card}>
                    <EmptyState
                        icon="id-card-outline"
                        title="No drivers yet"
                        text="Add your drivers so you can assign them to vehicles."
                        action={canManage ? <Button label="Add Driver" icon="add" onPress={openCreateModal} /> : undefined}
                    />
                </View>
            ) : (
                <Grid>
                    {drivers.map((driver) => (
                        <GridItem key={driver._id} minWidth={300}>
                            <View style={styles.driverCard}>
                                <View style={styles.driverTop}>
                                    <Avatar name={driver.name} size={46} />
                                    <View style={styles.driverTitle}>
                                        <Text style={styles.driverName} numberOfLines={1}>
                                            {driver.name}
                                        </Text>
                                        {driver.experience ? (
                                            <Badge label={driver.experience} tone="primary" />
                                        ) : (
                                            <Text style={styles.contactEmpty}>No experience level</Text>
                                        )}
                                    </View>
                                </View>

                                <View style={styles.contactBlock}>
                                    <ContactLine icon="mail-outline" value={driver.email} />
                                    <ContactLine icon="call-outline" value={driver.phoneNumber} />
                                </View>

                                {driver.notes ? (
                                    <Text style={styles.notes} numberOfLines={2}>
                                        {driver.notes}
                                    </Text>
                                ) : null}

                                {canManage ? (
                                    <View style={styles.cardActions}>
                                        <Button
                                            label="Edit"
                                            icon="create-outline"
                                            size="sm"
                                            variant="secondary"
                                            onPress={() => openEditModal(driver)}
                                        />
                                        <Button
                                            label="Delete"
                                            icon="trash-outline"
                                            size="sm"
                                            variant="ghost"
                                            onPress={() => setDriverToDelete(driver)}
                                        />
                                    </View>
                                ) : null}
                            </View>
                        </GridItem>
                    ))}
                </Grid>
            )}

            {/* Create / edit driver */}
            <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
                <View style={globalStyles.modalOverlay}>
                    <View style={[globalStyles.modalCard, styles.modalCard]}>
                        <Text style={globalStyles.modalTitle}>
                            {editingDriver ? "Edit Driver" : "Add Driver"}
                        </Text>

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
                                        autoCapitalize={"email" in field ? "none" : "sentences"}
                                        keyboardType={
                                            "email" in field ? "email-address" : "phone" in field ? "phone-pad" : "default"
                                        }
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
                                onPress={() => setShowModal(false)}
                                disabled={isSaving}
                            />
                            <Button
                                label={editingDriver ? "Save Changes" : "Add Driver"}
                                onPress={handleSaveDriver}
                                loading={isSaving}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Delete confirmation */}
            <Modal
                visible={!!driverToDelete}
                transparent
                animationType="fade"
                onRequestClose={() => setDriverToDelete(null)}
            >
                <View style={globalStyles.modalOverlay}>
                    <View style={globalStyles.modalCard}>
                        <Text style={globalStyles.modalTitle}>Delete driver?</Text>
                        <Text style={globalStyles.text}>
                            {driverToDelete?.name || "This driver"} will be removed from your team.
                        </Text>

                        <View style={styles.modalActions}>
                            <Button
                                label="Cancel"
                                variant="secondary"
                                onPress={() => setDriverToDelete(null)}
                                disabled={isSaving}
                            />
                            <Button
                                label="Delete"
                                variant="danger"
                                loading={isSaving}
                                onPress={() => {
                                    if (driverToDelete) handleDeleteDriver(driverToDelete);
                                }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </Screen>
    );
}

const styles = StyleSheet.create({
    driverCard: {
        backgroundColor: colors.card,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.borderDark,
        padding: 18,
        gap: 14,
    },

    driverTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },

    driverTitle: {
        flex: 1,
        gap: 6,
    },

    driverName: {
        color: colors.textPrimary,
        fontSize: 18,
        fontWeight: "800",
    },

    contactBlock: {
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 12,
        gap: 8,
    },

    contactLine: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },

    contactText: {
        color: colors.textSecondary,
        fontSize: 14,
        flexShrink: 1,
    },

    contactEmpty: {
        color: colors.textMuted,
        fontSize: 13,
    },

    notes: {
        color: colors.textMuted,
        fontSize: 14,
    },

    cardActions: {
        flexDirection: "row",
        gap: 8,
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
