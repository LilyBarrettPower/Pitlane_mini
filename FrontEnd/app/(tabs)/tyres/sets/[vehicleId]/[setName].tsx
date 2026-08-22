import {useEffect, useState} from "react";
import {ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View} from "react-native";
import {router, useLocalSearchParams} from "expo-router";
import {SafeAreaView} from "react-native-safe-area-context";

import {apiFetch} from "../../../../../assets/api";
import {useAuth} from "../../../../../context/AuthContext";
import { globalStyles } from "../../../../../constants/styles";


type Vehicle = {
    _id: string;
    name?: string;
    racingNumber?: string;
    make?: string;
    model?: string;
};

type Tyre = {
    _id: string;
    vehicleId: string | Vehicle;
    brand: string;
    spec?: string;
    currentSet?: string;
    size?: string;
    position?: string;
    fiaSerial?: string;
    condition: string;
    heatCycles?: number;
    kmTotal?: number;
    notes?: string;
};

export default function TyreSetDetailPage() {
    const {token} = useAuth();

    const {vehicleId, setName} = 
        useLocalSearchParams<{
            vehicleId: string;
            setName: string;
        }>();
    
        const [tyres, setTyres] = useState<Tyre[]>([]);
        const [isLoading, setIsLoading] = useState(true);
        const [isDeleting, setIsDeleting] = useState(false);

        const [showDeleteModal, setShowDeleteModal] = useState(false);
        const [errorMessage, setErrorMessage] = useState("");

        async function fetchTyreSet() {
            if (!token || !vehicleId) return;

            const data = await apiFetch(
                `/tyres?vehicleId=${vehicleId}`,
                {
                    method: "GET",
                    headers:{
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const matchingTyres = (data.tyres || []).filter(
                (tyre: Tyre) => 
                    tyre.currentSet
                        ?.trim()
                        .toLowerCase() ===
                    String(setName)
                        .trim()
                        .toLowerCase()
            );

            setTyres(matchingTyres);
        }

        useEffect(() => {
            async function loadPage() {
                if (!token || !vehicleId || !setName) {
                    return;
                }

                try {
                    setIsLoading(true);
                    setErrorMessage("");

                    await fetchTyreSet();
                } catch (error) {
                    setErrorMessage(error instanceof Error ? error.message : "Failed to load tyre set");
                } finally {
                    setIsLoading(false);
                }
            }

            loadPage();
        }, [token, vehicleId, setName]);

        function formatVehicleName(vehicle: Vehicle) {
            if (vehicle.name) {
                return vehicle.name;
            }

            const makeModel = [
                vehicle.make,
                vehicle.model,
            ]
                .filter(Boolean)
                .join(" ");

            if (makeModel) {
                return makeModel;
            }

            if (vehicle.racingNumber) {
                return vehicle.racingNumber;
            }

            return "Unnamed Vehicle";
        }

        function getVehicleName() {
            const firstTyre = tyres[0];

            if (!firstTyre) {
                return "Unknown vehicle";
            }
            if (
                typeof firstTyre.vehicleId === "object" &&
                firstTyre.vehicleId !== null
            ) {
                return formatVehicleName(
                    firstTyre.vehicleId
                );
            }

            return "Vehicle";
        }

        function getAverageHeatCycles() {
            if (tyres.length === 0) return 0;
            const total = tyres.reduce(
                (sum, tyre) => sum + (tyre.heatCycles ?? 0), 0
            );
            return total / tyres.length;
        }

        function getAverageDistance() {
            if (tyres.length === 0) return 0;
            const total = tyres.reduce(
                (sum, tyre) => sum + (tyre.kmTotal ?? 0), 0
            );
            return total / tyres.length;
        }

        async function handleDeleteSet() {
            try {
                setIsDeleting(true);
                setErrorMessage("");

                await apiFetch("/tyres/set", {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        vehicleId,
                        currentSet: setName,
                    }),
                });

                setShowDeleteModal(false);
                router.replace("/tyres");
            } catch (error) {
                setErrorMessage(error instanceof Error ? error.message : "Failed to delete tyre set");
            } finally {
                setIsDeleting(false);
            }
        }

        if (isLoading) {
            return (
                <SafeAreaView style={globalStyles.container}>
                    <ActivityIndicator color="#ffffff"/>
                </SafeAreaView>
            );
        }

        if (tyres.length === 0) {
            return (
                <SafeAreaView style={globalStyles.container}>
                    <View style={styles.content}>
                        <Text style={globalStyles.errorText}>
                            {errorMessage || "Tyre set not found"}
                        </Text>
                    </View>
                </SafeAreaView>
            );
        }

    return (
        <SafeAreaView
            style={globalStyles.container}
        >
            <ScrollView
                contentContainerStyle={styles.content}
            >
                <View style={styles.titleRow}>
                    <View style={styles.titleText}>
                        <Text style={globalStyles.title}>
                            {setName}
                        </Text>

                        <Text
                            style={globalStyles.subText}
                        >
                            {getVehicleName()}
                        </Text>
                    </View>

                    <Pressable
                        style={
                            globalStyles.buttonDangerSmall
                        }
                        onPress={() => {
                            setErrorMessage("");
                            setShowDeleteModal(true);
                        }}
                    >
                        <Text
                            style={
                                globalStyles.smallButtonText
                            }
                        >
                            Delete Set
                        </Text>
                    </Pressable>
                </View>

                {errorMessage ? (
                    <Text
                        style={globalStyles.errorText}
                    >
                        {errorMessage}
                    </Text>
                ) : null}

                <View style={globalStyles.card}>
                    <Text
                        style={
                            globalStyles.sectionTitle
                        }
                    >
                        Set Information
                    </Text>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>
                            Vehicle
                        </Text>

                        <Text style={styles.infoValue}>
                            {getVehicleName()}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>
                            Brand
                        </Text>

                        <Text style={styles.infoValue}>
                            {tyres[0]?.brand || "-"}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>
                            Specification
                        </Text>

                        <Text style={styles.infoValue}>
                            {tyres[0]?.spec || "-"}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>
                            Tyres
                        </Text>

                        <Text style={styles.infoValue}>
                            {tyres.length}/4
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>
                            Average Heat Cycles
                        </Text>

                        <Text style={styles.infoValue}>
                            {getAverageHeatCycles().toFixed(
                                1
                            )}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>
                            Average Distance
                        </Text>

                        <Text style={styles.infoValue}>
                            {getAverageDistance().toFixed(
                                0
                            )}{" "}
                            km
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>
                            Runs
                        </Text>

                        <Text style={styles.infoValue}>
                            -
                        </Text>
                    </View>
                </View>

                <View style={globalStyles.card}>
                    <Text
                        style={
                            globalStyles.sectionTitle
                        }
                    >
                        Pressure Check History
                    </Text>

                    <Text
                        style={globalStyles.subText}
                    >
                        No pressure history loaded yet.
                    </Text>
                </View>

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
                    <View
                        style={
                            globalStyles.modalOverlay
                        }
                    >
                        <View
                            style={
                                globalStyles.modalCard
                            }
                        >
                            <Text
                                style={
                                    globalStyles.modalTitle
                                }
                            >
                                Delete tyre set?
                            </Text>

                            <Text
                                style={globalStyles.text}
                            >
                                Are you sure you want to
                                delete {setName}?
                            </Text>

                            <Text
                                style={
                                    globalStyles.subText
                                }
                            >
                                This will archive all tyres
                                belonging to this set.
                            </Text>

                            {errorMessage ? (
                                <Text
                                    style={
                                        globalStyles.errorText
                                    }
                                >
                                    {errorMessage}
                                </Text>
                            ) : null}

                            <View
                                style={styles.actionRow}
                            >
                                <Pressable
                                    style={
                                        globalStyles.buttonPrimary
                                    }
                                    onPress={() => {
                                        setErrorMessage("");
                                        setShowDeleteModal(
                                            false
                                        );
                                    }}
                                    disabled={isDeleting}
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
                                        globalStyles.buttonDanger,
                                        isDeleting &&
                                            globalStyles.buttonDisabled,
                                    ]}
                                    onPress={
                                        handleDeleteSet
                                    }
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <ActivityIndicator
                                            color="#ffffff"
                                        />
                                    ) : (
                                        <Text
                                            style={
                                                globalStyles.buttonPrimaryText
                                            }
                                        >
                                            Yes, Delete Set
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

    titleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
    },

    titleText: {
        flex: 1,
        gap: 3,
    },

    actionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        marginTop: 14,
    },

    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#374151",
    },

    infoLabel: {
        color: "#9ca3af",
        fontSize: 14,
        fontWeight: "600",
    },

    infoValue: {
        color: "#f3f4f6",
        fontSize: 14,
        fontWeight: "700",
        textAlign: "right",
        flexShrink: 1,
    },
});