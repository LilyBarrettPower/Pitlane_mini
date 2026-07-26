import { useEffect, useState } from "react";
import { router } from "expo-router";
import {
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { globalStyles } from '../../../constants/styles';
import { apiFetch } from "../../../assets/api";
import { useAuth } from "../../../context/AuthContext";

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

    function formatDate(date?: string) {
        if (!date) return "-";
        return new Date(date).toLocaleDateString();
    }

    return (
        <SafeAreaView style={globalStyles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.headerRow}>
                    <Text style={globalStyles.title}>Events</Text>

                    <Pressable style={globalStyles.buttonPrimary} onPress={openCreateModal}>
                        <Text style={globalStyles.buttonPrimaryText}>Add Event</Text>
                    </Pressable>
                </View>

                {errorMessage ? <Text style={globalStyles.errorText}>{errorMessage}</Text> : null}

                {isLoading ? (
                    <ActivityIndicator color="#ffffff" />
                ) : events.length === 0 ? (
                    <Text style={globalStyles.text}>No events yet</Text>
                ) : (
                    events.map((event) => (
                        <Pressable key={event._id}
                            style={globalStyles.card}
                            onPress={() =>
                                router.push({
                                    pathname: "/events/[id]" as any,
                                    params: { id: event._id },
                                })
                            }>
                            <Text style={globalStyles.cardTitle}>{event.name}</Text>
                            <Text style={globalStyles.cardText}>Track: {getTrackName(event)}</Text>
                            <Text style={globalStyles.cardText}>Type: {event.type}</Text>
                            <Text style={globalStyles.cardText}>Start: {formatDate(event.startDate)}</Text>
                            <Text style={globalStyles.cardText}>End: {formatDate(event.endDate)}</Text>
                            <Text style={globalStyles.cardText}>Status: {event.status || "-"}</Text>
                            <Text style={globalStyles.cardText}>Notes: {event.notes || "-"}</Text>

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
                    ))
                )}
            </ScrollView>

            <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
                <ScrollView contentContainerStyle={styles.modalContent}>
                    <View style={globalStyles.modalOverlay}>

                        <View style={globalStyles.modalCard}>

                            <Text style={globalStyles.modalTitle}>
                                Create Event
                            </Text>

                            <Text style={globalStyles.label}>Event Name</Text>
                            <TextInput style={globalStyles.input} value={name} onChangeText={setName} />

                            <Text style={globalStyles.label}>Track</Text>
                            {tracks.length === 0 ? (
                                <Text style={globalStyles.text}>No tracks available</Text>
                            ) : (
                                <View style={styles.selectList}>
                                    {tracks.map((track) => (
                                        <Pressable
                                            key={track._id}
                                            style={[
                                                styles.selectItem,
                                                trackId === track._id && styles.selectItemActive,
                                            ]}
                                            onPress={() => setTrackId(track._id)}
                                        >
                                            <Text style={globalStyles.text}>{track.name}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            )}

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
                            <TextInput style={globalStyles.input} value={notes} onChangeText={setNotes} />

                            <View style={styles.modalActions}>
                                <Pressable
                                    style={globalStyles.buttonDanger}
                                    onPress={() => {
                                        clearForm();
                                        setShowModal(false);
                                    }}
                                >
                                    <Text style={globalStyles.buttonPrimaryText}>Cancel</Text>
                                </Pressable>

                                <Pressable style={globalStyles.buttonPrimary} onPress={handleCreateEvent}>
                                    <Text style={globalStyles.buttonPrimaryText}>
                                        Create Event
                                    </Text>
                                </Pressable>
                            </View>

                        </View>

                    </View>
                </ScrollView>
            </Modal>
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    content: {
        padding: 24,
        gap: 16,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    actionRow: {
        flexDirection: "row",
        gap: 8,
        marginTop: 14,
    },
    modalContent: {
        gap: 10,
        paddingBottom: 24,
    },
    modalActions: {
        flexDirection: "row",
        gap: 10,
        marginTop: 14,
        flexWrap: "wrap",
    },
    selectList: {
        gap: 8,
    },
    selectItem: {
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#374151",
        borderRadius: 10,
        padding: 12,
    },
    selectItemActive: {
        backgroundColor: "#1d4ed8",
        borderColor: "#2563eb",
    },
});