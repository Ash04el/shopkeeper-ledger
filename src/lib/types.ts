export type TransactionType = "credit" | "payment";

export interface Profile {
  id: string;
  phone_number: string;
  shop_name: string;
  created_at: string;
}

export interface Customer {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  note: string | null;
  is_archived: boolean;
  created_at: string;
}

export interface CustomerWithBalance extends Customer {
  balance: number;
}

export interface Transaction {
  id: string;
  customer_id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  description: string | null;
  created_at: string;
}

export interface ReminderLog {
  id: string;
  customer_id: string;
  user_id: string;
  balance_at_reminder: number;
  sent_at: string;
}