// Password inputs and the live rules checklist, used by the register,
// accept-invite and reset-password pages.

import { StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { globalStyles } from "../../constants/styles";
import { colors } from "../../constants/theme";
import { MIN_PASSWORD_LENGTH, passwordChecks, passwordProblem } from "../../constants/validation";

export { MIN_PASSWORD_LENGTH };

// Returns a message if the passwords aren't acceptable, otherwise null
export function passwordError(password: string, confirm: string) {
    const problem = passwordProblem(password);
    if (problem) return problem;

    if (password !== confirm) {
        return "Passwords don't match";
    }
    return null;
}

// "✓ 8+ characters  ✓ A letter  ✓ A number" - ticks off as you type
export function PasswordChecklist({ password }: { password: string }) {
    return (
        <View style={styles.checklist}>
            {passwordChecks(password).map((check) => (
                <View key={check.label} style={styles.checkItem}>
                    <Ionicons
                        name={check.met ? "checkmark-circle" : "ellipse-outline"}
                        size={15}
                        color={check.met ? colors.live : colors.textMuted}
                    />
                    <Text style={[styles.checkText, check.met && styles.checkTextMet]}>{check.label}</Text>
                </View>
            ))}
        </View>
    );
}

export default function PasswordFields({
    password,
    confirm,
    onChangePassword,
    onChangeConfirm,
    onSubmit,
}: {
    password: string;
    confirm: string;
    onChangePassword: (value: string) => void;
    onChangeConfirm: (value: string) => void;
    onSubmit?: () => void;
}) {
    const mismatch = confirm.length > 0 && confirm !== password;

    return (
        <>
            <View>
                <Text style={globalStyles.label}>New password</Text>
                <TextInput
                    value={password}
                    onChangeText={onChangePassword}
                    placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry
                    autoCapitalize="none"
                    style={globalStyles.input}
                />
                <PasswordChecklist password={password} />
            </View>

            <View>
                <Text style={globalStyles.label}>Confirm password</Text>
                <TextInput
                    value={confirm}
                    onChangeText={onChangeConfirm}
                    placeholder="Type it again"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry
                    autoCapitalize="none"
                    style={globalStyles.input}
                    onSubmitEditing={onSubmit}
                />
                {mismatch ? <Text style={styles.mismatch}>Passwords don&apos;t match yet</Text> : null}
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    checklist: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 14,
        marginTop: 8,
    },

    checkItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },

    checkText: {
        color: colors.textMuted,
        fontSize: 13,
    },

    checkTextMet: {
        color: colors.textSecondary,
    },

    mismatch: {
        color: colors.textMuted,
        fontSize: 13,
        marginTop: 6,
    },
});
