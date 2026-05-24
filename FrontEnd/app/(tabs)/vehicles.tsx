import {useEffect, useState} from "react";
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
import { apiFetch } from "../../assets/api";
import {useAuth} from "../../context/AuthContext";

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
    const {token} = useAuth();
    // Check there is a front end message for when token has expired...

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    // Add editing vehicle state to switch between create & edit modals
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

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

            if (editingVehicle) {
                await apiFetch(`/vehicles/${editingVehicle._id}`, {
                    method: "PATCH",
                    headers: {Authorization: `Bearer ${token}`},
                    body: JSON.stringify(payload),
                });
            } else {
                await apiFetch("/vehicles", {
                    method: "POST",
                    headers: {Authorization: `Bearer ${token}`},
                    body: JSON.stringify(payload),
                });
            }

            setEditingVehicle(null);
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
            setErrorMessage(error instanceof Error ? error.message: "Failed to create vehicle. Please try again");
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.headerRow}>
                    <Text style={styles.title}>Vehicles</Text>

                    <Pressable style={styles.button} 
                        onPress={() => {
                            setEditingVehicle(null);
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
                        <Text style={styles.buttonText}>Add Vehicle</Text>
                    </Pressable>
                </View>

                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

                {isLoading ? (
                    <ActivityIndicator color="#ffffff"/>
                ) : vehicles.length === 0 ? (
                    <Text style={styles.text}>No Vehicles Yet</Text>
                ) : (
                    vehicles.map((vehicle) => (
                        <View key={vehicle._id} style={styles.card}>
                            <Text style={styles.cardTitle}>
                                {vehicle.racingNumber ? `#${vehicle.racingNumber} ` : ""}
                                {vehicle.name || `${vehicle.make || ""} ${vehicle.model || ""}`}
                            </Text>

                            <Text style={styles.cardText}>Make: {vehicle.make || "-"}</Text>
                            <Text style={styles.cardText}>Model: {vehicle.model || "-"}</Text>
                            <Text style={styles.cardText}>Year: {vehicle.year || "-"}</Text>
                            <Text style={styles.cardText}>Owner: {vehicle.owner || "-"}</Text>
                            <Text style={styles.cardText}>Odo: {vehicle.odo || "-"}</Text>
                            <Text style={styles.cardText}>Chassis: {vehicle.chassisNumber || "-"}</Text>
                            <Text style={styles.cardText}>Notes: {vehicle.notes || "-"}</Text>

                            <View style={styles.actionRow}>
                                <Pressable style={styles.smallButton}
                                    onPress={() => {
                                        setEditingVehicle(vehicle);
                                        setName(vehicle.name || "");
                                        setMake(vehicle.make || "");
                                        setModel(vehicle.model || "");
                                        setYear(vehicle.year ? String(vehicle.year) : ""); // Not sure if these are right...
                                        setOwner(vehicle.owner || "");
                                        setOdo(vehicle.odo ? String(vehicle.odo) : "");
                                        setRacingNumber(vehicle.racingNumber || "");
                                        setChassisNumber(vehicle.chassisNumber || "");
                                        setNotes(vehicle.notes || "");
                                        setShowCreateModal(true);
                                    }}
                                    >
                                    <Text style={styles.smallButtonText}>Edit</Text>
                                </Pressable>
                                <Pressable style={styles.deleteButton}>
                                    <Text style={styles.smallButtonText}>Delete</Text>
                                </Pressable>
                            </View>

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
                        </View>
                    ))
                )}
            </ScrollView>

            <Modal visible={showCreateModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>
                            {editingVehicle ? "Edit Vehicle" : "Create Vehicle"}
                        </Text>

                        <TextInput style={styles.input} placeholder="Name" placeholderTextColor="9ca3af" value={name} onChangeText={setName}/>
                        <TextInput style={styles.input} placeholder="Make" placeholderTextColor="9ca3af" value={make} onChangeText={setMake}/>
                        <TextInput style={styles.input} placeholder="Model" placeholderTextColor="9ca3af" value={model} onChangeText={setModel}/>
                        <TextInput style={styles.input} placeholder="Year" placeholderTextColor="9ca3af" value={year} onChangeText={setYear}/>
                        <TextInput style={styles.input} placeholder="Owner" placeholderTextColor="9ca3af" value={owner} onChangeText={setOwner}/>
                        <TextInput style={styles.input} placeholder="ODO" placeholderTextColor="9ca3af" value={odo} onChangeText={setOdo}/>
                        <TextInput style={styles.input} placeholder="Race Number" placeholderTextColor="9ca3af" value={racingNumber} onChangeText={setRacingNumber}/>
                        <TextInput style={styles.input} placeholder="Chassis Number" placeholderTextColor="9ca3af" value={chassisNumber} onChangeText={setChassisNumber}/>
                        <TextInput style={styles.input} placeholder="Notes" placeholderTextColor="9ca3af" value={notes} onChangeText={setNotes}/>

                        <View style={styles.modalActions}>
                            <Pressable style={styles.cancelButton} onPress={() => setShowCreateModal(false)}>
                                <Text style={styles.buttonText}>Cancel</Text>
                            </Pressable>

                            <Pressable style={styles.button} onPress={handleSaveVehicle}>
                                <Text style={styles.buttonText}>
                                    {editingVehicle ? "Save Changes" : "Create Vehicle"}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111827",
    },
    content: {
        padding: 24,
        gap: 16,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    title: {
        color: "#ffffff",
        fontSize: 30,
        fontWeight: "700",
    },
    text: {
        color: "#d1d5db",
    },
    errorText: {
        color: "#f87171",
    },
    card: {
        backgroundColor: "#1f2937",
        borderRadius: 14,
        padding: 10,
        borderWidth: 1,
        borderColor: "#374151",
    },
    cardTitle: {
        color: "#ffffff",
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 10
    },
    cardText: {
        color: "#d1d5db",
        marginBottom: 4,
    },
    button: {
        backgroundColor: "#2563eb",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
    },
    buttonText: {color: "#ffffff", 
        fontWeight: "700",
    },
    actionRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 14,
    },
    smallButton: {
        backgroundColor: "#374151",
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 8,
    },
    deleteButton: {
        backgroundColor: "#dc2626",
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 8,
    },
    smallButtonText: {
        color: "#ffffff",
        fontWeight: "700",
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
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.55",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalCard: {
        width: "100%",
        maxWidth: 520,
        backgroundColor: "#1f2937",
        borderRadius: 16, 
        padding: 20, 
        gap: 12,
    },
    modalTitle: {
        color: "#ffffff",
        fontSize: 24,
        fontWeight: "700",
    },
    input: {
        backgroundColor: "#111827",
        color: "#ffffff",
        borderWidth: 1,
        borderColor: "#374151",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    modalActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 12,
        marginTop: 8,
    },
    cancelButton: {
        backgroundColor: "#374151",
        paddingVertical: 12, 
        paddingHorizontal: 16,
        borderRadius: 10,
    },
});