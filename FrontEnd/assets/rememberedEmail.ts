// Remembers the last email used to log in on this device, so the login page
// can fill it in. Only the email is stored - never the password (saved
// passwords are handled by the browser / phone's own password manager).

import AsyncStorage from "@react-native-async-storage/async-storage";

const LAST_EMAIL_KEY = "pitlane_last_email";

export async function getRememberedEmail() {
    try {
        return (await AsyncStorage.getItem(LAST_EMAIL_KEY)) || "";
    } catch {
        return "";
    }
}

export async function rememberEmail(email: string) {
    try {
        await AsyncStorage.setItem(LAST_EMAIL_KEY, email.trim().toLowerCase());
    } catch {
        // Not critical - the user just types their email next time
    }
}

export async function forgetRememberedEmail() {
    try {
        await AsyncStorage.removeItem(LAST_EMAIL_KEY);
    } catch {
        // Ignore
    }
}
