import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    TextInput
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { apiFetch } from "../../../../assets/api";
import { useAuth } from "../../../../context/AuthContext";
import { globalStyles } from "../../../../constants/styles";

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

type Vehicle = {
    _id: string;
    name?: string;
    racingNumber?: string;
    make?: string;
    model?: string;
};

type EventVehicle = {
    _id: string;
    eventId: string;
    vehicleId: Vehicle;
    type?: string;
};

export default function EventDetailPage() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { token } = useAuth();

    const [event, setEvent] = useState<Event | null>(null);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [eventVehicles, setEventVehicles] = useState<EventVehicle[]>([]);

    const [tracks, setTracks] = useState<Track[]>([]);

    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedVehicleId, setSelectedVehicleId] = useState("");
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [errorMessage, setErrorMessage] = useState("");

    const [name, setName] = useState("");
    const [trackId, setTrackId] = useState("");
    const [type, setType] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [status, setStatus] = useState("Upcoming");
    const [notes, setNotes] = useState("");


    async function fetchEvent() {
        const data = await apiFetch(`/events/${id}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            },
        });

        setEvent(data.event);
    }

    async function fetchVehicles() {
        const data = await apiFetch("/vehicles", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            },
        });

        setVehicles(data.vehicles || []);
    }

    async function fetchEventVehicles() {
        const data = await apiFetch(`/event-vehicles/vehicle/${id}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            },
        });

        setEventVehicles(data.assignments || []);
    }


    async function fetchTracks() {
        const data = await apiFetch("/tracks", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        setTracks(data.tracks || []);
    }

    async function fetchPageData() {
        try {
            setIsLoading(true);
            setErrorMessage("");

            await Promise.all([
                fetchEvent(),
                fetchVehicles(),
                fetchEventVehicles(),
                fetchTracks(),
            ]);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to load event");
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (id && token) {
            fetchPageData();
        }
    }, [id, token]);

    async function handleAssignVehicle() {
        if (!selectedVehicleId) {
            setErrorMessage("Please select a vehicle");
            return;
        }

        try {
            setIsAssigning(true);
            setErrorMessage("");

            await apiFetch("/event-vehicles", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    eventId: id,
                    vehicleId: selectedVehicleId,
                }),
            });

            setSelectedVehicleId("");
            setShowAssignModal(false);
            await fetchEventVehicles();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to assign vehicle")
        } finally {
            setIsAssigning(false);
        }
    }

    async function handleRemoveVehicleAssignment(assignmentId: string) {
        try {
            setIsLoading(true);
            setErrorMessage("");

            await apiFetch(`/event-vehicles/${assignmentId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                },
            });

            await fetchEventVehicles();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to remove vehicle")
        } finally {
            setIsLoading(false);
        }
    }

    function getTrackName() {
        if (!event) return "-";
        if (typeof event.trackId !== "string") {
            return event.trackId?.name || "-";
        }

        const track = tracks.find((item) => item._id === event.trackId);
        return track?.name || "-";
    }

    function vehicleLabel(vehicle: Vehicle) {
        return `${vehicle.racingNumber ? `#${vehicle.racingNumber} ` : ""}${vehicle.name || `${vehicle.make || ""} ${vehicle.model || ""}`
            }`;
    }

    function formatDate(date?: string) {
        if (!date) return "-";
        return new Date(date).toLocaleDateString();
    }


    // Added these for the moving of modals to detail page:
    function populateEditForm(selectedEvent: Event) {
        setName(selectedEvent.name || "");

        setTrackId(
            typeof selectedEvent.trackId === "string"
                ? selectedEvent.trackId
                : selectedEvent.trackId?._id || ""
        );

        setType(selectedEvent.type || "");

        setStartDate(
            selectedEvent.startDate
                ? selectedEvent.startDate.slice(0, 10)
                : ""
        );

        setEndDate(
            selectedEvent.endDate
                ? selectedEvent.endDate.slice(0, 10)
                : ""
        );

        setStatus(selectedEvent.status || "Upcoming");
        setNotes(selectedEvent.notes || "");
    }

    function openEditModal() {
        if (!event) return;

        populateEditForm(event);
        setErrorMessage("");
        setShowEditModal(true);
    }

    function closeEditModal() {
        if (isSaving) return;

        setShowEditModal(false);
        setErrorMessage("");

        if (event) {
            populateEditForm(event);
        }
    }

    async function handleUpdateEvent() {
        if (!name.trim()) {
            setErrorMessage("Event name is required");
            return;
        }
        if (!trackId) {
            setErrorMessage("Please select a track");
            return;
        }
        if (!type.trim()) {
            setErrorMessage("Event type is required");
            return;
        }
        if (!startDate || !endDate) {
            setErrorMessage("Start date and end date are required");
            return;
        }

        try {
            setIsSaving(true);
            setErrorMessage("");

            await apiFetch(`/events/${id}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: name.trim(),
                    trackId,
                    type: type.trim(),
                    startDate,
                    endDate,
                    status: status.trim(),
                    notes: notes.trim(),
                }),
            });

            await fetchEvent();
            setShowEditModal(false);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to update event");
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDeleteEvent() {
        try {
            setIsDeleting(true);
            setErrorMessage("");

            await apiFetch(`/events/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setShowDeleteModal(false);
            router.replace("/events");
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to delete event");
        } finally {
            setIsDeleting(false);
        }
    }


    if (isLoading) {
        return (
            <SafeAreaView style={globalStyles.container}>
                <ActivityIndicator color="#ffffff" />
            </SafeAreaView>
        );
    }

    if (errorMessage || !event) {
        return (
            <SafeAreaView style={globalStyles.container}>
                <View style={styles.content}>
                    <Text style={globalStyles.errorText}>
                        {errorMessage || "Event not found"}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={globalStyles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={globalStyles.title}>{event.name}</Text>
                <View style={styles.eventActionRow}>
                    <Pressable
                        style={globalStyles.smallButton}
                        onPress={openEditModal}
                    >
                        <Text style={globalStyles.smallButtonText}>
                            Edit Event
                        </Text>
                    </Pressable>

                    <Pressable
                        style={globalStyles.buttonDangerSmall}
                        onPress={() => {
                            setErrorMessage("");
                            setShowDeleteModal(true);
                        }}
                    >
                        <Text style={globalStyles.smallButtonText}>
                            Delete Event
                        </Text>
                    </Pressable>
                </View>
                <View style={globalStyles.card}>
                    <Text style={globalStyles.sectionTitle}>Event Info</Text>
                    <Text style={globalStyles.cardText}>Track: {getTrackName()}</Text>
                    <Text style={globalStyles.cardText}>Type: {event.type || "-"}</Text>
                    <Text style={globalStyles.cardText}>Start: {formatDate(event.startDate)}</Text>
                    <Text style={globalStyles.cardText}>End: {formatDate(event.endDate)}</Text>
                    <Text style={globalStyles.cardText}>Status: {event.status || "-"}</Text>
                    <Text style={globalStyles.cardText}>Notes: {event.notes || "-"}</Text>
                </View>

                <View style={globalStyles.card}>
                    <Text style={globalStyles.sectionTitle}>Assigned Vehicles</Text>

                    {eventVehicles.length === 0 ? (
                        <Text style={globalStyles.text}>No vehicles assigned</Text>
                    ) : (
                        eventVehicles.map((item) => (
                            <Pressable
                                key={item._id}
                                style={styles.listItemCard}
                                onPress={() =>
                                    router.push({
                                        pathname: "/events/[id]/vehicles/[eventVehicleId]" as any,
                                        params: {
                                            id: String(id),
                                            eventVehicleId: item._id,
                                        },
                                    })
                                }
                            >
                                <View>
                                    <Text style={globalStyles.cardText}>
                                        {vehicleLabel(item.vehicleId)}
                                    </Text>
                                    <Text style={globalStyles.subText}>
                                        {item.type || "Event vehicle"}
                                    </Text>
                                </View>

                                <Pressable
                                    style={globalStyles.buttonDangerSmall}
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        handleRemoveVehicleAssignment(item._id);
                                    }}
                                >
                                    <Text style={globalStyles.smallButtonText}>Remove</Text>
                                </Pressable>
                            </Pressable>
                        ))
                    )}

                    <View style={styles.actionRow}>
                        <Pressable
                            style={globalStyles.buttonPrimary}
                            onPress={() => setShowAssignModal(true)}
                        >
                            <Text style={globalStyles.buttonPrimaryText}>Assign Vehicle</Text>
                        </Pressable>
                    </View>
                </View>

                <Modal
                    visible={showAssignModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowAssignModal(false)}
                >
                    <View style={globalStyles.modalOverlay}>
                        <View style={globalStyles.modalCard}>
                            <Text style={globalStyles.modalTitle}>Assign Vehicle</Text>

                            {vehicles.length === 0 ? (
                                <Text style={globalStyles.text}>No vehicles available</Text>
                            ) : (
                                <View style={styles.selectList}>
                                    {vehicles.map((vehicle) => {
                                        const alreadyAssigned = eventVehicles.some(
                                            (assignment) => assignment.vehicleId?._id === vehicle._id
                                        );

                                        return (
                                            <Pressable
                                                key={vehicle._id}
                                                disabled={alreadyAssigned}
                                                style={[
                                                    styles.selectItem,
                                                    selectedVehicleId === vehicle._id && styles.selectItemActive,
                                                    alreadyAssigned && styles.selectItemDisabled,
                                                ]}
                                                onPress={() => setSelectedVehicleId(vehicle._id)}
                                            >
                                                <Text style={globalStyles.text}>{vehicleLabel(vehicle)}</Text>
                                                <Text style={globalStyles.subText}>
                                                    {alreadyAssigned ? "Already assigned" : "Available"}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            )}

                            <View style={styles.actionRow}>
                                <Pressable
                                    style={globalStyles.buttonDanger}
                                    onPress={() => {
                                        setSelectedVehicleId("");
                                        setShowAssignModal(false);
                                    }}
                                    disabled={isAssigning}
                                >
                                    <Text style={globalStyles.buttonPrimaryText}>Cancel</Text>
                                </Pressable>

                                <Pressable
                                    style={[
                                        globalStyles.buttonPrimary,
                                        isAssigning && globalStyles.buttonDisabled,
                                    ]}
                                    onPress={handleAssignVehicle}
                                    disabled={isAssigning || vehicles.length === 0}
                                >
                                    {isAssigning ? (
                                        <ActivityIndicator color="#ffffff" />
                                    ) : (
                                        <Text style={globalStyles.buttonPrimaryText}>Assign</Text>
                                    )}
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </Modal>
                <Modal
                    visible={showEditModal}
                    transparent
                    animationType="fade"
                    onRequestClose={closeEditModal}
                >
                    <ScrollView contentContainerStyle={styles.modalContent}>
                        <View style={globalStyles.modalOverlay}>
                            <View style={globalStyles.modalCard}>
                                <Text style={globalStyles.modalTitle}>
                                    Edit Event
                                </Text>

                                <Text style={globalStyles.label}>
                                    Event Name
                                </Text>

                                <TextInput
                                    style={globalStyles.input}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Event name"
                                    placeholderTextColor="#9ca3af"
                                />

                                <Text style={globalStyles.label}>
                                    Track
                                </Text>

                                {tracks.length === 0 ? (
                                    <Text style={globalStyles.text}>
                                        No tracks available
                                    </Text>
                                ) : (
                                    <View style={styles.selectList}>
                                        {tracks.map((track) => {
                                            const isSelected =
                                                trackId === track._id;

                                            return (
                                                <Pressable
                                                    key={track._id}
                                                    style={[
                                                        styles.selectItem,
                                                        isSelected &&
                                                        styles.selectItemActive,
                                                    ]}
                                                    onPress={() =>
                                                        setTrackId(track._id)
                                                    }
                                                >
                                                    <Text style={globalStyles.text}>
                                                        {track.name}
                                                    </Text>
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                )}

                                <Text style={globalStyles.label}>
                                    Type
                                </Text>

                                <TextInput
                                    style={globalStyles.input}
                                    value={type}
                                    onChangeText={setType}
                                    placeholder="Race, Test, Practice"
                                    placeholderTextColor="#9ca3af"
                                />

                                <Text style={globalStyles.label}>
                                    Start Date
                                </Text>

                                <TextInput
                                    style={globalStyles.input}
                                    value={startDate}
                                    onChangeText={setStartDate}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="#9ca3af"
                                />

                                <Text style={globalStyles.label}>
                                    End Date
                                </Text>

                                <TextInput
                                    style={globalStyles.input}
                                    value={endDate}
                                    onChangeText={setEndDate}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="#9ca3af"
                                />

                                <Text style={globalStyles.label}>
                                    Status
                                </Text>

                                <TextInput
                                    style={globalStyles.input}
                                    value={status}
                                    onChangeText={setStatus}
                                    placeholder="Upcoming, Active, Complete"
                                    placeholderTextColor="#9ca3af"
                                />

                                <Text style={globalStyles.label}>
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
                                    placeholder="Optional event notes"
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
                                        onPress={handleUpdateEvent}
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
                    onRequestClose={() => {
                        if (!isDeleting) {
                            setShowDeleteModal(false);
                        }
                    }}
                >
                    <View style={globalStyles.modalOverlay}>
                        <View style={globalStyles.modalCard}>
                            <Text style={globalStyles.modalTitle}>
                                Delete event?
                            </Text>

                            <Text style={globalStyles.text}>
                                Are you sure you want to delete {event.name}?
                            </Text>

                            <Text style={globalStyles.subText}>
                                This may also affect vehicles, runs and data
                                assigned to this event.
                            </Text>

                            {errorMessage ? (
                                <Text style={globalStyles.errorText}>
                                    {errorMessage}
                                </Text>
                            ) : null}

                            <View style={styles.actionRow}>
                                <Pressable
                                    style={globalStyles.buttonPrimary}
                                    onPress={() =>
                                        setShowDeleteModal(false)
                                    }
                                    disabled={isDeleting}
                                >
                                    <Text
                                        style={globalStyles.buttonPrimaryText}
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
                                    onPress={handleDeleteEvent}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <ActivityIndicator color="#ffffff" />
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
    vehicleRow: {
        marginBottom: 10,
        marginTop: 10,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#374151",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
    },
    actionRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 14,
        flexWrap: "wrap",
    },
    selectList: {
        gap: 8,
        marginTop: 12,
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
    selectItemDisabled: {
        opacity: 0.45,
    },
    eventActionRow: {
        flexDirection: "row",
        gap: 8,
        flexWrap: "wrap",
    },

    modalContent: {
        flexGrow: 1,
    },

    notesInput: {
        minHeight: 90,
    },
    listItemCard: {
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#374151",
        borderRadius: 12,
        padding: 14,
        marginTop: 10,

        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
});