import { Pressable, StyleSheet, Text, View, ActivityIndicator, Modal, TextInput, ScrollView } from 'react-native';
import SettingsShell from '../../../components/settingsShell';
import { useAuth } from '../../../context/AuthContext';
import {apiFetch} from '../../../assets/api';
import {useState, useEffect} from 'react';
import { SafeAreaView } from "react-native-safe-area-context";
import { globalStyles } from '../../../constants/styles';

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
    <SafeAreaView style={globalStyles.container}>
      <ScrollView>
      <SettingsShell title="Users">
        <View style={styles.headerRow}>
          <Text style={globalStyles.sectionTitle}>{organisation?.name}</Text>

          {isAdmin ? (
          <View style={styles.section}>
            <Text style={globalStyles.sectionTitle}>Create User</Text>
            <Pressable 
              style={[globalStyles.buttonPrimary, styles.gap]}
              onPress={() => setShowCreateModal(true)}
              >
              <Text style={globalStyles.buttonPrimaryText}>Add New User</Text>
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
              <Text style={[globalStyles.sectionTitle, styles.gapBottom]}>Users</Text>

              {isUsersLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : users.length === 0 ? (
                <Text style={globalStyles.text}>No users found.</Text>
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
              <View style={globalStyles.modalOverlay}>
                  <View style={globalStyles.modalCard}>
                      <Text style={globalStyles.modalTitle}>Create User</Text>
                      <View style={globalStyles.form}>
                          <View>
                              <Text style={globalStyles.label}>Name</Text>
                              <TextInput  
                                  value={name}
                                  placeholder='Name'
                                  onChangeText={setName}
                                  style={globalStyles.input}
                                  />
                          </View>

                          <View>
                              <Text style={globalStyles.label}>Email</Text>
                              <TextInput
                                  value={email}
                                  placeholder='Email'
                                  onChangeText={setEmail}
                                  autoCapitalize="none"
                                  keyboardType="email-address"
                                  style={globalStyles.input}
                              />

                          </View>

                          <View>
                              <Text style={globalStyles.label}>Password</Text>
                              <TextInput
                                  value={password}
                                  placeholder='Password'
                                  onChangeText={setPassword}
                                  secureTextEntry
                                  style={globalStyles.input}
                              />
                          </View>

                          <View>
                              <Text style={globalStyles.label}>Role</Text>
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
                              <Text style={globalStyles.errorText}>{errorMessage}</Text>
                          ) : null}

                          {successMessage ? (
                              <Text style={globalStyles.successText}>{successMessage}</Text>
                          ) : null}

                          <View style={styles.modalActions}>
                              <Pressable  
                                  style={globalStyles.buttonDanger}
                                  onPress={() => setShowCreateModal(false)}
                                  disabled={isLoading}
                              > 
                                  <Text style={globalStyles.buttonPrimaryText}>Cancel</Text>
                              </Pressable>

                              <Pressable
                                  style={[globalStyles.buttonPrimary, isLoading && styles.buttonDisabled]}
                                  onPress={handleCreateUser}
                                  disabled={isLoading}
                              >
                                  {isLoading ? (
                                      <ActivityIndicator color='#ffffff'/>
                                  ) : (
                                      <Text style={globalStyles.buttonPrimaryText}>Create User</Text>
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  section: {
    marginBottom: 24,
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
  buttonDisabled: {
    opacity: 0.7,
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
  gap : {
    marginTop: 20,
  },
  gapBottom: {
    marginBottom: 20,
  },
});