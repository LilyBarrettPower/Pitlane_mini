import { useLocalSearchParams } from 'expo-router';
import {useEffect, useState } from 'react';
import { Text, View, StyleSheet, ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import {apiFetch} from '../../../assets/api';
import { useAuth } from '../../../context/AuthContext';
import { globalStyles } from '../../../constants/styles';

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


  async function fetchVehicleDrivers() {
  const data = await apiFetch(`/vehicle-drivers/vehicle/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  setVehicleDrivers(data.assignments || []);
}

// Fetch all drivers 



useEffect(() => {
  if (id && token) {
    fetchVehicle();
    fetchVehicleDrivers();
  }
}, [id, token]);

  if (isLoading) {
    return (
     <SafeAreaView style={globalStyles.container}>
        <ActivityIndicator color="#ffffff"/>
     </SafeAreaView>   
    );
  }

  if (errorMessage) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={styles.content}>
          <Text style={globalStyles.errorText}>{errorMessage}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!vehicle) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <View style={styles.content}>
          <Text style={globalStyles.text}>No vehicle found</Text>
        </View>
      </SafeAreaView>
    )
  }


  return (
    <SafeAreaView style={globalStyles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={globalStyles.title}>
          {vehicle.racingNumber ? `#${vehicle.racingNumber} ` : ""}
          {vehicle.name}
        </Text>
        <View style={globalStyles.card}>
          <Text style={[styles.row, globalStyles.text]}>Make: {vehicle.make || "-"}</Text>
          <Text style={[styles.row, globalStyles.text]}>Model: {vehicle.model || ""}</Text>
          <Text style={[styles.row, globalStyles.text]}>Year: {vehicle.year || ""}</Text>
          <Text style={[styles.row, globalStyles.text]}>Owner: {vehicle.owner || ""}</Text>
          <Text style={[styles.row, globalStyles.text]}>Odo: {vehicle.odo || ""}</Text>
          <Text style={[styles.row, globalStyles.text]}>Chassis Number: {vehicle.chassisNumber || ""}</Text>
          <Text style={[styles.row, globalStyles.text]}>Notes: {vehicle.notes || ""}</Text>

          <Text style={globalStyles.subTitle}>Ownership History</Text>

          {vehicle.ownerHistory && vehicle.ownerHistory.length > 0 ? (
            vehicle.ownerHistory.map((entry, index) => (
              <View key={index} style={styles.historyRow}>
                <Text style={[styles.row, globalStyles.text]}>
                  {entry.owner}
                </Text>
                <Text style={globalStyles.subText}>
                  {new Date(entry.changedAt).toLocaleDateString()}
                </Text>
              </View>
            ))
          ) : (
            <Text style={globalStyles.text}>No previous owners</Text>
          )}
        </View>
        <View style={globalStyles.card}>
          <Text style={globalStyles.sectionTitle}>Drivers</Text>
          {vehicleDrivers.length === 0 ? (
            <Text style={globalStyles.text}>No assigned drivers</Text>
          ) : (
            vehicleDrivers.map((item) => (
              <View key={item._id} style={styles.driverRow}>
                <Text style={[styles.row, globalStyles.text]}>{item.driverId?.name}</Text>
                <Text style={globalStyles.subText}>{item.driverId?.experience}</Text>
                {/* Add more driver details here? */}
              </View>
            ))
          )}

          {/* Should be able to remove drivers from a vehicle here  */}
          <View style={styles.actionRow}>
            <Pressable style={[globalStyles.buttonPrimary, styles.buttonGap]} onPress={() => setShowAssignedDriverModal(true)}>
              <Text style={globalStyles.buttonPrimaryText}>Assign Driver</Text>
            </Pressable>
          </View>
          {/* Fetch drivers here to populate a drop down list  */}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    gap: 16,
  },
  row: {
    color: "#d1d15db",
    fontSize: 16,
    marginBottom: 8,
  },
  historyRow: {
    marginBottom: 2,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  driverRow: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  buttonGap: {
    marginTop: 20,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

});