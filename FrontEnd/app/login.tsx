import { useState, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { globalStyles } from "../constants/styles";
import { colors } from "../constants/theme";
import { apiFetch } from "../assets/api";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/ui/AuthLayout";
import { Button, ErrorBanner } from "../components/ui/kit";
import { INVALID_EMAIL_MESSAGE, isValidEmail } from "../constants/validation";
import { forgetRememberedEmail, getRememberedEmail, rememberEmail } from "../assets/rememberedEmail";

export default function LoginPage() {
    // Set when the app logged the user out, e.g. removed from the organisation
    const { reason } = useLocalSearchParams<{ reason?: string }>();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState(reason ? String(reason) : "");
    const [isLoading, setIsLoading] = useState(false);
    // The email was filled in from the last login on this device
    const [isRememberedEmail, setIsRememberedEmail] = useState(false);

    const { login, token, isLoading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && token) {
            router.replace("/(tabs)/dashboard");
        }
    }, [token, authLoading]);

    // Fill in the email used last time (only if nothing's been typed yet)
    useEffect(() => {
        getRememberedEmail().then((saved) => {
            if (saved) {
                setEmail((current) => current || saved);
                setIsRememberedEmail(true);
            }
        });
    }, []);

    if (authLoading) return null;

    async function handleUseDifferentEmail() {
        await forgetRememberedEmail();
        setEmail("");
        setPassword("");
        setIsRememberedEmail(false);
    }

    async function handleLogin() {
        // Email format only - password rules aren't applied at login
        if (!isValidEmail(email)) {
            setErrorMessage(INVALID_EMAIL_MESSAGE);
            return;
        }
        if (!password) {
            setErrorMessage("Please enter your password");
            return;
        }

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

            // Remember the email (never the password) for next time
            await rememberEmail(email);

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
                <View style={styles.passwordLabelRow}>
                    <Text style={globalStyles.label}>Email</Text>
                    {isRememberedEmail && email ? (
                        <Pressable onPress={handleUseDifferentEmail} hitSlop={8}>
                            <Text style={styles.forgotLink}>Not you? Use a different email</Text>
                        </Pressable>
                    ) : null}
                </View>
                {/* autoComplete / textContentType let browsers, iCloud Keychain and
                    Google Password Manager save and fill in this login */}
                <TextInput
                    value={email}
                    onChangeText={(text) => {
                        setEmail(text);
                        setIsRememberedEmail(false);
                    }}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    autoComplete="email"
                    textContentType="username"
                    importantForAutofill="yes"
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
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="current-password"
                    textContentType="password"
                    importantForAutofill="yes"
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
