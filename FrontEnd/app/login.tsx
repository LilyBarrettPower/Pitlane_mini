import { useState, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { globalStyles } from "../constants/styles";
import { colors } from "../constants/theme";
import { apiFetch } from "../assets/api";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/ui/AuthLayout";
import { Button, ErrorBanner } from "../components/ui/kit";

export default function LoginPage() {
    // Set when the app logged the user out, e.g. removed from the organisation
    const { reason } = useLocalSearchParams<{ reason?: string }>();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState(reason ? String(reason) : "");
    const [isLoading, setIsLoading] = useState(false);

    const { login, token, isLoading: authLoading } = useAuth();

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

            // Logging in updates the token, which redirects to the dashboard
            await login(data);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Login failed");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <AuthLayout
            title="Welcome back"
            subtitle="Log in to your team's Pitlane Mini account."
            footer={
                <Pressable onPress={() => router.replace("/register")} hitSlop={8}>
                    <Text style={styles.footerText}>
                        New team? <Text style={styles.footerLink}>Register your organisation</Text>
                    </Text>
                </Pressable>
            }
        >
            <View>
                <Text style={globalStyles.label}>Email</Text>
                <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={globalStyles.input}
                />
            </View>

            <View>
                <View style={styles.passwordLabelRow}>
                    <Text style={globalStyles.label}>Password</Text>
                    <Pressable onPress={() => router.push("/forgot-password")} hitSlop={8}>
                        <Text style={styles.forgotLink}>Forgot password?</Text>
                    </Pressable>
                </View>
                <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry
                    style={globalStyles.input}
                    onSubmitEditing={handleLogin}
                />
            </View>

            <ErrorBanner message={errorMessage} />

            <Button label="Log in" onPress={handleLogin} loading={isLoading} />
        </AuthLayout>
    );
}

const styles = StyleSheet.create({
    passwordLabelRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },

    forgotLink: {
        color: colors.primaryLight,
        fontSize: 13,
        fontWeight: "700",
    },

    footerText: {
        color: colors.textMuted,
        fontSize: 14,
    },

    footerLink: {
        color: colors.primaryLight,
        fontWeight: "700",
    },
});
