import { createClient } from "@/services/supabase/client";

export type TransactionType = "income" | "expense";
export type TransactionStatus = "pending" | "paid" | "late" | "cancelled";

export type FinancialTransaction = {
  id: string;
  user_id: string;
  category_id: string | null;
  type: TransactionType;
  status: TransactionStatus;
  description: string;
  amount: number;
  due_date: string;
  payment_date: string | null;
  payment_method: string | null;
  is_recurring: boolean;
  recurrence_type: string | null;
  recurrence_interval: number | null;
  recurrence_source_id: string | null;
  recurrence_start_date: string | null;
  recurrence_end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type TransactionFilters = {
  dateFrom?: string;
  dateTo?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  categoryId?: string;
};

export type CreateTransactionData = Omit<
  FinancialTransaction,
  "id" | "created_at" | "updated_at"
>;

export type UpdateTransactionData = Partial<
  Omit<FinancialTransaction, "id" | "user_id" | "created_at" | "updated_at">
>;

const supabase = createClient();

export const transactionsService = {
  async getAll(userId: string, filters?: TransactionFilters) {
    let query = supabase
      .from("financial_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("due_date", { ascending: false });

    if (filters?.dateFrom) {
      query = query.gte("due_date", filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte("due_date", filters.dateTo);
    }
    if (filters?.type) {
      query = query.eq("type", filters.type);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.categoryId) {
      query = query.eq("category_id", filters.categoryId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as FinancialTransaction[];
  },

  async create(data: CreateTransactionData) {
    const { data: created, error } = await supabase
      .from("financial_transactions")
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return created as FinancialTransaction;
  },

  async update(id: string, data: UpdateTransactionData) {
    const { data: updated, error } = await supabase
      .from("financial_transactions")
      .update(data)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return updated as FinancialTransaction;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from("financial_transactions")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};
