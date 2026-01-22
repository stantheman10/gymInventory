export interface Product {
  id: string;
  name: string;
  brand?: string;
  unitPrice: number;
  currentStock: number;
  reorderLevel: number;
}
