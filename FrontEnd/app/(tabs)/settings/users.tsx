import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import SettingsShell from "../../../components/settingsShell";
import { useAuth } from "../../../context/AuthContext";
import { apiFetch } from "../../../assets/api";
import { globalStyles } from "../../../constants/styles";
import { colors } from "../../../constants/theme";
import { INVALID_EMAIL_MESSAGE, isValidEmail } from "../../../constants/validation";
import { ROLE_DESCRIPTIONS, ROLES, Role, useCan } from "../../../constants/permissions";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  ErrorBanner,
  LoadingState,
  Panel,
} from "../../../components/ui/kit";

type ListedUser = {
  id?: string;
  _id?: string;
  name?: string;
  email: string;
  role: string;
  status?: "invited" | "active";
};

const ROLE_TONE: Record<string, "primary" | "live" | "warning" | "neutral"> = {
  admin: "primary",
  engineer: "live",
  mechanic: "warning",
  viewer: "neutral",
};

function roleLabel(role: string) {
  return role[0].toUpperCase() + role.slice(1);
}

function userId(listedUser: ListedUser | null) {
  return listedUser?.id || listedUser?._id;
}

// One option per role, with what that role can do
function RolePicker({ value, onChange }: { value: Role | null; onChange: (role: Role) => void }) {
  return (
    <View style={styles.roleList}>
      {ROLES.map((roleOption) => {
        const selected = value === roleOption;

        return (
          <Pressable
            key={roleOption}
            style={({ pressed }) => [styles.roleOption, selected && styles.roleOptionActive, pressed && styles.pressed]}
            onPress={() => onChange(roleOption)}
          >
            <Ionicons
              name={selected ? "radio-button-on" : "radio-button-off"}
              size={18}
              color={selected ? colors.primaryLight : colors.textMuted}
            />
            <View style={styles.roleOptionText}>
              <Text style={styles.roleOptionTitle}>{roleLabel(roleOption)}</Text>
              <Text style={styles.roleOptionDescription}>{ROLE_DESCRIPTIONS[roleOption]}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function UsersPage() {
  const { user, organisation, token } = useAuth();

  const isAdmin = useCan("admin");

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role | null>(null);

  // Change role
  const [userToChange, setUserToChange] = useState<ListedUser | null>(null);
  const [newRole, setNewRole] = useState<Role | null>(null);
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [roleError, setRoleError] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [userToRemove, setUserToRemove] = useState<ListedUser | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
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
    setRole(null);
    setFormError("");
    setShowCreateModal(true);
  }

  // Invite by email - the new user chooses their own password from the link
  async function handleInviteUser() {
    if (!isValidEmail(email)) {
      setFormError(INVALID_EMAIL_MESSAGE);
      return;
    }

    if (!role) {
      setFormError("Choose a role for this user");
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

  // Remove (archive) a user - they lose access straight away
  async function handleRemoveUser() {
    const userId = userToRemove?.id || userToRemove?._id;
    if (!userToRemove || !userId) return;

    try {
      setIsRemoving(true);
      setErrorMessage("");
      setSuccessMessage("");

      await apiFetch(`/auth/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccessMessage(`${userToRemove.name || userToRemove.email} has been removed`);
      setUserToRemove(null);
      await fetchUsers();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to remove user");
      setUserToRemove(null);
    } finally {
      setIsRemoving(false);
    }
  }

  function openChangeRole(listedUser: ListedUser) {
    setUserToChange(listedUser);
    setNewRole(listedUser.role as Role);
    setRoleError("");
  }

  async function handleChangeRole() {
    const id = userId(userToChange);
    if (!userToChange || !id || !newRole) return;

    if (newRole === userToChange.role) {
      setUserToChange(null);
      return;
    }

    try {
      setIsChangingRole(true);
      setRoleError("");

      await apiFetch(`/auth/users/${id}/role`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole }),
      });

      setErrorMessage("");
      setSuccessMessage(`${userToChange.name || userToChange.email} is now ${newRole === "admin" || newRole === "engineer" ? "an" : "a"} ${newRole}`);
      setUserToChange(null);
      await fetchUsers();
    } catch (error) {
      setRoleError(error instanceof Error ? error.message : "Failed to change role");
    } finally {
      setIsChangingRole(false);
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
                {/* Admins tap the role to change it (not their own) */}
                {isAdmin && userId(listedUser) !== user?.id ? (
                  <Pressable
                    hitSlop={6}
                    accessibilityLabel={`Change role for ${listedUser.name || listedUser.email}`}
                    style={({ pressed }) => [styles.roleBadgeButton, pressed && styles.pressed]}
                    onPress={() => openChangeRole(listedUser)}
                  >
                    <Badge label={listedUser.role.toUpperCase()} tone={ROLE_TONE[listedUser.role] || "neutral"} />
                    <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
                  </Pressable>
                ) : (
                  <Badge label={listedUser.role.toUpperCase()} tone={ROLE_TONE[listedUser.role] || "neutral"} />
                )}
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
              {/* Admins can remove anyone except themselves */}
              {isAdmin && (listedUser.id || listedUser._id) !== user?.id ? (
                <Pressable
                  hitSlop={8}
                  accessibilityLabel={`Remove ${listedUser.name || listedUser.email}`}
                  style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
                  onPress={() => setUserToRemove(listedUser)}
                >
                  <Ionicons name="person-remove-outline" size={18} color={colors.textMuted} />
                </Pressable>
              ) : null}
            </View>
          ))
        )}

        {isAdmin ? (
          <Text style={styles.helper}>Tap someone&apos;s role to change it.</Text>
        ) : (
          <Text style={styles.helper}>Only admins can invite users and change roles.</Text>
        )}
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
                // This is someone else's email - don't autofill the admin's own
                autoComplete="off"
                textContentType="none"
                style={globalStyles.input}
              />
            </View>

            <View>
              <Text style={globalStyles.label}>Role</Text>
              <RolePicker value={role} onChange={setRole} />
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

      {/* Change role */}
      <Modal
        visible={!!userToChange}
        transparent
        animationType="fade"
        onRequestClose={() => setUserToChange(null)}
      >
        <View style={globalStyles.modalOverlay}>
          <View style={globalStyles.modalCard}>
            <Text style={globalStyles.modalTitle}>Change role</Text>
            <Text style={styles.modalIntro}>
              {userToChange?.name || userToChange?.email} · changes apply straight away.
            </Text>

            <RolePicker value={newRole} onChange={setNewRole} />

            <ErrorBanner message={roleError} />

            <View style={styles.modalActions}>
              <Button
                label="Cancel"
                variant="secondary"
                onPress={() => setUserToChange(null)}
                disabled={isChangingRole}
              />
              <Button label="Save Role" onPress={handleChangeRole} loading={isChangingRole} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Remove user confirmation */}
      <Modal
        visible={!!userToRemove}
        transparent
        animationType="fade"
        onRequestClose={() => setUserToRemove(null)}
      >
        <View style={globalStyles.modalOverlay}>
          <View style={globalStyles.modalCard}>
            <Text style={globalStyles.modalTitle}>
              Remove {userToRemove?.name || userToRemove?.email}?
            </Text>
            <Text style={globalStyles.text}>
              {userToRemove?.status === "invited"
                ? "Their invite will be cancelled and the link will stop working."
                : `They'll lose access to ${organisation?.name || "this organisation"} straight away. Anything they've recorded will stay.`}
            </Text>
            <Text style={styles.modalIntro}>You can invite them again later if needed.</Text>

            <View style={styles.modalActions}>
              <Button
                label="Cancel"
                variant="secondary"
                onPress={() => setUserToRemove(null)}
                disabled={isRemoving}
              />
              <Button label="Remove" variant="danger" onPress={handleRemoveUser} loading={isRemoving} />
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

  removeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  pressed: {
    opacity: 0.7,
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

  roleBadgeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  roleList: {
    gap: 8,
  },

  roleOption: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderDark,
  },

  roleOptionActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },

  roleOptionText: {
    flex: 1,
    gap: 2,
  },

  roleOptionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },

  roleOptionDescription: {
    color: colors.textMuted,
    fontSize: 13,
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 4,
  },
});
