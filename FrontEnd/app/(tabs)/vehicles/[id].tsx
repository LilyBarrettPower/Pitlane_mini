import { useLocalSearchParams } from 'expo-router';
import {useEffect, useState } from 'react';
import { Text, View, StyleSheet, ActivityIndicator, Pressable, ScrollView, Modal, TextInput } from 'react-native';
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
  email?: string;
  phoneNumber?: string; 
  notes?: string;
};

type VehicleDriver = {
  _id: string;
  vehicleId: string;
  driverId: Driver;
};


type SetUp = {
  _id: string;
  vehicleId: string;
  version: string;
  springNm?: { front?: number; rear?: number };
  arbPos?: { front?: number; rear?: number };
  rideHeight?: { front?: number; rear?: number };
  camber?: { front?: string; rear?: string };
  toe?: { front?: string; rear?: string };
  packers?: { front?: string; rear?: string };
  diffPreload?: number;
  brakeBias?: string;
  wingHole?: string;
  splitter?: string;
  notes?: string;
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

  const [setups, setSetups] = useState<SetUp[]>([]);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupVersion, setSetupVersion] = useState('');
  const [springFront, setSpringFront] = useState('');
  const [springRear, setSpringRear] = useState('');
  const [arbFront, setArbFront] = useState('');
  const [arbRear, setArbRear] = useState('');
  const [rideHeightFront, setRideHeightFront] = useState('');
  const [rideHeightRear, setRideHeightRear] = useState('');
  const [camberFront, setCamberFront] = useState('');
  const [camberRear, setCamberRear] = useState('');
  const [toeFront, setToeFront] = useState('');
  const [toeRear, setToeRear] = useState('');
  const [packersFront, setPackersFront] = useState('');
  const [packersRear, setPackersRear] = useState('');
  const [diffPreload, setDiffPreload] = useState('');
  const [brakeBias, setBrakeBias] = useState('');
  const [wingHole, setWingHole] = useState('');
  const [splitter, setSplitter] = useState('');
  const [setupNotes, setSetupNotes] = useState('');
  const [isSavingSetup, setIsSavingSetup] = useState(false);

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

async function fetchSetups() {
  const data = await apiFetch(`/setups?vehicleId=${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  setSetups(data.setups || []);
} 



useEffect(() => {
  if (id && token) {
    fetchVehicle();
    fetchVehicleDrivers();
    fetchDrivers();
    fetchSetups();
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

  async function handleRemoveDriverAssignment(assignmentId: string) {
    try {
      setIsLoading(true);
      setErrorMessage("");

      await apiFetch(`/vehicle-drivers/${assignmentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await fetchVehicleDrivers();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to remove driver"
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemoveSetup(setupId: string) {
    try {
      setIsLoading(true);
      setErrorMessage("");

      await apiFetch(`/setups/${setupId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await fetchSetups();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to remove setup"
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateSetup() {
    if (!setupVersion) {
      setErrorMessage("Setup version is required");
      return;
    }

    try {
      setIsSavingSetup(true);
      setErrorMessage("");

      await apiFetch("/setups", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehicleId: id,
          version: setupVersion,

          springNm: {
            front: springFront ? Number(springFront) : undefined,
            rear: springRear ? Number(springRear) : undefined,
          },

          arbPos: {
            front: arbFront ? Number(arbFront) : undefined,
            rear: arbRear ? Number(arbRear) : undefined,
          },

          rideHeight: {
            front: rideHeightFront ? Number(rideHeightFront) : undefined,
            rear: rideHeightRear ? Number(rideHeightRear) : undefined,
          },

          camber: {
            front: camberFront,
            rear: camberRear,
          },

          toe: {
            front: toeFront,
            rear: toeRear,
          },

          packers: {
            front: packersFront,
            rear: packersRear,
          },

          diffPreload: diffPreload ? Number(diffPreload) : undefined,
          brakeBias,
          wingHole,
          splitter,
          notes: setupNotes,
        }),
      });

      setSetupVersion('');
      setSpringFront('');
      setSpringRear('');
      setArbFront('');
      setArbRear('');
      setRideHeightFront('');
      setRideHeightRear('');
      setCamberFront('');
      setCamberRear('');
      setToeFront('');
      setToeRear('');
      setPackersFront('');
      setPackersRear('');
      setDiffPreload('');
      setBrakeBias('');
      setWingHole('');
      setSplitter('');
      setSetupNotes('');
      setShowSetupModal(false);

      await fetchSetups();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to create setup"
      );
    } finally {
      setIsSavingSetup(false);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={globalStyles.container}>
        <ActivityIndicator color="#ffffff" />
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
                <View>
                <Text style={[styles.row, globalStyles.text]}>{item.driverId?.name}</Text>
                <Text style={globalStyles.subText}>{item.driverId?.experience}</Text>
                <Text style={globalStyles.subText}>{item.driverId?.email}</Text>
                <Text style={globalStyles.subText}>{item.driverId?.phoneNumber}</Text>
              </View>

              <Pressable 
                style={globalStyles.buttonDanger}
                onPress={() => handleRemoveDriverAssignment(item._id)}
                >
                  <Text style={globalStyles.buttonPrimaryText}>Remove</Text>
                </Pressable>
              </View>
            ))
          )}

          <View style={styles.actionRow}>
            <Pressable style={[globalStyles.buttonPrimary, styles.buttonGap]} onPress={() => setShowAssignedDriverModal(true)}>
              <Text style={globalStyles.buttonPrimaryText}>Assign Driver</Text>
            </Pressable>
          </View>

        </View>
        <View style={globalStyles.card}>
          <Text style={globalStyles.sectionTitle}>Setups</Text>

          {setups.length === 0 ? (
            <Text style={globalStyles.text}>No setups assigned to this vehicle</Text>
          ) : (
            setups.map((setup) => (
              <View key={setup._id} style={styles.driverRow}>
                <View>
                  <Text style={[styles.row, globalStyles.text]}>
                    Version: {setup.version}
                  </Text>
                  <Text style={globalStyles.subText}>
                    Events used at: Coming later
                  </Text>
                </View>

                <Pressable 
                  style={globalStyles.buttonDanger}
                  onPress={() => handleRemoveSetup(setup._id)}
                  >
                    <Text style={globalStyles.buttonPrimaryText}>Remove</Text>
                  </Pressable>
                </View>
            ))
          )}

          <View style={styles.actionRow}>
            <Pressable 
              style={[globalStyles.buttonPrimary, styles.buttonGap]}
              onPress={() => setShowSetupModal(true)}
              >
                <Text style={globalStyles.buttonPrimaryText}>Create  Setup</Text>
              </Pressable>
          </View>
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
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={globalStyles.buttonPrimaryText}>Assign</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
        <Modal
          visible={showSetupModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSetupModal(false)}
        >
          <ScrollView>
            <View style={globalStyles.modalOverlay}>
              <View style={globalStyles.modalCard}>
                <Text style={globalStyles.modalTitle}>Create Setup</Text>
                <TextInput
                  style={globalStyles.input}
                  placeholder="Version"
                  placeholderTextColor="#9ca3af"
                  value={setupVersion}
                  onChangeText={setSetupVersion}
                />

                <TextInput
                  style={globalStyles.input}
                  placeholder="Spring Front nm"
                  placeholderTextColor="#9ca3af"
                  value={springFront}
                  onChangeText={setSpringFront}
                />
                <TextInput
                  style={globalStyles.input}
                  placeholder="Spring Rear nm"
                  placeholderTextColor="#9ca3af"
                  value={springRear}
                  onChangeText={setSpringRear}
                />

                <TextInput
                  style={globalStyles.input}
                  placeholder="ARB Front"
                  placeholderTextColor="#9ca3af"
                  value={arbFront}
                  onChangeText={setArbFront}
                />
                <TextInput
                  style={globalStyles.input}
                  placeholder="ARB Rear"
                  placeholderTextColor="#9ca3af"
                  value={arbRear}
                  onChangeText={setArbRear}
                />

                <TextInput
                  style={globalStyles.input}
                  placeholder="Ride Height Front"
                  placeholderTextColor="#9ca3af"
                  value={rideHeightFront}
                  onChangeText={setRideHeightFront}
                />
                <TextInput
                  style={globalStyles.input}
                  placeholder="Ride Height Rear"
                  placeholderTextColor="#9ca3af"
                  value={rideHeightRear}
                  onChangeText={setRideHeightRear}
                />

                <TextInput
                  style={globalStyles.input}
                  placeholder="Camber Front"
                  placeholderTextColor="#9ca3af"
                  value={camberFront}
                  onChangeText={setCamberFront}
                />
                <TextInput
                  style={globalStyles.input}
                  placeholder="Camber Rear"
                  placeholderTextColor="#9ca3af"
                  value={camberRear}
                  onChangeText={setCamberRear}
                />

                <TextInput
                  style={globalStyles.input}
                  placeholder="Toe Front"
                  placeholderTextColor="#9ca3af"
                  value={toeFront}
                  onChangeText={setToeFront}
                />
                <TextInput
                  style={globalStyles.input}
                  placeholder="Toe Rear"
                  placeholderTextColor="#9ca3af"
                  value={toeRear}
                  onChangeText={setToeRear}
                />

                <TextInput
                  style={globalStyles.input}
                  placeholder="Packers Front"
                  placeholderTextColor="#9ca3af"
                  value={packersFront}
                  onChangeText={setPackersFront}
                />
                <TextInput
                  style={globalStyles.input}
                  placeholder="Packers Rear"
                  placeholderTextColor="#9ca3af"
                  value={packersRear}
                  onChangeText={setPackersRear}
                />
                <TextInput
                  style={globalStyles.input}
                  placeholder="Diff Preload"
                  placeholderTextColor="#9ca3af"
                  value={diffPreload}
                  onChangeText={setDiffPreload}
                />

                <TextInput
                  style={globalStyles.input}
                  placeholder="Brake Bias"
                  placeholderTextColor="#9ca3af"
                  value={brakeBias}
                  onChangeText={setBrakeBias}
                />
                <TextInput
                  style={globalStyles.input}
                  placeholder="Wing Hole"
                  placeholderTextColor="#9ca3af"
                  value={wingHole}
                  onChangeText={setWingHole}
                />
                <TextInput
                  style={globalStyles.input}
                  placeholder="Splitter"
                  placeholderTextColor="#9ca3af"
                  value={splitter}
                  onChangeText={setSplitter}
                />
                <TextInput
                  style={globalStyles.input}
                  placeholder="Notes"
                  placeholderTextColor="#9ca3af"
                  value={setupNotes}
                  onChangeText={setSetupNotes}
                />

                <View style={styles.actionRow}>
                  <Pressable
                    style={globalStyles.buttonDanger}
                    onPress={() => {
                      setShowSetupModal(false);
                    }}
                  >
                    <Text style={globalStyles.buttonPrimaryText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[globalStyles.buttonPrimary, isSavingSetup && globalStyles.buttonDisabled]}
                    onPress={handleCreateSetup}
                    disabled={isSavingSetup}
                  >
                    {isSavingSetup ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={globalStyles.buttonPrimaryText}>Create Setup</Text>
                    )}
                  </Pressable>

                </View>
              </View>
            </View>
          </ScrollView>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
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