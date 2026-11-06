
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Course = 'Starter' | 'Main Course' | 'Dessert';

type MenuItem = {
  id: number;
  name: string;
  description: string;
  course: Course;
  price: number;
};

const STORAGE_KEY = '@chefs_menu_items';

const courses: Course[] = ['Starter', 'Main Course', 'Dessert'];

export default function HomeScreen() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [course, setCourse] = useState<Course>('Starter');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Load saved menu items when the app opens
  useEffect(() => {
    async function loadMenu() {
      try {
        const savedMenu = await AsyncStorage.getItem(STORAGE_KEY);

        if (savedMenu) {
          setMenuItems(JSON.parse(savedMenu));
        }
      } catch (error) {
        Alert.alert('Error', 'Could not load your saved menu.');
      } finally {
        setLoaded(true);
      }
    }

    loadMenu();
  }, []);

  // Save menu items whenever the menu changes
  useEffect(() => {
    if (!loaded) return;

    async function saveMenu() {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(menuItems)
        );
      } catch (error) {
        Alert.alert('Error', 'Could not save your menu.');
      }
    }

    saveMenu();
  }, [menuItems, loaded]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCourse =
        filter === 'All' || item.course === filter;

      return matchesSearch && matchesCourse;
    });
  }, [menuItems, search, filter]);

  const averagePrice =
    menuItems.length === 0
      ? 0
      : menuItems.reduce((total, item) => total + item.price, 0) /
        menuItems.length;

  function clearForm() {
    setName('');
    setDescription('');
    setPrice('');
    setCourse('Starter');
    setEditingId(null);
  }

  function saveMenuItem() {
    if (!name.trim() || !description.trim() || !price.trim()) {
      Alert.alert('Missing information', 'Please complete all fields.');
      return;
    }

    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      Alert.alert('Invalid price', 'Enter a valid price greater than zero.');
      return;
    }

    if (editingId !== null) {
      setMenuItems((previous) =>
        previous.map((item) =>
          item.id === editingId
            ? {
                ...item,
                name: name.trim(),
                description: description.trim(),
                course,
                price: numericPrice,
              }
            : item
        )
      );

      Alert.alert('Success', 'Menu item updated successfully.');
    } else {
      const newItem: MenuItem = {
        id: Date.now(),
        name: name.trim(),
        description: description.trim(),
        course,
        price: numericPrice,
      };

      setMenuItems((previous) => [...previous, newItem]);

      Alert.alert('Success', 'New dish added successfully.');
    }

    clearForm();
  }

  function editMenuItem(item: MenuItem) {
    setName(item.name);
    setDescription(item.description);
    setPrice(item.price.toString());
    setCourse(item.course);
    setEditingId(item.id);
  }

  function deleteMenuItem(id: number) {
    Alert.alert(
      'Delete menu item',
      'Are you sure you want to delete this dish?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setMenuItems((previous) =>
              previous.filter((item) => item.id !== id)
            );

            if (editingId === id) clearForm();
          },
        },
      ]
    );
  }

  if (!loaded) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading your menu...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.logo}>CHEF'S MENU MANAGER</Text>
        <Text style={styles.heading}>Manage Your Menu</Text>
        <Text style={styles.subtitle}>
          Add, update and organise your restaurant dishes.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Menu Overview</Text>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{menuItems.length}</Text>
          <Text style={styles.statLabel}>Total Dishes</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>R{averagePrice.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Average Price</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        {courses.map((item) => (
          <View style={styles.courseStat} key={item}>
            <Text style={styles.courseNumber}>
              {menuItems.filter((dish) => dish.course === item).length}
            </Text>
            <Text style={styles.courseLabel}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>
          {editingId !== null ? 'Edit Menu Item' : 'Add New Dish'}
        </Text>

        <Text style={styles.label}>Dish Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter dish name"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.descriptionInput]}
          placeholder="Describe your dish"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.label}>Course</Text>
        <View style={styles.courseButtons}>
          {courses.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.courseButton,
                course === item && styles.selectedCourse,
              ]}
              onPress={() => setCourse(item)}
            >
              <Text
                style={[
                  styles.courseButtonText,
                  course === item && styles.selectedCourseText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Price (R)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter price"
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
        />

        <TouchableOpacity style={styles.saveButton} onPress={saveMenuItem}>
          <Text style={styles.saveButtonText}>
            {editingId !== null ? 'UPDATE DISH' : 'ADD DISH'}
          </Text>
        </TouchableOpacity>

        {editingId !== null && (
          <TouchableOpacity style={styles.cancelButton} onPress={clearForm}>
            <Text style={styles.cancelText}>Cancel Editing</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.sectionTitle}>Your Menu</Text>

      <TextInput
        style={styles.input}
        placeholder="Search dishes by name..."
        value={search}
        onChangeText={setSearch}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        {['All', ...courses].map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.filterButton,
              filter === item && styles.activeFilter,
            ]}
            onPress={() => setFilter(item)}
          >
            <Text
              style={[
                styles.filterText,
                filter === item && styles.activeFilterText,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filteredItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No dishes found</Text>
          <Text style={styles.emptyText}>
            Add a dish or change your search and filter.
          </Text>
        </View>
      ) : (
        filteredItems.map((item) => (
          <View style={styles.menuCard} key={item.id}>
            <Text style={styles.dishName}>{item.name}</Text>
            <Text style={styles.dishDescription}>{item.description}</Text>
            <Text style={styles.dishCourse}>{item.course}</Text>
            <Text style={styles.dishPrice}>R{item.price.toFixed(2)}</Text>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => editMenuItem(item)}
              >
                <Text style={styles.actionText}>EDIT</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteMenuItem(item.id)}
              >
                <Text style={styles.actionText}>DELETE</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <Text style={styles.footer}>Chef's Menu Manager © 2026</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F3EC',
  },
  loadingText: {
    color: '#193D32',
    fontSize: 17,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F3EC',
  },
  content: {
    padding: 20,
    paddingTop: 55,
    paddingBottom: 45,
  },
  header: {
    backgroundColor: '#193D32',
    padding: 25,
    borderRadius: 18,
    marginBottom: 25,
  },
  logo: {
    color: '#D9B66F',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: 'bold',
    marginTop: 15,
  },
  subtitle: {
    color: '#E3E6DF',
    fontSize: 14,
    marginTop: 8,
  },
  sectionTitle: {
    color: '#193D32',
    fontSize: 21,
    fontWeight: 'bold',
    marginBottom: 15,
    marginTop: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 14,
  },
  statNumber: {
    color: '#193D32',
    fontSize: 23,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#777777',
    marginTop: 6,
    fontSize: 12,
  },
  courseStat: {
    flex: 1,
    backgroundColor: '#E8E3D5',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  courseNumber: {
    color: '#193D32',
    fontSize: 20,
    fontWeight: 'bold',
  },
  courseLabel: {
    color: '#555555',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    marginTop: 20,
    marginBottom: 25,
  },
  label: {
    color: '#193D32',
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F5F3EC',
    borderWidth: 1,
    borderColor: '#E1DED3',
    borderRadius: 10,
    padding: 13,
    color: '#222222',
    fontSize: 14,
  },
  descriptionInput: {
    height: 85,
    textAlignVertical: 'top',
  },
  courseButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  courseButton: {
    borderWidth: 1,
    borderColor: '#193D32',
    padding: 9,
    borderRadius: 8,
  },
  selectedCourse: {
    backgroundColor: '#193D32',
  },
  courseButtonText: {
    color: '#193D32',
    fontSize: 11,
  },
  selectedCourseText: {
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#193D32',
    padding: 16,
    borderRadius: 10,
    marginTop: 22,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: '#777777',
  },
  filterContainer: {
    marginTop: 15,
    marginBottom: 15,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#E8E3D5',
    borderRadius: 20,
    marginRight: 8,
  },
  activeFilter: {
    backgroundColor: '#193D32',
  },
  filterText: {
    color: '#193D32',
    fontSize: 12,
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    padding: 17,
    borderRadius: 14,
    marginBottom: 13,
  },
  dishName: {
    color: '#193D32',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dishDescription: {
    color: '#777777',
    fontSize: 13,
    marginTop: 6,
  },
  dishCourse: {
    color: '#A17B37',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  dishPrice: {
    color: '#193D32',
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  editButton: {
    backgroundColor: '#193D32',
    padding: 11,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#A94343',
    padding: 11,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 11,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 25,
    borderRadius: 14,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#193D32',
    fontSize: 17,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#777777',
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    color: '#888888',
    textAlign: 'center',
    marginTop: 30,
    fontSize: 12,
  },
});
