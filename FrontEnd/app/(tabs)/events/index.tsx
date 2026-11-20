import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import {
    StyleSheet,
    Text,
    View,
    Modal,
    Pressable,
    ScrollView,
    TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { globalStyles } from "../../../constants/styles";
import { colors } from "../../../constants/theme";
import { apiFetch } from "../../../assets/api";
import { useAuth } from "../../../context/AuthContext";
import TrackPicker from "../../../components/TrackPicker";
import {
    Badge,
    Button,
    EmptyState,
    ErrorBanner,
    LoadingState,
    PageHeader,
    Screen,
    SectionLabel,
} from "../../../components/ui/kit";

type Track = {
    _id: string;
    name: string;
};

type Event = {
    _id: string;
    trackId: string | Track;
    name: string;
    type: string;
    startDate: string;
    endDate: string;
    status?: string;
    notes?: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const PAST_EVENTS_PREVIEW = 10;

// Event dates are stored as the start of each day, so an event is still
// on until the end of its end date.
function eventHasEnded(event: Event) {
    return new Date(event.endDate).getTime() + DAY_MS <= Date.now();
}

function eventIsLive(event: Event) {
    return new Date(event.startDate).getTime() <= Date.now() && !eventHasEnded(event);
}

// e.g. "12 Apr 2026" or "12 Apr – 13 Apr 2026"
function formatEventDates(startDate: string, endDate: string) {
    const format = (date: string) =>
        new Date(date).toLocaleDateString("en-NZ", { day: "numeric", month: "short" });

    const start = format(startDate);
    const end = format(endDate);
    const year = new Date(endDate).getFullYear();

    return start === end ? `${start} ${year}` : `${start} – ${end} ${year}`;
}

function daysUntilLabel(startDate: string) {
    const days = Math.ceil((new Date(startDate).getTime() - Date.now()) / DAY_MS);
    return days <= 1 ? "Tomorrow" : `In ${days} days`;
}

export default function EventsPage() {

    const { user, token } = useAuth();

    const [events, setEvents] = useState<Event[]>([]);
    const [tracks, setTracks] = useState<Track[]>([]);

    const [showModal, setShowModal] = useState(false);
    // const [editingEvent, setEditingEvent] = useState<Event | null>(null);

    const [name, setName] = useState("");
    const [trackId, setTrackId] = useState("");
    const [type, setType] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [status, setStatus] = useState("Upcoming");
    const [notes, setNotes] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    async function fetchEvents() {
        try {
            setIsLoading(true);
            setErrorMessage("");

            const data = await apiFetch("/events", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                },
            });

            setEvents(data.events || []);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to load events");
        } finally {
            setIsLoading(false);
        }
    }

    async function fetchTracks() {
        const data = await apiFetch("/tracks", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            },
        });

        setTracks(data.tracks || []);
    }

    useEffect(() => {
        if (token) {
            fetchEvents();
            fetchTracks();
        }
    }, [token]);

    function clearForm() {
        // setEditingEvent(null);
        setName("");
        setTrackId("");
        setType("");
        setStartDate("");
        setEndDate("");
        setStatus("Upcoming");
        setNotes("");
        setErrorMessage("");
    }

    function openCreateModal() {
        clearForm();
        setShowModal(true);
    }

    // function openEditModal(event: Event) {
    //     setEditingEvent(event);
    //     setName(event.name || "");
    //     setTrackId(typeof event.trackId === "string" ? event.trackId : event.trackId?._id || "");
    //     setType(event.type || "");
    //     setStartDate(event.startDate ? event.startDate.slice(0, 10) : "");
    //     setEndDate(event.endDate ? event.endDate.slice(0, 10) : "");
    //     setStatus(event.status || "upcoming");
    //     setNotes(event.notes || "");
    //     setShowModal(true);
    // }

    async function handleCreateEvent() {
        if (!name || !trackId || !startDate || !endDate) {
            setErrorMessage("Name, track, type, start date and end date are required");
            return;
        }

        try {
            setIsLoading(true);
            setErrorMessage("");

            await apiFetch("/events", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: name.trim(),
                    trackId,
                    type: type.trim(),
                    startDate,
                    endDate,
                    status: status.trim() || "Upcoming",
                    notes: notes.trim(),
                }),
            });

            const payload = {
                name,
                trackId,
                type,
                startDate,
                endDate,
                status,
                notes,
            };

            clearForm();
            setShowModal(false);
            await fetchEvents();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to save event");
        } finally {
            setIsLoading(false);
        }
    }

    // async function handleDeleteEvent(event: Event) {
    //     try {
    //         setIsLoading(true);
    //         setErrorMessage("");

    //         await apiFetch(`/events/${event._id}`, {
    //             method: "DELETE",
    //             headers: {
    //                 Authorization: `Bearer ${token}`
    //             },
    //         });

    //         await fetchEvents();

    //     } catch (error) {
    //         setErrorMessage(error instanceof Error ? error.message : "Failed to delete event");
    //     } finally {
    //         setIsLoading(false);
    //     }
    // }

    function getTrackName(event: Event) {
        if (typeof event.trackId !== "string") return event.trackId?.name || "-";

        const track = tracks.find((item) => item._id === event.trackId);
        return track?.name || "-";
    }

    // Upcoming (including live): soonest first. Past: most recent first.
    // The API already returns events sorted by start date, earliest first.
    const upcomingEvents = useMemo(
        () => events.filter((event) => !eventHasEnded(event)),
        [events]
    );

    const pastEvents = useMemo(
        () => events.filter((event) => eventHasEnded(event)).reverse(),
        [events]
    );

    const [showAllPastEvents, setShowAllPastEvents] = useState(false);

    const visiblePastEvents = showAllPastEvents
        ? pastEvents
        : pastEvents.slice(0, PAST_EVENTS_PREVIEW);

    function renderEventCard(event: Event, showTiming: boolean) {
        const live = eventIsLive(event);

        return (
            <Pressable
                key={event._id}
                style={({ pressed }) => [
                    globalStyles.card,
                    styles.eventCard,
                    live && styles.eventCardLive,
                    pressed && styles.pressed,
                ]}
                onPress={() =>
                    router.push({
                        pathname: "/events/[id]" as any,
                        params: { id: event._id },
                    })
                }
            >
                {/* Calendar-style date tile */}
                <View style={[styles.dateTile, live && styles.dateTileLive]}>
                    <Text style={[styles.dateTileMonth, live && styles.dateTileMonthLive]}>
                        {new Date(event.startDate)
                            .toLocaleDateString("en-NZ", { month: "short" })
                            .toUpperCase()}
                    </Text>
                    <Text style={styles.dateTileDay}>{new Date(event.startDate).getDate()}</Text>
                </View>

                <View style={styles.eventInfo}>
                    <Text style={styles.eventName}>{event.name}</Text>
                    <Text style={globalStyles.subText}>
                        {[
                            formatEventDates(event.startDate, event.endDate),
                            getTrackName(event) !== "-" ? getTrackName(event) : "",
                            event.type,
                        ]
                            .filter(Boolean)
                            .join(" · ")}
                    </Text>
                </View>

                {showTiming ? (
                    <Badge
                        label={live ? "● Live" : daysUntilLabel(event.startDate)}
                        tone={live ? "live" : "neutral"}
                    />
                ) : (
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                )}

                {/* <View style={styles.actionRow}>
                    <Pressable style={globalStyles.smallButton}
                        onPress={(e) => {
                            e.stopPropagation();
                            openEditModal(event);
                        }}>
                        <Text style={globalStyles.smallButtonText}>Edit</Text>
                    </Pressable>

                    <Pressable style={globalStyles.buttonDangerSmall}
                        onPress={(e) => {
                            e.stopPropagation();
                            handleDeleteEvent(event);
                        }}>
                        <Text style={globalStyles.smallButtonText}>Delete</Text>
                    </Pressable>
                </View> */}
            </Pressable>
        );
    }

    return (
        <Screen>
                <PageHeader
                    eyebrow="Calendar"
                    title="Events"
                    subtitle={
                        events.length
                            ? `${upcomingEvents.length} upcoming · ${pastEvents.length} past`
                            : undefined
                    }
                    actions={<Button label="Add Event" icon="add" onPress={openCreateModal} />}
                />

                {!showModal ? <ErrorBanner message={errorMessage} /> : null}

                {isLoading && events.length === 0 ? (
                    <LoadingState />
                ) : events.length === 0 ? (
                    <View style={globalStyles.card}>
                        <EmptyState
                            icon="calendar-outline"
                            title="No events yet"
                            text="Add a race weekend or test day to start logging runs."
                            action={<Button label="Add Event" icon="add" onPress={openCreateModal} />}
                        />
                    </View>
                ) : (
                    <>
                        <SectionLabel>Upcoming</SectionLabel>
                        {upcomingEvents.length === 0 ? (
                            <Text style={globalStyles.subText}>No upcoming events</Text>
                        ) : (
                            upcomingEvents.map((event) => renderEventCard(event, true))
                        )}

                        <SectionLabel spaced>Past</SectionLabel>
                        {pastEvents.length === 0 ? (
                            <Text style={globalStyles.subText}>No past events</Text>
                        ) : (
                            <>
                                {visiblePastEvents.map((event) => renderEventCard(event, false))}

                                {pastEvents.length > PAST_EVENTS_PREVIEW ? (
                                    <Pressable
                                        style={styles.showAllButton}
                                        onPress={() => setShowAllPastEvents((current) => !current)}
                                    >
                                        <Text style={styles.showAllText}>
                                            {showAllPastEvents
                                                ? "Show less"
                                                : `Show all ${pastEvents.length} past events`}
                                        </Text>
                                    </Pressable>
                                ) : null}
                            </>
                        )}
                    </>
                )}

            <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
                <ScrollView contentContainerStyle={styles.modalContent}>
                    <View style={globalStyles.modalOverlay}>

                        <View style={globalStyles.modalCard}>

                            <Text style={globalStyles.modalTitle}>
                                Add Event
                            </Text>

                            <Text style={globalStyles.label}>Event Name</Text>
                            <TextInput
                                style={globalStyles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="e.g. Hampton Downs Round 2"
                                placeholderTextColor={colors.textMuted}
                            />

                            <Text style={globalStyles.label}>Track</Text>
                            <TrackPicker
                                token={token}
                                selectedTrackId={trackId}
                                onSelect={(track) => setTrackId(track._id)}
                                onTracksChanged={() => fetchTracks().catch(() => {})}
                            />

                            <Text style={globalStyles.label}>Type</Text>
                            <TextInput
                                style={globalStyles.input}
                                value={type}
                                onChangeText={setType}
                                placeholder="Race, Test, Practice"
                                placeholderTextColor="#9ca3af"
                            />

                            <Text style={globalStyles.label}>Start Date</Text>
                            <TextInput
                                style={globalStyles.input}
                                value={startDate}
                                onChangeText={setStartDate}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor="#9ca3af"
                            />

                            <Text style={globalStyles.label}>End Date</Text>
                            <TextInput
                                style={globalStyles.input}
                                value={endDate}
                                onChangeText={setEndDate}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor="#9ca3af"
                            />

                            <Text style={globalStyles.label}>Status</Text>
                            <TextInput
                                style={globalStyles.input}
                                value={status}
                                onChangeText={setStatus}
                                placeholder="upcoming / active / complete"
                                placeholderTextColor="#9ca3af"
                            />

                            <Text style={globalStyles.label}>Notes</Text>
                            <TextInput
                                style={globalStyles.input}
                                value={notes}
                                onChangeText={setNotes}
                                placeholder="Optional notes"
                                placeholderTextColor={colors.textMuted}
                            />

                            <ErrorBanner message={errorMessage} />

                            <View style={styles.modalActions}>
                                <Button
                                    label="Cancel"
                                    variant="secondary"
                                    onPress={() => {
                                        clearForm();
                                        setShowModal(false);
                                    }}
                                />
                                <Button label="Create Event" onPress={handleCreateEvent} loading={isLoading} />
                            </View>

                        </View>

                    </View>
                </ScrollView>
            </Modal>
        </Screen>
    );
}


const styles = StyleSheet.create({
    modalContent: {
        flexGrow: 1,
    },
    modalActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 8,
        flexWrap: "wrap",
    },
    selectList: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    selectItem: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.borderDark,
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    selectItemActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    selectItemText: {
        color: colors.textSecondary,
        fontWeight: "600",
    },
    selectItemTextActive: {
        color: colors.textPrimary,
    },

    eventCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        paddingVertical: 16,
    },

    eventCardLive: {
        borderColor: colors.live,
    },

    pressed: {
        opacity: 0.85,
    },

    dateTile: {
        width: 54,
        height: 58,
        borderRadius: 12,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.borderDark,
        alignItems: "center",
        justifyContent: "center",
    },

    dateTileLive: {
        borderColor: colors.live,
        backgroundColor: colors.liveSoft,
    },

    dateTileMonth: {
        color: colors.primaryLight,
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 1,
    },

    dateTileMonthLive: {
        color: colors.live,
    },

    dateTileDay: {
        color: colors.textPrimary,
        fontSize: 22,
        fontWeight: "800",
    },

    eventInfo: {
        flex: 1,
        gap: 4,
    },

    eventName: {
        color: colors.textPrimary,
        fontSize: 17,
        fontWeight: "800",
    },

    showAllButton: {
        alignSelf: "flex-start",
    },

    showAllText: {
        color: colors.primaryLight,
        fontWeight: "700",
    },
});
