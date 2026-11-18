// Opened from the password reset email: choose a new password, then log in

import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

import { apiFetch } from "../assets/api";
import { useAuth } from "../context/AuthContext";
import { colors } from "../constants/theme";
import AuthLayout from "../components/ui/AuthLayout";
import PasswordFields, { passwordError } from "../components/ui/PasswordFields";
import { Button, ErrorBanner } from "../components/ui/kit";

export default function ResetPasswordPage() {
    const { token } = useLocalSearchParams<{ token?: string }>();
    const { login } = useAuth();

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [errorMessage, setErrorMessage] = useState(
        token ? "" : "This reset link is missing its code. Please use the link from your email."
    );
    const [isSaving, setIsSaving] = useState(false);

    async function handleSubmit() {
        const problem = passwordError(password, confirm);
        if (problem) {
            setErrorMessage(problem);
            return;
        }

        try {
            setErrorMessage("");
            setIsSaving(true);

            const data = await apiFetch("/auth/reset-password", {
                method: "POST",
                body: JSON.stringify({ token, password }),
            });

            await login(data);
            router.replace("/dashboard");
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Could not reset your password");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <AuthLayout
            title="Choose a new password"
            subtitle="Pick something you haven't used before."
            footer={
                <Pressable onPress={() => router.replace("/forgot-password")} hitSlop={8}>
                    <Text style={styles.footerText}>
                        Link expired? <Text style={styles.footerLink}>Request a new one</Text>
                    </Text>
                </Pressable>
            }
        >
            <PasswordFields
                password={password}
                confirm={confirm}
                onChangePassword={setPassword}
                onChangeConfirm={setConfirm}
                onSubmit={handleSubmit}
            />

            <ErrorBanner message={errorMessage} />

            <Button label="Save new password" onPress={handleSubmit} loading={isSaving} disabled={!token} />
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
