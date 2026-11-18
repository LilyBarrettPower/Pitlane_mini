import { StyleSheet } from "react-native";
import { colors, spacing } from "./theme";

// Shared styles used across the app. These follow the dashboard's look:
// rounded 18px cards, bold white headings, muted grey secondary text.
export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Narrow centred column (auth pages, loading states)
  content: {
    padding: spacing.lg,
    flex: 1,
    justifyContent: "center",
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
  },

  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: spacing.radiusLg,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },

  cardTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },

  cardText: {
    color: colors.textSecondary,
    fontSize: 15,
    marginBottom: 4,
  },

  buttonPrimary: {
    backgroundColor: colors.primary,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: spacing.radiusMd,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonSecondary: {
    backgroundColor: colors.borderDark,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: spacing.radiusMd,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonDanger: {
    backgroundColor: colors.danger,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: spacing.radiusMd,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonDangerSmall: {
    backgroundColor: colors.danger,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  smallButton: {
    backgroundColor: colors.borderDark,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  smallButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(3, 7, 18, 0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },

  modalCard: {
    width: "100%",
    maxWidth: 560,
    backgroundColor: colors.card,
    borderRadius: spacing.radiusModal,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderDark,
    gap: 12,
  },

  modalTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
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
    color: colors.textSecondary,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: "700",
  },

  buttonPrimaryText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },

  ButtonSecondaryText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },

  errorText: {
    color: colors.error,
    fontSize: 14,
  },

  successText: {
    color: colors.success,
    fontSize: 14,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 4,
  },

  subTitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: 24,
  },

  form: {
    gap: 16,
  },

  text: {
    color: colors.textSecondary,
    fontSize: 15,
  },

  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 10,
  },

  subText: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
