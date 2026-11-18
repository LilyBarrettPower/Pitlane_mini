// "Password" + "Confirm password" inputs used by the accept-invite and
// reset-password pages, with the same rules the backend enforces.

import { Text, TextInput, View } from "react-native";

import { globalStyles } from "../../constants/styles";
import { colors } from "../../constants/theme";

export const MIN_PASSWORD_LENGTH = 8;

// Returns a message if the passwords aren't acceptable, otherwise null
export function passwordError(password: string, confirm: string) {
    if (password.length < MIN_PASSWORD_LENGTH) {
        return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    }
    if (password !== confirm) {
        return "Passwords don't match";
    }
    return null;
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
            </View>
        </>
    );
}
