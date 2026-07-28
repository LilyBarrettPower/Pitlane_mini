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
import { globalStyles } from "../../constants/styles";
import { apiFetch } from "../../assets/api";
import { useAuth } from "../../context/AuthContext";

// What does this actually do? Create a template for the vehicle?
type Vehicle = {
    _id: string;
    name?: string;
    make?: string;
    model?: string;
    year?: string;
    owner?: string;
    odo?: string;
    racingNumber?: string;
    chassisNumber?: string;
    notes?: string;
};



export default function VehiclesPage() {

    //  Make sure there is a valid token to access this page 
    const { token } = useAuth();
    // Check there is a front end message for when token has expired...

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Create the use states for the vehicle so you are able to create it 
    const [name, setName] = useState("");
    const [make, setMake] = useState("");
    const [model, setModel] = useState("");
    const [year, setYear] = useState("");
    const [owner, setOwner] = useState(""); // Here it would be good to see previous owners saved too 
    const [odo, setOdo] = useState("");
    const [racingNumber, setRacingNumber] = useState("");
    const [chassisNumber, setChassisNumber] = useState("");
    const [notes, setNotes] = useState("");

    //  Get all vehicles associated with this organisation from the back end 
    async function fetchVehicles() {
        try {
            setIsLoading(true);
            setErrorMessage("");

            const data = await apiFetch("/vehicles", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setVehicles(data.vehicles || []);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to load vehicles. Please try again");
        } finally {
            setIsLoading(false);
        }
    }

    //  Make sure there is a valid token before fetching the vehicles 
    useEffect(() => {
        if (token) fetchVehicles();
    }, [token]);

    async function handleSaveVehicle() {
        try {
            setIsLoading(true);
            setErrorMessage("");

            const payload = {
                name,
                make,
                model,
                year: year ? Number(year) : undefined, // Convert to number on create
                owner,
                odo: odo ? Number(odo) : undefined, // convert to number on create
                racingNumber,
                chassisNumber,
                notes,
            }
            await apiFetch("/vehicles", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });

            setName("");
            setMake("");
            setModel("");
            setYear("");
            setOwner("");
            setOdo("");
            setRacingNumber("");
            setChassisNumber("");
            setNotes("");
            setShowCreateModal(false);

            // Re fetch vehicles after creation to update
            await fetchVehicles();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to create vehicle. Please try again");
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <SafeAreaView style={globalStyles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.headerRow}>
                    <Text style={globalStyles.title}>Vehicles</Text>

                    <Pressable style={globalStyles.buttonPrimary}
                        onPress={() => {
                            setName("");
                            setMake("");
                            setModel("");
                            setYear("");
                            setOwner("");
                            setOdo("");
                            setRacingNumber("");
                            setChassisNumber("");
                            setNotes("");
                            setShowCreateModal(true);
                        }}
                    >
                        <Text style={globalStyles.buttonPrimaryText}>Add Vehicle</Text>
                    </Pressable>
                </View>

                {errorMessage ? <Text style={globalStyles.errorText}>{errorMessage}</Text> : null}

                {isLoading ? (
                    <ActivityIndicator color="#ffffff" />
                ) : vehicles.length === 0 ? (
                    <Text style={globalStyles.text}>No Vehicles Yet</Text>
                ) : (
                    vehicles.map((vehicle) => (
                        <Pressable
                            key={vehicle._id}
                            style={globalStyles.card}
                            onPress={() =>
                                router.push({
                                    pathname: "/vehicles/[id]",
                                    params: { id: vehicle._id },
                                })
                            }
                        >
                            <Text style={globalStyles.cardTitle}>
                                {vehicle.racingNumber ? `#${vehicle.racingNumber} ` : ""}
                                {vehicle.name || `${vehicle.make || ""} ${vehicle.model || ""}`}
                            </Text>

                            <Text style={globalStyles.cardText}>Make: {vehicle.make || "-"}</Text>
                            <Text style={globalStyles.cardText}>Model: {vehicle.model || "-"}</Text>
                            <Text style={globalStyles.cardText}>Year: {vehicle.year || "-"}</Text>
                            <Text style={globalStyles.cardText}>Owner: {vehicle.owner || "-"}</Text>
                            <Text style={globalStyles.cardText}>Odo: {vehicle.odo || "-"}</Text>
                            <Text style={globalStyles.cardText}>Chassis: {vehicle.chassisNumber || "-"}</Text>
                            <Text style={globalStyles.cardText}>Notes: {vehicle.notes || "-"}</Text>

                            <View style={styles.linkGrid}>
                                {[
                                    "Events > Runs > Setups > Tyre Runs",
                                    "Drivers",
                                    "Setups",
                                    "Tyres",
                                    "Checklist Instances",
                                ].map((label) => (
                                    <Pressable key={label} style={styles.dummyButton}>
                                        <Text style={styles.dummyButtonText}>{label}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        </Pressable>
                    ))
                )}
            </ScrollView>

            <Modal visible={showCreateModal} transparent animationType="fade">
                <ScrollView>
                    <View style={globalStyles.modalOverlay}>

                        <View style={globalStyles.modalCard}>
                            <Text style={globalStyles.modalTitle}>
                                Create Vehicle
                            </Text>
                            <Text style={globalStyles.label}>Name</Text>
                            <TextInput style={globalStyles.input} placeholder="Name" placeholderTextColor="9ca3af" value={name} onChangeText={setName} />
                            <Text style={globalStyles.label}>Make</Text>
                            <TextInput style={globalStyles.input} placeholder="Make" placeholderTextColor="9ca3af" value={make} onChangeText={setMake} />
                            <Text style={globalStyles.label}>Model</Text>
                            <TextInput style={globalStyles.input} placeholder="Model" placeholderTextColor="9ca3af" value={model} onChangeText={setModel} />
                            <Text style={globalStyles.label}>Year</Text>
                            <TextInput style={globalStyles.input} placeholder="Year" placeholderTextColor="9ca3af" value={year} onChangeText={setYear} />
                            <Text style={globalStyles.label}>Owner</Text>
                            <TextInput style={globalStyles.input} placeholder="Owner" placeholderTextColor="9ca3af" value={owner} onChangeText={setOwner} />
                            <Text style={globalStyles.label}>Odometer</Text>
                            <TextInput style={globalStyles.input} placeholder="ODO" placeholderTextColor="9ca3af" value={odo} onChangeText={setOdo} />
                            <Text style={globalStyles.label}>Race Number</Text>
                            <TextInput style={globalStyles.input} placeholder="Race Number" placeholderTextColor="9ca3af" value={racingNumber} onChangeText={setRacingNumber} />
                            <Text style={globalStyles.label}>Chassis Number</Text>
                            <TextInput style={globalStyles.input} placeholder="Chassis Number" placeholderTextColor="9ca3af" value={chassisNumber} onChangeText={setChassisNumber} />
                            <Text style={globalStyles.label}>Notes</Text>
                            <TextInput style={globalStyles.input} placeholder="Notes" placeholderTextColor="9ca3af" value={notes} onChangeText={setNotes} />

                            <View style={styles.modalActions}>
                                <Pressable style={globalStyles.buttonDanger} onPress={() => setShowCreateModal(false)}>
                                    <Text style={globalStyles.buttonPrimaryText}>Cancel</Text>
                                </Pressable>

                                <Pressable style={globalStyles.buttonPrimary} onPress={handleSaveVehicle}>
                                    <Text style={globalStyles.buttonPrimaryText}>
                                        Create Vehicle
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
        gap: 10,
        marginTop: 14,
    },
    linkGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 14,
    },
    dummyButton: {
        backgroundColor: "#111827",
        borderColor: "#374151",
        borderWidth: 1,
        paddingVertical: 9,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    dummyButtonText: {
        color: "#d1d5db",
        fontWeight: "600",
    },
    modalActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 12,
        marginTop: 8,
    },
});