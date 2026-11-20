// Choose a track: the team's own tracks, the built-in library (e.g. NZ
// tracks - picking one adds it to the team), or add a brand new track.

import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { apiFetch } from "../assets/api";
import { globalStyles } from "../constants/styles";
import { colors } from "../constants/theme";
import { Button, ErrorBanner, SectionLabel } from "./ui/kit";

export type Track = {
    _id: string;
    name: string;
    city?: string;
    country?: string;
    distanceKms?: number | null;
    libraryKey?: string | null;
    notes?: string;
};

type LibraryTrack = {
    key: string;
    name: string;
    city?: string;
    country: string;
    distanceKms: number;
    alreadyAdded: boolean;
};

type LibraryCountry = {
    countryCode: string;
    countryName: string;
    tracks: LibraryTrack[];
};

type Props = {
    token: string | null;
    selectedTrackId?: string;
    onSelect: (track: Track) => void;
    // Called whenever the team's track list changes (a track was added)
    onTracksChanged?: () => void;
};

function trackMeta(track: { city?: string; distanceKms?: number | null }) {
    return [track.city, track.distanceKms ? `${track.distanceKms} km` : "No length set"]
        .filter(Boolean)
        .join(" · ");
}

export default function TrackPicker({ token, selectedTrackId, onSelect, onTracksChanged }: Props) {
    const [tracks, setTracks] = useState<Track[]>([]);
    const [library, setLibrary] = useState<LibraryCountry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [busyKey, setBusyKey] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    // New track form
    const [showAddForm, setShowAddForm] = useState(false);
    const [newName, setNewName] = useState("");
    const [newCity, setNewCity] = useState("");
    const [newCountry, setNewCountry] = useState("New Zealand");
    const [newLength, setNewLength] = useState("");

    async function load() {
        try {
            const headers = { Authorization: `Bearer ${token}` };
            const [trackData, libraryData] = await Promise.all([
                apiFetch("/tracks", { headers }),
                apiFetch("/tracks/library", { headers }),
            ]);
            setTracks(trackData.tracks || []);
            setLibrary(libraryData.countries || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load tracks");
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (token) load();
    }, [token]);

    const query = search.trim().toLowerCase();
    const matches = (text: string) => !query || text.toLowerCase().includes(query);

    const filteredTracks = useMemo(
        () => tracks.filter((track) => matches(`${track.name} ${track.city || ""}`)),
        [tracks, query]
    );

    async function handlePickLibrary(item: LibraryTrack) {
        try {
            setBusyKey(item.key);
            setError("");

            const data = await apiFetch("/tracks/from-library", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: JSON.stringify({ key: item.key }),
            });

            await load();
            onTracksChanged?.();
            onSelect(data.track);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to add track");
        } finally {
            setBusyKey(null);
        }
    }

    async function handleAddTrack() {
        const length = Number(newLength);

        if (!newName.trim()) {
            setError("Track name is required");
            return;
        }
        if (!newCountry.trim()) {
            setError("Country is required");
            return;
        }
        if (!newLength.trim() || !Number.isFinite(length) || length <= 0) {
            setError("Enter the track length in km, e.g. 2.63");
            return;
        }

        try {
            setBusyKey("new");
            setError("");

            const data = await apiFetch("/tracks", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    name: newName.trim(),
                    city: newCity.trim(),
                    country: newCountry.trim(),
                    distanceKms: length,
                }),
            });

            setShowAddForm(false);
            setNewName("");
            setNewCity("");
            setNewLength("");
            await load();
            onTracksChanged?.();
            onSelect(data.track);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to add track");
        } finally {
            setBusyKey(null);
        }
    }

    if (isLoading) {
        return <ActivityIndicator color="#ffffff" />;
    }

    return (
        <View style={styles.wrapper}>
            <View style={styles.searchBox}>
                <Ionicons name="search" size={16} color={colors.textMuted} />
                <TextInput
                    style={styles.searchInput}
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search tracks"
                    placeholderTextColor={colors.textMuted}
                />
            </View>

            {/* The team's own tracks */}
            {filteredTracks.length > 0 ? (
                <>
                    <SectionLabel>Your tracks</SectionLabel>
                    <View style={styles.list}>
                        {filteredTracks.map((track) => {
                            const selected = track._id === selectedTrackId;

                            return (
                                <Pressable
                                    key={track._id}
                                    style={[styles.option, selected && styles.optionSelected]}
                                    onPress={() => onSelect(track)}
                                >
                                    <View style={styles.optionText}>
                                        <Text style={styles.optionName}>{track.name}</Text>
                                        <Text style={[styles.optionMeta, selected && styles.optionMetaSelected]}>
                                            {trackMeta(track)}
                                        </Text>
                                    </View>
                                    {selected ? (
                                        <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                                    ) : null}
                                </Pressable>
                            );
                        })}
                    </View>
                </>
            ) : null}

            {/* Library tracks the team hasn't added yet */}
            {library.map((country) => {
                const available = country.tracks.filter(
                    (item) => !item.alreadyAdded && matches(`${item.name} ${item.city || ""}`)
                );
                if (available.length === 0) return null;

                return (
                    <View key={country.countryCode} style={styles.group}>
                        <SectionLabel spaced>{country.countryName}</SectionLabel>
                        <View style={styles.list}>
                            {available.map((item) => (
                                <Pressable
                                    key={item.key}
                                    style={styles.option}
                                    onPress={() => handlePickLibrary(item)}
                                    disabled={!!busyKey}
                                >
                                    <View style={styles.optionText}>
                                        <Text style={styles.optionName}>{item.name}</Text>
                                        <Text style={styles.optionMeta}>{trackMeta(item)}</Text>
                                    </View>
                                    {busyKey === item.key ? (
                                        <ActivityIndicator color={colors.textMuted} size="small" />
                                    ) : (
                                        <Ionicons name="add-circle-outline" size={20} color={colors.textMuted} />
                                    )}
                                </Pressable>
                            ))}
                        </View>
                    </View>
                );
            })}

            {query && filteredTracks.length === 0 && library.every((c) => c.tracks.every((t) => t.alreadyAdded || !matches(t.name))) ? (
                <Text style={styles.empty}>No tracks match &quot;{search.trim()}&quot;.</Text>
            ) : null}

            {/* Add a brand new track */}
            {showAddForm ? (
                <View style={styles.addBox}>
                    <Text style={styles.addTitle}>New track</Text>

                    <View>
                        <Text style={globalStyles.label}>Track name</Text>
                        <TextInput
                            style={globalStyles.input}
                            value={newName}
                            onChangeText={setNewName}
                            placeholder="Name and layout"
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={styles.flex}>
                            <Text style={globalStyles.label}>City</Text>
                            <TextInput
                                style={globalStyles.input}
                                value={newCity}
                                onChangeText={setNewCity}
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                        <View style={styles.flex}>
                            <Text style={globalStyles.label}>Country</Text>
                            <TextInput
                                style={globalStyles.input}
                                value={newCountry}
                                onChangeText={setNewCountry}
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                    </View>

                    <View>
                        <Text style={globalStyles.label}>Length (km)</Text>
                        <TextInput
                            style={globalStyles.input}
                            value={newLength}
                            onChangeText={setNewLength}
                            keyboardType="decimal-pad"
                            placeholder="e.g. 2.63"
                            placeholderTextColor={colors.textMuted}
                        />
                        <Text style={styles.hint}>Used to work out tyre mileage and the car&apos;s ODO.</Text>
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
                        <Button
                            label="Add track"
                            size="sm"
                            icon="add"
                            loading={busyKey === "new"}
                            onPress={handleAddTrack}
                        />
                    </View>
                </View>
            ) : (
                <Pressable
                    style={styles.addLink}
                    onPress={() => {
                        setShowAddForm(true);
                        setNewName(search.trim());
                        setError("");
                    }}
                >
                    <Ionicons name="add" size={18} color={colors.primaryLight} />
                    <Text style={styles.addLinkText}>Add a new track</Text>
                </Pressable>
            )}

            <ErrorBanner message={error} />
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        gap: 8,
    },

    group: {
        gap: 8,
    },

    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.borderDark,
        borderRadius: 12,
        paddingHorizontal: 12,
    },

    searchInput: {
        flex: 1,
        color: colors.textPrimary,
        fontSize: 15,
        paddingVertical: 10,
    },

    list: {
        gap: 6,
    },

    option: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.borderDark,
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },

    optionSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },

    optionText: {
        flex: 1,
        gap: 2,
    },

    optionName: {
        color: colors.textPrimary,
        fontSize: 15,
        fontWeight: "700",
    },

    optionMeta: {
        color: colors.textMuted,
        fontSize: 12,
    },

    optionMetaSelected: {
        color: "#dbeafe",
    },

    empty: {
        color: colors.textMuted,
        fontSize: 14,
    },

    addLink: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 6,
        alignSelf: "flex-start",
    },

    addLinkText: {
        color: colors.primaryLight,
        fontWeight: "700",
        fontSize: 14,
    },

    addBox: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.borderDark,
        borderRadius: 12,
        padding: 14,
        gap: 10,
        marginTop: 4,
    },

    addTitle: {
        color: colors.textPrimary,
        fontSize: 15,
        fontWeight: "800",
    },

    row: {
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

    actions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 8,
    },
});
