import { createClient } from "@/services/supabase/client";

export type InvestmentEntry = {
  id: string;
  user_id: string;
  category: string;
  value: number;
  current_value: number | null;
  date: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateInvestmentEntryData = Omit<
  InvestmentEntry,
  "id" | "created_at" | "updated_at"
>;
export type UpdateInvestmentEntryData = Partial<
  Omit<InvestmentEntry, "id" | "user_id" | "created_at" | "updated_at">
>;

const supabase = createClient();

export const investmentEntriesService = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from("investment_entries")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });
    if (error) throw error;
    return data as InvestmentEntry[];
  },

  async create(data: CreateInvestmentEntryData) {
    const { data: created, error } = await supabase
      .from("investment_entries")
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return created as InvestmentEntry;
  },

  async update(id: string, data: UpdateInvestmentEntryData) {
    const { data: updated, error } = await supabase
      .from("investment_entries")
      .update(data)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return updated as InvestmentEntry;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from("investment_entries")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};
