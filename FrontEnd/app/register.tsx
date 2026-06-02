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
import { globalStyles } from '../constants/styles';
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
        <SafeAreaView style={globalStyles.container}>
            <View style={globalStyles.content}>
                <Text style={globalStyles.title}>Register Organisation</Text>
                <Text style={globalStyles.subTitle}>
                    Create your organisation and admin user
                </Text>

                <View style={globalStyles.form}>
                    <View>
                        <Text style={globalStyles.label}>Organisation Name</Text>
                        <TextInput
                            value={orgName}
                            onChangeText={setOrgName}
                            style={globalStyles.input}
                            />
                    </View>
                    <View>
                        <Text style={globalStyles.label}>Your Name</Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            style={globalStyles.input}
                            />
                    </View>
                    <View>
                        <Text style={globalStyles.label}>Email</Text>
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            style={globalStyles.input}
                            />
                    </View>
                    <View>
                        <Text style={globalStyles.label}>Password</Text>
                        <TextInput  
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            style={globalStyles.input}
                            />
                    </View>

                    {errorMessage ? (
                        <Text style={globalStyles.errorText}>{errorMessage}</Text>
                    ) : null}

                    {successMessage ? (
                        <Text style={globalStyles.successText}>{successMessage}</Text>
                    ) : null}

                    <Pressable 
                        style={[globalStyles.buttonPrimary, isLoading && globalStyles.buttonDisabled]}
                        onPress={handleRegister}
                        disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#ffffff"/>
                            ) : (
                                <Text style={globalStyles.buttonPrimaryText}>Register Organisation</Text>
                            )}
                        </Pressable>
                </View>
            </View>
        </SafeAreaView>
    );
}
