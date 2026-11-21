import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Text, View, StyleSheet, ActivityIndicator, Pressable, ScrollView, Modal, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiFetch } from "../../../../assets/api";
import { useAuth } from "../../../../context/AuthContext";
import { useCan } from "../../../../constants/permissions";
import { globalStyles } from "../../../../constants/styles";
import { colors } from "../../../../constants/theme";
import SetupModal from "../../../../components/SetupModal";
import {
  Avatar,
  Button,
  EmptyState,
  ErrorBanner,
  Field,
  LoadingState,
  PageHeader,
  Panel,
  Screen,
  SectionLabel,
  useIsWide,
} from "../../../../components/ui/kit";


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

// From GET /event-vehicles/event/:vehicleId - this car's entry in an event
type VehicleEventEntry = {
  _id: string; // the event vehicle id (used for the car's page at that event)
  eventId: {
    _id: string;
    name: string;
    startDate: string;
    endDate: string;
    trackId?: { _id: string; name?: string } | null;
  };
};

const DAY_MS = 24 * 60 * 60 * 1000;

// Event dates are stored as the start of each day, so an event is still
// on until the end of its end date.
function eventHasEnded(entry: VehicleEventEntry) {
  return new Date(entry.eventId.endDate).getTime() + DAY_MS <= Date.now();
}

function eventIsLive(entry: VehicleEventEntry) {
  return new Date(entry.eventId.startDate).getTime() <= Date.now() && !eventHasEnded(entry);
}

// e.g. "12 Apr 2026" or "12 Apr – 13 Apr 2026"
function formatEventDates(startDate: string, endDate: string) {
  const format = (date: string) =>
    new Date(date).toLocaleDateString("en-NZ", { day: "numeric", month: "short" });

  const start = format(startDate);
  const end = format(endDate);
  const year = new Date(endDate).getFullYear();

  return start === end ? `${start} ${year}` : `${start} – ${end} ${year}`;
}

function daysUntilLabel(startDate: string) {
  const days = Math.ceil((new Date(startDate).getTime() - Date.now()) / DAY_MS);
  return days <= 1 ? "Tomorrow" : `In ${days} days`;
}

const PAST_EVENTS_PREVIEW = 5;

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
  const canManage = useCan("manage");
  const canSetups = useCan("setups");

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicleDrivers, setVehicleDrivers] = useState<VehicleDriver[]>([]);
  const [showAssignedDriverModal, setShowAssignedDriverModal] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [assignErrorMessage, setAssignErrorMessage] = useState("");
  const [isAssigningDriver, setIsAssigningDriver] = useState(false);

  const [vehicleEvents, setVehicleEvents] = useState<VehicleEventEntry[]>([]);
  const [showAllPastEvents, setShowAllPastEvents] = useState(false);

  const [setups, setSetups] = useState<SetUp[]>([]);
  // setUpId -> names of the events that setup was used at (newest first)
  const [setUpEventNames, setSetUpEventNames] = useState<Record<string, string[]>>({});
  const [showSetupModal, setShowSetupModal] = useState(false);
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

  const isWide = useIsWide();

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
    const [data, summaryData] = await Promise.all([
      apiFetch(`/setups?vehicleId=${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      apiFetch(`/run-setups/vehicle/${id}/summary`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    ]);

    setSetups(data.setups || []);

    const namesBySetUpId: Record<string, string[]> = {};
    for (const item of summaryData.summary || []) {
      namesBySetUpId[String(item.setUpId)] = (item.events || []).map(
        (event: { eventName: string }) => event.eventName
      );
    }
    setSetUpEventNames(namesBySetUpId);
  }



  async function fetchVehicleEvents() {
    const data = await apiFetch(`/event-vehicles/event/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setVehicleEvents(data.assignments || []);
  }

  // Upcoming (including live): soonest first. Past: most recent first.
  const upcomingEvents = useMemo(
    () => vehicleEvents.filter((entry) => !eventHasEnded(entry)),
    [vehicleEvents]
  );

  const pastEvents = useMemo(
    () => vehicleEvents.filter((entry) => eventHasEnded(entry)).reverse(),
    [vehicleEvents]
  );

  const visiblePastEvents = showAllPastEvents
    ? pastEvents
    : pastEvents.slice(0, PAST_EVENTS_PREVIEW);

  function openVehicleEvent(entry: VehicleEventEntry) {
    router.push(`/events/${entry.eventId._id}/vehicles/${entry._id}`);
  }

  function renderEventRow(entry: VehicleEventEntry, showTiming: boolean) {
    const live = eventIsLive(entry);

    return (
      <Pressable
        key={entry._id}
        style={({ pressed }) => [styles.eventRow, pressed && styles.eventRowPressed]}
        onPress={() => openVehicleEvent(entry)}
      >
        <View style={styles.eventRowInfo}>
          <Text style={globalStyles.cardText}>{entry.eventId.name}</Text>
          <Text style={globalStyles.subText}>
            {[
              formatEventDates(entry.eventId.startDate, entry.eventId.endDate),
              entry.eventId.trackId?.name,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        </View>

        {showTiming ? (
          <Text style={[styles.eventBadge, live ? styles.eventBadgeLive : styles.eventBadgeUpcoming]}>
            {live ? "Live" : daysUntilLabel(entry.eventId.startDate)}
          </Text>
        ) : null}
      </Pressable>
    );
  }

  useEffect(() => {
    if (id && token) {
      fetchVehicle();
      fetchVehicleDrivers();
      fetchDrivers();
      fetchSetups();
      fetchVehicleEvents().catch(() => {});
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
        fetchVehicleEvents().catch(() => {});
      }
    }, [id, token])
  );

  if (isLoading && !vehicle) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (!vehicle) {
    return (
      <Screen>
        <PageHeader title="Vehicle" onBack={() => router.navigate("/vehicles" as any)} backLabel="Vehicles" />
        <ErrorBanner message={errorMessage || "No vehicle found"} />
      </Screen>
    );
  }

  const detailsPanel = (
    <Panel title="Details" icon="information-circle-outline">
      <View style={styles.fieldGrid}>
        <Field label="Make" value={vehicle.make} />
        <Field label="Model" value={vehicle.model} />
        <Field label="Year" value={vehicle.year} />
        <Field
          label="Odometer"
          value={vehicle.odo != null ? `${Math.round(vehicle.odo).toLocaleString("en-NZ")} km` : undefined}
        />
        <Field label="Chassis" value={vehicle.chassisNumber} />
        <Field label="Owner" value={vehicle.owner} />
      </View>

      {vehicle.notes ? (
        <View style={styles.notesBlock}>
          <Text style={styles.notesLabel}>NOTES</Text>
          <Text style={styles.notesText}>{vehicle.notes}</Text>
        </View>
      ) : null}
    </Panel>
  );

  const eventsPanel = (
    <Panel title="Events" icon="flag-outline">
      <SectionLabel>Upcoming</SectionLabel>
      {upcomingEvents.length === 0 ? (
        <Text style={styles.emptyLine}>No upcoming events</Text>
      ) : (
        upcomingEvents.map((entry) => renderEventRow(entry, true))
      )}

      <SectionLabel spaced>Past</SectionLabel>
      {pastEvents.length === 0 ? (
        <Text style={styles.emptyLine}>No past events</Text>
      ) : (
        <>
          {visiblePastEvents.map((entry) => renderEventRow(entry, false))}

          {pastEvents.length > PAST_EVENTS_PREVIEW ? (
            <Pressable
              style={styles.showAllButton}
              onPress={() => setShowAllPastEvents((current) => !current)}
            >
              <Text style={styles.showAllText}>
                {showAllPastEvents ? "Show less" : `Show all ${pastEvents.length} past events`}
              </Text>
            </Pressable>
          ) : null}
        </>
      )}
    </Panel>
  );

  const driversPanel = (
    <Panel
      title="Drivers"
      icon="id-card-outline"
      actionLabel={canManage ? "Assign" : undefined}
      onAction={canManage ? () => setShowAssignedDriverModal(true) : undefined}
    >
      {vehicleDrivers.length === 0 ? (
        <EmptyState
          icon="id-card-outline"
          text="No drivers assigned"
          action={
            canManage && <Button
              label="Assign Driver"
              icon="person-add-outline"
              size="sm"
              variant="secondary"
              onPress={() => setShowAssignedDriverModal(true)}
            />
          }
        />
      ) : (
        vehicleDrivers.map((item) => (
          <View key={item._id} style={styles.listRow}>
            <Avatar name={item.driverId?.name} size={38} />
            <View style={styles.listRowText}>
              <Text style={styles.listRowTitle} numberOfLines={1}>{item.driverId?.name}</Text>
              <Text style={styles.listRowSub} numberOfLines={1}>
                {[item.driverId?.experience, item.driverId?.email || item.driverId?.phoneNumber]
                  .filter(Boolean)
                  .join(" · ") || "No details"}
              </Text>
            </View>
            {canManage ? (
              <Pressable
                hitSlop={8}
                onPress={() => handleRemoveDriverAssignment(item._id)}
                style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
              >
                <Ionicons name="close" size={18} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>
        ))
      )}
    </Panel>
  );

  const setupsPanel = (
    <Panel
      title="Setups"
      icon="construct-outline"
      actionLabel={canSetups ? "New setup" : undefined}
      onAction={canSetups ? openCreateSetupModal : undefined}
    >
      {setups.length === 0 ? (
        <EmptyState
          icon="construct-outline"
          text="No setups for this vehicle yet"
          action={
            canSetups && (
              <Button label="Create Setup" icon="add" size="sm" variant="secondary" onPress={openCreateSetupModal} />
            )
          }
        />
      ) : (
        setups.map((setup) => (
          <Pressable
            key={setup._id}
            style={({ pressed }) => [styles.listRow, pressed && styles.pressed]}
            onPress={() =>
              router.push({
                pathname: "/vehicles/[id]/setups/[setupId]",
                params: {
                  id,
                  setupId: setup._id,
                },
              })
            }
          >
            <View style={styles.versionTile}>
              <Text style={styles.versionText} numberOfLines={1}>{setup.version || "–"}</Text>
            </View>
            <View style={styles.listRowText}>
              <Text style={styles.listRowTitle}>Setup {setup.version}</Text>
              <Text style={styles.listRowSub} numberOfLines={1}>
                {setUpEventNames[setup._id]?.length
                  ? `Used at ${setUpEventNames[setup._id].join(", ")}`
                  : "Not used yet"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))
      )}
    </Panel>
  );

  const ownershipPanel = (
    <Panel title="Ownership History" icon="time-outline">
      {vehicle.ownerHistory && vehicle.ownerHistory.length > 0 ? (
        vehicle.ownerHistory.map((entry, index) => (
          <View key={index} style={styles.historyRow}>
            <Text style={styles.listRowTitle}>{entry.owner}</Text>
            <Text style={styles.listRowSub}>{new Date(entry.changedAt).toLocaleDateString("en-NZ")}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyLine}>No previous owners</Text>
      )}
    </Panel>
  );

  return (
    <Screen>
      <PageHeader
        eyebrow={vehicle.racingNumber ? `Car #${vehicle.racingNumber}` : "Vehicle"}
        title={vehicle.name}
        subtitle={[vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(" · ") || undefined}
        onBack={() => router.navigate("/vehicles" as any)}
        backLabel="Vehicles"
        actions={
          canManage && (
            <>
              <Button label="Edit" icon="create-outline" variant="secondary" onPress={openEditVehicleModal} />
              <Button
                label="Delete"
                icon="trash-outline"
                variant="ghost"
                onPress={() => {
                  setErrorMessage("");
                  setShowDeleteVehicleModal(true);
                }}
              />
            </>
          )
        }
      />

      <ErrorBanner message={errorMessage} />

      {isWide ? (
        <View style={styles.columns}>
          <View style={styles.colMain}>
            {detailsPanel}
            {eventsPanel}
          </View>
          <View style={styles.colSide}>
            {driversPanel}
            {setupsPanel}
            {ownershipPanel}
          </View>
        </View>
      ) : (
        <>
          {detailsPanel}
          {eventsPanel}
          {driversPanel}
          {setupsPanel}
          {ownershipPanel}
        </>
      )}

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
    </Screen>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
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

  eventGroupHeading: {
    color: "#9ca3af",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 2,
  },

  eventGroupHeadingSpaced: {
    marginTop: 18,
  },

  eventRow: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },

  eventRowPressed: {
    opacity: 0.75,
  },

  eventRowInfo: {
    flexShrink: 1,
    gap: 2,
  },

  eventBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: "700",
    overflow: "hidden",
  },

  eventBadgeLive: {
    backgroundColor: "#166534",
    color: "#dcfce7",
  },

  eventBadgeUpcoming: {
    backgroundColor: "#374151",
    color: "#e5e7eb",
  },

  showAllButton: {
    marginTop: 10,
    alignSelf: "flex-start",
  },

  showAllText: {
    color: "#2563eb",
    fontWeight: "700",
  },

  // ----- Redesigned layout -----
  columns: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 20,
  },

  colMain: {
    flex: 3,
    gap: 20,
  },

  colSide: {
    flex: 2,
    gap: 20,
  },

  fieldGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
  },

  notesBlock: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderDark,
    gap: 6,
  },

  notesLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },

  notesText: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },

  emptyLine: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 6,
  },

  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },

  listRowText: {
    flex: 1,
    gap: 2,
  },

  listRowTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },

  listRowSub: {
    color: colors.textMuted,
    fontSize: 13,
  },

  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  pressed: {
    opacity: 0.8,
  },

  versionTile: {
    minWidth: 38,
    height: 38,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },

  versionText: {
    color: "#93c5fd",
    fontSize: 14,
    fontWeight: "800",
  },
});
