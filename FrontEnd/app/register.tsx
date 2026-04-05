import {useState, useEffect} from 'react';
import {router} from 'expo-router';
import {
    ActivityIndicator, 
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import { apiFetch } from '../assets/api';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
    const {login, token, isLoading: authLoading} = useAuth();

    const [orgName, setOrgName] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!authLoading && token) {
            router.replace('/(tabs)/dashboard');
        }
    }, [token, authLoading]);

    if (authLoading) return null;

    async function handleRegister() {
        try {
            setErrorMessage('');
            setSuccessMessage('');
            setIsLoading(true);

            const data = await apiFetch('/auth/register-organisation', {
                method: 'POST',
                body: JSON.stringify({
                    orgName, 
                    name, 
                    email,
                    password,
                }),
            });

            await login(data);

            setSuccessMessage(
                `Organisation created: ${data.organisation.name}\nLogged in as ${data.user.name}`
            );

            setTimeout(() => {
                router.replace('/dashboard');
            }, 1500);
        } catch (error) {
            const message = 
                error instanceof Error ? error.message : 'Registration failed';
            setErrorMessage(message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Register Organisation</Text>
                <Text style={styles.subTitle}>
                    Create your organisation and admin user
                </Text>

                <View style={styles.form}>
                    <View>
                        <Text style={styles.label}>Organisation Name</Text>
                        <TextInput
                            value={orgName}
                            onChangeText={setOrgName}
                            style={styles.input}
                            />
                    </View>
                    <View>
                        <Text style={styles.label}>Your Name</Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            style={styles.input}
                            />
                    </View>
                    <View>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            style={styles.input}
                            />
                    </View>
                    <View>
                        <Text style={styles.label}>Password</Text>
                        <TextInput  
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            style={styles.input}
                            />
                    </View>

                    {errorMessage ? (
                        <Text style={styles.errorText}>{errorMessage}</Text>
                    ) : null}

                    {successMessage ? (
                        <Text style={styles.successText}>{successMessage}</Text>
                    ) : null}

                    <Pressable 
                        style={[styles.button, isLoading && styles.buttonDisabled]}
                        onPress={handleRegister}
                        disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#ffffff"/>
                            ) : (
                                <Text style={styles.buttonText}>Register Organisation</Text>
                            )}
                        </Pressable>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
        maxWidth: 520,
        width: '100%',
        alignSelf: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#ffffff',
        marginBottom: 8,
    },
    subTitle: {
        fontSize: 16,
        color: '#d1d5db',
        marginBottom: 28,
    },
    form: {
        gap: 16,
    },
    label: {
        color: '#ffffff',
        marginBottom: 8,
        fontSize: 14,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#1f2937',
        color: '#ffffff',
        borderWidth: 1,
        borderColor: '#374151',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#2563eb',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
    errorText: {
        color: '#f87171',
        fontSize: 14,
    },
    successText: {
        color: '#34d399',
        fontSize: 14,
    },
})