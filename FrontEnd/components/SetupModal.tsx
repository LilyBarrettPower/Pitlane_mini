import { useEffect, useState } from "react";
import { Modal, ScrollView, Text, TextInput, View, StyleSheet } from "react-native";
import { apiFetch } from "../assets/api";
import { useAuth } from "../context/AuthContext";
import { globalStyles } from "../constants/styles";
import {
    CustomValueMap,
    CustomValuePart,
    EMPTY_CUSTOM_VALUE,
    SetupCustomValue,
    SetupField,
    customValuesFromMap,
    customValuesToMap,
} from "../constants/setupFields";
import SetupCustomFields from "./SetupCustomFields";
import { Button } from "./ui/kit";

export type SetUp = {
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
    customValues?: SetupCustomValue[];
};

type Props = {
    visible: boolean;
    vehicleId: string;
    setup?: SetUp | null;
    existingSetups: SetUp[];
    onClose: () => void;
    onSaved: () => void;
};

export default function SetupModal({
    visible,
    vehicleId,
    setup,
    existingSetups,
    onClose,
    onSaved,
}: Props) {
    const { token } = useAuth();

    const [version, setVersion] = useState("");
    const [springFront, setSpringFront] = useState("");
    const [springRear, setSpringRear] = useState("");
    const [arbFront, setArbFront] = useState("");
    const [arbRear, setArbRear] = useState("");
    const [rideHeightFront, setRideHeightFront] = useState("");
    const [rideHeightRear, setRideHeightRear] = useState("");
    const [camberFront, setCamberFront] = useState("");
    const [camberRear, setCamberRear] = useState("");
    const [toeFront, setToeFront] = useState("");
    const [toeRear, setToeRear] = useState("");
    const [packersFront, setPackersFront] = useState("");
    const [packersRear, setPackersRear] = useState("");
    const [diffPreload, setDiffPreload] = useState("");
    const [brakeBias, setBrakeBias] = useState("");
    const [wingHole, setWingHole] = useState("");
    const [splitter, setSplitter] = useState("");
    const [notes, setNotes] = useState("");

    // The vehicle's custom fields and this setup's values for them
    const [customFields, setCustomFields] = useState<SetupField[]>([]);
    const [customValues, setCustomValues] = useState<CustomValueMap>({});

    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const isEditing = !!setup;

    useEffect(() => {
        if (!visible) return;

        if (setup) {
            setVersion(setup.version || "");
            setSpringFront(setup.springNm?.front ? String(setup.springNm.front) : "");
            setSpringRear(setup.springNm?.rear ? String(setup.springNm.rear) : "");
            setArbFront(setup.arbPos?.front ? String(setup.arbPos.front) : "");
            setArbRear(setup.arbPos?.rear ? String(setup.arbPos.rear) : "");
            setRideHeightFront(setup.rideHeight?.front ? String(setup.rideHeight.front) : "");
            setRideHeightRear(setup.rideHeight?.rear ? String(setup.rideHeight.rear) : "");
            setCamberFront(setup.camber?.front || "");
            setCamberRear(setup.camber?.rear || "");
            setToeFront(setup.toe?.front || "");
            setToeRear(setup.toe?.rear || "");
            setPackersFront(setup.packers?.front || "");
            setPackersRear(setup.packers?.rear || "");
            setDiffPreload(setup.diffPreload ? String(setup.diffPreload) : "");
            setBrakeBias(setup.brakeBias || "");
            setWingHole(setup.wingHole || "");
            setSplitter(setup.splitter || "");
            setNotes(setup.notes || "");
            setCustomValues(customValuesToMap(setup.customValues));
        } else {
            clearForm();
        }
    }, [visible, setup]);

    // Load the vehicle's custom setup fields each time the modal opens
    useEffect(() => {
        if (!visible || !vehicleId || !token) return;

        apiFetch(`/vehicles/${vehicleId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((data) => setCustomFields(data.vehicle?.setupFields || []))
            .catch(() => setCustomFields([]));
    }, [visible, vehicleId, token]);

    function handleCustomValueChange(fieldId: string, part: CustomValuePart, text: string) {
        setCustomValues((current) => {
            const existing = current[fieldId] ?? EMPTY_CUSTOM_VALUE;
            return { ...current, [fieldId]: { ...existing, [part]: text } };
        });
    }

    function clearForm() {
        setVersion("");
        setSpringFront("");
        setSpringRear("");
        setArbFront("");
        setArbRear("");
        setRideHeightFront("");
        setRideHeightRear("");
        setCamberFront("");
        setCamberRear("");
        setToeFront("");
        setToeRear("");
        setPackersFront("");
        setPackersRear("");
        setDiffPreload("");
        setBrakeBias("");
        setWingHole("");
        setSplitter("");
        setNotes("");
        setCustomValues({});
        setErrorMessage("");
    }

    function getNextSetupVersionName(originalVersion: string) {
        const baseName = originalVersion.replace(/\.\d+$/, "");

        const matchingVersions = existingSetups
            .map((item) => item.version)
            .filter((itemVersion) => itemVersion === baseName || itemVersion.startsWith(`${baseName}.`));

        let highestNumber = 1;

        matchingVersions.forEach((itemVersion) => {
            const match = itemVersion.match(/\.(\d+)$/);
            if (match) {
                const number = Number(match[1]);
                if (number > highestNumber) highestNumber = number;
            }
        });

        return `${baseName}.${highestNumber + 1}`;
    }

    async function handleSave(saveAsNewVersion = false) {
        if (!version) {
            setErrorMessage("Setup version is required");
            return;
        }

        let finalVersion = version;

        if (setup && saveAsNewVersion && version === setup.version) {
            finalVersion = getNextSetupVersionName(setup.version);
        }

        const payload = {
            vehicleId,
            version: finalVersion,
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
            notes,
            // Includes values for removed fields too, so they're never lost
            customValues: customValuesFromMap(customValues),
        };

        try {
            setIsSaving(true);
            setErrorMessage("");

            if (setup && !saveAsNewVersion) {
                await apiFetch(`/setups/${setup._id}`, {
                    method: "PATCH",
                    headers: { Authorization: `Bearer ${token}` },
                    body: JSON.stringify(payload),
                });
            } else {
                await apiFetch("/setups", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: JSON.stringify(payload),
                });
            }

            clearForm();
            onSaved();
            onClose();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to save setup");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={globalStyles.modalOverlay}>
                {/* Same card as every other modal; only adds a max height so the long form scrolls */}
                <View style={[globalStyles.modalCard, styles.setupModalCard]}>
                    <ScrollView 
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={styles.setupModalContent}>


                    <Text style={globalStyles.modalTitle}>
                        {isEditing ? "Edit Setup" : "Create Setup"}
                    </Text>

                    {errorMessage ? <Text style={globalStyles.errorText}>{errorMessage}</Text> : null}

                    <Text style={globalStyles.label}>Version</Text>
                    <TextInput style={globalStyles.input} value={version} onChangeText={setVersion} />

                    <Text style={globalStyles.sectionTitle}>Springs</Text>
                    <Text style={globalStyles.label}>Front Spring (N/mm)</Text>
                    <TextInput style={globalStyles.input} value={springFront} onChangeText={setSpringFront} />
                    <Text style={globalStyles.label}>Rear Spring (N/mm)</Text>
                    <TextInput style={globalStyles.input} value={springRear} onChangeText={setSpringRear} />

                    <Text style={globalStyles.sectionTitle}>ARB</Text>
                    <Text style={globalStyles.label}>ARB Front</Text>
                    <TextInput style={globalStyles.input} value={arbFront} onChangeText={setArbFront} />
                    <Text style={globalStyles.label}>ARB Rear</Text>
                    <TextInput style={globalStyles.input} value={arbRear} onChangeText={setArbRear} />

                    <Text style={globalStyles.sectionTitle}>Ride Height</Text>
                    <Text style={globalStyles.label}>Ride Height Front</Text>
                    <TextInput style={globalStyles.input} value={rideHeightFront} onChangeText={setRideHeightFront} />
                    <Text style={globalStyles.label}>Ride Height Rear</Text>
                    <TextInput style={globalStyles.input} value={rideHeightRear} onChangeText={setRideHeightRear} />

                    <Text style={globalStyles.sectionTitle}>Camber</Text>
                    <Text style={globalStyles.label}>Camber Front</Text>
                    <TextInput style={globalStyles.input} value={camberFront} onChangeText={setCamberFront} />
                    <Text style={globalStyles.label}>Camber Rear</Text>
                    <TextInput style={globalStyles.input} value={camberRear} onChangeText={setCamberRear} />

                    <Text style={globalStyles.sectionTitle}>Toe</Text>
                    <Text style={globalStyles.label}>Toe Front</Text>
                    <TextInput style={globalStyles.input} value={toeFront} onChangeText={setToeFront} />
                    <Text style={globalStyles.label}>Toe Rear</Text>
                    <TextInput style={globalStyles.input} value={toeRear} onChangeText={setToeRear} />

                    <Text style={globalStyles.sectionTitle}>Packers</Text>
                    <Text style={globalStyles.label}>Packers Front</Text>
                    <TextInput style={globalStyles.input} value={packersFront} onChangeText={setPackersFront} />
                    <Text style={globalStyles.label}>Packers Rear</Text>
                    <TextInput style={globalStyles.input} value={packersRear} onChangeText={setPackersRear} />

                    <Text style={globalStyles.sectionTitle}>Other</Text>
                    <Text style={globalStyles.label}>Diff Preload</Text>
                    <TextInput style={globalStyles.input} value={diffPreload} onChangeText={setDiffPreload} />
                    <Text style={globalStyles.label}>Brake Bias</Text>
                    <TextInput style={globalStyles.input} value={brakeBias} onChangeText={setBrakeBias} />
                    <Text style={globalStyles.label}>Wing Hole</Text>
                    <TextInput style={globalStyles.input} value={wingHole} onChangeText={setWingHole} />
                    <Text style={globalStyles.label}>Splitter</Text>
                    <TextInput style={globalStyles.input} value={splitter} onChangeText={setSplitter} />
                    <SetupCustomFields
                        vehicleId={vehicleId}
                        token={token}
                        fields={customFields}
                        onFieldsChange={setCustomFields}
                        values={customValues}
                        onValueChange={handleCustomValueChange}
                    />

                    <Text style={globalStyles.label}>Notes</Text>
                    <TextInput style={globalStyles.input} value={notes} onChangeText={setNotes} />

                    <View style={styles.modalActions}>
                        <Button
                            label="Cancel"
                            variant="secondary"
                            onPress={() => {
                                clearForm();
                                onClose();
                            }}
                            disabled={isSaving}
                        />

                        {isEditing ? (
                            <>
                                <Button
                                    label="Save as New Version"
                                    variant="secondary"
                                    onPress={() => handleSave(true)}
                                    disabled={isSaving}
                                />
                                <Button
                                    label="Save Changes"
                                    onPress={() => handleSave(false)}
                                    loading={isSaving}
                                />
                            </>
                        ) : (
                            <Button label="Create Setup" onPress={() => handleSave(false)} loading={isSaving} />
                        )}
                    </View>
                    </ScrollView>
                </View>
            </View>
    </Modal >
  );
}

const styles = StyleSheet.create({
    setupModalCard: {
        maxHeight: "90%",
    },
    modalActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        flexWrap: "wrap",
        gap: 10,
        marginTop: 14,
    },
    setupModalContent: {
        gap: 10,
        paddingBottom: 24,
    },
});