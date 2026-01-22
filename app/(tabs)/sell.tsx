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

export default function SellScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [memberName, setMemberName] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Load Products
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

  // Record Sale
  const handleSale = async () => {
    if (!selectedProduct) {
      Alert.alert('Error', 'Select a product');
      return;
    }

    const qty = Number(quantity);

    if (!qty || qty <= 0) {
      Alert.alert('Error', 'Enter valid quantity');
      return;
    }

    if (qty > selectedProduct.currentStock) {
      Alert.alert('Error', 'Not enough stock available');
      return;
    }

    setProcessing(true);

    try {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'products', selectedProduct.id);
        const snap = await tx.get(ref);

        const currentStock = snap.data()?.currentStock;

        if (currentStock < qty) {
          throw new Error('Stock changed. Try again.');
        }

        // Update stock
        tx.update(ref, {
          currentStock: currentStock - qty,
          updatedAt: new Date(),
        });

        // Add transaction log
        await addDoc(collection(db, 'transactions'), {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          type: 'sale',
          quantity: qty,
          amount: selectedProduct.unitPrice * qty,
          memberName: memberName || 'Walk-in',
          timestamp: new Date(),
        });
      });

      Alert.alert('Success', 'Sale recorded');

      // Reset form
      setSelectedProduct(null);
      setQuantity('1');
      setMemberName('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Sale failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Record Sale</Text>

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
            label={`${p.name} (${p.currentStock} in stock)`}
            value={p.id}
          />
        ))}
      </Picker>

      {/* Quantity */}
      <TextInput
        style={styles.input}
        placeholder="Quantity"
        keyboardType="numeric"
        value={quantity}
        onChangeText={setQuantity}
        editable={!!selectedProduct}
      />

      {/* Member */}
      <TextInput
        style={styles.input}
        placeholder="Member Name (optional)"
        value={memberName}
        onChangeText={setMemberName}
        editable={!!selectedProduct}
      />

      {/* Total */}
      {selectedProduct && (
        <Text style={styles.total}>
          Total: ₹
          {(Number(quantity) * selectedProduct.unitPrice || 0).toLocaleString()}
        </Text>
      )}

      {/* Submit */}
      <TouchableOpacity
        style={[
          styles.button,
          (!selectedProduct || processing) && styles.disabled,
        ]}
        onPress={handleSale}
        disabled={!selectedProduct || processing}
      >
        {processing ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Confirm Sale</Text>
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
  total: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#2563eb',
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
