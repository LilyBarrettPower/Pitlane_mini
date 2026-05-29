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
import {apiFetch} from "../../assets/api";
import {useAuth} from "../../context/AuthContext";

type Driver = {
    _id: string;
    name: string;
    experience: string;
    // email: string;
    // phone: string;
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
    // const [email, setEmail] = useState("")
    // const [phone, setPhone] = useState("")
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
        // setEmail("");
        // setPhone("");
        setNotes("");
        setShowModal(true);
    }

    function openEditModal(driver: Driver) {
        setEditingDriver(driver);
        setName(driver.name || "");
        setExperience(driver.experience || "");
        // setEmail(driver.email || "");
        // setPhone(driver.phone || "");
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
                // email, 
                // phone,
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
            // setEmail("");
            // setPhone("");
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
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.headerRow}>
                    <Text style={styles.title}>Driver</Text>

                    <Pressable style={styles.button} onPress={openCreateModal}>
                        <Text style={styles.buttonText}>Add Driver</Text>
                    </Pressable>
                </View>
                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text>: null}

                {isLoading ? (
                    <ActivityIndicator color="#ffffff"/>
                ) : drivers.length === 0 ? (
                    <Text style={styles.text}>No drivers yet</Text>
                ) : (
                    drivers.map((driver) => (
                        <View key={driver._id} style={styles.card}>
                            <Text style={styles.cardTitle}>{driver.name}</Text>
                            <Text style={styles.cardText}>Experience: {driver.experience || '-'}</Text>
                            {/* <Text style={styles.cardText}>Email: {driver.email}</Text> */}
                            {/* <Text style={styles.cardText}>Phone: {driver.phone}</Text> */}
                            <Text style={styles.cardText}>Notes: {driver.notes || '-'}</Text>

                            <View style={styles.actionRow}>
                                <Pressable style={styles.smallButton} onPress={() => openEditModal(driver)}>
                                    <Text style={styles.smallButtonText}>Edit</Text>
                                </Pressable>

                                <Pressable style={styles.deleteButton} onPress={() => handleDeleteDriver(driver)}>
                                    <Text style={styles.smallButtonText}>Delete</Text>
                                </Pressable>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            <Modal visible={showModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>
                            {editingDriver ? 'Edit Driver' : 'Create Driver'}
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Name"
                            placeholderTextColor="#9ca3af"
                            value={name}
                            onChangeText={setName}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Experience"
                            placeholderTextColor="#9ca3af"
                            value={experience}
                            onChangeText={setExperience}
                        />

                        {/* <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#9ca3af"
                            value={email}
                            onChangeText={setEmail}
                        />

                         <TextInput
                            style={styles.input}
                            placeholder="Phone"
                            placeholderTextColor="#9ca3af"
                            value={phone}
                            onChangeText={setPhone}
                        /> */}

                        <TextInput
                            style={styles.input}
                            placeholder="Notes"
                            placeholderTextColor="#9ca3af"
                            value={notes}
                            onChangeText={setNotes}
                        />

                        <View style={styles.modalActions}>
                            <Pressable style={styles.cancelButton} onPress={() => setShowModal(false)}>
                                <Text style={styles.buttonText}>Cancel</Text>
                            </Pressable>

                            <Pressable style={styles.button} onPress={handleSaveDriver}>
                                <Text style={styles.buttonText}>
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
      title: { color: '#ffffff', fontSize: 30, fontWeight: '700' },
  text: { color: '#d1d5db' },
  errorText: { color: '#f87171' },
  card: {
    backgroundColor: '#1f2937',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  cardText: { color: '#d1d5db', marginBottom: 4 },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  buttonText: { color: '#ffffff', fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  smallButton: {
    backgroundColor: '#374151',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  smallButtonText: { color: '#ffffff', fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  modalTitle: { color: '#ffffff', fontSize: 24, fontWeight: '700' },
  input: {
    backgroundColor: '#111827',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    backgroundColor: '#374151',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
});

