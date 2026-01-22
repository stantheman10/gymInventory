import { sendLowStockNotification } from '../../lib/notifications';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TextInput,
  Modal,
} from 'react-native';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Product } from '../../types/product';
import { Ionicons } from '@expo/vector-icons';

export default function InventoryScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [form, setForm] = useState({
    name: '',
    brand: '',
    unitPrice: '',
    currentStock: '',
    reorderLevel: '5',
  });

  // ---------------------------
  // Load Inventory
  // ---------------------------

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('name'));

    const unsub = onSnapshot(q, (snap) => {
      const list: Product[] = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Product, 'id'>),
      }));

      setProducts(list);
      setLoading(false);

      // 🔔 Low stock notification
      list.forEach((product) => {
        if (product.currentStock <= product.reorderLevel) {
          sendLowStockNotification(product.name, product.currentStock);
        }
      });
    });

    return unsub;
  }, []);

  const lowStockItems = products.filter(
    (p) => p.currentStock <= p.reorderLevel
  );

  // ---------------------------
  // ADD PRODUCT
  // ---------------------------

  const handleAddProduct = async () => {
    if (!form.name || !form.unitPrice || !form.currentStock) {
      Alert.alert('Error', 'Fill all required fields');
      return;
    }

    try {
      await addDoc(collection(db, 'products'), {
        name: form.name,
        brand: form.brand,
        unitPrice: Number(form.unitPrice),
        currentStock: Number(form.currentStock),
        reorderLevel: Number(form.reorderLevel),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      resetForm();
      setShowAddModal(false);
      Alert.alert('Success', 'Product added');
    } catch {
      Alert.alert('Error', 'Failed to add product');
    }
  };

  // ---------------------------
  // EDIT PRODUCT
  // ---------------------------

  const openEdit = (product: Product) => {
    setSelectedProduct(product);

    setForm({
      name: product.name,
      brand: product.brand || '',
      unitPrice: product.unitPrice.toString(),
      currentStock: product.currentStock.toString(),
      reorderLevel: product.reorderLevel.toString(),
    });

    setShowEditModal(true);
  };

  const handleUpdateProduct = async () => {
    if (!selectedProduct) return;

    try {
      const ref = doc(db, 'products', selectedProduct.id);

      await updateDoc(ref, {
        name: form.name,
        brand: form.brand,
        unitPrice: Number(form.unitPrice),
        currentStock: Number(form.currentStock),
        reorderLevel: Number(form.reorderLevel),
        updatedAt: new Date(),
      });

      resetForm();
      setShowEditModal(false);
      Alert.alert('Updated', 'Product updated successfully');
    } catch {
      Alert.alert('Error', 'Update failed');
    }
  };

  // ---------------------------
  // DELETE PRODUCT
  // ---------------------------

  const handleDeleteProduct = (product: Product) => {
    Alert.alert(
      'Delete Product',
      `Delete ${product.name}?`,
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'products', product.id));
              Alert.alert('Deleted', 'Product removed');
            } catch {
              Alert.alert('Error', 'Delete failed');
            }
          },
        },
      ],
    );
  };

  // ---------------------------
  // Helper
  // ---------------------------

  const resetForm = () => {
    setForm({
      name: '',
      brand: '',
      unitPrice: '',
      currentStock: '',
      reorderLevel: '5',
    });
    setSelectedProduct(null);
  };

  // ---------------------------
  // UI
  // ---------------------------

  if (loading) return <ActivityIndicator size="large" />;

  return (
    <View style={styles.container}>
      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <View style={styles.alertBox}>
          <Text style={styles.alertText}>
            ⚠ {lowStockItems.length} product(s) low on stock
          </Text>
        </View>
      )}

      {/* Product List */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item }) => {
          const isLow = item.currentStock <= item.reorderLevel;

          return (
            <TouchableOpacity
              onLongPress={() =>
                Alert.alert(
                  item.name,
                  'Choose Action',
                  [
                    {
                      text: 'Edit',
                      onPress: () => openEdit(item),
                    },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => handleDeleteProduct(item),
                    },
                    { text: 'Cancel' },
                  ],
                )
              }
            >
              <View style={[styles.card, isLow && styles.lowStockCard]}>
                <Text style={styles.name}>{item.name}</Text>
                <Text>Stock: {item.currentStock}</Text>
                <Text>Price: ₹{item.unitPrice}</Text>

                {isLow && (
                  <Text style={styles.lowBadge}>Low Stock</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      {/* ADD MODAL */}
      <Modal visible={showAddModal} animationType="slide">
        <FormUI
          title="Add Product"
          form={form}
          setForm={setForm}
          onCancel={() => setShowAddModal(false)}
          onSubmit={handleAddProduct}
        />
      </Modal>

      {/* EDIT MODAL */}
      <Modal visible={showEditModal} animationType="slide">
        <FormUI
          title="Edit Product"
          form={form}
          setForm={setForm}
          onCancel={() => setShowEditModal(false)}
          onSubmit={handleUpdateProduct}
        />
      </Modal>
    </View>
  );
}

// ---------------------------
// Reusable Form Component
// ---------------------------

function FormUI({
  title,
  form,
  setForm,
  onSubmit,
  onCancel,
}: any) {
  return (
    <View style={styles.modalContainer}>
      <Text style={styles.modalTitle}>{title}</Text>

      <TextInput
        style={styles.input}
        placeholder="Product Name"
        value={form.name}
        onChangeText={(t) => setForm({ ...form, name: t })}
      />

      <TextInput
        style={styles.input}
        placeholder="Brand"
        value={form.brand}
        onChangeText={(t) => setForm({ ...form, brand: t })}
      />

      <TextInput
        style={styles.input}
        placeholder="Price"
        keyboardType="numeric"
        value={form.unitPrice}
        onChangeText={(t) =>
          setForm({ ...form, unitPrice: t })
        }
      />

      <TextInput
        style={styles.input}
        placeholder="Stock"
        keyboardType="numeric"
        value={form.currentStock}
        onChangeText={(t) =>
          setForm({ ...form, currentStock: t })
        }
      />

      <TextInput
        style={styles.input}
        placeholder="Reorder Level"
        keyboardType="numeric"
        value={form.reorderLevel}
        onChangeText={(t) =>
          setForm({ ...form, reorderLevel: t })
        }
      />

      <View style={styles.modalActions}>
        <TouchableOpacity onPress={onCancel}>
          <Text>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveBtn} onPress={onSubmit}>
          <Text style={{ color: 'white' }}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------------- Styles ----------------

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },

  alertBox: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },

  alertText: {
    color: '#dc2626',
    fontWeight: '600',
  },

  card: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },

  lowStockCard: {
    borderWidth: 1,
    borderColor: '#dc2626',
  },

  name: { fontWeight: '600', fontSize: 16 },

  lowBadge: {
    marginTop: 6,
    color: '#dc2626',
    fontWeight: '600',
  },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#2563eb',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalContainer: {
    flex: 1,
    padding: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },

  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },

  saveBtn: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
  },
});
