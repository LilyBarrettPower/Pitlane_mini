import { Pressable, StyleSheet, Text, View, ActivityIndicator, Modal, TextInput, ScrollView } from 'react-native';
import SettingsShell from '../../../components/settingsShell';
import { useAuth } from '../../../context/AuthContext';
import {apiFetch} from '../../../assets/api';
import {useState, useEffect} from 'react';
import { SafeAreaView } from "react-native-safe-area-context";

export default function UsersPage() {
  const { user, organisation, token } = useAuth();

  const isAdmin = user?.role === 'admin';

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'engineer' | 'mechanic' | 'viewer'>('viewer');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [users, setUsers] = useState<
    {id?: string; _id?: string; name?: string; email: string; role: string} []
    >([]);
    
  const [isUsersLoading, setIsUsersLoading] = useState(false);

   async function fetchUsers() {
    try {
      setIsUsersLoading(false);

      const data = await apiFetch('/auth/users', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers(data.users || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load users';
      setErrorMessage(message);
    } finally {
      setIsUsersLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token]);

  async function handleCreateUser() {
    try {
        setErrorMessage('');
        setSuccessMessage('');
        setIsLoading(true);

        const data = await apiFetch('/auth/create-user', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                name,
                email,
                password,
                role,
            }),
        });

        setSuccessMessage(`Created user: ${data.user.email}`);

        await fetchUsers();
        // I believe this here is where my error of a white screen after creating a user is coming from

        setName('');
        setEmail('');
        setPassword('');
        setRole('viewer');

        setTimeout(() => {
            setShowCreateModal(false);
            setSuccessMessage('');
        }, 1000);
    } catch (error) {
        const message = 
            error instanceof Error ? error.message : 'Failed to create user';
        setErrorMessage(message);
    } finally {
        setIsLoading(false);
    }
  }

 

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
      <SettingsShell title="Users">
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>{organisation?.name}</Text>

          {isAdmin ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Create User</Text>
            <Pressable 
              style={styles.button}
              onPress={() => setShowCreateModal(true)}
              >
              <Text style={styles.buttonText}>Add New User</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.helper}>
              Only admins can create users.
            </Text>
          </View>
        )}
        
        </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Users</Text>

              {isUsersLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : users.length === 0 ? (
                <Text style={styles.text}>No users found.</Text>
              ) : (
                users.map((listedUser) => (
                  <View
                    key={listedUser.id || listedUser._id || listedUser.email}
                    style={styles.userCard}
                  >
                    <Text style={styles.userName}>
                      {listedUser.name || listedUser.email}
                    </Text>
                    <Text style={styles.userMeta}>{listedUser.email}</Text>
                    <Text style={styles.userMeta}>Role: {listedUser.role}</Text>
                  </View>
                ))
              )}
            </View>

        <Modal 
          visible={showCreateModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCreateModal(false)}
          >
              <View style={styles.modalOverlay}>
                  <View style={styles.modalCard}>
                      <Text style={styles.modalTitle}>Create User</Text>
                      <View style={styles.form}>
                          <View>
                              <Text style={styles.label}>Name</Text>
                              <TextInput  
                                  value={name}
                                  onChangeText={setName}
                                  style={styles.input}
                                  />
                          </View>

                          <View>
                              <Text style={styles.label}>Email</Text>
                              <TextInput
                                  value={email}
                                  onChangeText={setEmail}
                                  autoCapitalize="none"
                                  keyboardType="email-address"
                                  style={styles.input}
                              />

                          </View>

                          <View>
                              <Text style={styles.label}>Password</Text>
                              <TextInput
                                  value={password}
                                  onChangeText={setPassword}
                                  secureTextEntry
                                  style={styles.input}
                              />
                          </View>

                          <View>
                              <Text style={styles.label}>Role</Text>
                              <View style={styles.roleRow}>
                                  {(['admin', 'engineer', 'mechanic', 'viewer'] as const).map((roleOption)=> (
                                      <Pressable
                                          key={roleOption}
                                          style={[
                                              styles.roleButton,
                                              role == roleOption && styles.roleButtonActive,
                                          ]}
                                          onPress={() => setRole(roleOption)}
                                          >
                                              <Text 
                                                  style={[
                                                      styles.roleButtonText,
                                                      role === roleOption && styles.roleButtonTextActive,
                                                  ]}
                                                  >
                                                      {roleOption}
                                                  </Text>
                                          </Pressable>
                                  ))}
                              </View>
                          </View>
                          {errorMessage ? (
                              <Text style={styles.errorText}>{errorMessage}</Text>
                          ) : null}

                          {successMessage ? (
                              <Text style={styles.successText}>{successMessage}</Text>
                          ) : null}

                          <View style={styles.modalActions}>
                              <Pressable  
                                  style={styles.cancelButton}
                                  onPress={() => setShowCreateModal(false)}
                                  disabled={isLoading}
                              > 
                                  <Text style={styles.cancelButtonText}>Cancel</Text>
                              </Pressable>

                              <Pressable
                                  style={[styles.button, isLoading && styles.buttonDisabled]}
                                  onPress={handleCreateUser}
                                  disabled={isLoading}
                              >
                                  {isLoading ? (
                                      <ActivityIndicator color='#ffffff'/>
                                  ) : (
                                      <Text style={styles.buttonText}>Create User</Text>
                                  )}
                              </Pressable>
                          </View>
                      </View>
                  </View>
              </View>
          </Modal>
      </SettingsShell>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
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
  buttonDisabled: {
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rbga(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: "#10151c",
    borderRadius: 16,
    padding: 20, 
    borderWidth: 1,
    borderColor: '#374151',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 18,
  },
  form: {
    gap: 16,
  },
  label: {
    color: '#ffffff',
    marginBottom: 8, 
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#111827',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
  },
  roleButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  roleButtonText: {
    color: '#d1d5db',
    fontSize: 14,
    fontWeight: '600',
  },
  roleButtonTextActive: {
    color: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#374151',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  errorText: {
    color: '#f87171',
    fontSize: 14,
  },
  successText: {
    color: '#34d399',
    fontSize: 14,
  },
});