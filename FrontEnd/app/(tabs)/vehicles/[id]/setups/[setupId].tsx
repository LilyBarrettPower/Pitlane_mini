import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, Modal, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "../../../../../assets/api";
import { useAuth } from "../../../../../context/AuthContext";
import { globalStyles } from "../../../../../constants/styles";

type SetUp = {
    _id: string;
    vehicleId: string;
    version: string;
    springNm?: { front?: number; rear?: number };
    arbPos?: { front?: number; rear?: number };
    rideHeight?: { front?: number; rear?: number };
    camber?: { front?: string, rear?: string };
    toe?: { front?: string, rear?: string };
    packers?: { front?: string; rear?: string };
    diffPreload?: number;
    brakeBias?: string;
    wingHole?: string;
    splitter?: string;
    notes?: string;
};

export default function SetupDetailPage() {
    const { id, setupId } = useLocalSearchParams<{ id: string; setupId: string }>();
    const { token } = useAuth();

    const [setup, setSetup] = useState<SetUp | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [showDeleteModal, setShowDeleteModal] = useState(false);

    async function fetchSetup() {
        try {
            setIsLoading(true);
            setErrorMessage("");

            const data = await apiFetch(`/setups/${setupId}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setSetup(data.setup);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to load setup");
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (setupId && token) fetchSetup();
    }, [setupId, token]);

    async function handleDeleteSetup() {
        try {
            setIsLoading(true);
            setErrorMessage("");

            await apiFetch(`/setups/${setupId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setShowDeleteModal(false);

            await fetchSetup();
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : "Failed to remove setup"
            );
        } finally {
            setIsLoading(false);
        }
    }

    if (isLoading) {
        return (
            <SafeAreaView style={globalStyles.container}>
                <ActivityIndicator color="#ffffff" />
            </SafeAreaView>
        );
    }

    if (errorMessage || !setup) {
        return (
            <SafeAreaView style={globalStyles.container}>
                <View style={styles.content}>
                    <Text style={globalStyles.errorText}>{errorMessage || "Setup not found"}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={globalStyles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={globalStyles.title}>Setup {setup.version}</Text>

                <View style={styles.actionRow}>
                    <Pressable style={globalStyles.smallButton}>
                        <Text style={globalStyles.smallButtonText}>Edit setup</Text>
                    </Pressable>
                    <Pressable
                        style={globalStyles.buttonDangerSmall}
                        onPress={() => setShowDeleteModal(true)}
                    >
                        <Text style={globalStyles.smallButtonText}>Delete Setup</Text>
                    </Pressable>
                </View>

                <View style={globalStyles.card}>
                    <Text style={globalStyles.sectionTitle}>Springs</Text>
                    <Text style={globalStyles.cardText}>Front: {setup.springNm?.front || '-'}</Text>
                    <Text style={globalStyles.cardText}>Rear: {setup.springNm?.rear || '-'}</Text>
                </View>

                <View style={globalStyles.card}>
                    <Text style={globalStyles.sectionTitle}>ARB</Text>
                    <Text style={globalStyles.cardText}>Front: {setup.arbPos?.front || '-'}</Text>
                    <Text style={globalStyles.cardText}>Rear: {setup.arbPos?.rear || '-'}</Text>
                </View>

                <View style={globalStyles.card}>
                    <Text style={globalStyles.sectionTitle}>Ride Height</Text>
                    <Text style={globalStyles.cardText}>Front: {setup.rideHeight?.front || '-'}</Text>
                    <Text style={globalStyles.cardText}>Rear: {setup.rideHeight?.rear || '-'}</Text>
                </View>

                <View style={globalStyles.card}>
                    <Text style={globalStyles.sectionTitle}>Alignment</Text>
                    <Text style={globalStyles.cardText}>Camber F/R: {setup.camber?.front || '-'} / {setup.camber?.rear || '-'}</Text>
                    <Text style={globalStyles.cardText}>Toe F/R: {setup.toe?.front || '-'} / {setup.toe?.rear || '-'}</Text>
                </View>

                <View style={globalStyles.card}>
                    <Text style={globalStyles.sectionTitle}>Other</Text>
                    <Text style={globalStyles.cardText}>Packers F/R: {setup.packers?.front || '-'} / {setup.packers?.rear || '-'}</Text>
                    <Text style={globalStyles.cardText}>Diff Preload: {setup.diffPreload || '-'}</Text>
                    <Text style={globalStyles.cardText}>Brake Bias: {setup.brakeBias || '-'}</Text>
                    <Text style={globalStyles.cardText}>Wing Hole: {setup.wingHole || '-'}</Text>
                    <Text style={globalStyles.cardText}>Splitter: {setup.splitter || '-'}</Text>
                    <Text style={globalStyles.cardText}>Notes: {setup.notes || '-'}</Text>
                </View>

                <Modal
                    visible={showDeleteModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowDeleteModal(false)}
                >
                    <View style={globalStyles.modalOverlay}>
                        <View style={globalStyles.modalCard}>
                            <Text style={globalStyles.modalTitle}>Delete setup?</Text>
                            <Text style={globalStyles.text}>Are you sure you want to delete setup {setup.version}?</Text>

                            <View style={styles.actionRow}>
                                <Pressable
                                    style={globalStyles.buttonPrimary}
                                    onPress={() => setShowDeleteModal(false)}
                                    disabled={isLoading}
                                >
                                    <Text style={globalStyles.buttonPrimaryText}>Cancel</Text>
                                </Pressable>
                                <Pressable
                                    style={[globalStyles.buttonDanger, isLoading && globalStyles.buttonDisabled]}
                                    onPress={handleDeleteSetup}
                                    disabled={isLoading}
                                >
                                    <Text style={globalStyles.buttonPrimaryText}>Yes, Delete</Text>
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
        gap: 16
    },
    actionRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 14,
    }
});