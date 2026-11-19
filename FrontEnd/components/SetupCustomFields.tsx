// "Custom fields" section of the Create / Edit Setup modal: fill in the
// vehicle's custom fields, and add, rename or remove fields.

import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { apiFetch } from "../assets/api";
import { globalStyles } from "../constants/styles";
import { colors } from "../constants/theme";
import {
    CORNERS,
    CustomValueMap,
    CustomValuePart,
    EMPTY_CUSTOM_VALUE,
    SetupField,
    SetupFieldKind,
    activeSetupFields,
    fieldTitle,
} from "../constants/setupFields";
import { Button, ErrorBanner } from "./ui/kit";

type Props = {
    vehicleId: string;
    token: string | null;
    fields: SetupField[];
    onFieldsChange: (fields: SetupField[]) => void;
    values: CustomValueMap;
    onValueChange: (fieldId: string, part: CustomValuePart, text: string) => void;
};

export default function SetupCustomFields({
    vehicleId,
    token,
    fields,
    onFieldsChange,
    values,
    onValueChange,
}: Props) {
    const [error, setError] = useState("");
    const [isBusy, setIsBusy] = useState(false);

    // Add field form
    const [showAddForm, setShowAddForm] = useState(false);
    const [newLabel, setNewLabel] = useState("");
    const [newUnit, setNewUnit] = useState("");
    const [newKind, setNewKind] = useState<SetupFieldKind>("frontRear");

    // Rename / remove
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editLabel, setEditLabel] = useState("");
    const [editUnit, setEditUnit] = useState("");
    const [removingId, setRemovingId] = useState<string | null>(null);

    const activeFields = activeSetupFields(fields);

    async function callApi(path: string, method: string, body?: object) {
        setIsBusy(true);
        setError("");

        try {
            const data = await apiFetch(`/vehicles/${vehicleId}/setup-fields${path}`, {
                method,
                headers: { Authorization: `Bearer ${token}` },
                body: body ? JSON.stringify(body) : undefined,
            });

            onFieldsChange(data.setupFields || []);
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            return false;
        } finally {
            setIsBusy(false);
        }
    }

    async function handleAddField() {
        if (!newLabel.trim()) {
            setError("Field name is required");
            return;
        }

        const ok = await callApi("", "POST", { label: newLabel.trim(), unit: newUnit.trim(), kind: newKind });

        if (ok) {
            setShowAddForm(false);
            setNewLabel("");
            setNewUnit("");
            setNewKind("frontRear");
        }
    }

    function startEditing(field: SetupField) {
        setRemovingId(null);
        setEditingId(field._id);
        setEditLabel(field.label);
        setEditUnit(field.unit || "");
        setError("");
    }

    async function handleRename(fieldId: string) {
        const ok = await callApi(`/${fieldId}`, "PATCH", { label: editLabel.trim(), unit: editUnit.trim() });
        if (ok) setEditingId(null);
    }

    async function handleRemove(fieldId: string) {
        const ok = await callApi(`/${fieldId}`, "DELETE");
        if (ok) setRemovingId(null);
    }

    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={[globalStyles.sectionTitle, styles.noMargin]}>Custom Fields</Text>
                {!showAddForm ? (
                    <Pressable
                        hitSlop={8}
                        onPress={() => {
                            setShowAddForm(true);
                            setEditingId(null);
                            setError("");
                        }}
                    >
                        <Text style={styles.link}>+ Add field</Text>
                    </Pressable>
                ) : null}
            </View>

            {activeFields.length === 0 && !showAddForm ? (
                <Text style={styles.hint}>
                    Add your own fields. They&apos;ll appear on every setup for
                    this vehicle.
                </Text>
            ) : null}

            {activeFields.map((field) => {
                const value = values[field._id] || EMPTY_CUSTOM_VALUE;

                // Renaming this field
                if (editingId === field._id) {
                    return (
                        <View key={field._id} style={styles.editBox}>
                            <View style={styles.row}>
                                <View style={styles.flexInput}>
                                    <Text style={globalStyles.label}>Field name</Text>
                                    <TextInput style={globalStyles.input} value={editLabel} onChangeText={setEditLabel} />
                                </View>
                                <View style={styles.unitInput}>
                                    <Text style={globalStyles.label}>Unit</Text>
                                    <TextInput
                                        style={globalStyles.input}
                                        value={editUnit}
                                        onChangeText={setEditUnit}
                                        placeholder="mm"
                                        placeholderTextColor={colors.textMuted}
                                    />
                                </View>
                            </View>
                            <View style={styles.actions}>
                                <Button label="Cancel" size="sm" variant="secondary" onPress={() => setEditingId(null)} />
                                <Button label="Save" size="sm" loading={isBusy} onPress={() => handleRename(field._id)} />
                            </View>
                        </View>
                    );
                }

                return (
                    <View key={field._id} style={styles.fieldBlock}>
                        <View style={styles.fieldHeader}>
                            <Text style={globalStyles.label}>{fieldTitle(field)}</Text>

                            {removingId === field._id ? (
                                <View style={styles.inlineConfirm}>
                                    <Text style={styles.confirmText}>Remove from all setups?</Text>
                                    <Pressable hitSlop={6} onPress={() => setRemovingId(null)}>
                                        <Text style={styles.link}>Cancel</Text>
                                    </Pressable>
                                    <Pressable hitSlop={6} onPress={() => handleRemove(field._id)} disabled={isBusy}>
                                        <Text style={styles.dangerLink}>Remove</Text>
                                    </Pressable>
                                </View>
                            ) : (
                                <View style={styles.iconRow}>
                                    <Pressable
                                        hitSlop={6}
                                        accessibilityLabel={`Rename ${field.label}`}
                                        onPress={() => startEditing(field)}
                                    >
                                        <Ionicons name="create-outline" size={16} color={colors.textMuted} />
                                    </Pressable>
                                    <Pressable
                                        hitSlop={6}
                                        accessibilityLabel={`Remove ${field.label}`}
                                        onPress={() => {
                                            setEditingId(null);
                                            setRemovingId(field._id);
                                        }}
                                    >
                                        <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                                    </Pressable>
                                </View>
                            )}
                        </View>

                        {field.kind === "single" ? (
                            <TextInput
                                style={globalStyles.input}
                                value={value.value}
                                onChangeText={(text) => onValueChange(field._id, "value", text)}
                            />
                        ) : field.kind === "corners" ? (
                            // 2x2 laid out like the car: LF RF on top, LR RR below
                            <View style={styles.cornerGrid}>
                                {CORNERS.map((corner) => (
                                    <View key={corner.key} style={styles.cornerCell}>
                                        <Text style={styles.cornerLabel}>{corner.label}</Text>
                                        <TextInput
                                            style={[globalStyles.input, styles.flexInput]}
                                            value={value[corner.key]}
                                            onChangeText={(text) => onValueChange(field._id, corner.key, text)}
                                        />
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.row}>
                                <TextInput
                                    style={[globalStyles.input, styles.flexInput]}
                                    value={value.front}
                                    onChangeText={(text) => onValueChange(field._id, "front", text)}
                                    placeholder="Front"
                                    placeholderTextColor={colors.textMuted}
                                />
                                <TextInput
                                    style={[globalStyles.input, styles.flexInput]}
                                    value={value.rear}
                                    onChangeText={(text) => onValueChange(field._id, "rear", text)}
                                    placeholder="Rear"
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>
                        )}
                    </View>
                );
            })}

            {showAddForm ? (
                <View style={styles.editBox}>
                    <Text style={styles.editTitle}>New field</Text>

                    <View style={styles.row}>
                        <View style={styles.flexInput}>
                            <Text style={globalStyles.label}>Field name</Text>
                            <TextInput
                                style={globalStyles.input}
                                value={newLabel}
                                onChangeText={setNewLabel}
                                placeholder="Field name"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                        <View style={styles.unitInput}>
                            <Text style={globalStyles.label}>Unit</Text>
                            <TextInput
                                style={globalStyles.input}
                                value={newUnit}
                                onChangeText={setNewUnit}
                                placeholder="mm"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                    </View>

                    <Text style={globalStyles.label}>Type</Text>
                    <View style={styles.kindRow}>
                        {(
                            [
                                { kind: "frontRear", label: "Front / Rear" },
                                { kind: "corners", label: "LF / RF / LR / RR" },
                                { kind: "single", label: "Single value" },
                            ] as const
                        ).map((option) => (
                            <Pressable
                                key={option.kind}
                                style={[styles.kindButton, newKind === option.kind && styles.kindButtonActive]}
                                onPress={() => setNewKind(option.kind)}
                            >
                                <Text style={[styles.kindText, newKind === option.kind && styles.kindTextActive]}>
                                    {option.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    <View style={styles.actions}>
                        <Button
                            label="Cancel"
                            size="sm"
                            variant="secondary"
                            onPress={() => {
                                setShowAddForm(false);
                                setError("");
                            }}
                        />
                        <Button label="Add field" size="sm" icon="add" loading={isBusy} onPress={handleAddField} />
                    </View>
                </View>
            ) : null}

            <ErrorBanner message={error} />
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        gap: 10,
        marginTop: 6,
    },

    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    noMargin: {
        marginBottom: 0,
    },

    hint: {
        color: colors.textMuted,
        fontSize: 14,
    },

    link: {
        color: colors.primaryLight,
        fontWeight: "700",
        fontSize: 14,
    },

    dangerLink: {
        color: colors.error,
        fontWeight: "700",
        fontSize: 14,
    },

    fieldBlock: {
        gap: 2,
    },

    fieldHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 8,
    },

    iconRow: {
        flexDirection: "row",
        gap: 14,
    },

    inlineConfirm: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },

    confirmText: {
        color: colors.textMuted,
        fontSize: 13,
    },

    row: {
        flexDirection: "row",
        gap: 10,
    },

    flexInput: {
        flex: 1,
    },

    unitInput: {
        width: 90,
    },

    editBox: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.borderDark,
        borderRadius: 12,
        padding: 14,
        gap: 10,
    },

    editTitle: {
        color: colors.textPrimary,
        fontSize: 15,
        fontWeight: "800",
    },

    kindRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: -4,
    },

    // Two corners per row (LF RF / LR RR)
    cornerGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },

    cornerCell: {
        flexBasis: "45%",
        flexGrow: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    cornerLabel: {
        width: 24,
        color: colors.textMuted,
        fontSize: 13,
        fontWeight: "800",
    },

    kindButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.borderDark,
        backgroundColor: colors.card,
    },

    kindButtonActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },

    kindText: {
        color: colors.textSecondary,
        fontWeight: "600",
        fontSize: 13,
    },

    kindTextActive: {
        color: colors.textPrimary,
    },

    actions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 8,
    },
});
