import { Text, Pressable, StyleSheet } from 'react-native';
import SettingsShell from '../../../components/settingsShell';
import {useAuth} from '../../../context/AuthContext';
import { router } from 'expo-router';


export default function SettingsPage() {
    const {logout} = useAuth();

    async function handleLogout() {
        await logout();
        router.replace('/');
    }

  return (
    <SettingsShell title="Settings">
      <Text style={{ color: '#d1d5db', fontSize: 16 }}>
        Choose a settings section from the left.
      </Text>
        <Pressable style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonText}>Logout</Text>
        </Pressable>
    </SettingsShell>
  );
}

const styles = StyleSheet.create({
    button: {
    backgroundColor: '#2563eb',
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
})