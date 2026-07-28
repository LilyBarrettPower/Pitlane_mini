import {useState, useEffect} from "react";
import {router} from "expo-router";
import{
    ActivityIndicator, 
    Pressable, 
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";
import { globalStyles } from "../constants/styles";
import {SafeAreaView} from "react-native-safe-area-context";
import {apiFetch} from "../assets/api";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const {login, token, isLoading: authLoading} = useAuth();

    useEffect(() => {
        if (!authLoading && token) {
            router.replace("/(tabs)/dashboard");
        }
    }, [token, authLoading]);

    if (authLoading) return null;

    async function handleLogin() {
        try {
            setErrorMessage("");
            setIsLoading(true);

            const data = await apiFetch("/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    email, 
                    password,
                }),
            });

            await login(data);

            // View which user is logged in, for dev purposes
            setSuccessMessage(
                `Logged in as ${data.user.email}, (${data.user.role})\nOrganisation: ${data.organisation.name}`
            );


        } catch (error) {
            const message = 
                error instanceof Error ? error.message : "Login Failed";
            setErrorMessage(message);    
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <SafeAreaView style = {globalStyles.container}>
            <View style = {globalStyles.content}>
                <Text style = {globalStyles.title}>Login</Text>
                <Text style = {globalStyles.subTitle}>Sign in to Pitlane Mini</Text>
                <View style = {globalStyles.form}>
                    <View>
                        <Text style = {globalStyles.label}>Email</Text>
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            placeholder="you@example.com"
                            placeholderTextColor="#9ca3af"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            style={globalStyles.input}
                            />
                    </View>
                    <View>
                        <Text style = {globalStyles.label}>Password</Text>
                        <TextInput
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Enter your password"
                            placeholderTextColor="#9ca3af"
                            secureTextEntry
                            style={globalStyles.input}
                            />
                    </View>
                    {errorMessage ? (
                        <Text style={globalStyles.errorText}>{errorMessage}</Text>
                    ): null}
                    
                     {/* This is for development purposes, can remove later*/}
                    {successMessage ? (
                        <Text style={globalStyles.successText}>{successMessage}</Text>
                    ) : null}

                    <Pressable
                        style={[globalStyles.buttonPrimary, isLoading && globalStyles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#ffffff"/>
                            ) : (
                                <Text style={globalStyles.buttonPrimaryText}>Login</Text>
                            )}
                        </Pressable>
                </View>
            </View>
        </SafeAreaView>
    );
}
