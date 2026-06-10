import { StyleSheet } from 'react-native';
import { colors, spacing } from './theme';

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: spacing.lg,
    flex: 1,
    justifyContent: 'center',
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },

  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: spacing.radiusLg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },

  cardTitle: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10
  },

  cardText: {
    color: "#d1d5db",
    marginBottom: 4,
  },

  buttonPrimary: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: spacing.radiusMd,
    alignItems: 'center',
  },

  buttonSecondary: {
    backgroundColor: colors.borderDark,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: spacing.radiusMd,
    alignItems: 'center',
  },

  buttonDanger: {
    backgroundColor: colors.danger,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: spacing.radiusMd,
    alignItems: 'center',
  },
    buttonDangerSmall: {
    backgroundColor: colors.danger,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  smallButton: {
    backgroundColor: "#374151",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
  },

  smallButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },

  modalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: colors.card,
    borderRadius: spacing.radiusModal,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
            gap: 12,
  },

  modalTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
  },

  input: {
    backgroundColor: colors.background,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderDark,
    borderRadius: spacing.radiusMd,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },

  label: {
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    fontSize: 14,
    fontWeight: "600",
  },

  buttonPrimaryText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },

  ButtonSecondaryText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },

  errorText: {
    color: '#f87171',
    fontSize: 14,
  },
  successText: {
    color: '#34d399',
    fontSize: 14,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: "#ffffff",
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: '#d1d5db',
    marginBottom: 28,
  },
  form: {
    gap: 16,
  },
  text: {
    color: colors.textSecondary,
  },

  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 15,
  },

  subText: {
    color: '#ffffff',
    fontSize: 13,
  },

});