import { Link } from 'expo-router';
import { SafeAreaView, Text, View, Pressable, StyleSheet } from 'react-native';
import { globalStyles } from '../constants/styles';
import { colors, typography } from '../constants/theme';

export default function LandingPage() {
  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={[styles.content]}>
        <Text style={[styles.title]}>Pitlane Mini</Text>

        <Text style={styles.subtitle}>
          Trackside management for vehicles, runs, tyres, setups, issues, and checklists.
        </Text>

        <View style={styles.buttonGroup}>
          <Link href="/login" asChild>
            <Pressable style={globalStyles.buttonPrimary}>
              <Text style={styles.primaryButtonText}>Login</Text>
            </Pressable>
          </Link>

          <Link href="/register" asChild>
            <Pressable style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Register Organisation</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    maxWidth: 520,
    alignSelf: 'center',
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  buttonGroup: {
    gap: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
});