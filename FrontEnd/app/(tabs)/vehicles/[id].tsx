import { useLocalSearchParams } from 'expo-router';
import {useEffect, useState } from 'react';
import { Text, View, StyleSheet, ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import {apiFetch} from '../../../assets/api';
import { useAuth } from '../../..//context/AuthContext';

type Vehicle = {
    _id: string;
    name: string;
    racingNumber?: string;
    make?: string;
    model?: string;
    year?: number;
    owner?: string;
    odo?: number;
    chassisNumber?: string;
    notes?: string;
    ownerHistory?: {
    owner: string;
    changedAt: string;
    }[];
};

type Driver = {
  _id: string;
  name: string;
  experience?: string;
  // email?: string;
  // phone?: string; 
  notes?: string;
};

type VehicleDriver = {
  _id: string;
  vehicleId: string;
  driverId: Driver;
};


export default function VehicleDetailPage() {
  const { id } = useLocalSearchParams< { id: string}>();
  const {token} = useAuth();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicleDrivers, setVehicleDrivers] = useState<VehicleDriver[]>([]);
  const [showAssignedDriverModal, setShowAssignedDriverModal] = useState(false);


  async function fetchVehicle() {
    try {
        setIsLoading(true);
        setErrorMessage("");

        const data = await apiFetch(`/vehicles/${id}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        setVehicle(data.vehicle);
    } catch (error) {
        setErrorMessage(
            error instanceof Error ? error.message : "Failed to load vehicle"
        );
    } finally {
        setIsLoading(false);
    }
  }

  useEffect(() => {
    if (id && token) {
        fetchVehicle();
    }
  }, [id, token]);

  async function fetchVehicleDrivers() {
  const data = await apiFetch(`/vehicle-drivers/vehicle/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  setVehicleDrivers(data.assignments || []);
}

useEffect(() => {
  if (id && token) {
    fetchVehicle();
    fetchVehicleDrivers();
  }
}, [id, token]);

  if (isLoading) {
    return (
     <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#ffffff"/>
     </SafeAreaView>   
    );
  }

  if (errorMessage) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.errorText}>{errorMessage}</Text>
            </View> 
        </SafeAreaView>
    );
  }

  if (!vehicle) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.text}>No vehicle found</Text>
            </View>
        </SafeAreaView>
    )
  }
  

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
            {vehicle.racingNumber ? `#${vehicle.racingNumber} ` : ""}
            {vehicle.name}
        </Text>
        <View style={styles.card}>
            <Text style={[styles.row, styles.text]}>Make: {vehicle.make || "-"}</Text>
            <Text style={[styles.row, styles.text]}>Model: {vehicle.model || ""}</Text>
          <Text style={[styles.row, styles.text]}>Year: {vehicle.year || ""}</Text>
          <Text style={[styles.row, styles.text]}>Owner: {vehicle.owner || ""}</Text>
          <Text style={[styles.row, styles.text]}>Odo: {vehicle.odo || ""}</Text>
          <Text style={[styles.row, styles.text]}>Chassis Number: {vehicle.chassisNumber || ""}</Text>
          <Text style={[styles.row, styles.text]}>Notes: {vehicle.notes || ""}</Text>

          <Text style={styles.sectionTitle}>Ownership History</Text>

          {vehicle.ownerHistory && vehicle.ownerHistory.length > 0 ? (
            vehicle.ownerHistory.map((entry, index) => (
              <View key={index} style={styles.historyRow}>
                <Text style={[styles.row, styles.text]}>
                  {entry.owner}
                </Text>
                <Text style={styles.subText}>
                  {new Date(entry.changedAt).toLocaleDateString()}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.text}>No previous owners</Text>
          )}
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Drivers</Text>
          {vehicleDrivers.length === 0 ? (
            <Text style={styles.text}>No assigned drivers</Text>
          ) : (
            vehicleDrivers.map((item) => (
              <View key={item._id} style={styles.driverRow}>
                <Text style={[styles.row, styles.text]}>{item.driverId?.name}</Text>
                <Text style={styles.subText}>{item.driverId?.experience}</Text>
                {/* Add more driver details here? */}
                </View>
            ))
          )}

          <Pressable style={styles.button} onPress={() => setShowAssignedDriverModal(true)}>
            <Text style={styles.buttonText}>Assign Driver</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  content: { padding: 24 },
  title: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 18 },
  text: { color: '#ffffff', marginTop: 12, fontSize: 16 },
  card: {
    backgroundColor: "#1f2937",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#374151",
    marginBottom: 10,
  },
  row: {
    color: "#d1d15db",
    fontSize: 16,
    marginBottom: 8,
  },
  errorText: {
    color: "#f87171",
    fontSize: 16,
  },
  sectionTitle: {
  color: '#ffffff',
  fontSize: 18,
  fontWeight: '700',
  marginTop: 15,
},
historyRow: {
  marginBottom: 2,
  paddingBottom: 2,
  borderBottomWidth: 1,
  borderBottomColor: '#374151',
},
subText: {
  color: '#ffffff',
  fontSize: 13,
},
button: {
  backgroundColor: "#2563eb",
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderRadius: 10,
  alignSelf: "flex-start",
  marginTop: 12,
},
buttonText: {
  color: "#ffffff",
  fontWeight: "700",
},
driverRow: {
  marginBottom: 10,
  paddingBottom: 8,
  borderBottomWidth:1,
  borderBottomColor: "#374151",
},

});