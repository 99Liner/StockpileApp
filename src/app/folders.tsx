import {
    Alert,
    Button,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import {
    useCallback,
    useState,
} from 'react';

import {
    useFocusEffect,
} from 'expo-router';

import {
    useSQLiteContext,
} from 'expo-sqlite';

type Folder = {
  id: number;
  name: string;
};

export default function FoldersScreen() {
  const db = useSQLiteContext();

  const [folders, setFolders] =
    useState<Folder[]>([]);

  const [
    newFolderName,
    setNewFolderName,
  ] = useState('');

  const [
    editingId,
    setEditingId,
  ] = useState<number | null>(null);

  const [
    editingName,
    setEditingName,
  ] = useState('');

  async function loadFolders() {
    const results =
      await db.getAllAsync<Folder>(`
        SELECT id, name
        FROM folders
        ORDER BY name COLLATE NOCASE
      `);

    setFolders(results);
  }

  useFocusEffect(
    useCallback(() => {
      loadFolders();
    }, [])
  );

  async function addFolder() {
    const name =
      newFolderName.trim();

    if (!name) {
      Alert.alert(
        'Folder Name Required',
        'Enter a name for the folder.'
      );

      return;
    }

    try {
      await db.runAsync(
        `
        INSERT INTO folders (name)
        VALUES (?)
        `,
        name
      );

      setNewFolderName('');

      await loadFolders();
    } catch (error) {
      console.error(
        'ADD FOLDER ERROR:',
        error
      );

      Alert.alert(
        'Folder Already Exists',
        'Use a different folder name.'
      );
    }
  }

  function startEditing(
    folder: Folder
  ) {
    setEditingId(folder.id);
    setEditingName(folder.name);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingName('');
  }

  async function saveFolderName() {
    if (editingId === null) {
      return;
    }

    const name =
      editingName.trim();

    if (!name) {
      Alert.alert(
        'Folder Name Required',
        'Folder name cannot be empty.'
      );

      return;
    }

    try {
      await db.runAsync(
        `
        UPDATE folders
        SET name = ?
        WHERE id = ?
        `,
        name,
        editingId
      );

      cancelEditing();

      await loadFolders();
    } catch (error) {
      console.error(
        'RENAME FOLDER ERROR:',
        error
      );

      Alert.alert(
        'Name Already Used',
        'Another folder already has that name.'
      );
    }
  }

  function confirmDelete(
    folder: Folder
  ) {
    Alert.alert(
      'Delete Folder',
      `Delete "${folder.name}"?\n\nProducts in this folder will become Unfiled. They will NOT be deleted.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Delete',
          style: 'destructive',

          onPress: () =>
            deleteFolder(folder.id),
        },
      ]
    );
  }

  async function deleteFolder(
    folderId: number
  ) {
    try {
      // Keep the products.
      // Just remove their folder assignment.
      await db.runAsync(
        `
        UPDATE products
        SET folder_id = NULL
        WHERE folder_id = ?
        `,
        folderId
      );

      await db.runAsync(
        `
        DELETE FROM folders
        WHERE id = ?
        `,
        folderId
      );

      await loadFolders();
    } catch (error) {
      console.error(
        'DELETE FOLDER ERROR:',
        error
      );

      Alert.alert(
        'Error',
        'The folder could not be deleted.'
      );
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Manage Folders
      </Text>

      <Text style={styles.description}>
        Create your own folders to organize
        your stockpile.
      </Text>

      <View style={styles.addSection}>
        <TextInput
          style={styles.input}
          placeholder="New folder name"
          value={newFolderName}
          onChangeText={
            setNewFolderName
          }
        />

        <Button
          title="Create Folder"
          onPress={addFolder}
        />
      </View>

      <Text style={styles.sectionTitle}>
        Your Folders
      </Text>

      {folders.length === 0 ? (
        <Text style={styles.empty}>
          No folders yet.
        </Text>
      ) : (
        <FlatList
          data={folders}
          keyExtractor={(folder) =>
            folder.id.toString()
          }
          renderItem={({ item }) => (
            <View
              style={styles.folderCard}
            >
              {editingId === item.id ? (
                <>
                  <TextInput
                    style={styles.input}
                    value={editingName}
                    onChangeText={
                      setEditingName
                    }
                  />

                  <View
                    style={
                      styles.buttonSpace
                    }
                  >
                    <Button
                      title="Save"
                      onPress={
                        saveFolderName
                      }
                    />
                  </View>

                  <Button
                    title="Cancel"
                    onPress={
                      cancelEditing
                    }
                  />
                </>
              ) : (
                <>
                  <Text
                    style={
                      styles.folderName
                    }
                  >
                    {item.name}
                  </Text>

                  <View
                    style={
                      styles.buttonSpace
                    }
                  >
                    <Button
                      title="Rename"
                      onPress={() =>
                        startEditing(item)
                      }
                    />
                  </View>

                  <Button
                    title="Delete"
                    color="red"
                    onPress={() =>
                      confirmDelete(item)
                    }
                  />
                </>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'white',
      padding: 24,
      paddingTop: 60,
    },

    title: {
      fontSize: 30,
      fontWeight: 'bold',
    },

    description: {
      fontSize: 16,
      marginTop: 5,
      marginBottom: 25,
    },

    addSection: {
      marginBottom: 30,
    },

    input: {
      borderWidth: 1,
      borderColor: '#aaa',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      marginBottom: 10,
    },

    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 12,
    },

    empty: {
      textAlign: 'center',
      marginTop: 30,
    },

    folderCard: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 10,
      padding: 16,
      marginBottom: 12,
    },

    folderName: {
      fontSize: 19,
      fontWeight: '600',
      marginBottom: 10,
    },

    buttonSpace: {
      marginBottom: 8,
    },
  });