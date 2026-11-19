// Ask for a password reset email

import { useState } from "react";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { apiFetch } from "../assets/api";
import { globalStyles } from "../constants/styles";
import { colors } from "../constants/theme";
import AuthLayout from "../components/ui/AuthLayout";
import { Button, ErrorBanner } from "../components/ui/kit";
import { INVALID_EMAIL_MESSAGE, isValidEmail } from "../constants/validation";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [sentMessage, setSentMessage] = useState("");
    const [isSending, setIsSending] = useState(false);

    async function handleSubmit() {
        if (!isValidEmail(email)) {
            setErrorMessage(INVALID_EMAIL_MESSAGE);
            return;
        }

        try {
            setErrorMessage("");
            setIsSending(true);

            const data = await apiFetch("/auth/forgot-password", {
                method: "POST",
                body: JSON.stringify({ email: email.trim() }),
            });

            setSentMessage(data.message || "Check your email for a link to reset your password.");
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
        } finally {
            setIsSending(false);
        }
    }

    return (
        <AuthLayout
            title="Forgot your password?"
            subtitle="Enter your email and we'll send you a link to choose a new one."
            footer={
                <Pressable onPress={() => router.replace("/login")} hitSlop={8}>
                    <Text style={styles.footerText}>
                        Remembered it? <Text style={styles.footerLink}>Back to login</Text>
                    </Text>
                </Pressable>
            }
        >
            {sentMessage ? (
                <View style={styles.sentBox}>
                    <Ionicons name="mail-open-outline" size={22} color={colors.live} />
                    <Text style={styles.sentText}>{sentMessage} The link lasts 1 hour.</Text>
                </View>
            ) : (
                <>
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
                            onSubmitEditing={handleSubmit}
                        />
                    </View>

                    <ErrorBanner message={errorMessage} />

                    <Button label="Send reset link" onPress={handleSubmit} loading={isSending} />
                </>
            )}
        </AuthLayout>
    );
}

const styles = StyleSheet.create({
    sentBox: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        backgroundColor: colors.liveSoft,
        borderRadius: 12,
        padding: 14,
    },

    sentText: {
        color: colors.textSecondary,
        fontSize: 15,
        lineHeight: 22,
        flexShrink: 1,
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
