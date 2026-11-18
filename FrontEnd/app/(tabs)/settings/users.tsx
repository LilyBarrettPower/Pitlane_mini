import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import SettingsShell from "../../../components/settingsShell";
import { useAuth } from "../../../context/AuthContext";
import { apiFetch } from "../../../assets/api";
import { globalStyles } from "../../../constants/styles";
import { colors } from "../../../constants/theme";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  ErrorBanner,
  LoadingState,
  Panel,
} from "../../../components/ui/kit";

type Role = "admin" | "engineer" | "mechanic" | "viewer";

type ListedUser = {
  id?: string;
  _id?: string;
  name?: string;
  email: string;
  role: string;
  status?: "invited" | "active";
};

const ROLES: Role[] = ["admin", "engineer", "mechanic", "viewer"];

const ROLE_TONE: Record<string, "primary" | "live" | "warning" | "neutral"> = {
  admin: "primary",
  engineer: "live",
  mechanic: "warning",
  viewer: "neutral",
};

export default function UsersPage() {
  const { user, token } = useAuth();

  const isAdmin = user?.role === "admin";

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("viewer");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [users, setUsers] = useState<ListedUser[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  async function fetchUsers() {
    try {
      setIsUsersLoading(true);
      setErrorMessage("");

      const data = await apiFetch("/auth/users", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers(data.users || []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load users");
    } finally {
      setIsUsersLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  function openCreateModal() {
    setName("");
    setEmail("");
    setRole("viewer");
    setFormError("");
    setShowCreateModal(true);
  }

  // Invite by email - the new user chooses their own password from the link
  async function handleInviteUser() {
    if (!email.trim()) {
      setFormError("Email is required");
      return;
    }

    try {
      setFormError("");
      setIsSaving(true);

      const data = await apiFetch("/auth/invite", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          email,
          role,
        }),
      });

      setShowCreateModal(false);
      setErrorMessage(data.warning || "");
      setSuccessMessage(data.warning ? "" : `Invite sent to ${email.trim()}`);
      await fetchUsers();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to invite user");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleResendInvite(listedUser: ListedUser) {
    const userId = listedUser.id || listedUser._id;
    if (!userId) return;

    try {
      setResendingId(userId);
      setErrorMessage("");
      setSuccessMessage("");

      await apiFetch(`/auth/invite/${userId}/resend`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccessMessage(`New invite sent to ${listedUser.email}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to resend invite");
    } finally {
      setResendingId(null);
    }
  }

  return (
    <SettingsShell
      title="Users"
      subtitle={users.length ? `${users.length} ${users.length === 1 ? "member" : "members"}` : undefined}
      actions={isAdmin ? <Button label="Invite User" icon="person-add-outline" onPress={openCreateModal} /> : undefined}
    >
      <ErrorBanner message={errorMessage} />

      {successMessage ? (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={16} color={colors.live} />
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      ) : null}

      <Panel title="Team members" icon="people-outline">
        {isUsersLoading && users.length === 0 ? (
          <LoadingState />
        ) : users.length === 0 ? (
          <EmptyState icon="people-outline" text="No users found." />
        ) : (
          users.map((listedUser, index) => (
            <View
              key={listedUser.id || listedUser._id || listedUser.email}
              style={[styles.userRow, index === users.length - 1 && styles.userRowLast]}
            >
              <Avatar name={listedUser.name || listedUser.email} size={40} />
              <View style={styles.userText}>
                <Text style={styles.userName} numberOfLines={1}>
                  {listedUser.name || listedUser.email}
                </Text>
                <Text style={styles.userEmail} numberOfLines={1}>
                  {listedUser.email}
                </Text>
              </View>
              <View style={styles.userBadges}>
                {listedUser.status === "invited" ? <Badge label="INVITED" tone="warning" /> : null}
                <Badge label={listedUser.role.toUpperCase()} tone={ROLE_TONE[listedUser.role] || "neutral"} />
              </View>
              {isAdmin && listedUser.status === "invited" ? (
                <Button
                  label="Resend"
                  icon="mail-outline"
                  size="sm"
                  variant="ghost"
                  loading={resendingId === (listedUser.id || listedUser._id)}
                  onPress={() => handleResendInvite(listedUser)}
                />
              ) : null}
            </View>
          ))
        )}

        {!isAdmin ? <Text style={styles.helper}>Only admins can invite users.</Text> : null}
      </Panel>

      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={globalStyles.modalOverlay}>
          <View style={globalStyles.modalCard}>
            <Text style={globalStyles.modalTitle}>Invite User</Text>
            <Text style={styles.modalIntro}>
              We&apos;ll email them a link to set their own password. The link lasts 72 hours.
            </Text>

            <View>
              <Text style={globalStyles.label}>Name</Text>
              <TextInput
                value={name}
                placeholder="Full name"
                placeholderTextColor={colors.textMuted}
                onChangeText={setName}
                style={globalStyles.input}
              />
            </View>

            <View>
              <Text style={globalStyles.label}>Email</Text>
              <TextInput
                value={email}
                placeholder="name@example.com"
                placeholderTextColor={colors.textMuted}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={globalStyles.input}
              />
            </View>

            <View>
              <Text style={globalStyles.label}>Role</Text>
              <View style={styles.roleRow}>
                {ROLES.map((roleOption) => (
                  <Pressable
                    key={roleOption}
                    style={[styles.roleButton, role === roleOption && styles.roleButtonActive]}
                    onPress={() => setRole(roleOption)}
                  >
                    <Text style={[styles.roleButtonText, role === roleOption && styles.roleButtonTextActive]}>
                      {roleOption[0].toUpperCase() + roleOption.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <ErrorBanner message={formError} />

            <View style={styles.modalActions}>
              <Button
                label="Cancel"
                variant="secondary"
                onPress={() => setShowCreateModal(false)}
                disabled={isSaving}
              />
              <Button label="Send Invite" icon="send-outline" onPress={handleInviteUser} loading={isSaving} />
            </View>
          </View>
        </View>
      </Modal>
    </SettingsShell>
  );
}

const styles = StyleSheet.create({
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },

  userRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },

  userText: {
    flex: 1,
    gap: 2,
  },

  userName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },

  userEmail: {
    color: colors.textMuted,
    fontSize: 13,
  },

  userBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 6,
  },

  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.liveSoft,
    borderRadius: 10,
    padding: 12,
  },

  successText: {
    color: "#86efac",
    flexShrink: 1,
  },

  modalIntro: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: -4,
  },

  helper: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 14,
  },

  roleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  roleButton: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },

  roleButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  roleButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },

  roleButtonTextActive: {
    color: colors.textPrimary,
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 4,
  },
});
