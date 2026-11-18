// Opened from the invite email: the new user sets their password and is
// logged straight in.

import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { apiFetch } from "../assets/api";
import { useAuth } from "../context/AuthContext";
import { globalStyles } from "../constants/styles";
import { colors } from "../constants/theme";
import AuthLayout from "../components/ui/AuthLayout";
import PasswordFields, { passwordError } from "../components/ui/PasswordFields";
import { Button, ErrorBanner } from "../components/ui/kit";

type InviteDetails = {
    email: string;
    name?: string;
    organisationName?: string;
};

export default function AcceptInvitePage() {
    const { token } = useLocalSearchParams<{ token?: string }>();
    const { login } = useAuth();

    const [invite, setInvite] = useState<InviteDetails | null>(null);
    const [isChecking, setIsChecking] = useState(true);
    const [linkError, setLinkError] = useState("");

    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [formError, setFormError] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Check the link is still valid and show who it's for
    useEffect(() => {
        async function verify() {
            if (!token) {
                setLinkError("This invite link is missing its code. Please use the link from your email.");
                setIsChecking(false);
                return;
            }

            try {
                const data = await apiFetch(`/auth/invite/verify?token=${encodeURIComponent(String(token))}`);
                setInvite(data);
                setName(data.name || "");
            } catch (error) {
                setLinkError(error instanceof Error ? error.message : "This invite link is invalid or has expired.");
            } finally {
                setIsChecking(false);
            }
        }

        verify();
    }, [token]);

    async function handleSubmit() {
        const problem = passwordError(password, confirm);
        if (problem) {
            setFormError(problem);
            return;
        }

        try {
            setFormError("");
            setIsSaving(true);

            const data = await apiFetch("/auth/accept-invite", {
                method: "POST",
                body: JSON.stringify({ token, password, name }),
            });

            await login(data);
            router.replace("/dashboard");
        } catch (error) {
            setFormError(error instanceof Error ? error.message : "Could not set up your account");
        } finally {
            setIsSaving(false);
        }
    }

    if (isChecking) {
        return (
            <AuthLayout title="Checking your invite…">
                <ActivityIndicator color="#ffffff" />
            </AuthLayout>
        );
    }

    if (!invite) {
        return (
            <AuthLayout
                title="Invite link not valid"
                footer={
                    <Pressable onPress={() => router.replace("/login")} hitSlop={8}>
                        <Text style={styles.footerLink}>Go to login</Text>
                    </Pressable>
                }
            >
                <ErrorBanner message={linkError} />
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Set up your account"
            subtitle={
                invite.organisationName
                    ? `You've been invited to join ${invite.organisationName}.`
                    : "Choose a password to finish setting up your account."
            }
        >
            <View>
                <Text style={globalStyles.label}>Email</Text>
                <View style={styles.readonlyField}>
                    <Text style={styles.readonlyText}>{invite.email}</Text>
                </View>
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

            <PasswordFields
                password={password}
                confirm={confirm}
                onChangePassword={setPassword}
                onChangeConfirm={setConfirm}
                onSubmit={handleSubmit}
            />

            <ErrorBanner message={formError} />

            <Button label="Create account" onPress={handleSubmit} loading={isSaving} />
        </AuthLayout>
    );
}

const styles = StyleSheet.create({
    readonlyField: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.borderDark,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        opacity: 0.8,
    },

    readonlyText: {
        color: colors.textSecondary,
        fontSize: 16,
    },

    footerLink: {
        color: colors.primaryLight,
        fontWeight: "700",
        fontSize: 14,
    },
});
