import {useEffect, useState} from "react";
import {router} from "expo-router";
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
import { globalStyles } from '../../constants/styles';
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
    const {user, token} = useAuth();
    // Check there is a front end message for when token has expired...

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    // Add editing vehicle state to switch between create & edit modals
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    // Add delete vehicle state 
    const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
    // Need to know if logged in user is an admin to initialise delete vehicle
    const isAdmin = user?.role == "admin";

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

    async function handleDeleteVehicle() {
        if (!vehicleToDelete) return;

        try {
            setIsLoading(true);
            setErrorMessage("");

            await apiFetch(`/vehicles/${vehicleToDelete._id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setVehicleToDelete(null);
            await fetchVehicles();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to delete vehicle");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <SafeAreaView style={globalStyles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.headerRow}>
                    <Text style={globalStyles.title}>Vehicles</Text>

                    <Pressable style={globalStyles.buttonPrimary} 
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
                        <Text style={globalStyles.buttonPrimaryText}>Add Vehicle</Text>
                    </Pressable>
                </View>

                {errorMessage ? <Text style={globalStyles.errorText}>{errorMessage}</Text> : null}

                {isLoading ? (
                    <ActivityIndicator color="#ffffff"/>
                ) : vehicles.length === 0 ? (
                    <Text style={globalStyles.text}>No Vehicles Yet</Text>
                ) : (
                    vehicles.map((vehicle) => (
                        <Pressable 
                            key={vehicle._id} 
                            style={globalStyles.card}
                              onPress={() =>
                                router.push({
                                pathname: '/vehicles/[id]',
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

                            <View style={styles.actionRow}>
                                <Pressable style={globalStyles.smallButton}
                                    onPress={(e) => {
                                        e.stopPropagation?.();
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
                                    <Text style={globalStyles.smallButtonText}>Edit</Text>
                                </Pressable>
                                {isAdmin ? (
                                <Pressable style={globalStyles.buttonDanger}
                                    onPress={(e) => {
                                        e.stopPropagation?.();
                                        setVehicleToDelete(vehicle);
                                    }}
                                    >
                                    <Text style={globalStyles.smallButtonText}>Delete</Text>
                                </Pressable>
                                ): null}

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
                        </Pressable>
                    ))
                )}
            </ScrollView>

            <Modal visible={showCreateModal} transparent animationType="fade">
                <View style={globalStyles.modalOverlay}>
                    <View style={globalStyles.modalCard}>
                        <Text style={globalStyles.modalTitle}>
                            {editingVehicle ? "Edit Vehicle" : "Create Vehicle"}
                        </Text>

                        <TextInput style={globalStyles.input} placeholder="Name" placeholderTextColor="9ca3af" value={name} onChangeText={setName}/>
                        <TextInput style={globalStyles.input} placeholder="Make" placeholderTextColor="9ca3af" value={make} onChangeText={setMake}/>
                        <TextInput style={globalStyles.input} placeholder="Model" placeholderTextColor="9ca3af" value={model} onChangeText={setModel}/>
                        <TextInput style={globalStyles.input} placeholder="Year" placeholderTextColor="9ca3af" value={year} onChangeText={setYear}/>
                        <TextInput style={globalStyles.input} placeholder="Owner" placeholderTextColor="9ca3af" value={owner} onChangeText={setOwner}/>
                        <TextInput style={globalStyles.input} placeholder="ODO" placeholderTextColor="9ca3af" value={odo} onChangeText={setOdo}/>
                        <TextInput style={globalStyles.input} placeholder="Race Number" placeholderTextColor="9ca3af" value={racingNumber} onChangeText={setRacingNumber}/>
                        <TextInput style={globalStyles.input} placeholder="Chassis Number" placeholderTextColor="9ca3af" value={chassisNumber} onChangeText={setChassisNumber}/>
                        <TextInput style={globalStyles.input} placeholder="Notes" placeholderTextColor="9ca3af" value={notes} onChangeText={setNotes}/>

                        <View style={styles.modalActions}>
                            <Pressable style={globalStyles.buttonDanger} onPress={() => setShowCreateModal(false)}>
                                <Text style={globalStyles.buttonPrimaryText}>Cancel</Text>
                            </Pressable>

                            <Pressable style={globalStyles.buttonPrimary} onPress={handleSaveVehicle}>
                                <Text style={globalStyles.buttonPrimaryText}>
                                    {editingVehicle ? "Save Changes" : "Create Vehicle"}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
            {/* Delete Vehicle Warning Modal */}
            
            <Modal  
                visible={!!vehicleToDelete}
                transparent
                animationType = "fade"
                onRequestClose={() => setVehicleToDelete(null)}
            >
                <View style={globalStyles.modalOverlay}>
                    <View style={globalStyles.modalCard}>
                        <Text style={globalStyles.modalTitle}>Delete Vehicle?</Text>
                        <Text style={globalStyles.text}>
                            Are you use you want to delete{" "}
                            {vehicleToDelete?.name || vehicleToDelete?.racingNumber || "this vehicle"}?
                        </Text>
                        <View style={styles.modalActions}>
                            <Pressable 
                                style={globalStyles.buttonPrimary}
                                onPress={() => setVehicleToDelete(null)}
                                disabled={isLoading}
                            >
                                <Text style={globalStyles.buttonPrimaryText}>Cancel</Text>
                            </Pressable>
                            <Pressable 
                                style={[globalStyles.buttonDanger, isLoading && globalStyles.buttonDisabled]}
                                onPress={handleDeleteVehicle}
                                disabled={isLoading}
                            >
                                <Text style={globalStyles.smallButtonText}>Yes, Delete</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
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