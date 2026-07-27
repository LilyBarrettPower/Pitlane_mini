import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { Text, View, StyleSheet, ActivityIndicator, Pressable, ScrollView, Modal, TextInput, SectionList } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from '../../../../assets/api';
import { useAuth } from '../../../../context/AuthContext';
import { globalStyles } from '../../../../constants/styles';
import SetupModal from '../../../../components/SetupModal';


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
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, token } = useAuth();

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
  // const [setupVersion, setSetupVersion] = useState('');
  // const [springFront, setSpringFront] = useState('');
  // const [springRear, setSpringRear] = useState('');
  // const [arbFront, setArbFront] = useState('');
  // const [arbRear, setArbRear] = useState('');
  // const [rideHeightFront, setRideHeightFront] = useState('');
  // const [rideHeightRear, setRideHeightRear] = useState('');
  // const [camberFront, setCamberFront] = useState('');
  // const [camberRear, setCamberRear] = useState('');
  // const [toeFront, setToeFront] = useState('');
  // const [toeRear, setToeRear] = useState('');
  // const [packersFront, setPackersFront] = useState('');
  // const [packersRear, setPackersRear] = useState('');
  // const [diffPreload, setDiffPreload] = useState('');
  // const [brakeBias, setBrakeBias] = useState('');
  // const [wingHole, setWingHole] = useState('');
  // const [splitter, setSplitter] = useState('');
  // const [setupNotes, setSetupNotes] = useState('');
  // const [isSavingSetup, setIsSavingSetup] = useState(false);

  const [editingSetup, setEditingSetup] = useState<SetUp | null>(null);

  const [showEditVehicleModal, setShowEditVehicleModal] = useState(false);
  const [showDeleteVehicleModal, setShowDeleteVehicleModal] = useState(false);
  const [isSavingVehicle, setIsSavingVehicle] = useState(false);
  const [isDeletingVehicle, setIsDeletingVehicle] = useState(false);

  const [name, setName] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [owner, setOwner] = useState(""); // Here it would be good to see previous owners saved too 
  const [odo, setOdo] = useState("");
  const [racingNumber, setRacingNumber] = useState("");
  const [chassisNumber, setChassisNumber] = useState("");
  const [notes, setNotes] = useState("");

  const isAdmin = user?.role === "admin";

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

  function populateVehicleForm(selectedVehicle: Vehicle) {
    setName(selectedVehicle.name || "");
    setMake(selectedVehicle.make || "");
    setModel(selectedVehicle.model || "");
    setYear(
      selectedVehicle.year !== undefined
        ? String(selectedVehicle.year)
        : ""
    );
    setOwner(selectedVehicle.owner || "");
    setOdo(
      selectedVehicle.odo !== undefined
        ? String(selectedVehicle.odo)
        : ""
    );
    setRacingNumber(selectedVehicle.racingNumber || "");
    setChassisNumber(selectedVehicle.chassisNumber || "");
    setNotes(selectedVehicle.notes || "");
  }

  function openEditVehicleModal() {
    if (!vehicle) return;

    populateVehicleForm(vehicle);
    setErrorMessage("");
    setShowEditVehicleModal(true);
  }

  function closeEditVehicleModal() {
    if (!isSavingVehicle) return;

    setShowEditVehicleModal(false);
    setErrorMessage("");

    if (vehicle) {
      populateVehicleForm(vehicle);
    }
  }

  async function handleUpdateVehicle() {
    if (!vehicle) return;

    if (!name.trim() && !make.trim() && !model.trim()) {
      setErrorMessage("Please enter a vehicle name, make and model");
      return;
    }

    try {
      setIsSavingVehicle(true);
      setErrorMessage("");

      await apiFetch(`/vehicles/${vehicle._id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          make: make.trim(),
          model: model.trim(),
          year: year.trim() ? Number(year) : undefined,
          owner: owner.trim(),
          odo: odo.trim() ? Number(odo) : undefined,
          racingNumber: racingNumber.trim(),
          chassisNumber: chassisNumber.trim(),
          notes: notes.trim(),
        }),
      });

      await fetchVehicle();
      setShowEditVehicleModal(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update vehicle"
      );
    } finally {
      setIsSavingVehicle(false);
    }
  }

  async function handleDeleteVehicle() {
    if (!vehicle) return;

    try {
      setIsDeletingVehicle(true);
      setErrorMessage("");

      await apiFetch(`/vehicles/${vehicle._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setShowDeleteVehicleModal(false);

      router.replace("/vehicles");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to delete vehicle"
      );
    } finally {
      setIsDeletingVehicle(false);
    }
  }

  // async function handleRemoveSetup(setupId: string) {
  //   try {
  //     setIsLoading(true);
  //     setErrorMessage("");

  //     await apiFetch(`/setups/${setupId}`, {
  //       method: "DELETE",
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });

  //     await fetchSetups();
  //   } catch (error) {
  //     setErrorMessage(
  //       error instanceof Error ? error.message : "Failed to remove setup"
  //     );
  //   } finally {
  //     setIsLoading(false);
  //   }
  // }


  function openCreateSetupModal() {
    setEditingSetup(null);
    setShowSetupModal(true);
  }

  // function openEditSetupModal(setup: SetUp) {
  //   setEditingSetup(setup);
  //   setShowSetupModal(true);
  // }

  useFocusEffect(
    useCallback(() => {
      if (id && token) {
        fetchSetups();
        fetchVehicleDrivers();
        fetchDrivers();
        fetchSetups();
      }
    }, [id, token])
  );

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
        <View style={styles.vehicleActionRow}>
          <Pressable
            style={globalStyles.smallButton}
            onPress={openEditVehicleModal}
          >
            <Text style={globalStyles.smallButtonText}>
              Edit Vehicle
            </Text>
          </Pressable>

          {isAdmin ? (
            <Pressable
              style={globalStyles.buttonDangerSmall}
              onPress={() => {
                setErrorMessage("");
                setShowDeleteVehicleModal(true);
              }}
            >
              <Text style={globalStyles.smallButtonText}>
                Delete Vehicle
              </Text>
            </Pressable>
          ) : null}
        </View>

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
              <View key={item._id} style={styles.listItemCard}>
                <View>
                  <Text style={[styles.row, globalStyles.text]}>{item.driverId?.name}</Text>
                  <Text style={globalStyles.subText}>{item.driverId?.experience}</Text>
                  <Text style={globalStyles.subText}>{item.driverId?.email}</Text>
                  <Text style={globalStyles.subText}>{item.driverId?.phoneNumber}</Text>
                </View>

                <Pressable
                  style={globalStyles.buttonDangerSmall}
                  onPress={() => handleRemoveDriverAssignment(item._id)}
                >
                  <Text style={globalStyles.smallButtonText}>Remove</Text>
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
              <Pressable
                key={setup._id}
                style={styles.listItemCard}
                onPress={() =>
                  router.push({
                    pathname: "/vehicles/[id]/setups/[setupId]",
                    params: {
                      id,
                      setupId: setup._id,
                    },
                  })
                }>
                <View>
                  <Text style={[styles.row, globalStyles.text]}>
                    Version: {setup.version}
                  </Text>
                  <Text style={globalStyles.subText}>
                    Events used at: Coming later
                  </Text>
                </View>
              </Pressable>
            ))
          )}

          <View style={styles.actionRow}>
            <Pressable
              style={[globalStyles.buttonPrimary, styles.buttonGap]}
              onPress={openCreateSetupModal}
            >
              <Text style={globalStyles.buttonPrimaryText}>Create Setup</Text>
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
        <SetupModal
          visible={showSetupModal}
          vehicleId={String(id)}
          setup={editingSetup}
          existingSetups={setups}
          onClose={() => {
            setEditingSetup(null);
            setShowSetupModal(false);
          }}
          onSaved={fetchSetups}
        />
        <Modal
          visible={showEditVehicleModal}
          transparent
          animationType="fade"
          onRequestClose={closeEditVehicleModal}
        >
          <ScrollView
            contentContainerStyle={styles.modalContent}
          >
            <View style={globalStyles.modalOverlay}>
              <View style={globalStyles.modalCard}>
                <Text style={globalStyles.modalTitle}>
                  Edit Vehicle
                </Text>

                <Text style={globalStyles.label}>Name</Text>

                <TextInput
                  style={globalStyles.input}
                  placeholder="Vehicle name"
                  placeholderTextColor="#9ca3af"
                  value={name}
                  onChangeText={setName}
                />

                <Text style={globalStyles.label}>Make</Text>

                <TextInput
                  style={globalStyles.input}
                  placeholder="Make"
                  placeholderTextColor="#9ca3af"
                  value={make}
                  onChangeText={setMake}
                />

                <Text style={globalStyles.label}>Model</Text>

                <TextInput
                  style={globalStyles.input}
                  placeholder="Model"
                  placeholderTextColor="#9ca3af"
                  value={model}
                  onChangeText={setModel}
                />

                <Text style={globalStyles.label}>Year</Text>

                <TextInput
                  style={globalStyles.input}
                  placeholder="Year"
                  placeholderTextColor="#9ca3af"
                  value={year}
                  onChangeText={setYear}
                  keyboardType="numeric"
                />

                <Text style={globalStyles.label}>Owner</Text>

                <TextInput
                  style={globalStyles.input}
                  placeholder="Owner"
                  placeholderTextColor="#9ca3af"
                  value={owner}
                  onChangeText={setOwner}
                />

                <Text style={globalStyles.label}>
                  Odometer
                </Text>

                <TextInput
                  style={globalStyles.input}
                  placeholder="Odometer"
                  placeholderTextColor="#9ca3af"
                  value={odo}
                  onChangeText={setOdo}
                  keyboardType="numeric"
                />

                <Text style={globalStyles.label}>
                  Racing Number
                </Text>

                <TextInput
                  style={globalStyles.input}
                  placeholder="Racing number"
                  placeholderTextColor="#9ca3af"
                  value={racingNumber}
                  onChangeText={setRacingNumber}
                />

                <Text style={globalStyles.label}>
                  Chassis Number
                </Text>

                <TextInput
                  style={globalStyles.input}
                  placeholder="Chassis number"
                  placeholderTextColor="#9ca3af"
                  value={chassisNumber}
                  onChangeText={setChassisNumber}
                />

                <Text style={globalStyles.label}>Notes</Text>

                <TextInput
                  style={[
                    globalStyles.input,
                    styles.notesInput,
                  ]}
                  placeholder="Vehicle notes"
                  placeholderTextColor="#9ca3af"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  textAlignVertical="top"
                />

                {errorMessage ? (
                  <Text style={globalStyles.errorText}>
                    {errorMessage}
                  </Text>
                ) : null}

                <View style={styles.modalActions}>
                  <Pressable
                    style={globalStyles.buttonDanger}
                    onPress={closeEditVehicleModal}
                    disabled={isSavingVehicle}
                  >
                    <Text
                      style={globalStyles.buttonPrimaryText}
                    >
                      Cancel
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      globalStyles.buttonPrimary,
                      isSavingVehicle &&
                      globalStyles.buttonDisabled,
                    ]}
                    onPress={handleUpdateVehicle}
                    disabled={isSavingVehicle}
                  >
                    {isSavingVehicle ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text
                        style={
                          globalStyles.buttonPrimaryText
                        }
                      >
                        Save Changes
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          </ScrollView>
        </Modal>
        <Modal
          visible={showDeleteVehicleModal}
          transparent
          animationType="fade"
          onRequestClose={() => {
            if (!isDeletingVehicle) {
              setShowDeleteVehicleModal(false);
            }
          }}
        >
          <View style={globalStyles.modalOverlay}>
            <View style={globalStyles.modalCard}>
              <Text style={globalStyles.modalTitle}>
                Delete Vehicle?
              </Text>

              <Text style={globalStyles.text}>
                Are you sure you want to delete{" "}
                {vehicle.name ||
                  vehicle.racingNumber ||
                  `${vehicle.make || ""} ${vehicle.model || ""
                    }`.trim() ||
                  "this vehicle"}
                ?
              </Text>

              <Text style={globalStyles.subText}>
                This vehicle may have drivers, setups, tyres,
                event assignments and runs linked to it.
              </Text>

              {errorMessage ? (
                <Text style={globalStyles.errorText}>
                  {errorMessage}
                </Text>
              ) : null}

              <View style={styles.modalActions}>
                <Pressable
                  style={globalStyles.buttonPrimary}
                  onPress={() =>
                    setShowDeleteVehicleModal(false)
                  }
                  disabled={isDeletingVehicle}
                >
                  <Text
                    style={globalStyles.buttonPrimaryText}
                  >
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    globalStyles.buttonDanger,
                    isDeletingVehicle &&
                    globalStyles.buttonDisabled,
                  ]}
                  onPress={handleDeleteVehicle}
                  disabled={isDeletingVehicle}
                >
                  {isDeletingVehicle ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text
                      style={
                        globalStyles.buttonPrimaryText
                      }
                    >
                      Yes, Delete
                    </Text>
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
  setupButtonRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  vehicleActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },

  modalContent: {
    flexGrow: 1,
  },

  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    flexWrap: "wrap",
  },

  notesInput: {
    minHeight: 90,
  },
  listItemCard: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 12,
    padding: 14,
    marginTop: 10,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
},
});