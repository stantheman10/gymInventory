import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import {
  collection,
  onSnapshot,
  runTransaction,
  doc,
  addDoc,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Product } from '../../types/product';

export default function RestockScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'products'), (snap) => {
      const list: Product[] = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Product, 'id'>),
      }));

      setProducts(list);
      setLoading(false);
    });

    return unsub;
  }, []);

  const handleRestock = async () => {
    if (!selectedProduct) {
      Alert.alert('Error', 'Select product');
      return;
    }

    const qty = Number(quantity);

    if (!qty || qty <= 0) {
      Alert.alert('Error', 'Enter valid quantity');
      return;
    }

    setProcessing(true);

    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'products', selectedProduct.id);
        const snap = await tx.get(ref);

        const currentStock = snap.data()?.currentStock;

        tx.update(ref, {
          currentStock: currentStock + qty,
          updatedAt: new Date(),
        });

        await addDoc(collection(db, 'transactions'), {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          type: 'restock',
          quantity: qty,
          notes,
          timestamp: new Date(),
        });
      });

      Alert.alert('Success', 'Stock added');

      setSelectedProduct(null);
      setQuantity('');
      setNotes('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Restock failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Stock</Text>

      {/* Product Picker */}
      <Picker
        selectedValue={selectedProduct?.id}
        onValueChange={(id) => {
          const product = products.find((p) => p.id === id) || null;
          setSelectedProduct(product);
        }}
      >
        <Picker.Item label="Select Product" value={null} />
        {products.map((p) => (
          <Picker.Item
            key={p.id}
            label={`${p.name} (${p.currentStock} units)`}
            value={p.id}
          />
        ))}
      </Picker>

      {/* Quantity */}
      <TextInput
        style={styles.input}
        placeholder="Quantity to add"
        keyboardType="numeric"
        value={quantity}
        onChangeText={setQuantity}
        editable={!!selectedProduct}
      />

      {/* Notes */}
      <TextInput
        style={styles.input}
        placeholder="Notes (supplier, invoice)"
        value={notes}
        onChangeText={setNotes}
        editable={!!selectedProduct}
      />

      {/* New Stock Preview */}
      {selectedProduct && quantity && (
        <Text style={styles.preview}>
          New Stock Level:{' '}
          {selectedProduct.currentStock + Number(quantity)}
        </Text>
      )}

      {/* Submit */}
      <TouchableOpacity
        style={[
          styles.button,
          (!selectedProduct || processing) && styles.disabled,
        ]}
        onPress={handleRestock}
        disabled={!selectedProduct || processing}
      >
        {processing ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Confirm Restock</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ---------------- Styles ----------------

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  preview: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#16a34a',
    padding: 14,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  disabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
