import { useLocalSearchParams } from 'expo-router';
import {useEffect, useState } from 'react';
import { Text, View, StyleSheet, ActivityIndicator, Pressable, ScrollView, Modal } from 'react-native';
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
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [assignErrorMessage, setAssignErrorMessage] = useState("");
  const [isAssigningDriver, setIsAssigningDriver] = useState(false);


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

async function fetchDrivers() {
  try {
    const data = await apiFetch("/drivers", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setDrivers(data.drivers || []); 
  } catch (error) {
    setAssignErrorMessage(
      error instanceof Error ? error.message : "Failed to load drivers"
    );
  }
}



useEffect(() => {
  if (id && token) {
    fetchVehicle();
    fetchVehicleDrivers();
    fetchDrivers();
  }
}, [id, token]);

async function handleAssignDriver() {
  if (!selectedDriverId) {
    setAssignErrorMessage("Please select a driver");
    return;
  }

  try {
    setIsAssigningDriver(true);
    setAssignErrorMessage("");

    await apiFetch("/vehicle-drivers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        vehicleId: id,
        driverId: selectedDriverId,
      }),
    });

    setSelectedDriverId("");
    setShowAssignedDriverModal(false);
    await fetchVehicleDrivers();
  } catch (error) {
    setAssignErrorMessage(
      error instanceof Error ? error.message : "Failed to assign driver"
    );
  } finally {
    setIsAssigningDriver(false);
  }
}

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

        <Modal 
          visible={showAssignedDriverModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAssignedDriverModal(false)}
          >
            <View style={globalStyles.modalOverlay}>
              <View style={globalStyles.modalCard}>
                <Text style={globalStyles.title}>Assign Driver</Text>

                {assignErrorMessage ? (
                  <Text style={globalStyles.errorText}>{assignErrorMessage}</Text>
                ) : null}

                {drivers.length === 0 ? (
                  <Text style={globalStyles.text}>No drivers available. Create driver first</Text>
                ) : (
                  <View style={styles.driverSelectList}>
                    {drivers.map((driver) => {
                      const alreadyAssigned = vehicleDrivers.some(
                        (assignment) => assignment.driverId?._id === driver._id
                      );

                      return (
                        <Pressable 
                          key={driver._id}
                          disabled={alreadyAssigned}
                          style={[
                            styles.driverSelectItem,
                            selectedDriverId === driver._id && styles.driverSelectItemActive,
                            alreadyAssigned && styles.driverSelectItemDisabled,
                          ]}
                          onPress={() => setSelectedDriverId(driver._id)}
                          >
                            <Text style={globalStyles.text}>{driver.name}</Text>
                            <Text style={globalStyles.subText}>
                              {alreadyAssigned ? "Already assigned" : driver.experience || "-"}
                            </Text>
                          </Pressable>
                      );
                    })}
                    </View>
                )}

                <View style={styles.actionRow}>
                  <Pressable 
                    style={globalStyles.buttonDanger}
                    onPress={() => {
                      setSelectedDriverId("");
                      setAssignErrorMessage("");
                      setShowAssignedDriverModal(false);
                    }}
                    disabled={isAssigningDriver}
                    >
                      <Text style={globalStyles.buttonPrimaryText}>Cancel</Text>
                    </Pressable>

                    <Pressable 
                      style={[
                        globalStyles.buttonPrimary,
                        isAssigningDriver && globalStyles.buttonDisabled,
                      ]}
                      onPress={handleAssignDriver}
                      disabled={isAssigningDriver || drivers.length === 0}
                      >
                        {isAssigningDriver ? (
                          <ActivityIndicator color="#ffffff"/>
                        ) : (
                          <Text style={globalStyles.buttonPrimaryText}>Assign</Text>
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
  driverSelectList: {
    gap: 10,
    marginTop: 12,
  },
  driverSelectItem: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 10,
    padding: 12,
  },
  driverSelectItemActive: {
    borderColor: "#2563eb",
    backgroundColor: "#1d4ed8",
  },
  driverSelectItemDisabled: {
    opacity: 0.45,
  },
});