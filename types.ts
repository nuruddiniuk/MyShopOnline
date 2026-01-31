
export type Language = 'en' | 'bn';

export interface User {
  id: string;
  email: string;
  businessName: string;
  profilePicture?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  quantity: number;
  category: string;
  image?: string;
}

export interface Sale {
  id: string;
  date: string;
  customerName: string;
  items: { productId: string; quantity: number; price: number }[];
  totalAmount: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalSpent: number;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
}

export interface BusinessState {
  inventory: Product[];
  sales: Sale[];
  customers: Customer[];
  expenses: Expense[];
}
