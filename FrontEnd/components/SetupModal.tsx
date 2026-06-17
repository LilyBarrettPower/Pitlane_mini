import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { apiFetch } from '../assets/api';
import { useAuth } from '../context/AuthContext';
import { globalStyles } from '../constants/styles';

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

    const [version, setVersion] = useState('');
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
    const [notes, setNotes] = useState('');

    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const isEditing = !!setup;

    useEffect(() => {
        if (!visible) return;

        if (setup) {
            setVersion(setup.version || '');
            setSpringFront(setup.springNm?.front ? String(setup.springNm.front) : '');
            setSpringRear(setup.springNm?.rear ? String(setup.springNm.rear) : '');
            setArbFront(setup.arbPos?.front ? String(setup.arbPos.front) : '');
            setArbRear(setup.arbPos?.rear ? String(setup.arbPos.rear) : '');
            setRideHeightFront(setup.rideHeight?.front ? String(setup.rideHeight.front) : '');
            setRideHeightRear(setup.rideHeight?.rear ? String(setup.rideHeight.rear) : '');
            setCamberFront(setup.camber?.front || '');
            setCamberRear(setup.camber?.rear || '');
            setToeFront(setup.toe?.front || '');
            setToeRear(setup.toe?.rear || '');
            setPackersFront(setup.packers?.front || '');
            setPackersRear(setup.packers?.rear || '');
            setDiffPreload(setup.diffPreload ? String(setup.diffPreload) : '');
            setBrakeBias(setup.brakeBias || '');
            setWingHole(setup.wingHole || '');
            setSplitter(setup.splitter || '');
            setNotes(setup.notes || '');
        } else {
            clearForm();
        }
    }, [visible, setup]);

    function clearForm() {
        setVersion('');
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
        setNotes('');
        setErrorMessage('');
    }

    function getNextSetupVersionName(originalVersion: string) {
        const baseName = originalVersion.replace(/\.\d+$/, '');

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
            setErrorMessage('Setup version is required');
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
        };

        try {
            setIsSaving(true);
            setErrorMessage('');

            if (setup && !saveAsNewVersion) {
                await apiFetch(`/setups/${setup._id}`, {
                    method: 'PATCH',
                    headers: { Authorization: `Bearer ${token}` },
                    body: JSON.stringify(payload),
                });
            } else {
                await apiFetch('/setups', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: JSON.stringify(payload),
                });
            }

            clearForm();
            onSaved();
            onClose();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to save setup');
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <ScrollView contentContainerStyle={globalStyles.container}>
            <View style={globalStyles.modalOverlay}>
                <View style={globalStyles.modalCard}>

                    <Text style={globalStyles.modalTitle}>
                        {isEditing ? 'Edit Setup' : 'Create Setup'}
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
                    <Text style={globalStyles.label}>Notes</Text>
                    <TextInput style={globalStyles.input} value={notes} onChangeText={setNotes} />

                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                        <Pressable
                            style={globalStyles.buttonDanger}
                            onPress={() => {
                                clearForm();
                                onClose();
                            }}
                            disabled={isSaving}
                        >
                            <Text style={globalStyles.buttonPrimaryText}>Cancel</Text>
                        </Pressable>

                        {isEditing ? (
                            <>
                                <Pressable
                                    style={[globalStyles.buttonPrimary, isSaving && globalStyles.buttonDisabled]}
                                    onPress={() => handleSave(false)}
                                    disabled={isSaving}
                                >
                                    <Text style={globalStyles.buttonPrimaryText}>Save Changes</Text>
                                </Pressable>

                                <Pressable
                                    style={[globalStyles.buttonSecondary, isSaving && globalStyles.buttonDisabled]}
                                    onPress={() => handleSave(true)}
                                    disabled={isSaving}
                                >
                                    <Text style={globalStyles.buttonPrimaryText}>Save as New Version</Text>
                                </Pressable>
                            </>
                        ) : (
                            <Pressable
                                style={[globalStyles.buttonPrimary, isSaving && globalStyles.buttonDisabled]}
                                onPress={() => handleSave(false)}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color="#ffffff" />
                                ) : (
                                    <Text style={globalStyles.buttonPrimaryText}>Create Setup</Text>
                                )}
                            </Pressable>
                        )}
                    </View>

                </View>
            </View>
        </ScrollView>
    </Modal >
  );
}