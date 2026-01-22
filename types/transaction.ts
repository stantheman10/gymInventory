export type TransactionType = 'sale' | 'restock';

export interface Transaction {
  id: string;
  productId: string;
  productName: string;
  type: TransactionType;
  quantity: number;
  amount?: number;
  memberName?: string;
  notes?: string;
  timestamp: any;
}
