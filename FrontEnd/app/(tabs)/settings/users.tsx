import { Pressable, StyleSheet, Text, View } from 'react-native';
import SettingsShell from '../../../components/settingsShell';
import { useAuth } from '../../../context/AuthContext';

export default function UsersPage() {
  const { user, organisation } = useAuth();

  const isAdmin = user?.role === 'admin';

  return (
    <SettingsShell title="Users">
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Organisation</Text>
        <Text style={styles.text}>{organisation?.name}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Users</Text>

        <View style={styles.userCard}>
          <Text style={styles.userName}>{user?.name || user?.email}</Text>
          <Text style={styles.userMeta}>{user?.email}</Text>
          <Text style={styles.userMeta}>Role: {user?.role}</Text>
        </View>

        <Text style={styles.text}>
          User list from backend will go here next.
        </Text>
      </View>

      {isAdmin ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Create User</Text>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Add New User</Text>
          </Pressable>
          <Text style={styles.helper}>
            Create user form goes here next.
          </Text>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.helper}>
            Only admins can create users.
          </Text>
        </View>
      )}
    </SettingsShell>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  text: {
    color: '#d1d5db',
    fontSize: 15,
  },
  helper: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 10,
  },
  userCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  userName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  userMeta: {
    color: '#d1d5db',
    fontSize: 14,
    marginBottom: 2,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});