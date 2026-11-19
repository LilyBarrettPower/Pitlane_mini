import { useState, useEffect } from "react";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { globalStyles } from "../constants/styles";
import { colors } from "../constants/theme";
import { apiFetch } from "../assets/api";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/ui/AuthLayout";
import { PasswordChecklist } from "../components/ui/PasswordFields";
import { Button, ErrorBanner } from "../components/ui/kit";
import { INVALID_EMAIL_MESSAGE, isValidEmail, passwordProblem } from "../constants/validation";

export default function RegisterPage() {
    const { login, token, isLoading: authLoading } = useAuth();

    const [orgName, setOrgName] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!authLoading && token) {
            router.replace("/(tabs)/dashboard");
        }
    }, [token, authLoading]);

    if (authLoading) return null;

    async function handleRegister() {
        // Check before sending, using the same rules as the backend
        const problem = !orgName.trim()
            ? "Please enter your organisation's name"
            : !isValidEmail(email)
                ? INVALID_EMAIL_MESSAGE
                : passwordProblem(password);

        if (problem) {
            setErrorMessage(problem);
            return;
        }

        try {
            setErrorMessage("");
            setIsLoading(true);

            const data = await apiFetch("/auth/register-organisation", {
                method: "POST",
                body: JSON.stringify({
                    orgName,
                    name,
                    email,
                    password,
                }),
            });

            // Logging in updates the token, which redirects to the dashboard
            await login(data);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Registration failed");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <AuthLayout
            title="Create your team"
            subtitle="Set up your organisation and your admin account."
            footer={
                <Pressable onPress={() => router.replace("/login")} hitSlop={8}>
                    <Text style={styles.footerText}>
                        Already have an account? <Text style={styles.footerLink}>Log in</Text>
                    </Text>
                </Pressable>
            }
        >
            <View>
                <Text style={globalStyles.label}>Organisation name</Text>
                <TextInput
                    value={orgName}
                    onChangeText={setOrgName}
                    placeholder="e.g. Apex Racing"
                    placeholderTextColor={colors.textMuted}
                    style={globalStyles.input}
                />
            </View>

            <View>
                <Text style={globalStyles.label}>Your name</Text>
                <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Full name"
                    placeholderTextColor={colors.textMuted}
                    style={globalStyles.input}
                />
            </View>

            <View>
                <Text style={globalStyles.label}>Email</Text>
                <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    textContentType="username"
                    style={globalStyles.input}
                />
            </View>

            <View>
                <Text style={globalStyles.label}>Password</Text>
                <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Choose a password"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry
                    autoComplete="new-password"
                    textContentType="newPassword"
                    autoCapitalize="none"
                    style={globalStyles.input}
                    onSubmitEditing={handleRegister}
                />
                <PasswordChecklist password={password} />
            </View>

            <ErrorBanner message={errorMessage} />

            <Button label="Create organisation" onPress={handleRegister} loading={isLoading} />
        </AuthLayout>
    );
}

const styles = StyleSheet.create({
    footerText: {
        color: colors.textMuted,
        fontSize: 14,
    },

    footerLink: {
        color: colors.primaryLight,
        fontWeight: "700",
    },
});
