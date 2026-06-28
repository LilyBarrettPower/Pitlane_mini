import {useEffect, useState} from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {SafeAreaView} from "react-native-safe-area-context";

import { apiFetch } from "../../../../../../assets/api";
import {useAuth} from "../../../../../../context/AuthContext";
import {globalStyles} from "../../../../../../constants/styles";

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
    vehicleId: string | Vehicle;
    type?: string;
};

type Event = {
    _id: string,
    name: string,
    type?: string,
};

type Run = {
    _id: string;
    eventVehicleId: string;
    weather?: string;
    trackTemp?: string;
    trackCondition?: string;
    outTime?: string;
    inTime?: string;
    lapsDone?: number;
    fuelStart?: number;
    fuelEnd?: number;
    fuelUsed?: number; // Make it so that this auto populates 
    fuelPerLap?: number; // Also auto populates
    bestLapS?: number;
    averageLapS?: number;
    notes?: string;
};

export default function EventVehicleDetailPage() {
    const { id: eventId, eventVehicleId } = useLocalSearchParams<{
        id: string;
        eventVehicleId: string;
    }>();

    const {token} = useAuth();

    const [eventVehicle, setEventVehicle] = useState<EventVehicle | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [event, setEvent] = useState<Event | null>(null);

    const [runs, setRuns] = useState<Run[]>([]);

    async function fetchEventVehicle() {
        try {
            setIsLoading(true);
            setErrorMessage("");

            const data = await apiFetch(`/event-vehicles/vehicle/${eventId}`, {
                method: "GET",
                headers: {Authorization: `Bearer ${token}`},
            });

            const found = (data.assignments || []).find(
                (item: EventVehicle) => item._id === eventVehicleId
            );

            setEventVehicle(found || null);
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : "Failed to load event vehicle"
            );
        } finally {
            setIsLoading(false);
        }
    }

    async function fetchEvent() {
        const data = await apiFetch(`/events/${eventId}`,{
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            },
        });

        setEvent(data.event);
    }

    async function fetchRuns() {
        const data = await apiFetch(`/runs?eventVehicleId=${eventVehicleId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        setRuns(data.runs || []);
    }

    useEffect(() => {
        if (eventId && eventVehicleId && token) {
            fetchEventVehicle();
            fetchEvent();
            fetchRuns();
        }
    }, [eventId, eventVehicleId, token]);

    function vehicleLabel(vehicle: Vehicle) {
        const number = vehicle.racingNumber ? `#${vehicle.racingNumber} ` : ""
        const name = vehicle.name || `${vehicle.make || ""} ${vehicle.model || ""}`.trim();

        return `${number}${name || "Unnamed vehicle"}`;
    }

    if (isLoading) {
        return (
            <SafeAreaView style={globalStyles.container}>
                <ActivityIndicator color="#ffffff"/>
            </SafeAreaView>
        );
    }

    if (errorMessage || !eventVehicle) {
        return (
            <SafeAreaView style={globalStyles.container}>
                <View style={styles.content}>
                    <Text style={globalStyles.errorText}>
                        {errorMessage || "Event vehicle not found"}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={globalStyles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.breadcrumbCard}>
                    <Text style={globalStyles.title}>
                        {event?.name || "Event"}
                    </Text>
                
                <Text style={globalStyles.text}>
                    {typeof eventVehicle.vehicleId === "string"
                    ? "Event Vehicle"
                    : vehicleLabel(eventVehicle.vehicleId)}
                </Text>
                </View>

                <View style={globalStyles.card}>
                    <Text style={globalStyles.sectionTitle}>Event Vehicle Info</Text>
                    <Text style={globalStyles.cardText}>
                        Do we want any text here?
                    </Text>
                </View>

                <View style={globalStyles.card}>
                    <Text style={globalStyles.sectionTitle}>Runs</Text>
                    {runs.length === 0 ? (
                        <Text style={globalStyles.text}>No runs yet</Text>
                    ) : (
                        runs.map((run, index) => (
                            <Pressable 
                                key={run._id}
                                style={styles.runRow}
                                onPress={() => 
                                    router.push({
                                        pathname: "/events/[id]/vehicles/[eventVehicleId/runs/[runId]" as any,
                                        params: {
                                            id: String(eventId),
                                            eventVehicleId: String(eventVehicleId),
                                            runId: run._id,
                                        },
                                    })
                                }
                                >
                                    <View>
                                        <Text style={globalStyles.cardText}>Run {index + 1}</Text>
                                        <Text style={globalStyles.subText}>
                                            Laps: {run.lapsDone ?? "-"} | Best: {run.bestLapS ?? "-"}
                                        </Text>
                                        <Text style={globalStyles.subText}>
                                            Fuel Used: {run.fuelUsed ?? "-"} L
                                        </Text>
                                    </View>
                                </Pressable>
                        ))
                    )}

                    <View style={styles.actionRow}>
                        <Pressable style={globalStyles.buttonPrimary}>
                            <Text style={globalStyles.buttonPrimaryText}>Create Run</Text>
                        </Pressable>
                    </View>
                </View>
                <View style={globalStyles.card}>
                    <Text style={globalStyles.sectionTitle}>Setup Used</Text>
                    <Text style={globalStyles.text}>Coming later... </Text>
                </View>
                <View style={globalStyles.card}>
                    <Text style={globalStyles.sectionTitle}>Tyres</Text>
                    <Text style={globalStyles.text}>Coming Later...</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
    
}

const styles = StyleSheet.create({
    content: {
        padding: 24,
        gap: 16,
    },
    breadcrumbCard: {
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#374151",
        borderRadius: 12,
        padding: 12,
        gap: 4,
    },
    runRow: {
        marginBottom: 10,
        paddingBottom: 8,
        borderBottomWidth: 1, 
        borderBottomColor: "#374151",
    },
    actionRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 14,
        flexWrap: "wrap",
    }
});