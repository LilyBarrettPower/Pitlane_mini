import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
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

    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedVehicleId, setSelectedVehicleId] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

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
        const data = await apiFetch(`/event-vehicles/event/${id}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            },
        });

        setEventVehicles(data.assignments || []);
    }

    async function fetchPageData() {
        try {
            setIsLoading(true);
            setErrorMessage("");

            await Promise.all([
                fetchEvent(),
                fetchVehicles(),
                fetchEventVehicles(),
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
        if (typeof event.trackId !== "string") return event.trackId?.name || "-";
        return "-";
    }

    function vehicleLabel(vehicle: Vehicle) {
        return `${vehicle.racingNumber ? `#{vehicle.racingNumber}` : ""}${vehicle.name || `${vehicle.make || ""} ${vehicle.model || ""}`
            }`;
    }

    function formatDate(date?: string) {
        if (!date) return "-";
        return new Date(date).toLocaleDateString();
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
                            <View key={item._id} style={styles.vehicleRow}>
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
                                    onPress={() => handleRemoveVehicleAssignment(item._id)}
                                >
                                    <Text style={globalStyles.smallButtonText}>Remove</Text>
                                </Pressable>
                            </View>
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
});