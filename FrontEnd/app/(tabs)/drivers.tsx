import {useEffect, useState} from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import { globalStyles } from '../../constants/styles';
import {apiFetch} from "../../assets/api";
import {useAuth} from "../../context/AuthContext";

type Driver = {
    _id: string;
    name: string;
    experience: string;
    email: string;
    phoneNumber: string;
    notes: string;
    isActive: boolean;
};


export default function DriversPage() {

    const {token} = useAuth();

    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [name, setName] = useState("")
    const [experience, setExperience] = useState("")
    const [email, setEmail] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [notes, setNotes] = useState("")

    async function fetchDrivers() {
        try {
            setIsLoading(true);
            setErrorMessage("")

            const data = await apiFetch("/drivers", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setDrivers(data.drivers || []);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to load drivers");
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if(token) fetchDrivers();
    }, [token]);

    function openCreateModal() {
        setEditingDriver(null);
        setName("");
        setExperience("");
        setEmail("");
        setPhoneNumber("");
        setNotes("");
        setShowModal(true);
    }

    function openEditModal(driver: Driver) {
        setEditingDriver(driver);
        setName(driver.name || "");
        setExperience(driver.experience || "");
        setEmail(driver.email || "");
        setPhoneNumber(driver.phoneNumber || "");
        setNotes(driver.notes || "");
        setShowModal(true);
    }

    async function handleSaveDriver() {
        try {
            setIsLoading(true);
            setErrorMessage("");

            const payload = {
                name, 
                experience,
                email, 
                phoneNumber,
                notes,
            };

            if (editingDriver) {
                await apiFetch(`/drivers/${editingDriver._id}`, {
                    method: "PATCH",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                });
            } else {
                await apiFetch("/drivers", {
                    method: "POST",
                    headers:{
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                });
            }

            setShowModal(false);
            setEditingDriver(null);
            setName("");
            setExperience("");
            setEmail("");
            setPhoneNumber("");
            setNotes("");

            await fetchDrivers();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to save driver");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleDeleteDriver(driver: Driver) {
        try {
            setIsLoading(true);
            setErrorMessage("")

            await apiFetch(`/drivers/${driver._id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            await fetchDrivers();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to delete driver");
        } finally {
            setIsLoading(false);
        }
    }


    return (
        <SafeAreaView style={globalStyles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.headerRow}>
                    <Text style={globalStyles.title}>Driver</Text>

                    <Pressable style={globalStyles.buttonPrimary} onPress={openCreateModal}>
                        <Text style={globalStyles.buttonPrimaryText}>Add Driver</Text>
                    </Pressable>
                </View>
                {errorMessage ? <Text style={globalStyles.errorText}>{errorMessage}</Text>: null}

                {isLoading ? (
                    <ActivityIndicator color="#ffffff"/>
                ) : drivers.length === 0 ? (
                    <Text style={globalStyles.text}>No drivers yet</Text>
                ) : (
                    drivers.map((driver) => (
                        <View key={driver._id} style={globalStyles.card}>
                            <Text style={globalStyles.cardTitle}>{driver.name}</Text>
                            <Text style={globalStyles.cardText}>Experience: {driver.experience || '-'}</Text>
                            <Text style={globalStyles.cardText}>Email: {driver.email}</Text> 
                            <Text style={globalStyles.cardText}>Phone: {driver.phoneNumber}</Text> 
                            <Text style={globalStyles.cardText}>Notes: {driver.notes || '-'}</Text>

                            <View style={styles.actionRow}>
                                <Pressable style={globalStyles.smallButton} onPress={() => openEditModal(driver)}>
                                    <Text style={globalStyles.smallButtonText}>Edit</Text>
                                </Pressable>

                                <Pressable style={globalStyles.buttonDanger} onPress={() => handleDeleteDriver(driver)}>
                                    <Text style={globalStyles.smallButtonText}>Delete</Text>
                                </Pressable>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            <Modal visible={showModal} transparent animationType="fade">
                <View style={globalStyles.modalOverlay}>
                    <View style={globalStyles.modalCard}>
                        <Text style={globalStyles.modalTitle}>
                            {editingDriver ? 'Edit Driver' : 'Create Driver'}
                        </Text>

                        <TextInput
                            style={globalStyles.input}
                            placeholder="Name"
                            placeholderTextColor="#9ca3af"
                            value={name}
                            onChangeText={setName}
                        />

                        <TextInput
                            style={globalStyles.input}
                            placeholder="Experience"
                            placeholderTextColor="#9ca3af"
                            value={experience}
                            onChangeText={setExperience}
                        />

                        <TextInput
                            style={globalStyles.input}
                            placeholder="Email"
                            placeholderTextColor="#9ca3af"
                            value={email}
                            onChangeText={setEmail}
                        />

                         <TextInput
                            style={globalStyles.input}
                            placeholder="Phone"
                            placeholderTextColor="#9ca3af"
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                        /> 

                        <TextInput
                            style={globalStyles.input}
                            placeholder="Notes"
                            placeholderTextColor="#9ca3af"
                            value={notes}
                            onChangeText={setNotes}
                        />

                        <View style={styles.modalActions}>
                            <Pressable style={globalStyles.buttonDanger} onPress={() => setShowModal(false)}>
                                <Text style={globalStyles.buttonPrimaryText}>Cancel</Text>
                            </Pressable>

                            <Pressable style={globalStyles.buttonPrimary} onPress={handleSaveDriver}>
                                <Text style={globalStyles.buttonPrimaryText}>
                                    {editingDriver ? 'Save Changes' : 'Create'}
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
    content: {
        padding: 24,
        gap: 16,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },

});

