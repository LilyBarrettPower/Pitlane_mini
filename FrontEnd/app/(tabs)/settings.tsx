import {SafeAreaView} from 'react-native-safe-area-context';
import {StyleSheet, Text, View, Pressable} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {router} from 'expo-router';

export default function SettingsPage() {
    const {user, organisation, logout} = useAuth();

    async function handleLogout() {
        await logout();
        router.replace('/');
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Settings</Text>
                <Text style={styles.text}>User: {user?.name}</Text>
                <Text style={styles.text}>Role: {user?.role}</Text>
                <Text style={styles.text}>Organisation: {organisation?.name}</Text>

                <Pressable style={styles.button} onPress={handleLogout}>
                    <Text style={styles.buttonText}>Logout</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827',
    },
    content: {
        flex: 1,
        padding: 24,
        gap: 12,
    },
    title: {
        color: '#ffffff',
        fontSize: 30,
        fontWeight: '700',
        marginBottom: 12,
    },
    text: {
        color: '#d1d5db',
        fontSize: 16,
    },
    button: {
        backgroundColor: '#ef4444',
        paddingVertical: 14,
        borderRadius: 10, 
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
});