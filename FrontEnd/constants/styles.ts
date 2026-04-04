import { StyleSheet } from 'react-native';
import { colors, spacing } from './theme';

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenPadding: {
    padding: spacing.lg,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
});