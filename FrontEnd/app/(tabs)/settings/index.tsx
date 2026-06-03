import { Text, Pressable, StyleSheet } from 'react-native';
import SettingsShell from '../../../components/settingsShell';
import {useAuth} from '../../../context/AuthContext';
import { router } from 'expo-router';
import { globalStyles } from '../../../constants/styles';


export default function SettingsPage() {
    const {logout} = useAuth();

    async function handleLogout() {
        await logout();
        router.replace('/');
    }

  return (
    <SettingsShell title="Settings">
      <Text style={[globalStyles.text, styles.gapBottom]}>
        Choose a settings section from the left.
      </Text>
        <Pressable style={globalStyles.buttonPrimary} onPress={handleLogout}>
          <Text style={globalStyles.buttonPrimaryText}>Logout</Text>
        </Pressable>
    </SettingsShell>
  );
}

const styles = StyleSheet.create({
  gapBottom: {
    marginBottom: 20,
  }
})