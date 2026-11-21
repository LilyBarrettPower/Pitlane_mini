// Settings > Tracks: the team's tracks. Add from the built-in library or
// create new ones, and edit details - especially the length, which drives
// tyre mileage and the car's ODO.

import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import SettingsShell from "../../../components/settingsShell";
import TrackPicker, { Track } from "../../../components/TrackPicker";
import { useAuth } from "../../../context/AuthContext";
import { useCan } from "../../../constants/permissions";
import { apiFetch } from "../../../assets/api";
import { globalStyles } from "../../../constants/styles";
import { colors } from "../../../constants/theme";
import { Badge, Button, EmptyState, ErrorBanner, LoadingState, Panel } from "../../../components/ui/kit";

export default function TracksSettingsPage() {
    const { token } = useAuth();
    const canManage = useCan("manage");

    const [tracks, setTracks] = useState<Track[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    const [showAddModal, setShowAddModal] = useState(false);

    // Edit modal
    const [editingTrack, setEditingTrack] = useState<Track | null>(null);
    const [name, setName] = useState("");
    const [city, setCity] = useState("");
    const [country, setCountry] = useState("");
    const [length, setLength] = useState("");
    const [notes, setNotes] = useState("");
    const [formError, setFormError] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [confirmRemove, setConfirmRemove] = useState(false);

    async function fetchTracks() {
        try {
            setErrorMessage("");
            const data = await apiFetch("/tracks", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTracks(data.tracks || []);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to load tracks");
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (token) fetchTracks();
    }, [token]);

    function openEdit(track: Track) {
        setEditingTrack(track);
        setName(track.name);
        setCity(track.city || "");
        setCountry(track.country || "");
        setLength(track.distanceKms != null ? String(track.distanceKms) : "");
        setNotes(track.notes || "");
        setFormError("");
        setConfirmRemove(false);
    }

    async function handleSave() {
        if (!editingTrack) return;

        const lengthNumber = Number(length);
        if (!name.trim()) {
            setFormError("Track name is required");
            return;
        }
        if (!country.trim()) {
            setFormError("Country is required");
            return;
        }
        if (!length.trim() || !Number.isFinite(lengthNumber) || lengthNumber <= 0) {
            setFormError("Enter the track length in km, e.g. 2.63");
            return;
        }

        try {
            setIsSaving(true);
            setFormError("");

            await apiFetch(`/tracks/${editingTrack._id}`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    name: name.trim(),
                    city: city.trim(),
                    country: country.trim(),
                    distanceKms: lengthNumber,
                    notes,
                }),
            });

            setEditingTrack(null);
            await fetchTracks();
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Failed to save track");
        } finally {
            setIsSaving(false);
        }
    }

    async function handleRemove() {
        if (!editingTrack) return;

        try {
            setIsSaving(true);
            await apiFetch(`/tracks/${editingTrack._id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            setEditingTrack(null);
            await fetchTracks();
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Failed to remove track");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <SettingsShell
            title="Tracks"
            subtitle={tracks.length ? `${tracks.length} ${tracks.length === 1 ? "track" : "tracks"}` : undefined}
            actions={canManage ? <Button label="Add Track" icon="add" onPress={() => setShowAddModal(true)} /> : undefined}
        >
            <ErrorBanner message={errorMessage} />

            <Panel title="Your tracks" icon="flag-outline">
                {isLoading ? (
                    <LoadingState />
                ) : tracks.length === 0 ? (
                    <EmptyState
                        icon="flag-outline"
                        text="No tracks yet. Add New Zealand tracks from the list, or create your own."
                        action={canManage ? <Button label="Add Track" icon="add" size="sm" onPress={() => setShowAddModal(true)} /> : undefined}
                    />
                ) : (
                    tracks.map((track, index) => (
                        <Pressable
                            key={track._id}
                            style={({ pressed }) => [
                                styles.row,
                                index === tracks.length - 1 && styles.rowLast,
                                pressed && styles.pressed,
                            ]}
                            disabled={!canManage}
                            onPress={() => openEdit(track)}
                        >
                            <View style={styles.rowText}>
                                <Text style={styles.trackName}>{track.name}</Text>
                                <Text style={styles.trackMeta}>
                                    {[track.city, track.country].filter(Boolean).join(", ") || "—"}
                                </Text>
                            </View>

                            {track.distanceKms ? (
                                <Text style={styles.length}>
                                    {track.distanceKms}
                                    <Text style={styles.unit}> km</Text>
                                </Text>
                            ) : (
                                <Badge label="No length" tone="warning" />
                            )}
                            {canManage ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null}
                        </Pressable>
                    ))
                )}
            </Panel>

            <Text style={styles.footnote}>
                Track lengths are used to work out tyre mileage and each car&apos;s ODO. Check them against the
                layout you run.
            </Text>

            {/* Add from the library or create a new track */}
            <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
                <View style={globalStyles.modalOverlay}>
                    <View style={[globalStyles.modalCard, styles.modalCard]}>
                        <Text style={globalStyles.modalTitle}>Add Track</Text>
                        <Text style={styles.modalIntro}>Pick a track to add it to your team, or create a new one.</Text>

                        <ScrollView>
                            <TrackPicker
                                token={token}
                                onSelect={() => {
                                    setShowAddModal(false);
                                    fetchTracks();
                                }}
                                onTracksChanged={fetchTracks}
                            />
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <Button label="Done" variant="secondary" onPress={() => setShowAddModal(false)} />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit track */}
            <Modal
                visible={!!editingTrack}
                transparent
                animationType="fade"
                onRequestClose={() => setEditingTrack(null)}
            >
                <View style={globalStyles.modalOverlay}>
                    <View style={[globalStyles.modalCard, styles.modalCard]}>
                        <Text style={globalStyles.modalTitle}>Edit Track</Text>

                        <ScrollView contentContainerStyle={styles.form}>
                            <View>
                                <Text style={globalStyles.label}>Track name</Text>
                                <TextInput style={globalStyles.input} value={name} onChangeText={setName} />
                            </View>

                            <View style={styles.formRow}>
                                <View style={styles.flex}>
                                    <Text style={globalStyles.label}>City</Text>
                                    <TextInput style={globalStyles.input} value={city} onChangeText={setCity} />
                                </View>
                                <View style={styles.flex}>
                                    <Text style={globalStyles.label}>Country</Text>
                                    <TextInput style={globalStyles.input} value={country} onChangeText={setCountry} />
                                </View>
                            </View>

                            <View>
                                <Text style={globalStyles.label}>Length (km)</Text>
                                <TextInput
                                    style={globalStyles.input}
                                    value={length}
                                    onChangeText={setLength}
                                    keyboardType="decimal-pad"
                                    placeholder="e.g. 2.63"
                                    placeholderTextColor={colors.textMuted}
                                />
                                <Text style={styles.hint}>
                                    Changing this only affects runs from now on - past mileage isn&apos;t recalculated.
                                </Text>
                            </View>

                            <View>
                                <Text style={globalStyles.label}>Notes</Text>
                                <TextInput
                                    style={globalStyles.input}
                                    value={notes}
                                    onChangeText={setNotes}
                                    placeholder="Optional notes"
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>
                        </ScrollView>

                        <ErrorBanner message={formError} />

                        <View style={styles.modalActionsSpread}>
                            {confirmRemove ? (
                                <View style={styles.confirmRow}>
                                    <Text style={styles.confirmText}>Remove this track?</Text>
                                    <Button label="Cancel" size="sm" variant="secondary" onPress={() => setConfirmRemove(false)} />
                                    <Button label="Remove" size="sm" variant="danger" loading={isSaving} onPress={handleRemove} />
                                </View>
                            ) : (
                                <Button label="Remove" icon="trash-outline" variant="ghost" onPress={() => setConfirmRemove(true)} />
                            )}

                            {!confirmRemove ? (
                                <View style={styles.modalActions}>
                                    <Button label="Cancel" variant="secondary" onPress={() => setEditingTrack(null)} disabled={isSaving} />
                                    <Button label="Save" onPress={handleSave} loading={isSaving} />
                                </View>
                            ) : null}
                        </View>
                    </View>
                </View>
            </Modal>
        </SettingsShell>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderDark,
    },

    rowLast: {
        borderBottomWidth: 0,
        paddingBottom: 0,
    },

    pressed: {
        opacity: 0.75,
    },

    rowText: {
        flex: 1,
        gap: 2,
    },

    trackName: {
        color: colors.textPrimary,
        fontSize: 15,
        fontWeight: "700",
    },

    trackMeta: {
        color: colors.textMuted,
        fontSize: 13,
    },

    length: {
        color: colors.textPrimary,
        fontSize: 16,
        fontWeight: "800",
        fontVariant: ["tabular-nums"],
    },

    unit: {
        color: colors.textMuted,
        fontSize: 12,
        fontWeight: "600",
    },

    footnote: {
        color: colors.textMuted,
        fontSize: 13,
    },

    modalCard: {
        maxHeight: "90%",
    },

    modalIntro: {
        color: colors.textMuted,
        fontSize: 14,
        marginTop: -4,
    },

    form: {
        gap: 14,
    },

    formRow: {
        flexDirection: "row",
        gap: 10,
    },

    flex: {
        flex: 1,
    },

    hint: {
        color: colors.textMuted,
        fontSize: 12,
        marginTop: 4,
    },

    modalActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 10,
    },

    modalActionsSpread: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 10,
        marginTop: 4,
    },

    confirmRow: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 8,
    },

    confirmText: {
        color: colors.textSecondary,
        fontSize: 14,
    },
});
