import {useEffect, useState} from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import {SafeAreaView} from "react-native-safe-area-context";

import { apiFetch } from "../../../../../assets/api";
import {useAuth} from "../../../../../context/AuthContext";
import {globalStyles} from "../../../../../constants/styles";

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

    useEffect(() => {
        if (eventId && eventVehicleId && token) {
            fetchEventVehicle();
            fetchEvent();
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
                    <Text style={globalStyles.text}>Coming later...</Text>
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
    }
});