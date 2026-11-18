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
import { Ionicons } from "@expo/vector-icons";

import { apiFetch } from "../../../../assets/api";
import { useAuth } from "../../../../context/AuthContext";
import { globalStyles } from "../../../../constants/styles";
import { colors } from "../../../../constants/theme";
import {
    Button,
    EmptyState,
    ErrorBanner,
    Field,
    LoadingState,
    PageHeader,
    Panel,
    Screen,
    useIsWide,
} from "../../../../components/ui/kit";

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
    const isWide = useIsWide();

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


    if (isLoading && !event) {
        return (
            <Screen>
                <LoadingState />
            </Screen>
        );
    }

    if (!event) {
        return (
            <Screen>
                <PageHeader title="Event" onBack={() => router.back()} backLabel="Events" />
                <ErrorBanner message={errorMessage || "Event not found"} />
            </Screen>
        );
    }

    const dayMs = 24 * 60 * 60 * 1000;
    const isLive =
        new Date(event.startDate).getTime() <= Date.now() &&
        new Date(event.endDate).getTime() + dayMs > Date.now();
    const trackName = getTrackName();

    const formatLongDate = (date?: string) =>
        date
            ? new Date(date).toLocaleDateString("en-NZ", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
            })
            : undefined;

    const infoPanel = (
        <Panel title="Event Info" icon="information-circle-outline">
            <View style={styles.fieldGrid}>
                <Field label="Track" value={trackName !== "-" ? trackName : undefined} />
                <Field label="Type" value={event.type} />
                <Field label="Start" value={formatLongDate(event.startDate)} />
                <Field label="End" value={formatLongDate(event.endDate)} />
            </View>

            {event.notes ? (
                <View style={styles.notesBlock}>
                    <Text style={styles.notesLabel}>NOTES</Text>
                    <Text style={styles.notesText}>{event.notes}</Text>
                </View>
            ) : null}
        </Panel>
    );

    const carsPanel = (
        <Panel
            title="Cars Entered"
            icon="car-sport-outline"
            actionLabel="Assign vehicle"
            onAction={() => setShowAssignModal(true)}
        >
            {eventVehicles.length === 0 ? (
                <EmptyState
                    icon="car-sport-outline"
                    text="No cars entered in this event yet."
                    action={
                        <Button
                            label="Assign Vehicle"
                            icon="add"
                            size="sm"
                            variant="secondary"
                            onPress={() => setShowAssignModal(true)}
                        />
                    }
                />
            ) : (
                <View style={styles.carGrid}>
                    {eventVehicles.map((item) => (
                        <Pressable
                            key={item._id}
                            style={({ pressed }) => [styles.carCard, pressed && styles.pressed]}
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
                            <View style={styles.numberTile}>
                                <Text style={styles.numberText}>
                                    {item.vehicleId?.racingNumber ? `#${item.vehicleId.racingNumber}` : "–"}
                                </Text>
                            </View>

                            <View style={styles.carText}>
                                <Text style={styles.carName} numberOfLines={1}>
                                    {item.vehicleId?.name ||
                                        `${item.vehicleId?.make || ""} ${item.vehicleId?.model || ""}`.trim() ||
                                        "Unnamed vehicle"}
                                </Text>
                                <Text style={styles.carSub} numberOfLines={1}>
                                    Runs, tyres & setups ›
                                </Text>
                            </View>

                            <Pressable
                                hitSlop={8}
                                style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    handleRemoveVehicleAssignment(item._id);
                                }}
                            >
                                <Ionicons name="close" size={18} color={colors.textMuted} />
                            </Pressable>
                        </Pressable>
                    ))}
                </View>
            )}
        </Panel>
    );

    return (
        <Screen>
            <PageHeader
                eyebrow={isLive ? "● Live now" : event.type || "Event"}
                title={event.name}
                subtitle={[
                    `${formatDate(event.startDate)} – ${formatDate(event.endDate)}`,
                    trackName !== "-" ? trackName : "",
                ]
                    .filter(Boolean)
                    .join(" · ")}
                onBack={() => router.back()}
                backLabel="Events"
                actions={
                    <>
                        <Button label="Edit" icon="create-outline" variant="secondary" onPress={openEditModal} />
                        <Button
                            label="Delete"
                            icon="trash-outline"
                            variant="ghost"
                            onPress={() => {
                                setErrorMessage("");
                                setShowDeleteModal(true);
                            }}
                        />
                    </>
                }
            />

            {!showEditModal && !showAssignModal ? <ErrorBanner message={errorMessage} /> : null}

            {isWide ? (
                <View style={styles.columns}>
                    <View style={styles.colMain}>{carsPanel}</View>
                    <View style={styles.colSide}>{infoPanel}</View>
                </View>
            ) : (
                <>
                    {infoPanel}
                    {carsPanel}
                </>
            )}

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
        </Screen>
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

    // ----- Redesigned layout -----
    columns: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 20,
    },
    colMain: {
        flex: 3,
        gap: 20,
    },
    colSide: {
        flex: 2,
        gap: 20,
    },
    fieldGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 18,
    },
    notesBlock: {
        marginTop: 18,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.borderDark,
        gap: 6,
    },
    notesLabel: {
        color: colors.textMuted,
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 1,
    },
    notesText: {
        color: colors.textSecondary,
        fontSize: 15,
        lineHeight: 22,
    },
    carGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    carCard: {
        flexGrow: 1,
        flexBasis: 260,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: colors.background,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.borderDark,
        padding: 12,
    },
    numberTile: {
        minWidth: 48,
        height: 48,
        paddingHorizontal: 8,
        borderRadius: 12,
        backgroundColor: colors.primarySoft,
        alignItems: "center",
        justifyContent: "center",
    },
    numberText: {
        color: colors.textPrimary,
        fontSize: 17,
        fontWeight: "800",
    },
    carText: {
        flex: 1,
        gap: 3,
    },
    carName: {
        color: colors.textPrimary,
        fontSize: 16,
        fontWeight: "800",
    },
    carSub: {
        color: colors.primaryLight,
        fontSize: 13,
        fontWeight: "600",
    },
    iconButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    pressed: {
        opacity: 0.8,
    },
});
