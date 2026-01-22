import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
} from "react-native";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Transaction } from "../../types/transaction";
import { BarChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

export default function HistoryScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "transactions"),
      orderBy("timestamp", "desc"),
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: Transaction[] = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Transaction, "id">),
      }));

      setTransactions(list);
      setLoading(false);
    });

    return unsub;
  }, []);

  // --------------------
  // Helpers
  // --------------------

  const getDate = (t: any) =>
    t instanceof Timestamp ? t.toDate() : new Date(t);

  // --------------------
  // Daily Revenue
  // --------------------

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todaySales = transactions.filter(
    (t) => t.type === "sale" && getDate(t.timestamp) >= todayStart,
  );

  const todayRevenue = todaySales.reduce((sum, t) => sum + (t.amount || 0), 0);

  // --------------------
  // Weekly Revenue
  // --------------------

  const last7Days = [...Array(7)]
    .map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d;
    })
    .reverse();

  const weeklyRevenue = last7Days.map((day) => {
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);

    const end = new Date(day);
    end.setHours(23, 59, 59, 999);

    const total = transactions
      .filter(
        (t) =>
          t.type === "sale" &&
          getDate(t.timestamp) >= start &&
          getDate(t.timestamp) <= end,
      )
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    return total;
  });

  // --------------------
  // Monthly Revenue
  // --------------------

  const monthRevenue: number[] = [];

  for (let i = 0; i < 6; i++) {
    const start = new Date();
    start.setMonth(start.getMonth() - i);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setMonth(start.getMonth() + 1);

    const total = transactions
      .filter(
        (t) =>
          t.type === "sale" &&
          getDate(t.timestamp) >= start &&
          getDate(t.timestamp) < end,
      )
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    monthRevenue.unshift(total);
  }

  const formatTime = (t: any) => {
    const date = t instanceof Timestamp ? t.toDate() : new Date(t);

    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) return <ActivityIndicator size="large" />;

  return (
    <ScrollView style={styles.container}>
      {/* Daily Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Today's Revenue</Text>
        <Text style={styles.summaryValue}>
          ₹{todayRevenue.toLocaleString()}
        </Text>
      </View>

      {/* Weekly Chart */}
      <Text style={styles.chartTitle}>Last 7 Days</Text>

      <BarChart
        data={{
          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          datasets: [{ data: weeklyRevenue }],
        }}
        width={screenWidth - 32}
        height={220}
        yAxisLabel="₹"
        yAxisSuffix=""
        chartConfig={chartConfig}
        style={styles.chart}
      />

      {/* Monthly Chart */}
      <Text style={styles.chartTitle}>Last 6 Months</Text>

      <BarChart
        data={{
          labels: ["-5", "-4", "-3", "-2", "-1", "Now"],
          datasets: [{ data: monthRevenue }],
        }}
        width={screenWidth - 32}
        height={220}
        yAxisLabel="₹"
        yAxisSuffix=""
        chartConfig={chartConfig}
        style={styles.chart}
      />

      {/* Transaction Logs */}
      <Text style={styles.chartTitle}>Transaction History</Text>

      {/* -------------------- */}
      {/* Transaction Logs */}
      {/* -------------------- */}

      <Text style={styles.chartTitle}>Transaction Logs</Text>

      {transactions.length === 0 ? (
        <Text style={{ color: "#6b7280" }}>No transactions yet</Text>
      ) : (
        transactions.map((txn) => {
          const isSale = txn.type === "sale";

          return (
            <View
              key={txn.id}
              style={[
                styles.logCard,
                isSale ? styles.saleLog : styles.restockLog,
              ]}
            >
              <View style={styles.logHeader}>
                <Text style={styles.logProduct}>{txn.productName}</Text>
                <Text
                  style={[
                    styles.logType,
                    isSale ? styles.saleText : styles.restockText,
                  ]}
                >
                  {isSale ? "SALE" : "RESTOCK"}
                </Text>
              </View>

              <Text style={styles.logMeta}>Qty: {txn.quantity}</Text>

              {isSale && txn.amount != null && (
                <Text style={styles.logAmount}>
                  ₹{txn.amount.toLocaleString()}
                </Text>
              )}

              {txn.memberName && (
                <Text style={styles.logMeta}>Member: {txn.memberName}</Text>
              )}

              {txn.notes && (
                <Text style={styles.logMeta}>Notes: {txn.notes}</Text>
              )}

              <Text style={styles.logTime}>{formatTime(txn.timestamp)}</Text>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

// ---------------- Styles ----------------

const chartConfig = {
  backgroundGradientFrom: "#2563eb",
  backgroundGradientTo: "#1e40af",
  decimalPlaces: 0,
  color: () => "#fff",
  labelColor: () => "#fff",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  summary: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryLabel: {
    color: "#dbeafe",
  },
  summaryValue: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  chart: {
    borderRadius: 12,
    marginBottom: 20,
  },
  logCard: {
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  saleLog: {
    borderLeftWidth: 4,
    borderLeftColor: "#ef4444",
  },

  restockLog: {
    borderLeftWidth: 4,
    borderLeftColor: "#10b981",
  },

  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },

  logProduct: {
    fontWeight: "600",
    fontSize: 15,
    color: "#111827",
  },

  logType: {
    fontSize: 12,
    fontWeight: "700",
  },

  saleText: {
    color: "#dc2626",
  },

  restockText: {
    color: "#059669",
  },

  logMeta: {
    fontSize: 13,
    color: "#4b5563",
  },

  logAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563eb",
    marginTop: 2,
  },

  logTime: {
    marginTop: 6,
    fontSize: 12,
    color: "#6b7280",
  },
});
